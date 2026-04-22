import settingApp from '@/settingApp';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useAuth } from '@/hooks/useAuth';

SplashScreen.preventAutoHideAsync();

export default function SplashPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated, user } = useAuth();
  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hasNavigated = useRef(false);

  useEffect(() => {
    const prepare = async () => {
      await SplashScreen.hideAsync();

      // Animate title: fade in + scale up
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 4,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    };

    prepare();
  }, []);

  // Navigate after auth is loaded
  useEffect(() => {
    if (isLoading || hasNavigated.current) return;

    const navigate = async () => {
      // Wait a bit for splash animation
      await new Promise((resolve) => setTimeout(resolve, 1500));

      hasNavigated.current = true;

      if (isAuthenticated && user) {
        // User is logged in, AuthContext will handle navigation
        // Just trigger by going to a protected route
        const { getRouteForRole } = require('@/services/auth/authService');
        router.replace(getRouteForRole(user.primaryRole));
      } else {
        router.replace('/auth/login');
      }
    };

    navigate();
  }, [isLoading, isAuthenticated, user, router]);

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[
          styles.title,
          { opacity, transform: [{ scale }] },
        ]}
      >
        SmartFarm
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: settingApp.green_primery,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
