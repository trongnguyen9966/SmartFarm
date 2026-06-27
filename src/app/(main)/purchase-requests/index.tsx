import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LoadingScreen, ErrorScreen } from '@/components/ui';
import { DOCTYPES } from '@/constants/api';
import { usePermission } from '@/hooks/usePermission';
import * as PurchaseRequestAPI from '@/services/api/resources/purchaseRequest';
import type { FarmPurchaseRequest } from '@/types/models';
import settingApp from '@/settingApp';

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  Pending:   { color: '#D97706', bg: '#FEF3C7' },
  Approved:  { color: '#059669', bg: '#D1FAE5' },
  Rejected:  { color: '#DC2626', bg: '#FEE2E2' },
  Completed: { color: '#059669', bg: '#D1FAE5' },
  Cancelled: { color: '#6B7280', bg: '#F3F4F6' },
};

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const { color, bg } = STATUS_COLORS[status] || STATUS_COLORS.Pending;
  const labelMap: Record<string, string> = {
    Pending: t('purchaseRequests.statusPending'),
    Approved: t('purchaseRequests.statusApproved'),
    Rejected: t('purchaseRequests.statusRejected'),
    Completed: t('purchaseRequests.statusCompleted'),
    Cancelled: t('purchaseRequests.statusCancelled'),
  };
  return (
    <View style={{ borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: bg }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color }}>{labelMap[status] || status}</Text>
    </View>
  );
}

export default function PurchaseRequestsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { canCreate } = usePermission(DOCTYPES.FARM_PURCHASE_REQUEST);
  const [data, setData] = useState<FarmPurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await PurchaseRequestAPI.list({
        order_by: 'creation desc',
      });
      setData(result);
    } catch {
      setError(t('common.errorLoadData'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const filtered = data.filter(item =>
    (item.farm_name ?? item.farm ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (item.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.store_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingScreen message={t('common.loading')} />;
  if (error) return <ErrorScreen message={error} onRetry={loadData} />;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('purchaseRequests.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {canCreate && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(main)/purchase-requests/form' as never)}
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
            onPress={() => router.push(`/(main)/purchase-requests/${encodeURIComponent(item.name)}` as never)}
          >
            <View style={styles.cardTop}>
              <View style={styles.iconBox}>
                <Ionicons name="cart" size={20} color="#FF9800" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSub}>{item.farm_name || item.farm}</Text>
              </View>
              <StatusBadge status={item.status} />
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.cardDate}>{item.creation?.split(' ')[0]}</Text>
              {item.store_name ? (
                <Text style={styles.cardStore}>{item.store_name}</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cart-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>{t('purchaseRequests.notFound')}</Text>
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
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1C1E21' },
  cardSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  cardDate: { fontSize: 12, color: '#9CA3AF' },
  cardStore: { fontSize: 12, color: '#2196F3' },
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
