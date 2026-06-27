/**
 * Root Layout
 * Sets up FrappeProvider, AuthProvider, SafeArea, and navigation structure
 */

import '@/config/polyfills';
import '@/i18n';

if (__DEV__) {
  require('@/config/reactotron');
}

import { useEffect } from 'react';
import { API_BASE_URL } from '@/constants/api';
import { AuthProvider } from '@/contexts/AuthContext';
import { FrappeProvider } from 'frappe-react-sdk';
import settingApp from '@/settingApp';
import { store } from '@/store';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import NetInfo from '@react-native-community/netinfo';
import { syncAll } from '@/services/offlineQueue';
// Set the root view background color to match the app theme
// This ensures the status bar area on iOS has the correct color
SystemUI.setBackgroundColorAsync(settingApp.green_primery);

export default function RootLayout() {
  // Auto-sync offline queue when network comes back
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        syncAll().then(({ synced }) => {
          if (synced > 0 && __DEV__) console.log(`[OfflineSync] Synced ${synced} docs`);
        });
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <Provider store={store}>
      <FrappeProvider url={API_BASE_URL} enableSocket={false}>
        <SafeAreaProvider>
          <AuthProvider>
            <View style={{ flex: 1, backgroundColor: settingApp.green_primery }}>
              <StatusBar style="light" />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="auth" />
                <Stack.Screen name="(main)" />
              </Stack>
            </View>
          </AuthProvider>
        </SafeAreaProvider>
      </FrappeProvider>
    </Provider>
  );
}
