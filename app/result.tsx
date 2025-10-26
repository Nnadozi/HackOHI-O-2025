import * as FileSystem from "expo-file-system/legacy";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function ResultScreen() {
  const {
    imageUri,
    originalImageUri,
    originalWidth,
    originalHeight,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    selectionWidth,
    selectionHeight,
  } = useLocalSearchParams<{
    imageUri: string;
    originalImageUri?: string;
    originalWidth?: string;
    originalHeight?: string;
    cropX?: string;
    cropY?: string;
    cropWidth?: string;
    cropHeight?: string;
    selectionWidth?: string;
    selectionHeight?: string;
  }>();
  const [objectLabel, setObjectLabel] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [color, setColor ] = useState("");

  useEffect(() => {
    if (imageUri) {
      analyzeImage();
    }
  }, [imageUri]);

  const analyzeImage = async () => {
    if (!imageUri) return;

    setIsLoading(true);
    try {
      const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
      
      if (!apiKey) {
        console.error("OpenAI API key not found in environment variables");
        setObjectLabel("API key not configured");
        setIsLoading(false);
        return;
      }

      // Determine which image to use for analysis
      const imageToAnalyze = originalImageUri || imageUri;
      
      // Read the image file and convert to base64
      const response = await fetch(imageToAnalyze);
      const blob = await response.blob();
      const base64Image = await blobToBase64(blob);

      const prompt = "What is the main object in this image? Respond with ONLY a single word - the name of the object. Or multiple words if the object is not a single word. No more than 4 words.";

      // Call OpenAI GPT-4 Vision API
      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-5", // Using gpt-5 (latest vision model)
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
                    detail: "low", // Faster processing
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

      console.log("Finding color....")
      // Using Node.js bridge server on port 3000
      // With ADB port forwarding, use localhost for USB-connected Android devices
      const API_URL = "http://localhost:3000";
      
      // Read the image file and convert to base64
      const imageData = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64' as any,
      });
      
      const colorResponse = await fetch(`${API_URL}/uploadfile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ file_uri: imageData }),
      });

      if (!colorResponse.ok) {
        console.error("Backend request failed:", colorResponse.status);
        setColor("Error getting color from backend");
        return;
      }

      const fetchedColor = await colorResponse.json();

      if (fetchedColor && fetchedColor.prediction) {
        setColor(fetchedColor.prediction);
      } else {
        setColor("Unable to identify color");
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
      setObjectLabel("Error analyzing image");
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Result" }} />
      <View style={styles.container}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Analyzing image...</Text>
          </View>
        )}
        {!isLoading && objectLabel && (
          <View style={styles.labelContainer}>
            <Text style={styles.labelText}>{objectLabel}</Text>
          </View>
        )}
        {!isLoading && color && (
          <View style={styles.labelContainer}>
            <Text style={styles.labelText}>{color}</Text>
          </View>
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
  loadingContainer: {
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 16,
  },
  labelContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: "center",
  },
  labelText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
});
