import { ErrorScreen, LoadingScreen } from '@/components/ui';
import { DOCTYPES } from '@/constants/api';
import { usePermission } from '@/hooks/usePermission';
import * as GardenAPI from '@/services/api/resources/garden';
import settingApp from '@/settingApp';
import type { Garden } from '@/types/models';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Polygon, type Region } from 'react-native-maps';

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

function getMapRegion(geo: GeoJSONData): Region {
  const allCoords: { latitude: number; longitude: number }[] = [];

  for (const feature of geo.features) {
    const { type, coordinates } = feature.geometry;
    if (type === 'Point') {
      const [lng, lat] = coordinates as number[];
      allCoords.push({ latitude: lat, longitude: lng });
    } else if (type === 'Polygon') {
      const ring = (coordinates as number[][][])[0];
      for (const [lng, lat] of ring) {
        allCoords.push({ latitude: lat, longitude: lng });
      }
    }
  }

  if (allCoords.length === 0) {
    return { latitude: 10.39, longitude: 106.92, latitudeDelta: 0.02, longitudeDelta: 0.02 };
  }

  if (allCoords.length === 1) {
    return { latitude: allCoords[0].latitude, longitude: allCoords[0].longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 };
  }

  const lats = allCoords.map(c => c.latitude);
  const lngs = allCoords.map(c => c.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latDelta = (maxLat - minLat) * 1.3 || 0.005;
  const lngDelta = (maxLng - minLng) * 1.3 || 0.005;

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

export default function GardenDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { canWrite } = usePermission(DOCTYPES.GARDEN);
  const [garden, setGarden] = useState<Garden | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!name) return;
    try {
      setLoading(true);
      setError(null);
      const result = await GardenAPI.get(decodeURIComponent(name));
      setGarden(result);
    } catch {
      setError(t('gardens.notFound'));
    } finally {
      setLoading(false);
    }
  }, [name, t]);

  useEffect(() => { loadData(); }, [loadData]);

  const geo = useMemo(() => parseGeolocation(garden?.geolocation), [garden?.geolocation]);
  const mapRegion = useMemo(() => geo ? getMapRegion(geo) : null, [geo]);

  // Get navigable coordinates (from geolocation center or lat/lng)
  const navCoords = useMemo(() => {
    if (garden?.latitude && garden?.longitude) {
      return { latitude: garden.latitude, longitude: garden.longitude };
    }
    if (mapRegion) {
      return { latitude: mapRegion.latitude, longitude: mapRegion.longitude };
    }
    return null;
  }, [garden?.latitude, garden?.longitude, mapRegion]);

  const openNavigation = useCallback(() => {
    if (!navCoords) return;
    const { latitude, longitude } = navCoords;
    const label = encodeURIComponent(garden?.garden_name || 'Garden');
    const url = Platform.select({
      ios: `maps:0,0?q=${label}&ll=${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`,
    })!;
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback to Google Maps web
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`);
      }
    });
  }, [navCoords, garden?.garden_name]);

  if (loading) return <LoadingScreen message={t('common.loading')} />;
  if (error || !garden) return <ErrorScreen message={error ?? t('gardens.notFound')} onRetry={loadData} />;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{garden.garden_name}</Text>
        {canWrite ? (
          <TouchableOpacity
            onPress={() => router.push(`/(main)/gardens/form?edit=${encodeURIComponent(garden.name)}` as never)}
            style={styles.backBtn}
          >
            <Ionicons name="create-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Status */}
        <View style={styles.statusRow}>
          <View style={[styles.badge, garden.status === 'Active' ? styles.badgeActive : styles.badgeInactive]}>
            <Text style={[styles.badgeText, garden.status === 'Active' ? styles.badgeTextActive : styles.badgeTextInactive]}>
              {garden.status === 'Active' ? t('common.active') : t('common.inactive')}
            </Text>
          </View>
        </View>

        {/* Map — show when geolocation or navCoords exist */}
        {(geo || navCoords) && (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={mapRegion ?? (navCoords ? { ...navCoords, latitudeDelta: 0.005, longitudeDelta: 0.005 } : undefined)}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
            >
              {geo?.features.map((feature, index) => {
                const { type, coordinates } = feature.geometry;
                if (type === 'Polygon') {
                  const ring = (coordinates as number[][][])[0];
                  const coords = ring.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
                  return (
                    <Polygon
                      key={`polygon-${index}`}
                      coordinates={coords}
                      fillColor="rgba(5, 150, 105, 0.2)"
                      strokeColor="#059669"
                      strokeWidth={2}
                    />
                  );
                }
                if (type === 'Point') {
                  const [lng, lat] = coordinates as number[];
                  return (
                    <Marker
                      key={`point-${index}`}
                      coordinate={{ latitude: lat, longitude: lng }}
                      pinColor="#059669"
                    />
                  );
                }
                return null;
              })}
              {/* Show marker from navCoords if no geo point exists */}
              {!geo && navCoords && (
                <Marker coordinate={navCoords} pinColor="#059669" />
              )}
            </MapView>
          </View>
        )}

        {/* Navigate button */}
        {navCoords && (
          <TouchableOpacity style={styles.navBtn} onPress={openNavigation}>
            <Ionicons name="navigate" size={18} color="#FFFFFF" />
            <Text style={styles.navBtnText}>{t('gardens.navigate')}</Text>
          </TouchableOpacity>
        )}

        {/* Info */}
        <View style={styles.card}>
          <InfoRow label={t('farmDetail.title')} value={garden.farm} />
          <InfoRow label={t('farmOwners.title')} value={garden.farm_owner} />
          {garden.area && (
            <InfoRow label={t('farmDetail.sqmCultivation')} value={`${garden.area} ${garden.area_uom || 'sqm'}`} />
          )}
          {garden.soil_type && (
            <InfoRow label={t('gardens.soilType')} value={garden.soil_type} />
          )}
        </View>

        {/* Metadata */}
        <View style={styles.metaCard}>
          <Text style={styles.metaLabel}>{t('metadata.createdBy')}</Text>
          <Text style={styles.metaValue}>{garden.owner}</Text>
          <Text style={styles.metaLabel}>{t('metadata.createdDate')}</Text>
          <Text style={styles.metaValue}>{garden.creation?.split(' ')[0]}</Text>
          <Text style={styles.metaLabel}>{t('metadata.updatedDate')}</Text>
          <Text style={styles.metaValue}>{garden.modified?.split(' ')[0]}</Text>
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
  navBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#2563EB', borderRadius: 10, paddingVertical: 12, marginBottom: 16,
  },
  navBtnText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 16 },
  mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  map: {
    width: '100%',
    height: 200,
  },
  metaCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14 },
  metaLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 8 },
  metaValue: { fontSize: 13, color: '#374151' },
});
