/**
 * LoadingScreen Component
 * Full screen loading indicator
 */

import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import settingApp from '@/settingApp';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={settingApp.green_primery} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  message: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  },
});
