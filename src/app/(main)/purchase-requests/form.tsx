/**
 * Purchase Request Form — Create only (no edit)
 * Uses RPC endpoint: esf.api.farm_owner.create_purchase_request
 */

import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FormField, PickerField, PickerModal, type PickerItem } from '@/components/forms';
import * as FarmAPI from '@/services/api/resources/farm';
import * as ItemAPI from '@/services/api/resources/item';
import { createPurchaseRequest } from '@/services/api/rpc/farmOwner';
import { API_BASE_URL } from '@/constants/api';
import type { Item } from '@/types/models';
import settingApp from '@/settingApp';

interface RequestItem {
  item: string;
  item_name: string;
  quantity: string;
  uom: string;
  image?: string;
}

function getImageUri(imagePath?: string) {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${API_BASE_URL}${imagePath}`;
}

export default function PurchaseRequestFormScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Form state
  const [farm, setFarm] = useState('');
  const [farmDisplay, setFarmDisplay] = useState('');
  const [items, setItems] = useState<RequestItem[]>([]);
  const [notes, setNotes] = useState('');

  // Picker data
  const [farms, setFarms] = useState<PickerItem[]>([]);
  const [farmPickerVisible, setFarmPickerVisible] = useState(false);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [itemPickerVisible, setItemPickerVisible] = useState(false);
  const [itemSearch, setItemSearch] = useState('');
  const [editingItemIndex, setEditingItemIndex] = useState(-1);

  // UI state
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load picker data
  useEffect(() => {
    (async () => {
      try {
        const [farmList, itemList] = await Promise.all([
          FarmAPI.list(),
          ItemAPI.list({ filters: [['custom_usage_type', 'in', ['Farm Care', 'Both']]] }),
        ]);
        setFarms(farmList.map(f => ({
          value: f.name, label: f.farm_name,
        })));
        setAllItems(itemList);
      } catch { /* ignore */ }
    })();
  }, []);

  const addItem = useCallback(() => {
    setEditingItemIndex(items.length);
    setItemSearch('');
    setItemPickerVisible(true);
  }, [items.length]);

  const removeItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateItemQuantity = useCallback((index: number, qty: string) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, quantity: qty } : item));
  }, []);

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    if (!farm) errs.farm = t('purchaseRequests.farmRequired');
    if (items.length === 0) errs.items = t('purchaseRequests.itemRequired');
    const invalidQty = items.some(i => !i.quantity || Number(i.quantity) <= 0);
    if (invalidQty) errs.items = t('form.required');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [farm, items, t]);

  const handleSave = useCallback(async () => {
    if (!validate()) return;
    setSaving(true);

    try {
      const payload = {
        farm,
        items: items.map(i => ({
          item: i.item,
          quantity: Number(i.quantity),
          uom: i.uom,
        })),
        notes: notes || undefined,
      };

      if (__DEV__) {
        console.log('[PurchaseRequest] Submit payload:', JSON.stringify(payload, null, 2));
      }

      await createPurchaseRequest(payload);
      Alert.alert(t('purchaseRequests.submitSuccess'), '', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('purchaseRequests.submitError');
      Alert.alert(t('common.error'), message);
    } finally {
      setSaving(false);
    }
  }, [validate, farm, items, notes, t, router]);

  const handleSelectItem = useCallback((selected: Item) => {
    const newItem: RequestItem = {
      item: selected.item_code || selected.name,
      item_name: selected.item_name,
      quantity: '1',
      uom: selected.stock_uom || 'Unit',
      image: selected.image,
    };
    setItems(prev => {
      const updated = [...prev];
      if (editingItemIndex >= prev.length) {
        updated.push(newItem);
      } else {
        updated[editingItemIndex] = newItem;
      }
      return updated;
    });
    setItemPickerVisible(false);
  }, [editingItemIndex]);

  const filteredPickerItems = allItems.filter(item =>
    item.item_name.toLowerCase().includes(itemSearch.toLowerCase()) ||
    (item.item_code || item.name).toLowerCase().includes(itemSearch.toLowerCase()) ||
    (item.description || '').toLowerCase().includes(itemSearch.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('purchaseRequests.createRequest')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {/* Farm picker */}
          <PickerField
            label={t('purchaseRequests.farm')}
            required
            placeholder={t('purchaseRequests.selectFarm')}
            value={farm}
            displayValue={farmDisplay}
            error={errors.farm}
            onPress={() => setFarmPickerVisible(true)}
          />

          {/* Items section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('form.items')}</Text>
            <TouchableOpacity onPress={addItem} style={styles.addBtn}>
              <Ionicons name="add-circle" size={24} color={settingApp.green_primery} />
              <Text style={styles.addBtnText}>{t('purchaseRequests.addItem')}</Text>
            </TouchableOpacity>
          </View>
          {errors.items && <Text style={styles.errorText}>{errors.items}</Text>}

          {items.length === 0 ? (
            <View style={styles.emptyItems}>
              <Ionicons name="cube-outline" size={32} color="#D1D5DB" />
              <Text style={styles.emptyItemsText}>{t('purchaseRequests.noItems')}</Text>
            </View>
          ) : (
            items.map((item, index) => {
              const imgUri = getImageUri(item.image);
              return (
                <View key={index} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    {imgUri ? (
                      <Image source={{ uri: imgUri }} style={styles.itemImage} />
                    ) : (
                      <View style={styles.itemIconBox}>
                        <Ionicons name="cube" size={18} color="#FF9800" />
                      </View>
                    )}
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.item_name}</Text>
                      <Text style={styles.itemUom}>{item.uom}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeItem(index)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="trash-outline" size={20} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                  <FormField
                    label={t('form.quantity')}
                    required
                    value={item.quantity}
                    onChangeText={(val) => updateItemQuantity(index, val)}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>
              );
            })
          )}

          {/* Notes */}
          <FormField
            label={t('purchaseRequests.notes')}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('purchaseRequests.notesPlaceholder')}
            multiline
            numberOfLines={4}
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>
              {saving ? t('form.saving') : t('common.save')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Farm Picker Modal */}
      <PickerModal
        visible={farmPickerVisible}
        title={t('purchaseRequests.selectFarm')}
        items={farms}
        selectedValue={farm}
        onSelect={(selected) => {
          setFarm(selected.value);
          setFarmDisplay(selected.label);
          setFarmPickerVisible(false);
        }}
        onClose={() => setFarmPickerVisible(false)}
      />

      {/* Item Picker Modal — custom with image, description, UOM */}
      <Modal visible={itemPickerVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={[pickerStyles.container, { paddingTop: insets.top + 8 }]}>
          <View style={pickerStyles.header}>
            <TouchableOpacity onPress={() => setItemPickerVisible(false)} style={pickerStyles.closeBtn}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={pickerStyles.title}>{t('form.selectItem')}</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={pickerStyles.searchRow}>
            <Ionicons name="search-outline" size={18} color="#9CA3AF" />
            <TextInput
              style={pickerStyles.searchInput}
              placeholder={t('common.search')}
              placeholderTextColor="#9CA3AF"
              value={itemSearch}
              onChangeText={setItemSearch}
              autoFocus
            />
          </View>

          <FlatList
            data={filteredPickerItems}
            keyExtractor={item => item.name}
            renderItem={({ item }) => {
              const imgUri = getImageUri(item.image);
              return (
                <TouchableOpacity
                  style={pickerStyles.item}
                  onPress={() => handleSelectItem(item)}
                >
                  {imgUri ? (
                    <Image source={{ uri: imgUri }} style={pickerStyles.itemImage} />
                  ) : (
                    <View style={pickerStyles.itemPlaceholder}>
                      <Ionicons name="cube-outline" size={24} color="#D1D5DB" />
                    </View>
                  )}
                  <View style={pickerStyles.itemContent}>
                    <Text style={pickerStyles.itemName} numberOfLines={1}>{item.item_name}</Text>
                    {item.description ? (
                      <Text style={pickerStyles.itemDesc} numberOfLines={2}>{item.description}</Text>
                    ) : null}
                    <Text style={pickerStyles.itemUom}>{item.stock_uom}</Text>
                  </View>
                  <Ionicons name="add-circle-outline" size={22} color={settingApp.green_primery} />
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={pickerStyles.empty}>
                <Ionicons name="cube-outline" size={40} color="#D1D5DB" />
                <Text style={pickerStyles.emptyText}>{t('common.notFound')}</Text>
              </View>
            }
            contentContainerStyle={pickerStyles.list}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    backgroundColor: settingApp.green_primery,
    paddingHorizontal: 16, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 8 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 8, marginTop: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: { fontSize: 14, fontWeight: '500', color: settingApp.green_primery },
  errorText: { fontSize: 12, color: '#DC2626', marginBottom: 8 },
  emptyItems: {
    alignItems: 'center', paddingVertical: 24, backgroundColor: '#FFFFFF',
    borderRadius: 12, marginBottom: 12,
  },
  emptyItemsText: { fontSize: 13, color: '#9CA3AF', marginTop: 6 },
  itemCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 2, elevation: 1,
  },
  itemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  itemImage: {
    width: 40, height: 40, borderRadius: 10, marginRight: 10,
    backgroundColor: '#F3F4F6',
  },
  itemIconBox: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF3E0',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#1C1E21' },
  itemUom: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  footer: {
    paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  saveBtn: {
    backgroundColor: settingApp.green_primery, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});

const pickerStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 8,
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
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  itemImage: {
    width: 56, height: 56, borderRadius: 10, backgroundColor: '#F3F4F6',
  },
  itemPlaceholder: {
    width: 56, height: 56, borderRadius: 10, backgroundColor: '#F9FAFB',
    justifyContent: 'center', alignItems: 'center',
  },
  itemContent: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  itemDesc: { fontSize: 12, color: '#6B7280', marginTop: 2, lineHeight: 16 },
  itemUom: { fontSize: 12, color: '#FF9800', fontWeight: '500', marginTop: 3 },
  empty: { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
});
