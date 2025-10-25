import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert, Button, Dimensions, Image, View } from "react-native";

export default function Index() {
  const [image, setImage] = useState<string | null>(null);
  const {width: screenWidth, height: screenHeight} = Dimensions.get("window");

  // Request camera permissions
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Sorry, we need camera permissions to take a picture!"
      );
      return false;
    }
    return true;
  };

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

  // Take a picture using the camera
  const takePicture = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  // Pick an image from the photo library
  const pickImageFromLibrary = async () => {
    const hasPermission = await requestPhotoLibraryPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      {image && (
        <Image
          source={{ uri: image }}
          style={{
            width: screenWidth * 0.9,
            height: screenHeight * 0.5,
            marginBottom: 20,
            borderRadius: 10,
          }}
        />
      )}
      <Button title="Take Picture" onPress={takePicture} />
      <View style={{ marginTop: 10 }}>
        <Button title="Upload Picture" onPress={pickImageFromLibrary} />
      </View>
    </View>
  );
}
