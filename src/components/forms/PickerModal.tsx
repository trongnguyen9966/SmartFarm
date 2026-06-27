/**
 * PickerModal — Modal with searchable list for selecting items
 * Used for Farm, Garden, Cultivation Master, Item pickers
 */

import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import settingApp from '@/settingApp';

export interface PickerItem {
  value: string;
  label: string;
  subtitle?: string;
}

interface Props {
  visible: boolean;
  title: string;
  items: PickerItem[];
  loading?: boolean;
  selectedValue?: string;
  onSelect: (item: PickerItem) => void;
  onClose: () => void;
}

export function PickerModal({ visible, title, items, loading, selectedValue, onSelect, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (visible) setSearch('');
  }, [visible]);

  const filtered = items.filter(item =>
    item.label.toLowerCase().includes(search.toLowerCase()) ||
    item.value.toLowerCase().includes(search.toLowerCase()) ||
    (item.subtitle || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
        </View>

        {/* List */}
        {loading ? (
          <View style={styles.loading}>
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item.value}
            renderItem={({ item }) => {
              const isSelected = item.value === selectedValue;
              return (
                <TouchableOpacity
                  style={[styles.item, isSelected && styles.itemSelected]}
                  onPress={() => onSelect(item)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemLabel, isSelected && styles.itemLabelSelected]}>
                      {item.label}
                    </Text>
                    {item.subtitle && (
                      <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                    )}
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={22} color={settingApp.green_primery} />}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Không tìm thấy kết quả</Text>
              </View>
            }
            contentContainerStyle={styles.list}
          />
        )}
      </View>
    </Modal>
  );
}

/**
 * PickerField — Tappable field that opens PickerModal
 */

interface PickerFieldProps {
  label: string;
  required?: boolean;
  placeholder: string;
  value?: string;
  displayValue?: string;
  error?: string;
  onPress: () => void;
}

export function PickerField({ label, required, placeholder, value, displayValue, error, onPress }: PickerFieldProps) {
  return (
    <View style={fieldStyles.container}>
      <View style={fieldStyles.labelRow}>
        <Text style={fieldStyles.label}>{label}</Text>
        {required && <Text style={fieldStyles.required}>*</Text>}
      </View>
      <TouchableOpacity
        style={[fieldStyles.input, error && fieldStyles.inputError]}
        onPress={onPress}
      >
        <Text style={[fieldStyles.inputText, !value && fieldStyles.placeholder]}>
          {displayValue || value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
      </TouchableOpacity>
      {error && <Text style={fieldStyles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
    paddingBottom: 8,
  },
  closeBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  title: { flex: 1, fontSize: 17, fontWeight: '700', color: '#1F2937', textAlign: 'center' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    marginHorizontal: 12, marginBottom: 8, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#333' },
  list: { paddingHorizontal: 12, paddingBottom: 24 },
  item: {
    backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, marginBottom: 6,
    flexDirection: 'row', alignItems: 'center',
  },
  itemSelected: { borderWidth: 1.5, borderColor: settingApp.green_primery },
  itemLabel: { fontSize: 15, color: '#1F2937', fontWeight: '500' },
  itemLabelSelected: { color: settingApp.green_primery },
  itemSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
  loading: { alignItems: 'center', paddingTop: 40 },
  loadingText: { fontSize: 14, color: '#9CA3AF' },
});

const fieldStyles = StyleSheet.create({
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
  inputText: { fontSize: 14, color: '#1F2937', flex: 1 },
  placeholder: { color: '#9CA3AF' },
  error: { fontSize: 12, color: '#DC2626', marginTop: 4 },
});
