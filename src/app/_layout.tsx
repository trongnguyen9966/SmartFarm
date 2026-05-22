/**
 * Root Layout
 * Sets up FrappeProvider, AuthProvider, SafeArea, and navigation structure
 */

if (__DEV__) {
  require('@/config/reactotron');
}

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import 'react-native-reanimated';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { FrappeProvider } from '@/providers/FrappeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import settingApp from '@/settingApp';

// Set the root view background color to match the app theme
// This ensures the status bar area on iOS has the correct color
SystemUI.setBackgroundColorAsync(settingApp.green_primery);

export default function RootLayout() {
  return (
    <Provider store={store}>
      <FrappeProvider>
        <SafeAreaProvider>
          <AuthProvider>
            <View style={{ flex: 1, backgroundColor: settingApp.green_primery }}>
              <StatusBar style="light" />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="auth" />
                <Stack.Screen name="(store-employee)" />
                <Stack.Screen name="(farm-owner)" />
                <Stack.Screen name="(investor)" />
                {/* Keep old tabs for backward compatibility, will be removed later */}
                <Stack.Screen name="(tabs)" />
              </Stack>
            </View>
          </AuthProvider>
        </SafeAreaProvider>
      </FrappeProvider>
    </Provider>
  );
}
