import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

export default function OrderDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!name) return;
    try {
      setLoading(true);
      setError(null);
      const result = await SalesOrderAPI.get(decodeURIComponent(name));
      setOrder(result);
    } catch {
      setError(t('orders.notFound'));
    } finally {
      setLoading(false);
    }
  }, [name, t]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <LoadingScreen message={t('common.loading')} />;
  if (error || !order) return <ErrorScreen message={error ?? t('orders.notFound')} onRetry={loadData} />;

  const s = STATUS_COLORS[order.status] ?? { bg: '#F3F4F6', text: '#6B7280' };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{order.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Status */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
            <Text style={[styles.statusText, { color: s.text }]}>{order.status}</Text>
          </View>
          <Text style={styles.dateText}>{order.transaction_date}</Text>
        </View>

        {/* Customer */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('orders.customer')}</Text>
          <Text style={styles.sectionValue}>{order.customer_name || order.customer}</Text>
        </View>

        {/* Store */}
        {order.custom_distribution_store && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('storeDetail.title')}</Text>
            <Text style={styles.sectionValue}>{order.custom_distribution_store}</Text>
          </View>
        )}

        {/* Products */}
        {order.items?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('orders.products')}</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, { flex: 2 }]}>{t('orders.products')}</Text>
              <Text style={[styles.tableCell, styles.tableRight]}>{t('orders.quantity')}</Text>
              <Text style={[styles.tableCell, styles.tableRight]}>{t('orders.unitPrice')}</Text>
              <Text style={[styles.tableCell, styles.tableRight]}>{t('orders.lineTotal')}</Text>
            </View>
            {order.items.map((item, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={2}>{item.item_name}</Text>
                <Text style={[styles.tableCell, styles.tableRight]}>{item.qty} {item.uom}</Text>
                <Text style={[styles.tableCell, styles.tableRight]}>
                  {t('common.currency')}{(item.rate || 0).toLocaleString()}
                </Text>
                <Text style={[styles.tableCell, styles.tableRight]}>
                  {t('common.currency')}{(item.amount || 0).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Totals */}
        <View style={styles.totalsCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('orders.subtotal')}</Text>
            <Text style={styles.totalValue}>
              {t('common.currency')}{(order.total || 0).toLocaleString()}
            </Text>
          </View>
          <View style={[styles.totalRow, styles.totalRowLast]}>
            <Text style={styles.totalLabelBold}>{t('orders.total')}</Text>
            <Text style={styles.totalValueBold}>
              {t('common.currency')}{(order.grand_total || 0).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Metadata */}
        <View style={styles.metaCard}>
          <Text style={styles.metaLabel}>{t('metadata.createdBy')}</Text>
          <Text style={styles.metaValue}>{order.owner}</Text>
          <Text style={styles.metaLabel}>{t('metadata.createdDate')}</Text>
          <Text style={styles.metaValue}>{order.creation?.split(' ')[0]}</Text>
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
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  statusText: { fontSize: 13, fontWeight: '600' },
  dateText: { fontSize: 13, color: '#6B7280' },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  sectionLabel: { fontSize: 12, color: '#9CA3AF', marginBottom: 4 },
  sectionValue: { fontSize: 15, color: '#1C1E21', fontWeight: '500' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 12 },
  tableHeader: { flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  tableCell: { flex: 1, fontSize: 12, color: '#374151' },
  tableRight: { textAlign: 'right' },
  totalsCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  totalRowLast: { borderTopWidth: 1, borderTopColor: '#F0F0F0', marginTop: 4, paddingTop: 10 },
  totalLabel: { fontSize: 14, color: '#6B7280' },
  totalValue: { fontSize: 14, color: '#333' },
  totalLabelBold: { fontSize: 15, fontWeight: '700', color: '#1C1E21' },
  totalValueBold: { fontSize: 16, fontWeight: '700', color: settingApp.green_primery },
  metaCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14 },
  metaLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 8 },
  metaValue: { fontSize: 13, color: '#374151' },
});
