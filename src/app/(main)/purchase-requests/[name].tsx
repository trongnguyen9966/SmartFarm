import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LoadingScreen, ErrorScreen } from '@/components/ui';
import * as PurchaseRequestAPI from '@/services/api/resources/purchaseRequest';
import type { FarmPurchaseRequest } from '@/types/models';
import settingApp from '@/settingApp';
import { useFocusEffect } from 'expo-router';

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  Pending:   { color: '#D97706', bg: '#FEF3C7' },
  Approved:  { color: '#059669', bg: '#D1FAE5' },
  Rejected:  { color: '#DC2626', bg: '#FEE2E2' },
  Completed: { color: '#059669', bg: '#D1FAE5' },
  Cancelled: { color: '#6B7280', bg: '#F3F4F6' },
};

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

export default function PurchaseRequestDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [request, setRequest] = useState<FarmPurchaseRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const decodedName = name ? decodeURIComponent(name) : '';

  const loadData = useCallback(async () => {
    if (!decodedName) return;
    try {
      setLoading(true);
      setError(null);
      const result = await PurchaseRequestAPI.get(decodedName);
      setRequest(result);
    } catch {
      setError(t('purchaseRequests.requestNotFound'));
    } finally {
      setLoading(false);
    }
  }, [decodedName, t]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  if (loading) return <LoadingScreen message={t('common.loading')} />;
  if (error || !request) return <ErrorScreen message={error ?? t('purchaseRequests.requestNotFound')} onRetry={loadData} />;

  const { color: statusColor, bg: statusBg } = STATUS_COLORS[request.status] || STATUS_COLORS.Pending;
  const statusLabelMap: Record<string, string> = {
    Pending: t('purchaseRequests.statusPending'),
    Approved: t('purchaseRequests.statusApproved'),
    Rejected: t('purchaseRequests.statusRejected'),
    Completed: t('purchaseRequests.statusCompleted'),
    Cancelled: t('purchaseRequests.statusCancelled'),
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{request.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Status */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabelMap[request.status] || request.status}
            </Text>
          </View>
        </View>

        {/* Request info */}
        <View style={styles.card}>
          <InfoRow label={t('purchaseRequests.farm')} value={request.farm_name || request.farm} />
          <InfoRow label={t('purchaseRequests.store')} value={request.store_name || request.distribution_store || '—'} />
          <InfoRow label={t('purchaseRequests.requestDate')} value={request.creation?.split(' ')[0]} />
        </View>

        {/* Items */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('form.items')}</Text>
          <Text style={styles.sectionCount}>{request.items?.length ?? 0}</Text>
        </View>

        {request.items && request.items.length > 0 ? (
          request.items.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemLeft}>
                <View style={styles.itemIconBox}>
                  <Ionicons name="cube" size={18} color="#FF9800" />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.item_name || item.item}</Text>
                </View>
              </View>
              <Text style={styles.itemQty}>
                {item.quantity} {item.uom}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyItems}>
            <Text style={styles.emptyItemsText}>{t('purchaseRequests.noItems')}</Text>
          </View>
        )}

        {/* Notes */}
        {request.notes ? (
          <View style={styles.card}>
            <Text style={styles.notesTitle}>{t('purchaseRequests.notes')}</Text>
            <Text style={styles.notesText}>{request.notes}</Text>
          </View>
        ) : null}

        {/* Metadata */}
        <View style={styles.metaCard}>
          <Text style={styles.metaLabel}>{t('metadata.createdBy')}</Text>
          <Text style={styles.metaValue}>{request.owner}</Text>
          <Text style={styles.metaLabel}>{t('metadata.createdDate')}</Text>
          <Text style={styles.metaValue}>{request.creation?.split(' ')[0]}</Text>
          <Text style={styles.metaLabel}>{t('metadata.updatedDate')}</Text>
          <Text style={styles.metaValue}>{request.modified?.split(' ')[0]}</Text>
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
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 8, marginTop: 4,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  sectionCount: {
    fontSize: 12, fontWeight: '600', color: '#6B7280',
    backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
  },
  itemCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  itemIconBox: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF3E0',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#1C1E21' },
  itemQty: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
  emptyItems: {
    alignItems: 'center', paddingVertical: 24, backgroundColor: '#FFFFFF',
    borderRadius: 12, marginBottom: 12,
  },
  emptyItemsText: { fontSize: 13, color: '#9CA3AF' },
  notesTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  notesText: { fontSize: 14, color: '#374151', lineHeight: 22 },
  metaCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14 },
  metaLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 8 },
  metaValue: { fontSize: 13, color: '#374151' },
});
