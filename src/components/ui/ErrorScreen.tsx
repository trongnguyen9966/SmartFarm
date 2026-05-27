/**
 * ErrorScreen Component
 * Full screen error display with retry option
 */

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import settingApp from '@/settingApp';

interface ErrorScreenProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorScreen({
  title,
  message,
  onRetry,
  retryLabel,
}: ErrorScreenProps) {
  const { t } = useTranslation();
  const displayTitle = title ?? t('common.errorOccurred');
  const displayMessage = message ?? t('common.errorLoadData');
  const displayRetryLabel = retryLabel ?? t('common.retry');

  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
      <Text style={styles.title}>{displayTitle}</Text>
      <Text style={styles.message}>{displayMessage}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Ionicons name="refresh" size={18} color="#FFFFFF" />
          <Text style={styles.retryText}>{displayRetryLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: settingApp.green_primery,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 24,
    gap: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
