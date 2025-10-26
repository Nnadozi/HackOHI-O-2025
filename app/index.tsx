import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAudioPlayer } from "expo-audio";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { Camera, useCameraDevices, useFrameProcessor } from 'react-native-vision-camera';
import { runOnJS } from 'react-native-reanimated';
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import * as Speech from "expo-speech";
import React, { useEffect, useRef, useState } from "react";

declare global {
  var lastFrameTime: number | undefined;
}
import { Alert, Button, Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import { Icon } from "react-native-paper";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import LanguageSelector from "../components/LanguageSelector";
import ObjectOutput from "../components/ObjectOutput";
import { translateColor } from "../util/colorTranslator";
import { getPromptForLanguage } from "../util/languagePrompts";
import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import type { Frame } from "react-native-vision-camera";

export type FrameType = Frame & {
  width: number;
  height: number;
  data: Uint8Array; // raw pixel data (BGRA or YUV)
};

const session = await InferenceSession.create('color_model.onnx');
const input = new Tensor('float32', Float32Array.from([r, g, b]), [1, 3]);
const output = await session.run({ input });

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Selection overlay defaults and constraints
const INITIAL_SELECTION_SIZE = 140;
const MIN_SIZE = 60;
const HANDLE_SIZE = 16;
const HANDLE_HIT = 36;

export default function Index() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const [selectionVisible, setSelectionVisible] = useState(false);
  const isCapturingRef = useRef(false);
  const [objectLabel, setObjectLabel] = useState("");
  const [color, setColor] = useState("");
  const [translatedColor, setTranslatedColor] = useState("");
  const [showOutput, setShowOutput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");
  const [languageSelectorVisible, setLanguageSelectorVisible] = useState(false);

  // Load language preference on mount
  useEffect(() => {
    const loadLanguage = async () => {
      const savedLanguage = await AsyncStorage.getItem("selectedLanguage");
      if (savedLanguage) {
        setSelectedLanguage(savedLanguage);
      }
    };
    loadLanguage();
  }, []);

  const devices = useCameraDevices();
  const device = devices.back;
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const request = async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'authorized');
    };
    request();
  }, []);

  // Convert raw RGB array to base64 JPEG using a temporary PNG data URI
async function rgbToBase64(rgbArray: Uint8Array, width: number, height: number) {
  // Convert Uint8Array to data URL using simple Canvas workaround
  // Each pixel: R G B
  const pixels = [];
  for (let i = 0; i < rgbArray.length; i += 3) {
    const r = rgbArray[i];
    const g = rgbArray[i + 1];
    const b = rgbArray[i + 2];
    pixels.push(r, g, b, 255); // add alpha
  }
  const rgbaArray = new Uint8ClampedArray(pixels);

  // Create a temporary PNG using ImageManipulator
  // First, create a 1x1 white image base64 (placeholder), then replace pixels
  // Because ImageManipulator can't take raw RGBA directly, we'll skip direct raw manipulation
  // Instead, we can encode RGB → base64 using `jpeg-js` in a Node environment,
  // but in React Native, often you just write the RGB bytes to cache as a raw .rgb file
  // For simplicity, here we just return a placeholder: you can still feed the model
  // and optionally skip creating a URI if you only need model inference.
  // If you need the URI, the standard approach is to take a captured photo from the camera
  // or use the frame’s built-in toJPEG method if available.

  // Example: returning the raw RGB as base64 directly (not a valid JPEG, but can be saved for debugging)
  const binary = String.fromCharCode(...rgbArray);
  return btoa(binary);
}

const sendFrame = async (frame: FrameType) => {
  try {
    const { width, height, data } = frame; // raw BGRA or YUV

    // Convert to RGB array
    const rgbArray = new Uint8Array(width * height * 3);
    for (let i = 0; i < width * height; i++) {
      const r = data[i * 4];     // BGRA: B G R A
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      rgbArray[i * 3] = r;
      rgbArray[i * 3 + 1] = g;
      rgbArray[i * 3 + 2] = b;
    }

    // Normalize and CHW for ONNX
    const H = height;
    const W = width;
    const C = 3;
    const floatData = new Float32Array(rgbArray.length);
    for (let i = 0; i < rgbArray.length; i++) {
      floatData[i] = rgbArray[i] / 255.0;
    }

    const chw = new Float32Array(C * H * W);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        for (let c = 0; c < C; c++) {
          chw[c * H * W + y * W + x] = floatData[(y * W + x) * C + c];
        }
      }
    }

    const inputTensor = new Tensor("float32", chw, [1, 3, H, W]);
    const output = await session.run({ input: inputTensor });
    console.log("Model output:", output);

    // Save to temporary file (for URI) if needed
    const base64 = await rgbToBase64(rgbArray, width, height);
    const uri = FileSystem.cacheDirectory + "frame.jpg";
    await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
    analyzeImage(uri);

    return { uri, rgbArray, output };
  } catch (error) {
    console.error("Error in sendFrame:", error);
  }
};

  // Send frame (30 fps)
  // const sendFrame = async (uri: string): Promise<void> => {
  //   try {
  //     // Read the image file as base64
  //     const base64 = await FileSystem.readAsStringAsync(uri, {
  //       encoding: FileSystem.EncodingType.Base64,
  //     });

  //     const image = await ImageManipulator.manipulateAsync(
  //       `data:image/jpeg;base64,${base64}`,
  //       [{ resize: { width: 224, height: 224 } }],
  //       { base64: true, format: ImageManipulator.SaveFormat.JPEG }
  //     );

  //     const resizedBase64 = image.base64!;




  //     // Send to your FastAPI backend
  //     // await fetch("http://localhost:8000/uploadfile", {
  //     //   method: "POST",
  //     //   headers: { "Content-Type": "application/json" },
  //     //   body: JSON.stringify({ file_uri: "data:image/jpeg;base64," + base64 }),
  //     // });

  //     analyzeImage(uri);

  //     // Decode
  //     const imageBytes = base64ToUint8Array(resizedBase64);

  //     // Convert to Float32Array and normalize
  //     const float32Data = new Float32Array(imageBytes.length);
  //     for (let i = 0; i < imageBytes.length; i++) {
  //       float32Data[i] = imageBytes[i] / 255.0; // normalize 0-1
  //     }

  //     const H = 224;
  //     const W = 224;
  //     const C = 3;
  //     const chw = new Float32Array(C * H * W);

  //     for (let y = 0; y < H; y++) {
  //       for (let x = 0; x < W; x++) {
  //         for (let c = 0; c < C; c++) {
  //           chw[c * H * W + y * W + x] = float32Data[(y * W + x) * C + c];
  //         }
  //       }
  //     }

  //     const inputTensor = new Tensor('float32', chw, [1, 3, H, W]);

  //     const output = await session.run({ input: inputTensor });

  //     console.log('Model output:', output);
  //   } catch (error) {
  //     console.error("Error sending frame:", error);
  //   }
  // };

  // Helper: convert base64 to UInt8Array
  const base64ToUint8Array = (b64: string) => {
    const binaryString = atob(b64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  // Frame processor (runs on every frame)
  const frameProcessor = useFrameProcessor((frame) => {
    const now = Date.now();
    if (!global.lastFrameTime || now - global.lastFrameTime > 30000) {
      global.lastFrameTime = now;
      runOnJS(sendFrame)(frame);
    }
  }, []);

  if (!device || !hasPermission) return <View style={{ flex: 1 }} />;

  // Save language preference when changed
  const handleLanguageSelect = async (language: string) => {
    setSelectedLanguage(language);
    await AsyncStorage.setItem("selectedLanguage", language);
  };

  // Re-translate color when language changes
  useEffect(() => {
    if (color) {
      const translated = translateColor(color, selectedLanguage);
      setTranslatedColor(translated);
    }
  }, [selectedLanguage, color]);

  // Create audio player
  const player = useAudioPlayer(
    require("../assets/sound/ES_Mobile Phone, Notification Tone 02 - Epidemic Sound.mp3")
  );

  // Play sound and speak when output is shown
  useEffect(() => {
    if (showOutput && !isLoading && player && objectLabel && color) {
      // Seek to beginning and play the sound effect
      player.seekTo(0);
      player.play();
      
      // Speak the color and object (e.g., "Gray table")
      setTimeout(() => {
        const textToSpeak = translatedColor ? `${translatedColor} ${objectLabel}` : `${color} ${objectLabel}`;
        Speech.speak(textToSpeak, {
          language: selectedLanguage,
          pitch: 1.0,
          rate: 1.0,
        });
      }, 500); // Wait 500ms after sound starts playing
    }
  }, [showOutput, isLoading, player, objectLabel, color, translatedColor, selectedLanguage]);

  // Animated state for draggable, resizable selection box
  const translateX = useSharedValue(SCREEN_WIDTH / 2 - INITIAL_SELECTION_SIZE / 2);
  const translateY = useSharedValue(SCREEN_HEIGHT / 2 - INITIAL_SELECTION_SIZE / 2);
  const selectionWidth = useSharedValue(INITIAL_SELECTION_SIZE);
  const selectionHeight = useSharedValue(INITIAL_SELECTION_SIZE);

  // Request photo library permissions
  const requestPhotoLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Sorry, we need photo library permissions to upload a picture!"
      );
      return false;
    }
    return true;
  };

  // Reset output and selection
  const resetOutput = () => {
    setObjectLabel("");
    setColor("");
    setTranslatedColor("");
    setShowOutput(false);
  };

  // Handle camera tap to show/hide selection
  function handleCameraTap(event: any) {
    if (isCapturingRef.current) return;
    
    // Reset output when tapping to move selection
    if (showOutput) {
      resetOutput();
    }

    const { locationX, locationY } = event.nativeEvent;
    const halfW = selectionWidth.value / 2;
    const halfH = selectionHeight.value / 2;
    const clampedX = Math.min(Math.max(halfW, locationX), SCREEN_WIDTH - halfW) - halfW;
    const clampedY = Math.min(Math.max(halfH, locationY), SCREEN_HEIGHT - halfH) - halfH;
    translateX.value = withSpring(clampedX);
    translateY.value = withSpring(clampedY);
    setSelectionVisible(true);
  }

  // Pan gesture for moving the selection
  const panGesture = Gesture.Pan().onChange((event) => {
    const nextX = translateX.value + event.changeX;
    const nextY = translateY.value + event.changeY;
    const maxX = SCREEN_WIDTH - selectionWidth.value;
    const maxY = SCREEN_HEIGHT - selectionHeight.value;
    translateX.value = Math.min(Math.max(0, nextX), Math.max(0, maxX));
    translateY.value = Math.min(Math.max(0, nextY), Math.max(0, maxY));
  });

  // Translation-only transform: keep position math stable (size handled separately)
  const animatedTransformStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

  // Animated size to reflect width/height without affecting translation
  const animatedSizeStyle = useAnimatedStyle(() => {
    return {
      width: selectionWidth.value,
      height: selectionHeight.value,
    };
  });

  // Static styles for the selection box
  const selectionStaticStyle = { borderColor: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.18)' } as const;

  // Corner handle gestures
  const topLeftGesture = Gesture.Pan()
    .onChange((event) => {
      const right = translateX.value + selectionWidth.value;
      const bottom = translateY.value + selectionHeight.value;
      let newX = translateX.value + event.changeX;
      let newY = translateY.value + event.changeY;
      newX = Math.min(Math.max(0, newX), right - MIN_SIZE);
      newY = Math.min(Math.max(0, newY), bottom - MIN_SIZE);
      const newWidth = right - newX;
      const newHeight = bottom - newY;
      translateX.value = newX;
      translateY.value = newY;
      selectionWidth.value = newWidth;
      selectionHeight.value = newHeight;
    });

  const topRightGesture = Gesture.Pan()
    .onChange((event) => {
      const bottom = translateY.value + selectionHeight.value;
      let newY = translateY.value + event.changeY;
      newY = Math.min(Math.max(0, newY), bottom - MIN_SIZE);
      const newHeight = bottom - newY;
      let newWidth = selectionWidth.value + event.changeX;
      const maxWidth = SCREEN_WIDTH - translateX.value;
      newWidth = Math.min(Math.max(MIN_SIZE, newWidth), maxWidth);
      translateY.value = newY;
      selectionHeight.value = newHeight;
      selectionWidth.value = newWidth;
    });

  const bottomLeftGesture = Gesture.Pan()
    .onChange((event) => {
      const right = translateX.value + selectionWidth.value;
      let newX = translateX.value + event.changeX;
      newX = Math.min(Math.max(0, newX), right - MIN_SIZE);
      const newWidth = right - newX;
      let newHeight = selectionHeight.value + event.changeY;
      const maxHeight = SCREEN_HEIGHT - translateY.value;
      newHeight = Math.min(Math.max(MIN_SIZE, newHeight), maxHeight);
      translateX.value = newX;
      selectionWidth.value = newWidth;
      selectionHeight.value = newHeight;
    });

  const bottomRightGesture = Gesture.Pan()
    .onChange((event) => {
      let newWidth = selectionWidth.value + event.changeX;
      let newHeight = selectionHeight.value + event.changeY;
      const maxWidth = SCREEN_WIDTH - translateX.value;
      const maxHeight = SCREEN_HEIGHT - translateY.value;
      selectionWidth.value = Math.min(Math.max(MIN_SIZE, newWidth), maxWidth);
      selectionHeight.value = Math.min(Math.max(MIN_SIZE, newHeight), maxHeight);
    });

  // Handle styles
  const handleTLStyle = useAnimatedStyle(() => ({
    top: translateY.value - HANDLE_HIT / 2,
    left: translateX.value - HANDLE_HIT / 2,
  }));

  const handleTRStyle = useAnimatedStyle(() => ({
    top: translateY.value - HANDLE_HIT / 2,
    left: translateX.value + selectionWidth.value - HANDLE_HIT / 2,
  }));

  const handleBLStyle = useAnimatedStyle(() => ({
    top: translateY.value + selectionHeight.value - HANDLE_HIT / 2,
    left: translateX.value - HANDLE_HIT / 2,
  }));

  const handleBRStyle = useAnimatedStyle(() => ({
    top: translateY.value + selectionHeight.value - HANDLE_HIT / 2,
    left: translateX.value + selectionWidth.value - HANDLE_HIT / 2,
  }));

  // Mask styles for overlay
  const maskTopStyle = useAnimatedStyle(() => ({
    top: 0,
    left: 0,
    right: 0,
    height: Math.max(0, translateY.value),
    zIndex: 1,
  }));

  const maskBottomStyle = useAnimatedStyle(() => {
    const bottomTop = translateY.value + selectionHeight.value;
    return {
      top: Math.min(SCREEN_HEIGHT, bottomTop),
      left: 0,
      right: 0,
      height: Math.max(0, SCREEN_HEIGHT - bottomTop),
      zIndex: 1,
    };
  });

  const maskLeftStyle = useAnimatedStyle(() => ({
    top: translateY.value,
    left: 0,
    width: Math.max(0, translateX.value),
    height: Math.max(0, selectionHeight.value),
    zIndex: 1,
  }));

  const maskRightStyle = useAnimatedStyle(() => {
    const left = translateX.value + selectionWidth.value;
    return {
      top: translateY.value,
      left: Math.min(SCREEN_WIDTH, left),
      right: 0,
      height: Math.max(0, selectionHeight.value),
      zIndex: 1,
    };
  });

  // Crop image to selection
  async function cropToSelection(
    photo: { uri: string; width: number; height: number },
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    const scaleX = photo.width / SCREEN_WIDTH;
    const scaleY = photo.height / SCREEN_HEIGHT;
    const originX = Math.max(0, Math.round(x * scaleX));
    const originY = Math.max(0, Math.round(y * scaleY));
    const cropW = Math.min(photo.width - originX, Math.round(w * scaleX));
    const cropH = Math.min(photo.height - originY, Math.round(h * scaleY));

    const result = await ImageManipulator.manipulateAsync(
      photo.uri,
      [
        { crop: { originX, originY, width: cropW, height: cropH } },
        { resize: { width: Math.round(w), height: Math.round(h) } }
      ],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );

    return result.uri;
  }

  // Helper function to convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove the data URL prefix
        const base64 = base64String.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Analyze image and get object label and color
  const analyzeImage = async (imageUri: string) => {
    try {
      setIsLoading(true);
      setObjectLabel("");
      setColor("");
      setShowOutput(false);

      // Get object label from OpenAI
      const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
      
      if (!apiKey) {
        console.error("OpenAI API key not found in environment variables");
        setObjectLabel("API key not configured");
        return;
      }

      // Read the image file and convert to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const base64Image = await blobToBase64(blob);

      // Get language-specific prompt
      const prompt = getPromptForLanguage(selectedLanguage);

      // Call OpenAI GPT-4 Vision API
      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: prompt,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                    detail: "low",
                  },
                },
              ],
            },
          ],
        }),
      });

      const data = await openaiResponse.json();
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const label = data.choices[0].message.content.trim();
        setObjectLabel(label);
      } else {
        setObjectLabel("Unable to identify");
      }

      // Get color from backend
      // console.log("Finding color....");
      // const API_URL = "http://localhost:3000";
      
      // // Read the image file and convert to base64
      // const imageData = await FileSystem.readAsStringAsync(imageUri, {
      //   encoding: 'base64' as any,
      // });
      
      // const colorResponse = await fetch(`${API_URL}/uploadfile`, {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({ file_uri: imageData }),
      // });

      // if (!colorResponse.ok) {
      //   console.error("Backend request failed:", colorResponse.status);
      //   setColor("Error getting color from backend");
      //   return;
      // }

      // const fetchedColor = await colorResponse.json();

      if (fetchedColor && fetchedColor.prediction) {
        const rawColor = fetchedColor.prediction;
        const translated = translateColor(rawColor, selectedLanguage);
        setColor(rawColor);
        setTranslatedColor(translated);
      } else {
        setColor("Unable to identify color");
        setTranslatedColor("Unable to identify color");
      }

      setShowOutput(true);
    } catch (error) {
      console.error("Error analyzing image:", error);
      setObjectLabel("Error analyzing image");
    } finally {
      setIsLoading(false);
    }
  };

  // Capture picture from camera
  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      isCapturingRef.current = true;
      setSelectionVisible(false);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo && photo.width && photo.height) {
        const x = translateX.value;
        const y = translateY.value;
        const w = selectionWidth.value;
        const h = selectionHeight.value;

        const croppedUri = await cropToSelection(
          { uri: photo.uri, width: photo.width, height: photo.height },
          x,
          y,
          w,
          h
        );

        // Calculate crop coordinates for the original image
        const scaleX = photo.width / SCREEN_WIDTH;
        const scaleY = photo.height / SCREEN_HEIGHT;
        const originX = Math.max(0, Math.round(x * scaleX));
        const originY = Math.max(0, Math.round(y * scaleY));
        const cropW = Math.min(photo.width - originX, Math.round(w * scaleX));
        const cropH = Math.min(photo.height - originY, Math.round(h * scaleY));

        // Analyze the cropped image
        await analyzeImage(croppedUri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take picture");
    } finally {
      isCapturingRef.current = false;
    }
  };

  // Pick image from photo library with native editing
  const pickImageFromLibrary = async () => {
    const hasPermission = await requestPhotoLibraryPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4,4], // Square crop
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      
      // Analyze the image
      await analyzeImage(asset.uri);
    }
  };

  // Handle camera permission status
  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <Camera
        style={{ flex: 1 }}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
        frameProcessorFps={1} // reduce processing load
      />
        {selectionVisible && !isCapturingRef.current && (
          <GestureDetector gesture={panGesture}>
            <Animated.View
              onStartShouldSetResponder={() => true}
              onResponderTerminationRequest={() => false}
              style={[
                styles.tapIndicator,
                styles.selectionBox,
                animatedTransformStyle,
                animatedSizeStyle,
                selectionStaticStyle,
              ]}
            />
          </GestureDetector>
        )}
        {selectionVisible && !isCapturingRef.current && (
          <>
            <GestureDetector gesture={topLeftGesture}>
              <Animated.View style={[styles.handle, handleTLStyle]}>
                <View style={styles.handleDot} />
              </Animated.View>
            </GestureDetector>
            <GestureDetector gesture={topRightGesture}>
              <Animated.View style={[styles.handle, handleTRStyle]}>
                <View style={styles.handleDot} />
              </Animated.View>
            </GestureDetector>
            <GestureDetector gesture={bottomLeftGesture}>
              <Animated.View style={[styles.handle, handleBLStyle]}>
                <View style={styles.handleDot} />
              </Animated.View>
            </GestureDetector>
            <GestureDetector gesture={bottomRightGesture}>
              <Animated.View style={[styles.handle, handleBRStyle]}>
                <View style={styles.handleDot} />
              </Animated.View>
            </GestureDetector>
          </>
        )}
        {selectionVisible && !isCapturingRef.current && (
          <>
            <Animated.View pointerEvents="none" style={[styles.mask, maskTopStyle]} />
            <Animated.View pointerEvents="none" style={[styles.mask, maskBottomStyle]} />
            <Animated.View pointerEvents="none" style={[styles.mask, maskLeftStyle]} />
            <Animated.View pointerEvents="none" style={[styles.mask, maskRightStyle]} />
          </>
        )}

        <View style={styles.controlsBackground}>
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={pickImageFromLibrary}
            >
              <Icon source="folder" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.flipButton}
              onPress={() => setFacing(facing === "back" ? "front" : "back")}
            >
              <Icon source="camera-flip" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.languageButton}
          onPress={() => setLanguageSelectorVisible(true)}
        >
          <Text style={styles.languageFlag}>
            {selectedLanguage.includes("en") ? "🇺🇸" :
             selectedLanguage.includes("es") ? "🇪🇸" :
             selectedLanguage.includes("fr") ? "🇫🇷" :
             selectedLanguage.includes("de") ? "🇩🇪" :
             selectedLanguage.includes("it") ? "🇮🇹" :
             selectedLanguage.includes("pt") ? "🇧🇷" :
             selectedLanguage.includes("ja") ? "🇯🇵" :
             selectedLanguage.includes("zh") ? "🇨🇳" : "🌐"}
          </Text>
        </TouchableOpacity>

        <ObjectOutput 
          objectLabel={objectLabel} 
          color={translatedColor || color}
          originalColor={color}
          visible={showOutput || isLoading}
          isLoading={isLoading}
          onDismiss={resetOutput}
        />

        <LanguageSelector
          visible={languageSelectorVisible}
          onClose={() => setLanguageSelectorVisible(false)}
          onSelect={handleLanguageSelect}
          selectedLanguage={selectedLanguage}
        />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  camera: {
    flex: 1,
  },
  controlsBackground: {
    position: "absolute",
    bottom: 50,
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 16,
    paddingVertical: 16,
    width: "60%",
    alignSelf: "center",
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "85%",
    alignSelf: "center",
  },
  uploadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButton: {
    width: 62,
    height: 62,
    borderRadius: 35,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  captureButtonInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "white",
  },
  flipButton: {
    width: 40,
    height: 40, 
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
    color: "white",
  },
  tapIndicator: {
    position: "absolute",
  },
  selectionBox: {
    borderWidth: 2,
    borderRadius: 0,
    zIndex: 3,
  },
  handle: {
    position: "absolute",
    width: HANDLE_HIT,
    height: HANDLE_HIT,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 4,
  },
  handleDot: {
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    backgroundColor: "#FFFFFF",
  },
  mask: {
    position: "absolute",
    zIndex: 1,
  },
  languageButton: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    zIndex: 10,
  },
  languageFlag: {
    fontSize: 28,
  },
});