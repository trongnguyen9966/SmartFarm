/**
 * Cultivation Log Form — Create / Edit
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
import { FormField, PickerField, PickerModal, DatePickerField, type PickerItem } from '@/components/forms';
import { LoadingScreen } from '@/components/ui';
import * as CultivationLogAPI from '@/services/api/resources/cultivationLog';
import * as GardenAPI from '@/services/api/resources/garden';
import * as CultivationMasterAPI from '@/services/api/resources/cultivationMaster';
import { saveOrQueue } from '@/services/offlineQueue';
import { useNetwork } from '@/hooks/useNetwork';
import settingApp from '@/settingApp';

export default function CultivationLogFormScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = !!edit;
  const docName = edit ? decodeURIComponent(edit) : undefined;
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isConnected } = useNetwork();

  // Form state
  const [garden, setGarden] = useState('');
  const [gardenDisplay, setGardenDisplay] = useState('');
  const [farm, setFarm] = useState('');
  const [farm_owner, setFarmOwner] = useState('');
  const [cultivation_master, setCultivationMaster] = useState('');
  const [cmDisplay, setCmDisplay] = useState('');
  const [cultivation_type, setCultivationType] = useState('');
  const [from_date, setFromDate] = useState('');
  const [to_date, setToDate] = useState('');
  const [expected_harvest_date, setExpectedHarvest] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'In Progress' | 'Completed' | 'Cancelled'>('In Progress');

  // Picker data
  const [gardens, setGardens] = useState<PickerItem[]>([]);
  const [gardenPickerVisible, setGardenPickerVisible] = useState(false);
  const [cultivationMasters, setCultivationMasters] = useState<PickerItem[]>([]);
  const [cmPickerVisible, setCmPickerVisible] = useState(false);

  // UI state
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load picker data
  useEffect(() => {
    (async () => {
      try {
        const [gardenList, cmList] = await Promise.all([
          GardenAPI.list(),
          CultivationMasterAPI.list(),
        ]);
        setGardens(gardenList.map(g => ({
          value: g.name, label: g.garden_name, subtitle: g.farm,
        })));
        setCultivationMasters(cmList.map(cm => ({
          value: cm.name, label: cm.cultivation_name, subtitle: cm.cultivation_type,
        })));
      } catch { /* ignore */ }
    })();
  }, []);

  // Load existing doc for edit
  useEffect(() => {
    if (!isEdit || !docName) return;
    (async () => {
      try {
        const doc = await CultivationLogAPI.get(docName);
        setGarden(doc.garden);
        setGardenDisplay(doc.garden_name || doc.garden);
        setFarm(doc.farm);
        setFarmOwner(doc.farm_owner);
        setCultivationMaster(doc.cultivation_master);
        setCmDisplay(doc.cultivation_master);
        setCultivationType(doc.cultivation_type);
        setFromDate(doc.from_date);
        setToDate(doc.to_date || '');
        setExpectedHarvest(doc.expected_harvest_date || '');
        setNotes(doc.notes || '');
        setStatus(doc.status);
      } catch {
        Alert.alert(t('common.error'), t('cultivationLogs.notFound'));
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, docName, t, router]);

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    if (!garden) errs.garden = t('form.required');
    if (!cultivation_master) errs.cultivation_master = t('form.required');
    if (!from_date) errs.from_date = t('form.required');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [garden, cultivation_master, from_date, t]);

  const handleSave = useCallback(async () => {
    if (!validate()) return;
    setSaving(true);

    const data: Record<string, unknown> = {
      garden,
      farm,
      farm_owner,
      cultivation_master,
      cultivation_type,
      from_date,
      to_date: to_date || undefined,
      expected_harvest_date: expected_harvest_date || undefined,
      notes: notes || undefined,
      status,
    };

    const result = await saveOrQueue({
      action: isEdit ? 'update' : 'create',
      doctype: 'Cultivation Log',
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
  }, [validate, garden, farm, farm_owner, cultivation_master, cultivation_type, from_date, to_date, expected_harvest_date, notes, status, isEdit, docName, t, router]);

  if (loading) return <LoadingScreen message={t('common.loading')} />;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEdit ? t('form.editCultivation') : t('form.createCultivation')}
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
            label={t('form.cultivationMaster')}
            required
            placeholder={t('form.selectCultivationMaster')}
            value={cultivation_master}
            displayValue={cmDisplay}
            error={errors.cultivation_master}
            onPress={() => setCmPickerVisible(true)}
          />

          <DatePickerField
            label={t('form.fromDate')}
            required
            value={from_date}
            error={errors.from_date}
            onChange={setFromDate}
          />

          <DatePickerField
            label={t('form.toDate')}
            value={to_date}
            onChange={setToDate}
          />

          <DatePickerField
            label={t('form.expectedHarvest')}
            value={expected_harvest_date}
            onChange={setExpectedHarvest}
          />

          <FormField
            label={t('form.notes')}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('form.notes')}
            multiline
            numberOfLines={4}
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />

          {/* Status */}
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{t('form.status')}</Text>
            <View style={styles.statusToggle}>
              {(['In Progress', 'Completed', 'Cancelled'] as const).map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusBtn, status === s && styles.statusBtnSelected]}
                  onPress={() => setStatus(s)}
                >
                  <Text style={[styles.statusBtnText, status === s && styles.statusBtnTextSelected]}>
                    {s === 'In Progress' ? t('cultivationLogs.statusInProgress')
                      : s === 'Completed' ? t('cultivationLogs.statusCompleted')
                      : t('cultivationLogs.statusCancelled')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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

      <PickerModal
        visible={gardenPickerVisible}
        title={t('form.selectGarden')}
        items={gardens}
        selectedValue={garden}
        onSelect={(item) => {
          setGarden(item.value);
          setGardenDisplay(item.label);
          if (item.subtitle) setFarm(item.subtitle);
          // Find farm_owner from gardens data
          setGardenPickerVisible(false);
        }}
        onClose={() => setGardenPickerVisible(false)}
      />

      <PickerModal
        visible={cmPickerVisible}
        title={t('form.selectCultivationMaster')}
        items={cultivationMasters}
        selectedValue={cultivation_master}
        onSelect={(item) => {
          setCultivationMaster(item.value);
          setCmDisplay(item.label);
          if (item.subtitle) setCultivationType(item.subtitle);
          setCmPickerVisible(false);
        }}
        onClose={() => setCmPickerVisible(false)}
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
  statusToggle: { flexDirection: 'row', gap: 6 },
  statusBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  statusBtnSelected: { backgroundColor: '#DBEAFE', borderColor: '#2563EB' },
  statusBtnText: { fontSize: 12, fontWeight: '500', color: '#6B7280' },
  statusBtnTextSelected: { color: '#2563EB' },
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
