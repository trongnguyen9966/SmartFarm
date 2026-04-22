import { Stack } from 'expo-router';

export default function FarmsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="owner/[id]" />
      <Stack.Screen name="farm/[id]" />
      <Stack.Screen name="garden/[id]" />
      <Stack.Screen name="cultivation/[id]" />
      <Stack.Screen name="care/[id]" />
    </Stack>
  );
}
