import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Alert, Button, Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import { Icon } from "react-native-paper";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

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

  // Handle camera tap to show/hide selection
  function handleCameraTap(event: any) {
    if (isCapturingRef.current) return;

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

        // Navigate to result screen with both original and cropped images, plus coordinates
        router.push({
          pathname: "/result",
          params: {
            imageUri: croppedUri,
            originalImageUri: photo.uri,
            originalWidth: photo.width.toString(),
            originalHeight: photo.height.toString(),
            cropX: originX.toString(),
            cropY: originY.toString(),
            cropWidth: cropW.toString(),
            cropHeight: cropH.toString(),
            selectionWidth: Math.round(w).toString(),
            selectionHeight: Math.round(h).toString(),
          },
        });
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
      
      // Navigate to result screen with the edited/cropped image
      router.push({
        pathname: "/result",
        params: {
          imageUri: asset.uri,
          originalImageUri: asset.uri,
          originalWidth: asset.width?.toString() || "0",
          originalHeight: asset.height?.toString() || "0",
          cropX: "0",
          cropY: "0", 
          cropWidth: "0",
          cropHeight: "0",
          selectionWidth: "0",
          selectionHeight: "0",
        },
      });
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
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        onTouchEnd={handleCameraTap}
      >
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
      </CameraView>
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
    paddingVertical: 8,
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
});