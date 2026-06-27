/**
 * DatePickerField — Tappable field that opens native date picker
 */

import { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  label: string;
  required?: boolean;
  value?: string; // ISO date string (YYYY-MM-DD)
  placeholder?: string;
  error?: string;
  onChange: (dateStr: string) => void;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN');
}

export function DatePickerField({ label, required, value, placeholder, error, onChange }: Props) {
  const [show, setShow] = useState(false);

  const handleChange = (_: unknown, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (selectedDate) {
      const iso = selectedDate.toISOString().split('T')[0];
      onChange(iso);
    }
  };

  const currentDate = value ? new Date(value) : new Date();

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={styles.required}>*</Text>}
      </View>
      <TouchableOpacity
        style={[styles.input, error && styles.inputError]}
        onPress={() => setShow(true)}
      >
        <Text style={[styles.inputText, !value && styles.placeholder]}>
          {value ? formatDate(value) : (placeholder || 'Chọn ngày')}
        </Text>
        <Ionicons name="calendar-outline" size={18} color="#9CA3AF" />
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}

      {show && (
        <>
          {Platform.OS === 'ios' && (
            <View style={styles.iosActions}>
              <TouchableOpacity onPress={() => setShow(false)}>
                <Text style={styles.doneBtn}>Xong</Text>
              </TouchableOpacity>
            </View>
          )}
          <DateTimePicker
            value={currentDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleChange}
          />
        </>
      )}
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  inputError: { borderColor: '#DC2626' },
  inputText: { fontSize: 14, color: '#1F2937' },
  placeholder: { color: '#9CA3AF' },
  error: { fontSize: 12, color: '#DC2626', marginTop: 4 },
  iosActions: { alignItems: 'flex-end', paddingRight: 8, paddingTop: 8 },
  doneBtn: { fontSize: 16, fontWeight: '600', color: '#2196F3' },
});
