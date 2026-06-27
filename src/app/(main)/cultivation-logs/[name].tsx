import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LoadingScreen, ErrorScreen } from '@/components/ui';
import { DOCTYPES } from '@/constants/api';
import { usePermission } from '@/hooks/usePermission';
import * as CultivationLogAPI from '@/services/api/resources/cultivationLog';
import * as CareLogAPI from '@/services/api/resources/careLog';
import type { CultivationLog, CareLog } from '@/types/models';
import settingApp from '@/settingApp';

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value || '—'}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  label: { fontSize: 13, color: '#9CA3AF', flex: 1 },
  value: { fontSize: 13, color: '#1C1E21', fontWeight: '500', flex: 2, textAlign: 'right' },
});

export default function CultivationLogDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { canWrite: canWriteCL } = usePermission(DOCTYPES.CULTIVATION_LOG);
  const { canCreate: canCreateCare } = usePermission(DOCTYPES.CARE_LOG);
  const [log, setLog] = useState<CultivationLog | null>(null);
  const [careLogs, setCareLogs] = useState<CareLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const decodedName = name ? decodeURIComponent(name) : '';

  const loadData = useCallback(async () => {
    if (!decodedName) return;
    try {
      setLoading(true);
      setError(null);
      const [result, allCareLogs] = await Promise.all([
        CultivationLogAPI.get(decodedName),
        CareLogAPI.list(),
      ]);
      setLog(result);
      // Filter care logs belonging to this cultivation log
      setCareLogs(allCareLogs.filter(cl => cl.cultivation_log === decodedName));
    } catch {
      setError(t('cultivationLogs.notFound'));
    } finally {
      setLoading(false);
    }
  }, [decodedName, t]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  if (loading) return <LoadingScreen message={t('common.loading')} />;
  if (error || !log) return <ErrorScreen message={error ?? t('cultivationLogs.notFound')} onRetry={loadData} />;

  const statusColor = log.status === 'Completed' ? '#059669' : log.status === 'In Progress' ? '#2563EB' : '#6B7280';
  const statusBg   = log.status === 'Completed' ? '#D1FAE5' : log.status === 'In Progress' ? '#DBEAFE' : '#F3F4F6';
  const statusLabel = log.status === 'Completed'
    ? t('cultivationLogs.statusCompleted')
    : log.status === 'In Progress'
    ? t('cultivationLogs.statusInProgress')
    : t('cultivationLogs.statusCancelled');

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{log.name}</Text>
        {canWriteCL ? (
          <TouchableOpacity
            onPress={() => router.push(`/(main)/cultivation-logs/form?edit=${encodeURIComponent(log.name)}` as never)}
            style={styles.backBtn}
          >
            <Ionicons name="create-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Status badge */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.card}>
          <InfoRow label={t('cultivation.garden')} value={log.garden_name || log.garden} />
          <InfoRow label={t('cultivation.farm')} value={log.farm} />
          <InfoRow label={t('cultivationLogs.cultivationType')} value={log.cultivation_type} />
          <InfoRow label={t('cultivationLogs.cultivationMaster')} value={log.cultivation_master} />
        </View>

        {/* Dates */}
        <View style={styles.card}>
          <InfoRow label={t('cultivationLogs.fromDate')} value={log.from_date} />
          <InfoRow label={t('cultivationLogs.toDate')} value={log.to_date} />
          {log.expected_harvest_date && (
            <InfoRow label={t('cultivationLogs.expectedHarvest')} value={log.expected_harvest_date} />
          )}
        </View>

        {/* Notes */}
        {log.notes ? (
          <View style={styles.card}>
            <Text style={styles.notesTitle}>{t('form.notes')}</Text>
            <Text style={styles.notesText}>{log.notes}</Text>
          </View>
        ) : null}

        {/* Care Logs Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('cultivation.careLogs')}</Text>
          <Text style={styles.sectionCount}>{careLogs.length}</Text>
        </View>

        {careLogs.length > 0 ? (
          careLogs.map(care => (
            <TouchableOpacity
              key={care.name}
              style={styles.careCard}
              onPress={() => router.push(`/(main)/care-logs/${encodeURIComponent(care.name)}` as never)}
            >
              <View style={styles.careCardLeft}>
                <View style={styles.careIconBox}>
                  <Ionicons name="clipboard" size={18} color="#FF5722" />
                </View>
                <View style={styles.careCardInfo}>
                  <Text style={styles.careCardTitle}>{care.care_date}</Text>
                  {care.content ? (
                    <Text style={styles.careCardSub} numberOfLines={1}>{care.content}</Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.careCardRight}>
                {care.efficiency_percent != null && (
                  <View style={[
                    styles.effBadge,
                    { backgroundColor: care.efficiency_percent >= 80 ? '#D1FAE5' : care.efficiency_percent >= 50 ? '#FEF3C7' : '#FEE2E2' },
                  ]}>
                    <Text style={[
                      styles.effText,
                      { color: care.efficiency_percent >= 80 ? '#059669' : care.efficiency_percent >= 50 ? '#D97706' : '#DC2626' },
                    ]}>
                      {care.efficiency_percent}%
                    </Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyCare}>
            <Ionicons name="clipboard-outline" size={32} color="#D1D5DB" />
            <Text style={styles.emptyCareText}>{t('cultivation.noCareLogs')}</Text>
          </View>
        )}

        {/* Metadata */}
        <View style={styles.metaCard}>
          <Text style={styles.metaLabel}>{t('metadata.createdBy')}</Text>
          <Text style={styles.metaValue}>{log.owner}</Text>
          <Text style={styles.metaLabel}>{t('metadata.createdDate')}</Text>
          <Text style={styles.metaValue}>{log.creation?.split(' ')[0]}</Text>
          <Text style={styles.metaLabel}>{t('metadata.updatedDate')}</Text>
          <Text style={styles.metaValue}>{log.modified?.split(' ')[0]}</Text>
        </View>
      </ScrollView>

      {/* FAB - Create Care Log for this Cultivation */}
      {canCreateCare && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push(
            `/(main)/care-logs/form?cultivation_log=${encodeURIComponent(log.name)}&garden=${encodeURIComponent(log.garden)}&garden_name=${encodeURIComponent(log.garden_name || log.garden)}` as never
          )}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    backgroundColor: settingApp.green_primery,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  statusRow: { alignItems: 'flex-start', marginBottom: 12 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  statusText: { fontSize: 14, fontWeight: '700' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 12 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 8, marginTop: 4,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  sectionCount: {
    fontSize: 12, fontWeight: '600', color: '#6B7280',
    backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
  },
  notesText: { fontSize: 14, color: '#374151', lineHeight: 22 },
  notesTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  // Care log cards
  careCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  careCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  careIconBox: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#FBE9E7',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  careCardInfo: { flex: 1 },
  careCardTitle: { fontSize: 14, fontWeight: '600', color: '#1C1E21' },
  careCardSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  careCardRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  effBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  effText: { fontSize: 11, fontWeight: '600' },
  emptyCare: {
    alignItems: 'center', paddingVertical: 24, backgroundColor: '#FFFFFF',
    borderRadius: 12, marginBottom: 12,
  },
  emptyCareText: { fontSize: 13, color: '#9CA3AF', marginTop: 6 },
  // Metadata
  metaCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14 },
  metaLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 8 },
  metaValue: { fontSize: 13, color: '#374151' },
  // FAB
  fab: {
    position: 'absolute', right: 16, bottom: 24, zIndex: 10,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: settingApp.green_primery,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 6,
  },
});
