import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LoadingScreen, ErrorScreen } from '@/components/ui';
import * as SalesOrderAPI from '@/services/api/resources/salesOrder';
import type { SalesOrder } from '@/types/models';
import settingApp from '@/settingApp';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  'Draft': { bg: '#F3F4F6', text: '#6B7280' },
  'To Deliver and Bill': { bg: '#FEF3C7', text: '#D97706' },
  'To Deliver': { bg: '#DBEAFE', text: '#2563EB' },
  'To Bill': { bg: '#EDE9FE', text: '#7C3AED' },
  'Completed': { bg: '#D1FAE5', text: '#059669' },
  'Cancelled': { bg: '#FEE2E2', text: '#DC2626' },
};

export default function OrdersScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await SalesOrderAPI.list();
      setData(result);
    } catch {
      setError(t('common.errorLoadData'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = data.filter(item =>
    (item.customer_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
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
        <Text style={styles.headerTitle}>{t('orders.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder={t('orders.searchPlaceholder')}
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.name}
        renderItem={({ item }) => {
          const s = STATUS_COLORS[item.status] ?? { bg: '#F3F4F6', text: '#6B7280' };
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/(main)/menu/orders/${encodeURIComponent(item.name)}` as never)}
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.customer_name || item.customer}
                </Text>
                <View style={[styles.badge, { backgroundColor: s.bg }]}>
                  <Text style={[styles.badgeText, { color: s.text }]}>{item.status}</Text>
                </View>
              </View>
              <View style={styles.cardMeta}>
                <Text style={styles.metaText}>{item.name}</Text>
                <Text style={styles.metaText}>{item.transaction_date}</Text>
              </View>
              <Text style={styles.amount}>
                {t('common.currency')}{(item.grand_total || 0).toLocaleString()}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>{t('orders.noOrders')}</Text>
            <Text style={styles.emptyHint}>{t('orders.ordersWillShow')}</Text>
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
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1C1E21' },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  metaText: { fontSize: 12, color: '#9CA3AF' },
  amount: { fontSize: 16, fontWeight: '700', color: settingApp.green_primery },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 15, color: '#6B7280', fontWeight: '500' },
  emptyHint: { fontSize: 13, color: '#9CA3AF' },
});
