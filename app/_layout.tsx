import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="admin-dashboard" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="persona" />
      <Stack.Screen name="mfa-setup" />
      <Stack.Screen name="admin-events" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
