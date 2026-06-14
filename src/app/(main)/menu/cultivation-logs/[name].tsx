import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LoadingScreen, ErrorScreen } from '@/components/ui';
import * as CultivationLogAPI from '@/services/api/resources/cultivationLog';
import type { CultivationLog } from '@/types/models';
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
  const [log, setLog] = useState<CultivationLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!name) return;
    try {
      setLoading(true);
      setError(null);
      const result = await CultivationLogAPI.get(decodeURIComponent(name));
      setLog(result);
    } catch {
      setError(t('cultivationLogs.notFound'));
    } finally {
      setLoading(false);
    }
  }, [name, t]);

  useEffect(() => { loadData(); }, [loadData]);

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
        <View style={{ width: 40 }} />
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
            <Text style={styles.sectionTitle}>{t('common.noDescription')}</Text>
            <Text style={styles.notesText}>{log.notes}</Text>
          </View>
        ) : null}

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
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  notesText: { fontSize: 14, color: '#374151', lineHeight: 22 },
  metaCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14 },
  metaLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 8 },
  metaValue: { fontSize: 13, color: '#374151' },
});
