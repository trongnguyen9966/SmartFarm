/**
 * Main Stack Layout
 * Wraps Tabs + feature screens in a single Stack.
 * Feature screens push on top of tabs (tab bar hidden).
 */

import { Stack } from 'expo-router';

export default function MainLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
