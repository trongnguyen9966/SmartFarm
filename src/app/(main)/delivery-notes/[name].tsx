import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LoadingScreen, ErrorScreen } from '@/components/ui';
import * as DeliveryNoteAPI from '@/services/api/resources/deliveryNote';
import type { DeliveryNote } from '@/types/models';
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

export default function DeliveryNoteDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState<DeliveryNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!name) return;
    try {
      setLoading(true);
      setError(null);
      const result = await DeliveryNoteAPI.get(decodeURIComponent(name));
      setNote(result);
    } catch {
      setError(t('deliveryNotes.notFound'));
    } finally {
      setLoading(false);
    }
  }, [name, t]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <LoadingScreen message={t('common.loading')} />;
  if (error || !note) return <ErrorScreen message={error ?? t('deliveryNotes.notFound')} onRetry={loadData} />;

  const statusMap: Record<DeliveryNote['status'], { color: string; bg: string; label: string }> = {
    'Draft':     { color: '#6B7280', bg: '#F3F4F6', label: t('deliveryNotes.statusDraft') },
    'To Bill':   { color: '#D97706', bg: '#FEF3C7', label: t('deliveryNotes.statusToBill') },
    'Completed': { color: '#059669', bg: '#D1FAE5', label: t('deliveryNotes.statusCompleted') },
    'Cancelled': { color: '#DC2626', bg: '#FEE2E2', label: t('deliveryNotes.statusCancelled') },
  };
  const statusStyle = statusMap[note.status] ?? statusMap['Draft'];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{note.customer_name || note.customer}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Status + date row */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.color }]}>{statusStyle.label}</Text>
          </View>
          <Text style={styles.dateText}>{note.posting_date}</Text>
        </View>

        {/* Info */}
        <View style={styles.card}>
          <InfoRow label={t('orders.customer')} value={note.customer_name || note.customer} />
          <InfoRow label={t('deliveryNotes.postingDate')} value={note.posting_date} />
          {note.custom_distribution_store && (
            <InfoRow label={t('metadata.store')} value={note.custom_distribution_store} />
          )}
        </View>

        {/* Items */}
        {note.items?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('orders.products')}</Text>
            {/* Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.thCell, { flex: 3 }]}>{t('orders.products')}</Text>
              <Text style={[styles.thCell, { flex: 1, textAlign: 'right' }]}>{t('orders.quantity')}</Text>
              <Text style={[styles.thCell, { flex: 2, textAlign: 'right' }]}>{t('orders.lineTotal')}</Text>
            </View>
            {note.items.map((item, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.tdCell, { flex: 3 }]}>{item.item_name}</Text>
                <Text style={[styles.tdCell, { flex: 1, textAlign: 'right' }]}>{item.qty} {item.uom}</Text>
                <Text style={[styles.tdCell, { flex: 2, textAlign: 'right' }]}>
                  {item.amount?.toLocaleString('vi-VN')}{t('common.currency')}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Totals */}
        <View style={styles.card}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('orders.subtotal')}</Text>
            <Text style={styles.totalValue}>{note.total?.toLocaleString('vi-VN')}{t('common.currency')}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandRow]}>
            <Text style={styles.grandLabel}>{t('orders.total')}</Text>
            <Text style={styles.grandValue}>{note.grand_total?.toLocaleString('vi-VN')}{t('common.currency')}</Text>
          </View>
        </View>

        {/* Metadata */}
        <View style={styles.metaCard}>
          <Text style={styles.metaLabel}>{t('metadata.createdDate')}</Text>
          <Text style={styles.metaValue}>{note.creation?.split(' ')[0]}</Text>
          <Text style={styles.metaLabel}>{t('metadata.updatedDate')}</Text>
          <Text style={styles.metaValue}>{note.modified?.split(' ')[0]}</Text>
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
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  statusText: { fontSize: 14, fontWeight: '700' },
  dateText: { fontSize: 13, color: '#6B7280' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10 },
  tableHeader: { flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginBottom: 4 },
  thCell: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  tdCell: { fontSize: 13, color: '#374151' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  grandRow: { borderTopWidth: 1, borderTopColor: '#E5E7EB', marginTop: 4, paddingTop: 10 },
  totalLabel: { fontSize: 13, color: '#6B7280' },
  totalValue: { fontSize: 13, color: '#374151' },
  grandLabel: { fontSize: 15, fontWeight: '700', color: '#1C1E21' },
  grandValue: { fontSize: 15, fontWeight: '700', color: settingApp.green_primery },
  metaCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14 },
  metaLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 8 },
  metaValue: { fontSize: 13, color: '#374151' },
});
