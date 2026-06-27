import { ErrorScreen, LoadingScreen } from '@/components/ui';
import { DOCTYPES } from '@/constants/api';
import { usePermission } from '@/hooks/usePermission';
import * as GardenAPI from '@/services/api/resources/garden';
import settingApp from '@/settingApp';
import type { Garden } from '@/types/models';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Polygon, Callout, type Region } from 'react-native-maps';

interface GeoJSONFeature {
  type: string;
  properties: Record<string, unknown>;
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
}

interface GeoJSONData {
  type: string;
  features: GeoJSONFeature[];
}

function parseGeolocation(geolocation?: string): GeoJSONData | null {
  if (!geolocation) return null;
  try {
    const geo: GeoJSONData = JSON.parse(geolocation);
    if (!geo.features?.length) return null;
    return geo;
  } catch {
    return null;
  }
}

function getCoordinatesFromGeo(geo: GeoJSONData): { latitude: number; longitude: number }[] {
  const coords: { latitude: number; longitude: number }[] = [];
  for (const feature of geo.features) {
    const { type, coordinates } = feature.geometry;
    if (type === 'Point') {
      const [lng, lat] = coordinates as number[];
      coords.push({ latitude: lat, longitude: lng });
    } else if (type === 'Polygon') {
      const ring = (coordinates as number[][][])[0];
      for (const [lng, lat] of ring) {
        coords.push({ latitude: lat, longitude: lng });
      }
    }
  }
  return coords;
}

function getMapRegionFromGardens(gardens: Garden[]): Region | null {
  const allCoords: { latitude: number; longitude: number }[] = [];

  for (const garden of gardens) {
    const geo = parseGeolocation(garden.geolocation);
    if (geo) {
      allCoords.push(...getCoordinatesFromGeo(geo));
    } else if (garden.latitude && garden.longitude) {
      allCoords.push({ latitude: garden.latitude, longitude: garden.longitude });
    }
  }

  if (allCoords.length === 0) return null;

  if (allCoords.length === 1) {
    return {
      latitude: allCoords[0].latitude,
      longitude: allCoords[0].longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
  }

  const lats = allCoords.map(c => c.latitude);
  const lngs = allCoords.map(c => c.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latDelta = (maxLat - minLat) * 1.5 || 0.02;
  const lngDelta = (maxLng - minLng) * 1.5 || 0.02;

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

export default function GardensScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { canCreate } = usePermission(DOCTYPES.GARDEN);
  const [data, setData] = useState<Garden[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await GardenAPI.list();
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
      (item.garden_name || '').toLowerCase().includes(q) ||
      (item.farm || '').toLowerCase().includes(q)
    );
  }, [data, search]);

  const gardensWithLocation = useMemo(() =>
    data.filter(g => parseGeolocation(g.geolocation) || (g.latitude && g.longitude)),
    [data]
  );
  const mapRegion = useMemo(() => getMapRegionFromGardens(data), [data]);

  if (loading) return <LoadingScreen message={t('common.loading')} />;
  if (error) return <ErrorScreen message={error} onRetry={loadData} />;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('gardens.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* FAB - Create Garden */}
      {canCreate && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(main)/gardens/form' as never)}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

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
          mapRegion && gardensWithLocation.length > 0 ? (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={mapRegion}
                scrollEnabled={true}
                zoomEnabled={true}
                rotateEnabled={false}
                pitchEnabled={false}
              >
                {gardensWithLocation.map(garden => {
                  const geo = parseGeolocation(garden.geolocation);
                  return (
                    <View key={garden.name}>
                      {/* Render polygons/points from geolocation */}
                      {geo && geo.features.map((feature, idx) => {
                        const { type, coordinates } = feature.geometry;
                        if (type === 'Polygon') {
                          const ring = (coordinates as number[][][])[0];
                          const coords = ring.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
                          return (
                            <Polygon
                              key={`${garden.name}-polygon-${idx}`}
                              coordinates={coords}
                              fillColor={garden.status === 'Active' ? 'rgba(5, 150, 105, 0.2)' : 'rgba(107, 114, 128, 0.2)'}
                              strokeColor={garden.status === 'Active' ? '#059669' : '#6B7280'}
                              strokeWidth={2}
                              tappable
                              onPress={() => router.push(`/(main)/gardens/${encodeURIComponent(garden.name)}` as never)}
                            />
                          );
                        }
                        if (type === 'Point') {
                          const [lng, lat] = coordinates as number[];
                          return (
                            <Marker
                              key={`${garden.name}-point-${idx}`}
                              coordinate={{ latitude: lat, longitude: lng }}
                              onCalloutPress={() => router.push(`/(main)/gardens/${encodeURIComponent(garden.name)}` as never)}
                            >
                              <View style={styles.markerContainer}>
                                <View style={[styles.markerBubble, garden.status === 'Active' ? styles.markerActive : styles.markerInactive]}>
                                  <Ionicons name="flower" size={14} color="#FFFFFF" />
                                </View>
                                <View style={[styles.markerArrow, garden.status === 'Active' ? styles.markerArrowActive : styles.markerArrowInactive]} />
                              </View>
                              <Callout tooltip>
                                <View style={styles.callout}>
                                  <Text style={styles.calloutTitle}>{garden.garden_name}</Text>
                                  <Text style={styles.calloutSub}>{garden.farm}</Text>
                                  <Text style={styles.calloutHint}>{t('gardens.gardenDetail')} →</Text>
                                </View>
                              </Callout>
                            </Marker>
                          );
                        }
                        return null;
                      })}

                      {/* Marker for gardens with lat/lng (with or without geolocation) */}
                      {garden.latitude && garden.longitude && (
                        <Marker
                          coordinate={{ latitude: garden.latitude, longitude: garden.longitude }}
                          onCalloutPress={() => router.push(`/(main)/gardens/${encodeURIComponent(garden.name)}` as never)}
                        >
                          <View style={styles.markerContainer}>
                            <View style={[styles.markerBubble, garden.status === 'Active' ? styles.markerActive : styles.markerInactive]}>
                              <Ionicons name="flower" size={14} color="#FFFFFF" />
                            </View>
                            <View style={[styles.markerArrow, garden.status === 'Active' ? styles.markerArrowActive : styles.markerArrowInactive]} />
                          </View>
                          <Callout tooltip>
                            <View style={styles.callout}>
                              <Text style={styles.calloutTitle}>{garden.garden_name}</Text>
                              <Text style={styles.calloutSub}>{garden.farm}</Text>
                              <Text style={styles.calloutHint}>{t('gardens.gardenDetail')} →</Text>
                            </View>
                          </Callout>
                        </Marker>
                      )}
                    </View>
                  );
                })}
              </MapView>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(main)/gardens/${encodeURIComponent(item.name)}` as never)}
          >
            <View style={styles.cardLeft}>
              <View style={styles.iconBox}>
                <Ionicons name="flower" size={22} color="#4CAF50" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.garden_name}</Text>
                <Text style={styles.cardSub}>{item.farm}</Text>
                {item.area && (
                  <Text style={styles.cardMeta}>{item.area} {item.area_uom || 'sqm'}</Text>
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
            <Ionicons name="flower-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>{t('gardens.notFound')}</Text>
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
  // Map
  mapContainer: {
    marginBottom: 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  map: {
    width: '100%',
    height: 250,
  },
  // Custom marker
  markerContainer: {
    alignItems: 'center',
  },
  markerBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
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
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
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
  // Cards
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
    backgroundColor: '#F1F8E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1C1E21' },
  cardSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  cardMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeActive: { backgroundColor: '#D1FAE5' },
  badgeInactive: { backgroundColor: '#F3F4F6' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeTextActive: { color: '#059669' },
  badgeTextInactive: { color: '#6B7280' },
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
