import { useCallback, useEffect, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LoadingScreen, ErrorScreen } from '@/components/ui';
import * as FarmAPI from '@/services/api/resources/farm';
import * as GardenAPI from '@/services/api/resources/garden';
import type { Farm, Garden } from '@/types/models';
import settingApp from '@/settingApp';

export default function FarmDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [gardens, setGardens] = useState<Garden[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!name) return;
    try {
      setLoading(true);
      setError(null);
      const decodedName = decodeURIComponent(name);
      const [farmResult, gardenResult] = await Promise.all([
        FarmAPI.get(decodedName),
        GardenAPI.list({ filters: [['farm', '=', decodedName]] }),
      ]);
      setFarm(farmResult);
      setGardens(gardenResult);
    } catch {
      setError(t('farmDetail.notFound'));
    } finally {
      setLoading(false);
    }
  }, [name, t]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <LoadingScreen message={t('common.loading')} />;
  if (error || !farm) return <ErrorScreen message={error ?? t('farmDetail.notFound')} onRetry={loadData} />;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{farm.farm_name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Status */}
        <View style={styles.statusRow}>
          <View style={[styles.badge, farm.status === 'Active' ? styles.badgeActive : styles.badgeInactive]}>
            <Text style={[styles.badgeText, farm.status === 'Active' ? styles.badgeTextActive : styles.badgeTextInactive]}>
              {farm.status === 'Active' ? t('common.active') : t('common.inactive')}
            </Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.card}>
          <InfoRow label={t('farmDetail.farmOwner')} value={farm.farm_owner} />
          <InfoRow label={t('farmDetail.store')} value={farm.distribution_store} />
          <InfoRow label={t('farmDetail.noAddress')} value={farm.address || t('farmDetail.noAddress')} />
          {farm.area && (
            <InfoRow label={t('farmDetail.sqmCultivation')} value={`${farm.area} ${farm.area_uom || 'sqm'}`} />
          )}
        </View>

        {/* Gardens */}
        <Text style={styles.sectionTitle}>{t('farmDetail.gardenList')}</Text>
        {gardens.length === 0 ? (
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>{t('farmDetail.noGardens')}</Text>
          </View>
        ) : (
          gardens.map(garden => (
            <TouchableOpacity
              key={garden.name}
              style={styles.gardenCard}
              onPress={() => router.push(`/(main)/menu/gardens/${encodeURIComponent(garden.name)}` as never)}
            >
              <View style={styles.gardenInfo}>
                <Text style={styles.gardenName}>{garden.garden_name}</Text>
                {garden.area && (
                  <Text style={styles.gardenMeta}>{garden.area} {garden.area_uom || 'sqm'}</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
            </TouchableOpacity>
          ))
        )}

        {/* Metadata */}
        <View style={styles.metaCard}>
          <Text style={styles.metaLabel}>{t('metadata.createdBy')}</Text>
          <Text style={styles.metaValue}>{farm.owner}</Text>
          <Text style={styles.metaLabel}>{t('metadata.createdDate')}</Text>
          <Text style={styles.metaValue}>{farm.creation?.split(' ')[0]}</Text>
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
  statusRow: { marginBottom: 12 },
  badge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  badgeActive: { backgroundColor: '#D1FAE5' },
  badgeInactive: { backgroundColor: '#F3F4F6' },
  badgeText: { fontSize: 13, fontWeight: '600' },
  badgeTextActive: { color: '#059669' },
  badgeTextInactive: { color: '#6B7280' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 10 },
  emptySection: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 16 },
  emptySectionText: { fontSize: 14, color: '#9CA3AF' },
  gardenCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gardenInfo: { flex: 1 },
  gardenName: { fontSize: 15, fontWeight: '500', color: '#1C1E21' },
  gardenMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  metaCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginTop: 8 },
  metaLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 8 },
  metaValue: { fontSize: 13, color: '#374151' },
});
