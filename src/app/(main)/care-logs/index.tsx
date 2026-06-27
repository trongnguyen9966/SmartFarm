import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LoadingScreen, ErrorScreen } from '@/components/ui';
import { DOCTYPES } from '@/constants/api';
import { usePermission } from '@/hooks/usePermission';
import * as CareLogAPI from '@/services/api/resources/careLog';
import type { CareLog } from '@/types/models';
import settingApp from '@/settingApp';

function EfficiencyBadge({ value }: { value?: number }) {
  if (value == null) return null;
  const color = value >= 80 ? '#059669' : value >= 50 ? '#D97706' : '#DC2626';
  const bg = value >= 80 ? '#D1FAE5' : value >= 50 ? '#FEF3C7' : '#FEE2E2';
  return (
    <View style={[{ borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: bg }]}>
      <Text style={{ fontSize: 12, fontWeight: '600', color }}>{value}%</Text>
    </View>
  );
}

export default function CareLogsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { canCreate } = usePermission(DOCTYPES.CARE_LOG);
  const [data, setData] = useState<CareLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await CareLogAPI.list();
      setData(result);
    } catch {
      setError(t('common.errorLoadData'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = data.filter(item =>
    (item.garden_name || item.garden || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingScreen message={t('common.loading')} />;
  if (error) return <ErrorScreen message={error} onRetry={loadData} />;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('care.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* FAB - Create Care Log */}
      {canCreate && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(main)/care-logs/form' as never)}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

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
            onPress={() => router.push(`/(main)/care-logs/${encodeURIComponent(item.name)}` as never)}
          >
            <View style={styles.cardTop}>
              <View style={styles.iconBox}>
                <Ionicons name="clipboard" size={20} color="#FF5722" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.garden_name || item.garden}</Text>
                <Text style={styles.cardSub}>{item.care_date}</Text>
              </View>
              <EfficiencyBadge value={item.efficiency_percent} />
            </View>
            <Text style={styles.cardId}>{item.name}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="clipboard-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>{t('care.notFound')}</Text>
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
    backgroundColor: '#FBE9E7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1C1E21' },
  cardSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  cardId: { fontSize: 12, color: '#9CA3AF', marginTop: 6 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 15, color: '#6B7280' },
  fab: {
    position: 'absolute', right: 16, bottom: 24, zIndex: 10,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: settingApp.green_primery,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 6,
  },
});
