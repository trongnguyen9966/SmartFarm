import settingApp from '@/settingApp';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

SplashScreen.preventAutoHideAsync();

export default function SplashPage() {
  const router = useRouter();
  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0)).current;

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

      // Wait then navigate to login
      await new Promise((resolve) => setTimeout(resolve, 2000));
      router.replace('/auth/login');
    };

    prepare();
  }, []);

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
