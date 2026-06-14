import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LoadingScreen, ErrorScreen } from '@/components/ui';
import * as CultivationLogAPI from '@/services/api/resources/cultivationLog';
import type { CultivationLog } from '@/types/models';
import settingApp from '@/settingApp';

function StatusBadge({ status }: { status: CultivationLog['status'] }) {
  const color = status === 'Completed' ? '#059669' : status === 'In Progress' ? '#2563EB' : '#6B7280';
  const bg   = status === 'Completed' ? '#D1FAE5' : status === 'In Progress' ? '#DBEAFE' : '#F3F4F6';
  const { t } = useTranslation();
  const label = status === 'Completed'
    ? t('cultivationLogs.statusCompleted')
    : status === 'In Progress'
    ? t('cultivationLogs.statusInProgress')
    : t('cultivationLogs.statusCancelled');
  return (
    <View style={{ borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: bg }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color }}>{label}</Text>
    </View>
  );
}

export default function CultivationLogsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<CultivationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await CultivationLogAPI.list();
      setData(result);
    } catch {
      setError(t('common.errorLoadData'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = data.filter(item =>
    (item.garden_name ?? item.garden ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (item.cultivation_type ?? '').toLowerCase().includes(search.toLowerCase()) ||
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingScreen message={t('common.loading')} />;
  if (error) return <ErrorScreen message={error} onRetry={loadData} />;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('cultivationLogs.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder={t('common.search')}
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.name}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(main)/menu/cultivation-logs/${encodeURIComponent(item.name)}` as never)}
          >
            <View style={styles.cardTop}>
              <View style={styles.iconBox}>
                <Ionicons name="leaf" size={20} color="#8BC34A" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.garden_name || item.garden}</Text>
                <Text style={styles.cardSub}>{item.cultivation_type || '—'}</Text>
              </View>
              <StatusBadge status={item.status} />
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.cardDate}>{item.from_date}</Text>
              {item.to_date ? <Text style={styles.cardDate}>→ {item.to_date}</Text> : null}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="leaf-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>{t('cultivationLogs.notFound')}</Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />
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
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#333' },
  list: { paddingHorizontal: 12, paddingBottom: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F9FBE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1C1E21' },
  cardSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  cardFooter: { flexDirection: 'row', gap: 8, marginTop: 8 },
  cardDate: { fontSize: 12, color: '#9CA3AF' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 15, color: '#6B7280' },
});
