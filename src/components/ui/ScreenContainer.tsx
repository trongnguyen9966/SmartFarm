/**
 * ScreenContainer Component
 * Provides consistent safe area handling for all screens
 * Handles iOS notch, Android status bar, and home indicator
 */

import React from 'react';
import { StyleSheet, View, ViewStyle, Platform, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets, Edge } from 'react-native-safe-area-context';
import settingApp from '@/settingApp';

interface ScreenContainerProps {
  children: React.ReactNode;
  /** Background color of the screen */
  backgroundColor?: string;
  /** Background color of the status bar area (iOS) */
  statusBarColor?: string;
  /** Whether to apply safe area to edges. Default: ['top', 'left', 'right'] */
  edges?: Edge[];
  /** Additional style for the container */
  style?: ViewStyle;
  /** Use View instead of SafeAreaView (for screens that handle their own safe area) */
  disableSafeArea?: boolean;
}

export function ScreenContainer({
  children,
  backgroundColor = '#F5F5F5',
  statusBarColor = settingApp.green_primery,
  edges = ['top', 'left', 'right'],
  style,
  disableSafeArea = false,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();

  if (disableSafeArea) {
    return (
      <View style={[styles.container, { backgroundColor }, style]}>
        {/* Status bar background for Android */}
        {Platform.OS === 'android' && (
          <View
            style={[
              styles.statusBarBackground,
              {
                height: StatusBar.currentHeight || 0,
                backgroundColor: statusBarColor,
              },
            ]}
          />
        )}
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Status bar background - extends behind the notch/status bar */}
      <View
        style={[
          styles.statusBarBackground,
          {
            height: insets.top,
            backgroundColor: statusBarColor,
          },
        ]}
      />
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor }, style]}
        edges={edges}
      >
        {children}
      </SafeAreaView>
    </View>
  );
}

/**
 * FullScreenContainer - For screens with custom headers that extend into status bar
 * Use this for screens where the header color should extend behind the status bar
 */
interface FullScreenContainerProps {
  children: React.ReactNode;
  /** Background color that extends behind status bar */
  headerColor?: string;
  /** Background color of the main content area */
  contentColor?: string;
  /** Additional style */
  style?: ViewStyle;
}

export function FullScreenContainer({
  children,
  headerColor = settingApp.green_primery,
  contentColor = '#F5F5F5',
  style,
}: FullScreenContainerProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.fullScreenContainer, { backgroundColor: headerColor }]}>
      {/* Padding for status bar */}
      <View style={{ height: insets.top, backgroundColor: headerColor }} />
      <View style={[styles.fullScreenContent, { backgroundColor: contentColor }, style]}>
        {children}
      </View>
      {/* Bottom safe area for home indicator */}
      <View style={{ height: insets.bottom, backgroundColor: contentColor }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  safeArea: {
    flex: 1,
  },
  fullScreenContainer: {
    flex: 1,
  },
  fullScreenContent: {
    flex: 1,
  },
});

export default ScreenContainer;
