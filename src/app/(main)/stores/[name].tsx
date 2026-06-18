import { useCallback, useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LoadingScreen, ErrorScreen } from '@/components/ui';
import * as StoreAPI from '@/services/api/resources/distributionStore';
import type { DistributionStore } from '@/types/models';
import settingApp from '@/settingApp';

export default function StoreDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [store, setStore] = useState<DistributionStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!name) return;
    try {
      setLoading(true);
      setError(null);
      const result = await StoreAPI.get(decodeURIComponent(name));
      setStore(result);
    } catch {
      setError(t('storeDetail.notFound'));
    } finally {
      setLoading(false);
    }
  }, [name, t]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <LoadingScreen message={t('common.loading')} />;
  if (error || !store) return <ErrorScreen message={error ?? t('storeDetail.notFound')} onRetry={loadData} />;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{store.store_name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Status */}
        <View style={styles.statusRow}>
          <View style={[styles.badge, store.status === 'Active' ? styles.badgeActive : styles.badgeInactive]}>
            <Text style={[styles.badgeText, store.status === 'Active' ? styles.badgeTextActive : styles.badgeTextInactive]}>
              {store.status === 'Active' ? t('common.active') : t('common.inactive')}
            </Text>
          </View>
        </View>

        {/* Store icon */}
        <View style={styles.iconCard}>
          <View style={styles.storeIcon}>
            <Ionicons name="storefront" size={40} color="#2196F3" />
          </View>
          <Text style={styles.storeName}>{store.store_name}</Text>
        </View>

        {/* Info */}
        <View style={styles.card}>
          {store.warehouse && (
            <View style={styles.infoRow}>
              <Ionicons name="cube-outline" size={18} color="#9CA3AF" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t('storeDetail.warehouse')}</Text>
                <Text style={styles.infoValue}>{store.warehouse}</Text>
              </View>
            </View>
          )}
          {store.phone ? (
            <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(`tel:${store.phone}`)}>
              <Ionicons name="call-outline" size={18} color={settingApp.green_primery} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t('storeDetail.noPhone')}</Text>
                <Text style={[styles.infoValue, { color: settingApp.green_primery }]}>{store.phone}</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={18} color="#9CA3AF" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t('storeDetail.noPhone')}</Text>
                <Text style={[styles.infoValue, { color: '#9CA3AF' }]}>{t('storeDetail.noPhone')}</Text>
              </View>
            </View>
          )}
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color="#9CA3AF" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('storeDetail.noAddress')}</Text>
              <Text style={styles.infoValue}>{store.address || t('storeDetail.noAddress')}</Text>
            </View>
          </View>
        </View>

        {/* Metadata */}
        <View style={styles.metaCard}>
          <Text style={styles.metaLabel}>{t('metadata.createdDate')}</Text>
          <Text style={styles.metaValue}>{store.creation?.split(' ')[0]}</Text>
          <Text style={styles.metaLabel}>{t('metadata.updatedDate')}</Text>
          <Text style={styles.metaValue}>{store.modified?.split(' ')[0]}</Text>
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
  statusRow: { marginBottom: 12 },
  badge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  badgeActive: { backgroundColor: '#D1FAE5' },
  badgeInactive: { backgroundColor: '#F3F4F6' },
  badgeText: { fontSize: 13, fontWeight: '600' },
  badgeTextActive: { color: '#059669' },
  badgeTextInactive: { color: '#6B7280' },
  iconCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  storeIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  storeName: { fontSize: 18, fontWeight: '700', color: '#1C1E21' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 16, overflow: 'hidden' },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
    gap: 12,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#9CA3AF' },
  infoValue: { fontSize: 14, color: '#1C1E21', fontWeight: '500', marginTop: 2 },
  metaCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14 },
  metaLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 8 },
  metaValue: { fontSize: 13, color: '#374151' },
});
