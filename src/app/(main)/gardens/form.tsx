/**
 * Garden Form — Create / Edit
 * Supports offline: saves to queue when no network.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, type MapPressEvent } from 'react-native-maps';
import * as Location from 'expo-location';
import { FormField, PickerField, PickerModal, type PickerItem } from '@/components/forms';
import { LoadingScreen } from '@/components/ui';
import * as GardenAPI from '@/services/api/resources/garden';
import * as FarmAPI from '@/services/api/resources/farm';
import { saveOrQueue } from '@/services/offlineQueue';
import { useNetwork } from '@/hooks/useNetwork';
import type { Garden, Farm } from '@/types/models';
import settingApp from '@/settingApp';

export default function GardenFormScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = !!edit;
  const gardenName = edit ? decodeURIComponent(edit) : undefined;
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isConnected } = useNetwork();

  // Form state
  const [garden_name, setGardenName] = useState('');
  const [farm, setFarm] = useState('');
  const [farmDisplay, setFarmDisplay] = useState('');
  const [farm_owner, setFarmOwner] = useState('');
  const [area, setArea] = useState('');
  const [area_uom, setAreaUom] = useState('sqm');
  const [soil_type, setSoilType] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Map picker state
  const [mapVisible, setMapVisible] = useState(false);
  const [tempCoord, setTempCoord] = useState<{ latitude: number; longitude: number } | null>(null);
  const [addressQuery, setAddressQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const mapRef = useRef<MapView>(null);

  // Picker state
  const [farms, setFarms] = useState<PickerItem[]>([]);
  const [farmPickerVisible, setFarmPickerVisible] = useState(false);

  // UI state
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [farmsLoading, setFarmsLoading] = useState(false);

  // Load farms for picker
  useEffect(() => {
    (async () => {
      setFarmsLoading(true);
      try {
        const result = await FarmAPI.list();
        setFarms(result.map(f => ({ value: f.name, label: f.farm_name, subtitle: f.farm_owner })));
      } catch { /* ignore */ }
      setFarmsLoading(false);
    })();
  }, []);

  // Load existing garden for edit
  useEffect(() => {
    if (!isEdit || !gardenName) return;
    (async () => {
      try {
        const g = await GardenAPI.get(gardenName);
        setGardenName(g.garden_name);
        setFarm(g.farm);
        setFarmDisplay(g.farm);
        setFarmOwner(g.farm_owner);
        setArea(g.area ? String(g.area) : '');
        setAreaUom(g.area_uom || 'sqm');
        setSoilType(g.soil_type || '');
        setStatus(g.status);
        // Parse geolocation GeoJSON to get lat/lng for map picker
        if (g.geolocation) {
          try {
            const geo = JSON.parse(g.geolocation);
            const point = geo.features?.find((f: any) => f.geometry?.type === 'Point');
            if (point) {
              const [lng, lat] = point.geometry.coordinates;
              setLatitude(lat);
              setLongitude(lng);
            }
          } catch { /* ignore parse errors */ }
        }
      } catch {
        Alert.alert(t('common.error'), t('gardens.notFound'));
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, gardenName, t, router]);

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    if (!garden_name.trim()) errs.garden_name = t('form.required');
    if (!farm) errs.farm = t('form.required');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [garden_name, farm, t]);

  const animateToCoord = useCallback((coord: { latitude: number; longitude: number }) => {
    setTempCoord(coord);
    mapRef.current?.animateToRegion({
      ...coord,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    }, 500);
  }, []);

  const handleSearchAddress = useCallback(async () => {
    if (!addressQuery.trim()) return;
    Keyboard.dismiss();
    setSearching(true);
    try {
      const results = await Location.geocodeAsync(addressQuery.trim());
      if (results.length > 0) {
        animateToCoord({ latitude: results[0].latitude, longitude: results[0].longitude });
      } else {
        Alert.alert(t('common.notFound'), t('gardens.addressNotFound'));
      }
    } catch {
      Alert.alert(t('common.error'), t('gardens.geocodeError'));
    } finally {
      setSearching(false);
    }
  }, [addressQuery, t, animateToCoord]);

  const handleGetCurrentLocation = useCallback(async () => {
    setLocating(true);
    try {
      const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
      if (permStatus !== 'granted') {
        Alert.alert(t('common.error'), t('gardens.locationPermissionDenied'));
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      animateToCoord({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch {
      Alert.alert(t('common.error'), t('gardens.locationError'));
    } finally {
      setLocating(false);
    }
  }, [t, animateToCoord]);

  const handleSave = useCallback(async () => {
    if (!validate()) return;
    setSaving(true);

    // Build geolocation GeoJSON from picked coordinates
    let geolocation: string | undefined;
    if (latitude != null && longitude != null) {
      geolocation = JSON.stringify({
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
        }],
      });
    }

    const data: Record<string, unknown> = {
      garden_name: garden_name.trim(),
      farm,
      farm_owner,
      area: area ? parseFloat(area) : undefined,
      area_uom,
      soil_type: soil_type || undefined,
      status,
      geolocation,
    };

    console.log('[GardenForm] save body:', JSON.stringify({ action: isEdit ? 'update' : 'create', doctype: 'Garden', docname: gardenName, data }, null, 2));

    const result = await saveOrQueue({
      action: isEdit ? 'update' : 'create',
      doctype: 'Garden',
      docname: gardenName,
      data,
    });

    setSaving(false);

    if (result.synced) {
      Alert.alert(t('form.saveSuccess'), '', [{ text: 'OK', onPress: () => router.back() }]);
    } else {
      Alert.alert(
        t('form.saveSuccess'),
        'Dữ liệu đã được lưu offline. Sẽ tự động đồng bộ khi có mạng.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  }, [validate, garden_name, farm, farm_owner, area, area_uom, soil_type, status, latitude, longitude, isEdit, gardenName, t, router]);

  if (loading) return <LoadingScreen message={t('common.loading')} />;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEdit ? t('form.editGarden') : t('form.createGarden')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color="#92400E" />
          <Text style={styles.offlineText}>Offline — dữ liệu sẽ đồng bộ khi có mạng</Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <FormField
            label={t('form.gardenName')}
            required
            value={garden_name}
            onChangeText={setGardenName}
            placeholder={t('form.gardenName')}
            error={errors.garden_name}
          />

          <PickerField
            label={t('form.farm')}
            required
            placeholder={t('form.selectFarm')}
            value={farm}
            displayValue={farmDisplay || farm}
            error={errors.farm}
            onPress={() => setFarmPickerVisible(true)}
          />

          <FormField
            label={t('form.area')}
            value={area}
            onChangeText={setArea}
            placeholder="0"
            keyboardType="numeric"
          />

          <FormField
            label={t('form.soilType')}
            value={soil_type}
            onChangeText={setSoilType}
            placeholder={t('form.soilType')}
          />

          {/* Status toggle */}
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{t('form.status')}</Text>
            <View style={styles.statusToggle}>
              <TouchableOpacity
                style={[styles.statusBtn, status === 'Active' && styles.statusBtnActive]}
                onPress={() => setStatus('Active')}
              >
                <Text style={[styles.statusBtnText, status === 'Active' && styles.statusBtnTextActive]}>
                  {t('common.active')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusBtn, status === 'Inactive' && styles.statusBtnInactive]}
                onPress={() => setStatus('Inactive')}
              >
                <Text style={[styles.statusBtnText, status === 'Inactive' && styles.statusBtnTextInactive]}>
                  {t('common.inactive')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Location picker */}
          <View style={styles.locationSection}>
            <Text style={styles.statusLabel}>{t('gardens.pickLocation')}</Text>
            {latitude != null && longitude != null ? (
              <View style={styles.locationPreview}>
                <MapView
                  style={styles.locationMap}
                  region={{
                    latitude, longitude,
                    latitudeDelta: 0.005, longitudeDelta: 0.005,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  rotateEnabled={false}
                  pitchEnabled={false}
                >
                  <Marker coordinate={{ latitude, longitude }} pinColor="#059669" />
                </MapView>
                <View style={styles.locationInfo}>
                  <View style={styles.locationTextRow}>
                    <Ionicons name="location" size={16} color="#059669" />
                    <Text style={styles.locationText}>
                      {latitude.toFixed(6)}, {longitude.toFixed(6)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.locationChangeBtn}
                    onPress={() => {
                      setTempCoord({ latitude, longitude });
                      setMapVisible(true);
                    }}
                  >
                    <Ionicons name="create-outline" size={16} color="#2563EB" />
                    <Text style={styles.locationChangeBtnText}>{t('form.edit')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.locationPickBtn}
                onPress={() => {
                  setTempCoord(null);
                  setMapVisible(true);
                }}
              >
                <Ionicons name="map-outline" size={20} color="#2563EB" />
                <Text style={styles.locationPickBtnText}>{t('gardens.pickLocation')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>
              {saving ? t('form.saving') : t('common.save')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <PickerModal
        visible={farmPickerVisible}
        title={t('form.selectFarm')}
        items={farms}
        loading={farmsLoading}
        selectedValue={farm}
        onSelect={(item) => {
          setFarm(item.value);
          setFarmDisplay(item.label);
          if (item.subtitle) setFarmOwner(item.subtitle);
          setFarmPickerVisible(false);
        }}
        onClose={() => setFarmPickerVisible(false)}
      />

      {/* Map Location Picker Modal */}
      <Modal visible={mapVisible} animationType="slide">
        <View style={styles.mapModalContainer}>
          <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity onPress={() => setMapVisible(false)} style={styles.backBtn}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('gardens.pickLocation')}</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Search bar */}
          <View style={styles.searchBarRow}>
            <Ionicons name="search-outline" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.searchBarText}
              placeholder={t('gardens.searchAddress')}
              placeholderTextColor="#9CA3AF"
              value={addressQuery}
              onChangeText={setAddressQuery}
              onSubmitEditing={handleSearchAddress}
              returnKeyType="search"
              autoCorrect={false}
            />
            {searching ? (
              <ActivityIndicator size="small" color={settingApp.green_primery} />
            ) : (
              <TouchableOpacity onPress={handleSearchAddress}>
                <Ionicons name="arrow-forward-circle" size={28} color={settingApp.green_primery} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.mapHint}>
            <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
            <Text style={styles.mapHintText}>{t('gardens.tapToPickLocation')}</Text>
          </View>

          {/* Map */}
          <View style={{ flex: 1 }}>
            <MapView
              ref={mapRef}
              style={styles.fullMap}
              initialRegion={{
                latitude: tempCoord?.latitude ?? 10.39,
                longitude: tempCoord?.longitude ?? 106.92,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
              showsUserLocation
              showsMyLocationButton={false}
              onPress={(e: MapPressEvent) => {
                setTempCoord(e.nativeEvent.coordinate);
              }}
            >
              {tempCoord && (
                <Marker coordinate={tempCoord} pinColor="#059669" />
              )}
            </MapView>

            {/* GPS floating button */}
            <TouchableOpacity
              style={[styles.gpsBtn, { top: 12, right: 12 }]}
              onPress={handleGetCurrentLocation}
              disabled={locating}
            >
              {locating ? (
                <ActivityIndicator size="small" color={settingApp.green_primery} />
              ) : (
                <Ionicons name="locate" size={22} color={settingApp.green_primery} />
              )}
            </TouchableOpacity>
          </View>

          {/* Footer with coordinates + confirm */}
          {tempCoord && (
            <View style={[styles.mapFooter, { paddingBottom: insets.bottom + 12 }]}>
              <Text style={styles.mapCoordText}>
                {tempCoord.latitude.toFixed(6)}, {tempCoord.longitude.toFixed(6)}
              </Text>
              <TouchableOpacity
                style={styles.mapConfirmBtn}
                onPress={() => {
                  setLatitude(tempCoord.latitude);
                  setLongitude(tempCoord.longitude);
                  setMapVisible(false);
                }}
              >
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.mapConfirmBtnText}>{t('gardens.confirmLocation')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    backgroundColor: settingApp.green_primery,
    paddingHorizontal: 16, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FEF3C7', paddingHorizontal: 14, paddingVertical: 8,
  },
  offlineText: { fontSize: 12, color: '#92400E', fontWeight: '500' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 8 },
  statusRow: { marginBottom: 16 },
  statusLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 },
  statusToggle: { flexDirection: 'row', gap: 8 },
  statusBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  statusBtnActive: { backgroundColor: '#D1FAE5', borderColor: '#059669' },
  statusBtnInactive: { backgroundColor: '#F3F4F6', borderColor: '#6B7280' },
  statusBtnText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  statusBtnTextActive: { color: '#059669' },
  statusBtnTextInactive: { color: '#6B7280' },
  footer: {
    paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  saveBtn: {
    backgroundColor: settingApp.green_primery, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  // Location picker
  locationSection: { marginBottom: 16 },
  locationPickBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FFFFFF', borderRadius: 10, paddingVertical: 14,
    borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed',
  },
  locationPickBtnText: { fontSize: 14, fontWeight: '500', color: '#2563EB' },
  locationPreview: { borderRadius: 12, overflow: 'hidden', backgroundColor: '#FFFFFF' },
  locationMap: { width: '100%', height: 150 },
  locationInfo: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
  },
  locationTextRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 13, color: '#374151' },
  locationChangeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationChangeBtnText: { fontSize: 13, fontWeight: '500', color: '#2563EB' },
  // Map modal
  mapModalContainer: { flex: 1, backgroundColor: '#F5F5F5' },
  searchBarRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  searchBarText: {
    flex: 1, fontSize: 15, color: '#333',
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
  gpsBtn: {
    position: 'absolute',
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 3, elevation: 4,
  },
  mapHint: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F9FAFB', paddingHorizontal: 14, paddingVertical: 8,
  },
  mapHintText: { fontSize: 13, color: '#6B7280' },
  fullMap: { flex: 1 },
  mapFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingTop: 12,
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 4,
  },
  mapCoordText: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 10 },
  mapConfirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: settingApp.green_primery, borderRadius: 12, paddingVertical: 14,
  },
  mapConfirmBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
