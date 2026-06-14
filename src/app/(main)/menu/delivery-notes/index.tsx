import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LoadingScreen, ErrorScreen } from '@/components/ui';
import * as DeliveryNoteAPI from '@/services/api/resources/deliveryNote';
import { useAuth } from '@/hooks/useAuth';
import type { DeliveryNote } from '@/types/models';
import settingApp from '@/settingApp';

function StatusBadge({ status }: { status: DeliveryNote['status'] }) {
  const { t } = useTranslation();
  const map: Record<DeliveryNote['status'], { color: string; bg: string; label: string }> = {
    'Draft':     { color: '#6B7280', bg: '#F3F4F6',  label: t('deliveryNotes.statusDraft') },
    'To Bill':   { color: '#D97706', bg: '#FEF3C7',  label: t('deliveryNotes.statusToBill') },
    'Completed': { color: '#059669', bg: '#D1FAE5',  label: t('deliveryNotes.statusCompleted') },
    'Cancelled': { color: '#DC2626', bg: '#FEE2E2',  label: t('deliveryNotes.statusCancelled') },
  };
  const s = map[status] ?? map['Draft'];
  return (
    <View style={{ borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: s.bg }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: s.color }}>{s.label}</Text>
    </View>
  );
}

export default function DeliveryNotesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { sessionInfo } = useAuth();
  const [data, setData] = useState<DeliveryNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const storeId = (sessionInfo?.context as any)?.stores?.[0]?.name;
      const filters: Array<[string, string, unknown]> = storeId
        ? [['custom_distribution_store', '=', storeId]]
        : [];
      const result = await DeliveryNoteAPI.list({ filters });
      setData(result);
    } catch {
      setError(t('common.errorLoadData'));
    } finally {
      setLoading(false);
    }
  }, [t, sessionInfo]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = data.filter(item =>
    (item.customer_name ?? item.customer ?? '').toLowerCase().includes(search.toLowerCase()) ||
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
        <Text style={styles.headerTitle}>{t('deliveryNotes.title')}</Text>
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
            onPress={() => router.push(`/(main)/menu/delivery-notes/${encodeURIComponent(item.name)}` as never)}
          >
            <View style={styles.cardTop}>
              <View style={styles.iconBox}>
                <Ionicons name="car" size={20} color="#4CAF50" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.customer_name || item.customer}</Text>
                <Text style={styles.cardSub}>{item.posting_date}</Text>
              </View>
              <StatusBadge status={item.status} />
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.cardId}>{item.name}</Text>
              <Text style={styles.cardTotal}>
                {item.grand_total?.toLocaleString('vi-VN')}{t('common.currency')}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="car-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>{t('deliveryNotes.notFound')}</Text>
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
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1C1E21' },
  cardSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  cardId: { fontSize: 12, color: '#9CA3AF' },
  cardTotal: { fontSize: 13, fontWeight: '600', color: '#374151' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 15, color: '#6B7280' },
});
