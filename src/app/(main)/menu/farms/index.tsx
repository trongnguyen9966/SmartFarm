import { ErrorScreen, LoadingScreen } from '@/components/ui';
import * as FarmAPI from '@/services/api/resources/farm';
import settingApp from '@/settingApp';
import type { Farm } from '@/types/models';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Callout, type Region } from 'react-native-maps';

function getMapRegion(farms: Farm[]): Region | null {
  const withCoords = farms.filter(f => f.latitude && f.longitude);
  if (withCoords.length === 0) return null;

  if (withCoords.length === 1) {
    return {
      latitude: withCoords[0].latitude!,
      longitude: withCoords[0].longitude!,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }

  const lats = withCoords.map(f => f.latitude!);
  const lngs = withCoords.map(f => f.longitude!);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latDelta = (maxLat - minLat) * 1.5 || 0.05;
  const lngDelta = (maxLng - minLng) * 1.5 || 0.05;

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

export default function FarmsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await FarmAPI.list();
      setData(result);
    } catch {
      setError(t('common.errorLoadData'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(item =>
      (item.farm_name || '').toLowerCase().includes(q) ||
      (item.farm_owner ?? '').toLowerCase().includes(q)
    );
  }, [data, search]);

  const farmsWithCoords = useMemo(() => data.filter(f => f.latitude && f.longitude), [data]);
  const mapRegion = useMemo(() => getMapRegion(data), [data]);

  if (loading) return <LoadingScreen message={t('common.loading')} />;
  if (error) return <ErrorScreen message={error} onRetry={loadData} />;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('menu.farms')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.name}
        ListHeaderComponent={
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
        }
        ListFooterComponent={
          mapRegion && farmsWithCoords.length > 0 ? (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={mapRegion}
                scrollEnabled={true}
                zoomEnabled={true}
                rotateEnabled={false}
                pitchEnabled={false}
              >
                {farmsWithCoords.map(farm => (
                  <Marker
                    key={farm.name}
                    coordinate={{ latitude: farm.latitude!, longitude: farm.longitude! }}
                    onCalloutPress={() => router.push(`/(main)/menu/farms/${encodeURIComponent(farm.name)}` as never)}
                  >
                    <View style={styles.markerContainer}>
                      <View style={[styles.markerBubble, farm.status === 'Active' ? styles.markerActive : styles.markerInactive]}>
                        <Ionicons name="leaf" size={16} color="#FFFFFF" />
                      </View>
                      <View style={[styles.markerArrow, farm.status === 'Active' ? styles.markerArrowActive : styles.markerArrowInactive]} />
                    </View>
                    <Callout tooltip>
                      <View style={styles.callout}>
                        <Text style={styles.calloutTitle}>{farm.farm_name}</Text>
                        {farm.farm_owner && <Text style={styles.calloutSub}>{farm.farm_owner}</Text>}
                        <Text style={styles.calloutHint}>{t('farmDetail.title')} →</Text>
                      </View>
                    </Callout>
                  </Marker>
                ))}
              </MapView>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(main)/menu/farms/${encodeURIComponent(item.name)}` as never)}
          >
            <View style={styles.cardLeft}>
              <View style={styles.iconBox}>
                <Ionicons name="leaf" size={22} color={settingApp.green_primery} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.farm_name}</Text>
                {item.farm_owner && (
                  <Text style={styles.cardSub}>{item.farm_owner}</Text>
                )}
              </View>
            </View>
            <View style={styles.cardRight}>
              <View style={[styles.badge, item.status === 'Active' ? styles.badgeActive : styles.badgeInactive]}>
                <Text style={[styles.badgeText, item.status === 'Active' ? styles.badgeTextActive : styles.badgeTextInactive]}>
                  {item.status === 'Active' ? t('common.active') : t('common.inactive')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#D1D5DB" style={{ marginTop: 8 }} />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="leaf-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>{t('farmDetail.notFound')}</Text>
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
  mapContainer: {
    marginHorizontal: 0,
    marginBottom: 4,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  map: {
    width: '100%',
    height: 220,
  },
  // Custom marker
  markerContainer: {
    alignItems: 'center',
  },
  markerBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  markerActive: {
    backgroundColor: '#059669',
  },
  markerInactive: {
    backgroundColor: '#6B7280',
  },
  markerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  markerArrowActive: {
    borderTopColor: '#059669',
  },
  markerArrowInactive: {
    borderTopColor: '#6B7280',
  },
  // Callout
  callout: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1E21',
  },
  calloutSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  calloutHint: {
    fontSize: 11,
    color: '#059669',
    marginTop: 4,
    fontWeight: '500',
  },
  // Search & list
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1C1E21' },
  cardSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeActive: { backgroundColor: '#D1FAE5' },
  badgeInactive: { backgroundColor: '#F3F4F6' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeTextActive: { color: '#059669' },
  badgeTextInactive: { color: '#6B7280' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 15, color: '#6B7280' },
});
