/**
 * Garden Form — Create / Edit
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
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FormField, PickerField, PickerModal, type PickerItem } from '@/components/forms';
import { LoadingScreen } from '@/components/ui';
import * as GardenAPI from '@/services/api/resources/garden';
import * as FarmAPI from '@/services/api/resources/farm';
import { saveOrQueue } from '@/services/offlineQueue';
import { useNetwork } from '@/hooks/useNetwork';
import type { Garden, Farm } from '@/types/models';
import settingApp from '@/settingApp';

export default function GardenFormScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = !!edit;
  const gardenName = edit ? decodeURIComponent(edit) : undefined;
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isConnected } = useNetwork();

  // Form state
  const [garden_name, setGardenName] = useState('');
  const [farm, setFarm] = useState('');
  const [farmDisplay, setFarmDisplay] = useState('');
  const [farm_owner, setFarmOwner] = useState('');
  const [area, setArea] = useState('');
  const [area_uom, setAreaUom] = useState('sqm');
  const [soil_type, setSoilType] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  // Picker state
  const [farms, setFarms] = useState<PickerItem[]>([]);
  const [farmPickerVisible, setFarmPickerVisible] = useState(false);

  // UI state
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [farmsLoading, setFarmsLoading] = useState(false);

  // Load farms for picker
  useEffect(() => {
    (async () => {
      setFarmsLoading(true);
      try {
        const result = await FarmAPI.list();
        setFarms(result.map(f => ({ value: f.name, label: f.farm_name, subtitle: f.farm_owner })));
      } catch { /* ignore */ }
      setFarmsLoading(false);
    })();
  }, []);

  // Load existing garden for edit
  useEffect(() => {
    if (!isEdit || !gardenName) return;
    (async () => {
      try {
        const g = await GardenAPI.get(gardenName);
        setGardenName(g.garden_name);
        setFarm(g.farm);
        setFarmDisplay(g.farm);
        setFarmOwner(g.farm_owner);
        setArea(g.area ? String(g.area) : '');
        setAreaUom(g.area_uom || 'sqm');
        setSoilType(g.soil_type || '');
        setStatus(g.status);
      } catch {
        Alert.alert(t('common.error'), t('gardens.notFound'));
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, gardenName, t, router]);

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    if (!garden_name.trim()) errs.garden_name = t('form.required');
    if (!farm) errs.farm = t('form.required');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [garden_name, farm, t]);

  const handleSave = useCallback(async () => {
    if (!validate()) return;
    setSaving(true);

    const data: Record<string, unknown> = {
      garden_name: garden_name.trim(),
      farm,
      farm_owner,
      area: area ? parseFloat(area) : undefined,
      area_uom,
      soil_type: soil_type || undefined,
      status,
    };

    const result = await saveOrQueue({
      action: isEdit ? 'update' : 'create',
      doctype: 'Garden',
      docname: gardenName,
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
  }, [validate, garden_name, farm, farm_owner, area, area_uom, soil_type, status, isEdit, gardenName, t, router]);

  if (loading) return <LoadingScreen message={t('common.loading')} />;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEdit ? t('form.editGarden') : t('form.createGarden')}
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
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <FormField
            label={t('form.gardenName')}
            required
            value={garden_name}
            onChangeText={setGardenName}
            placeholder={t('form.gardenName')}
            error={errors.garden_name}
          />

          <PickerField
            label={t('form.farm')}
            required
            placeholder={t('form.selectFarm')}
            value={farm}
            displayValue={farmDisplay || farm}
            error={errors.farm}
            onPress={() => setFarmPickerVisible(true)}
          />

          <FormField
            label={t('form.area')}
            value={area}
            onChangeText={setArea}
            placeholder="0"
            keyboardType="numeric"
          />

          <FormField
            label={t('form.soilType')}
            value={soil_type}
            onChangeText={setSoilType}
            placeholder={t('form.soilType')}
          />

          {/* Status toggle */}
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{t('form.status')}</Text>
            <View style={styles.statusToggle}>
              <TouchableOpacity
                style={[styles.statusBtn, status === 'Active' && styles.statusBtnActive]}
                onPress={() => setStatus('Active')}
              >
                <Text style={[styles.statusBtnText, status === 'Active' && styles.statusBtnTextActive]}>
                  {t('common.active')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusBtn, status === 'Inactive' && styles.statusBtnInactive]}
                onPress={() => setStatus('Inactive')}
              >
                <Text style={[styles.statusBtnText, status === 'Inactive' && styles.statusBtnTextInactive]}>
                  {t('common.inactive')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Save Button */}
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

      <PickerModal
        visible={farmPickerVisible}
        title={t('form.selectFarm')}
        items={farms}
        loading={farmsLoading}
        selectedValue={farm}
        onSelect={(item) => {
          setFarm(item.value);
          setFarmDisplay(item.label);
          if (item.subtitle) setFarmOwner(item.subtitle);
          setFarmPickerVisible(false);
        }}
        onClose={() => setFarmPickerVisible(false)}
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
  content: { padding: 16, paddingBottom: 8 },
  statusRow: { marginBottom: 16 },
  statusLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 },
  statusToggle: { flexDirection: 'row', gap: 8 },
  statusBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  statusBtnActive: { backgroundColor: '#D1FAE5', borderColor: '#059669' },
  statusBtnInactive: { backgroundColor: '#F3F4F6', borderColor: '#6B7280' },
  statusBtnText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  statusBtnTextActive: { color: '#059669' },
  statusBtnTextInactive: { color: '#6B7280' },
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
