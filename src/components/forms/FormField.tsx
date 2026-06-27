/**
 * FormField — Text input with label, error, and required indicator
 */

import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

interface Props extends TextInputProps {
  label: string;
  required?: boolean;
  error?: string;
}

export function FormField({ label, required, error, style, ...inputProps }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={styles.required}>*</Text>}
      </View>
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor="#9CA3AF"
        {...inputProps}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', marginBottom: 6 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151' },
  required: { fontSize: 14, color: '#DC2626', marginLeft: 2 },
  input: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#1F2937',
  },
  inputError: { borderColor: '#DC2626' },
  error: { fontSize: 12, color: '#DC2626', marginTop: 4 },
});
