import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";

export default function RootLayout() {
  return (
    <GestureHandlerRootView>
    <PaperProvider>
      <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
        <Stack.Screen name="index"  />
        <Stack.Screen name="result"  />
      </Stack>
    </PaperProvider>
    </GestureHandlerRootView>
  );
}
