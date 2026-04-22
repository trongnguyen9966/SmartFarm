/**
 * ListItem Component
 * Standard list row with icon, title, subtitle, and chevron
 */

import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: IoniconsName;
  leftIconColor?: string;
  rightContent?: React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}

export function ListItem({
  title,
  subtitle,
  leftIcon,
  leftIconColor = '#333',
  rightContent,
  showChevron = true,
  onPress,
  style,
  disabled,
}: ListItemProps) {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[styles.container, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {leftIcon && (
        <View style={styles.leftIconContainer}>
          <Ionicons name={leftIcon} size={22} color={leftIconColor} />
        </View>
      )}

      <View style={styles.content}>
        <Text style={[styles.title, disabled && styles.disabled]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, disabled && styles.disabled]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {rightContent}

      {showChevron && onPress && (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  leftIconContainer: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  disabled: {
    opacity: 0.5,
  },
});
