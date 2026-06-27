/**
 * Care Log Form — Create / Edit with items child table
 * Supports offline: saves to queue when no network.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FormField, PickerField, PickerModal, DatePickerField, type PickerItem } from '@/components/forms';
import { LoadingScreen } from '@/components/ui';
import * as CareLogAPI from '@/services/api/resources/careLog';
import * as GardenAPI from '@/services/api/resources/garden';
import * as CultivationLogAPI from '@/services/api/resources/cultivationLog';
import * as ItemAPI from '@/services/api/resources/item';
import { saveOrQueue } from '@/services/offlineQueue';
import { useNetwork } from '@/hooks/useNetwork';
import type { CareLogItem } from '@/types/models';
import settingApp from '@/settingApp';

interface FormItem {
  id: string; // temp ID for key
  item: string;
  item_name: string;
  quantity: string;
  uom: string;
  notes: string;
}

function newItem(): FormItem {
  return { id: String(Date.now()), item: '', item_name: '', quantity: '', uom: '', notes: '' };
}

export default function CareLogFormScreen() {
  const params = useLocalSearchParams<{
    edit?: string;
    cultivation_log?: string;
    garden?: string;
    garden_name?: string;
  }>();
  const isEdit = !!params.edit;
  const docName = params.edit ? decodeURIComponent(params.edit) : undefined;
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isConnected } = useNetwork();

  // Pre-fill from query params (when navigating from Cultivation Log detail)
  const initialCL = params.cultivation_log ? decodeURIComponent(params.cultivation_log) : '';
  const initialGarden = params.garden ? decodeURIComponent(params.garden) : '';
  const initialGardenName = params.garden_name ? decodeURIComponent(params.garden_name) : '';

  // Form state
  const [cultivation_log, setCultivationLog] = useState(initialCL);
  const [clDisplay, setClDisplay] = useState(initialCL);
  const [garden, setGarden] = useState(initialGarden);
  const [gardenDisplay, setGardenDisplay] = useState(initialGardenName || initialGarden);
  const [care_date, setCareDate] = useState(new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState('');
  const [efficiency_percent, setEfficiency] = useState('');
  const [items, setItems] = useState<FormItem[]>([newItem()]);

  // Picker data
  const [gardens, setGardens] = useState<PickerItem[]>([]);
  const [gardenPickerVisible, setGardenPickerVisible] = useState(false);
  const [cultivationLogs, setCultivationLogs] = useState<PickerItem[]>([]);
  const [clPickerVisible, setClPickerVisible] = useState(false);
  const [apiItems, setApiItems] = useState<PickerItem[]>([]);
  const [itemPickerVisible, setItemPickerVisible] = useState(false);
  const [editingItemIdx, setEditingItemIdx] = useState(-1);

  // UI state
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load picker data
  useEffect(() => {
    (async () => {
      try {
        const [gardenList, clList, itemList] = await Promise.all([
          GardenAPI.list(),
          CultivationLogAPI.list(),
          ItemAPI.list(),
        ]);
        setGardens(gardenList.map(g => ({ value: g.name, label: g.garden_name, subtitle: g.farm })));
        setCultivationLogs(clList.map(cl => ({
          value: cl.name, label: cl.garden || cl.name, subtitle: cl.cultivation_master,
        })));
        setApiItems(itemList.map(i => ({
          value: i.item_code || i.name, label: i.item_name, subtitle: i.stock_uom,
        })));
      } catch { /* ignore */ }
    })();
  }, []);

  // Load existing doc for edit
  useEffect(() => {
    if (!isEdit || !docName) return;
    (async () => {
      try {
        const doc = await CareLogAPI.get(docName);
        setCultivationLog(doc.cultivation_log);
        setClDisplay(doc.cultivation_log);
        setGarden(doc.garden);
        setGardenDisplay(doc.garden_name || doc.garden);
        setCareDate(doc.care_date);
        setContent(doc.content || '');
        setEfficiency(doc.efficiency_percent != null ? String(doc.efficiency_percent) : '');
        if (doc.items?.length) {
          setItems(doc.items.map((item: CareLogItem) => ({
            id: String(Math.random()),
            item: item.item,
            item_name: item.item_name || item.item,
            quantity: String(item.quantity),
            uom: item.uom,
            notes: item.notes || '',
          })));
        }
      } catch {
        Alert.alert(t('common.error'), t('care.notFound'));
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, docName, t, router]);

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    if (!garden) errs.garden = t('form.required');
    if (!care_date) errs.care_date = t('form.required');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [garden, care_date, t]);

  const updateItem = (idx: number, field: keyof FormItem, value: string) => {
    setItems(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const addItem = () => {
    setItems(prev => [...prev, newItem()]);
  };

  const handleSave = useCallback(async () => {
    if (!validate()) return;
    setSaving(true);

    const validItems = items
      .filter(it => it.item && it.quantity)
      .map(it => ({
        item: it.item,
        item_name: it.item_name,
        quantity: parseFloat(it.quantity) || 0,
        uom: it.uom,
        notes: it.notes || undefined,
      }));

    const data: Record<string, unknown> = {
      cultivation_log: cultivation_log || undefined,
      garden,
      care_date,
      content: content || undefined,
      efficiency_percent: efficiency_percent ? parseFloat(efficiency_percent) : undefined,
      items: validItems,
    };

    const result = await saveOrQueue({
      action: isEdit ? 'update' : 'create',
      doctype: 'Care Log',
      docname: docName,
      data,
    });

    setSaving(false);

    if (result.synced) {
      Alert.alert(t('form.saveSuccess'), '', [{ text: 'OK', onPress: () => router.back() }]);
    } else {
      Alert.alert(
        t('form.saveSuccess'),
        'Dữ liệu đã được lưu offline. Sẽ tự động đồng bộ khi có mạng.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  }, [validate, cultivation_log, garden, care_date, content, efficiency_percent, items, isEdit, docName, t, router]);

  if (loading) return <LoadingScreen message={t('common.loading')} />;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEdit ? t('form.editCareLog') : t('form.createCareLog')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color="#92400E" />
          <Text style={styles.offlineText}>Offline — dữ liệu sẽ đồng bộ khi có mạng</Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content_scroll}>
          <PickerField
            label={t('form.garden')}
            required
            placeholder={t('form.selectGarden')}
            value={garden}
            displayValue={gardenDisplay}
            error={errors.garden}
            onPress={() => setGardenPickerVisible(true)}
          />

          <PickerField
            label={t('form.cultivationLog')}
            placeholder={t('form.selectCultivation')}
            value={cultivation_log}
            displayValue={clDisplay}
            onPress={() => setClPickerVisible(true)}
          />

          <DatePickerField
            label={t('form.careDate')}
            required
            value={care_date}
            error={errors.care_date}
            onChange={setCareDate}
          />

          <FormField
            label={t('form.content')}
            value={content}
            onChangeText={setContent}
            placeholder={t('form.content')}
            multiline
            numberOfLines={3}
            style={{ minHeight: 70, textAlignVertical: 'top' }}
          />

          <FormField
            label={t('form.efficiency')}
            value={efficiency_percent}
            onChangeText={setEfficiency}
            placeholder="0 - 100"
            keyboardType="numeric"
          />

          {/* ─── Items Child Table ──────────────────────────────────── */}
          <View style={styles.itemsSection}>
            <View style={styles.itemsHeader}>
              <Text style={styles.itemsTitle}>{t('form.items')}</Text>
              <TouchableOpacity onPress={addItem} style={styles.addItemBtn}>
                <Ionicons name="add-circle" size={22} color={settingApp.green_primery} />
                <Text style={styles.addItemText}>{t('form.addItem')}</Text>
              </TouchableOpacity>
            </View>

            {items.map((item, idx) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemCardHeader}>
                  <Text style={styles.itemCardNum}>#{idx + 1}</Text>
                  <TouchableOpacity onPress={() => removeItem(idx)}>
                    <Ionicons name="trash-outline" size={18} color="#DC2626" />
                  </TouchableOpacity>
                </View>

                {/* Item picker */}
                <TouchableOpacity
                  style={styles.itemPickerBtn}
                  onPress={() => { setEditingItemIdx(idx); setItemPickerVisible(true); }}
                >
                  <Text style={[styles.itemPickerText, !item.item && { color: '#9CA3AF' }]}>
                    {item.item_name || t('form.selectItem')}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
                </TouchableOpacity>

                <View style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemFieldLabel}>{t('form.quantity')}</Text>
                    <TextInput
                      style={styles.itemInput}
                      value={item.quantity}
                      onChangeText={v => updateItem(idx, 'quantity', v)}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemFieldLabel}>{t('form.uom')}</Text>
                    <TextInput
                      style={styles.itemInput}
                      value={item.uom}
                      onChangeText={v => updateItem(idx, 'uom', v)}
                      placeholder="kg, lít..."
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
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

      {/* Pickers */}
      <PickerModal
        visible={gardenPickerVisible}
        title={t('form.selectGarden')}
        items={gardens}
        selectedValue={garden}
        onSelect={(picked) => {
          setGarden(picked.value);
          setGardenDisplay(picked.label);
          setGardenPickerVisible(false);
        }}
        onClose={() => setGardenPickerVisible(false)}
      />

      <PickerModal
        visible={clPickerVisible}
        title={t('form.selectCultivation')}
        items={cultivationLogs}
        selectedValue={cultivation_log}
        onSelect={(picked) => {
          setCultivationLog(picked.value);
          setClDisplay(picked.label);
          setClPickerVisible(false);
        }}
        onClose={() => setClPickerVisible(false)}
      />

      <PickerModal
        visible={itemPickerVisible}
        title={t('form.selectItem')}
        items={apiItems}
        selectedValue={editingItemIdx >= 0 ? items[editingItemIdx]?.item : undefined}
        onSelect={(picked) => {
          if (editingItemIdx >= 0) {
            updateItem(editingItemIdx, 'item', picked.value);
            updateItem(editingItemIdx, 'item_name', picked.label);
            if (picked.subtitle) updateItem(editingItemIdx, 'uom', picked.subtitle);
          }
          setItemPickerVisible(false);
          setEditingItemIdx(-1);
        }}
        onClose={() => { setItemPickerVisible(false); setEditingItemIdx(-1); }}
      />
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
  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FEF3C7', paddingHorizontal: 14, paddingVertical: 8,
  },
  offlineText: { fontSize: 12, color: '#92400E', fontWeight: '500' },
  scroll: { flex: 1 },
  content_scroll: { padding: 16, paddingBottom: 8 },

  // Items child table
  itemsSection: { marginBottom: 16 },
  itemsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8,
  },
  itemsTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  addItemBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addItemText: { fontSize: 13, color: settingApp.green_primery, fontWeight: '600' },
  itemCard: {
    backgroundColor: '#FFFFFF', borderRadius: 10, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  itemCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8,
  },
  itemCardNum: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  itemPickerBtn: {
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  itemPickerText: { fontSize: 14, color: '#1F2937' },
  itemRow: { flexDirection: 'row', gap: 8 },
  itemFieldLabel: { fontSize: 11, color: '#6B7280', marginBottom: 4 },
  itemInput: {
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8,
    fontSize: 14, color: '#1F2937',
  },

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
