import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface ObjectOutputProps {
  objectLabel: string;
  color: string;
  originalColor?: string; // The untranslated color name for hex mapping
  visible: boolean;
  isLoading: boolean;
  onDismiss: () => void;
}

export default function ObjectOutput({ objectLabel, color, originalColor, visible, isLoading, onDismiss }: ObjectOutputProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      // Reset and start animation
      scale.value = 0;
      opacity.value = 0;
      rotate.value = 0;

      // Fun zoom-in animation with bounce
      scale.value = withDelay(
        100,
        withSpring(1, {
          damping: 10,
          stiffness: 150,
          mass: 0.8,
        })
      );

      // Fade in
      opacity.value = withTiming(1, { duration: 300 });

      // Gentle rotation effect
      rotate.value = withSequence(
        withTiming(5, { duration: 200, easing: Easing.out(Easing.quad) }),
        withSpring(0, { damping: 15 })
      );
    } else {
      // Fade out animation
      scale.value = withTiming(0, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotateZ: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  if (!visible && objectLabel === "" && color === "") {
    return null;
  }

  // Helper function to convert color name to hex
  const getColorHex = (colorName: string): string => {
    const colorMap: { [key: string]: string } = {
      red: "#FF0000",
      blue: "#0000FF",
      green: "#008000",
      yellow: "#FFFF00",
      orange: "#FFA500",
      purple: "#800080",
      pink: "#FFC0CB",
      brown: "#A52A2A",
      black: "#000000",
      white: "#FFFFFF",
      gray: "#808080",
      grey: "#808080",
      cyan: "#00FFFF",
      magenta: "#FF00FF",
      navy: "#000080",
      maroon: "#800000",
      lime: "#00FF00",
      olive: "#808000",
      teal: "#008080",
      silver: "#C0C0C0",
      gold: "#FFD700",
      beige: "#F5F5DC",
      violet: "#8B00FF",
      indigo: "#4B0082",
      turquoise: "#40E0D0",
      coral: "#FF7F50",
      salmon: "#FA8072",
      tan: "#D2B48C",
      cream: "#FFFDD0",
      lavender: "#E6E6FA",
      mint: "#98FF98",
      peach: "#FFE5B4",
    };

    const normalizedName = colorName.toLowerCase().trim();
    
    // Check for variations (e.g., "dark red", "light blue")
    if (normalizedName.includes("dark")) {
      const baseColor = normalizedName.replace("dark", "").trim();
      switch (baseColor) {
        case "red": return "#8B0000";
        case "blue": return "#00008B";
        case "green": return "#006400";
        default: return colorMap[baseColor] || "#FFFFFF";
      }
    }
    
    if (normalizedName.includes("light")) {
      const baseColor = normalizedName.replace("light", "").trim();
      switch (baseColor) {
        case "blue": return "#ADD8E6";
        case "green": return "#90EE90";
        default: return colorMap[baseColor] || "#FFFFFF";
      }
    }
    
    return colorMap[normalizedName] || "#FFFFFF";
  };

  // Use originalColor for hex mapping, fallback to color if not provided
  const colorForHex = originalColor || color;
  const colorHex = isLoading ? "#FFFFFF" : getColorHex(colorForHex);

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={onDismiss}
        disabled={isLoading}
      >
        <View style={styles.content}>
          {isLoading ? (
            <>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>Analyzing...</Text>
            </>
          ) : (
            <>
              <Text style={styles.objectLabel} numberOfLines={2}>
                {objectLabel || "..."}
              </Text>
              <Text style={[styles.colorLabel, { color: colorHex }]} numberOfLines={1}>
                {color || "..."}
              </Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -40,
    marginLeft: -100,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  content: {
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    minWidth: 200,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  objectLabel: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    textTransform: "capitalize",
    textAlign: "center",
    marginBottom: 4,
  },
  colorLabel: {
    fontSize: 18,
    fontWeight: "600",
    textTransform: "capitalize",
    textAlign: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    textAlign: "center",
  },
});

