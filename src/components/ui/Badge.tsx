/**
 * Badge Component
 * Status badges with different variants
 */

import { StyleSheet, Text, View, ViewStyle } from 'react-native';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: '#DCFCE7', text: '#16A34A' },
  warning: { bg: '#FEF3C7', text: '#D97706' },
  error: { bg: '#FEE2E2', text: '#DC2626' },
  info: { bg: '#DBEAFE', text: '#2563EB' },
  default: { bg: '#F3F4F6', text: '#6B7280' },
};

export function Badge({ label, variant = 'default', style }: BadgeProps) {
  const colors = variantStyles[variant];

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});
