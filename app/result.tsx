import { Stack, useLocalSearchParams } from "expo-router";
import { Dimensions, Image, StyleSheet, View } from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function ResultScreen() {
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Result" }} />
      <View style={styles.container}>
        {imageUri && (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="contain"
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  image: {
    width: screenWidth,
    height: screenHeight,
  },
});

