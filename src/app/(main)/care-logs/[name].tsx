import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LoadingScreen, ErrorScreen } from '@/components/ui';
import { DOCTYPES } from '@/constants/api';
import { usePermission } from '@/hooks/usePermission';
import * as CareLogAPI from '@/services/api/resources/careLog';
import type { CareLog } from '@/types/models';
import settingApp from '@/settingApp';

export default function CareLogDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { canWrite } = usePermission(DOCTYPES.CARE_LOG);
  const [log, setLog] = useState<CareLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!name) return;
    try {
      setLoading(true);
      setError(null);
      const result = await CareLogAPI.get(decodeURIComponent(name));
      setLog(result);
    } catch {
      setError(t('care.notFound'));
    } finally {
      setLoading(false);
    }
  }, [name, t]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <LoadingScreen message={t('common.loading')} />;
  if (error || !log) return <ErrorScreen message={error ?? t('care.notFound')} onRetry={loadData} />;

  const efficiency = log.efficiency_percent;
  const effColor = efficiency == null ? '#6B7280'
    : efficiency >= 80 ? '#059669'
    : efficiency >= 50 ? '#D97706'
    : '#DC2626';
  const effBg = efficiency == null ? '#F3F4F6'
    : efficiency >= 80 ? '#D1FAE5'
    : efficiency >= 50 ? '#FEF3C7'
    : '#FEE2E2';

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{log.name}</Text>
        {canWrite ? (
          <TouchableOpacity
            onPress={() => router.push(`/(main)/care-logs/form?edit=${encodeURIComponent(log.name)}` as never)}
            style={styles.backBtn}
          >
            <Ionicons name="create-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Efficiency badge */}
        {efficiency != null && (
          <View style={styles.effRow}>
            <Text style={styles.effLabel}>{t('care.efficiency')}</Text>
            <View style={[styles.effBadge, { backgroundColor: effBg }]}>
              <Text style={[styles.effText, { color: effColor }]}>{efficiency}%</Text>
            </View>
          </View>
        )}

        {/* Info */}
        <View style={styles.card}>
          <InfoRow label={t('gardens.gardenDetail')} value={log.garden_name || log.garden} />
          <InfoRow label={t('care.createdDate')} value={log.care_date} />
          {log.cultivation_log && (
            <InfoRow label={t('cultivation.title')} value={log.cultivation_log} />
          )}
        </View>

        {/* Work content */}
        {log.content && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('care.workContent')}</Text>
            <Text style={styles.contentText}>{log.content}</Text>
          </View>
        )}

        {/* Materials */}
        {log.items?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('care.materialsUsed')}</Text>
            {log.items.map((item, idx) => (
              <View key={idx} style={styles.materialRow}>
                <Text style={styles.materialName}>{item.item_name || item.item}</Text>
                <Text style={styles.materialQty}>{item.quantity} {item.uom}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Metadata */}
        <View style={styles.metaCard}>
          <Text style={styles.metaLabel}>{t('care.createdBy')}</Text>
          <Text style={styles.metaValue}>{log.owner}</Text>
          <Text style={styles.metaLabel}>{t('care.createdDate')}</Text>
          <Text style={styles.metaValue}>{log.creation?.split(' ')[0]}</Text>
          <Text style={styles.metaLabel}>{t('care.updatedDate')}</Text>
          <Text style={styles.metaValue}>{log.modified?.split(' ')[0]}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

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
  effRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  effLabel: { fontSize: 14, color: '#374151', fontWeight: '500' },
  effBadge: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  effText: { fontSize: 15, fontWeight: '700' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10 },
  contentText: { fontSize: 14, color: '#374151', lineHeight: 22 },
  materialRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  materialName: { fontSize: 14, color: '#1C1E21', flex: 2 },
  materialQty: { fontSize: 14, color: '#6B7280', textAlign: 'right' },
  metaCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14 },
  metaLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 8 },
  metaValue: { fontSize: 13, color: '#374151' },
});
