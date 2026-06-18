import { useCallback, useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LoadingScreen, ErrorScreen } from '@/components/ui';
import * as FarmOwnerAPI from '@/services/api/resources/farmOwner';
import * as FarmAPI from '@/services/api/resources/farm';
import type { Farm, FarmOwner } from '@/types/models';
import settingApp from '@/settingApp';

export default function FarmOwnerDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [owner, setOwner] = useState<FarmOwner | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!name) return;
    try {
      setLoading(true);
      setError(null);
      const decodedName = decodeURIComponent(name);
      const [ownerResult, farmResult] = await Promise.all([
        FarmOwnerAPI.get(decodedName),
        FarmAPI.list({ filters: [['farm_owner', '=', decodedName]] }),
      ]);
      setOwner(ownerResult);
      setFarms(farmResult);
    } catch {
      setError(t('farmOwners.notFound'));
    } finally {
      setLoading(false);
    }
  }, [name, t]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <LoadingScreen message={t('common.loading')} />;
  if (error || !owner) return <ErrorScreen message={error ?? t('farmOwners.notFound')} onRetry={loadData} />;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{owner.owner_name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Avatar + name */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{owner.owner_name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.profileName}>{owner.owner_name}</Text>
          <Text style={styles.profileRole}>{t('profile.roleFarmOwner')}</Text>
        </View>

        {/* Contact */}
        <View style={styles.card}>
          {owner.phone && (
            <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`tel:${owner.phone}`)}>
              <View style={styles.contactIcon}>
                <Ionicons name="call-outline" size={20} color={settingApp.green_primery} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>{t('farmOwners.call')}</Text>
                <Text style={styles.contactValue}>{owner.phone}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
            </TouchableOpacity>
          )}
          {owner.email && (
            <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`mailto:${owner.email}`)}>
              <View style={styles.contactIcon}>
                <Ionicons name="mail-outline" size={20} color="#2196F3" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>{owner.email}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
            </TouchableOpacity>
          )}
          {owner.address && (
            <View style={styles.contactRow}>
              <View style={styles.contactIcon}>
                <Ionicons name="location-outline" size={20} color="#FF5722" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>{t('farmDetail.noAddress')}</Text>
                <Text style={styles.contactValue}>{owner.address}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Farms */}
        <Text style={styles.sectionTitle}>
          {t('farmOwners.farmList')} ({farms.length})
        </Text>
        {farms.length === 0 ? (
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>{t('farmOwners.noFarms')}</Text>
          </View>
        ) : (
          farms.map(farm => (
            <TouchableOpacity
              key={farm.name}
              style={styles.farmCard}
              onPress={() => router.push(`/(main)/farms/${encodeURIComponent(farm.name)}` as never)}
            >
              <View style={styles.farmInfo}>
                <Text style={styles.farmName}>{farm.farm_name}</Text>
                <View style={[styles.badge, farm.status === 'Active' ? styles.badgeActive : styles.badgeInactive]}>
                  <Text style={[styles.badgeText, farm.status === 'Active' ? styles.badgeTextActive : styles.badgeTextInactive]}>
                    {farm.status === 'Active' ? t('common.active') : t('common.inactive')}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
            </TouchableOpacity>
          ))
        )}
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
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: settingApp.green_primery,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  profileName: { fontSize: 18, fontWeight: '700', color: '#1C1E21', marginBottom: 4 },
  profileRole: { fontSize: 13, color: '#9CA3AF' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 16, overflow: 'hidden' },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: { flex: 1 },
  contactLabel: { fontSize: 12, color: '#9CA3AF' },
  contactValue: { fontSize: 14, color: '#1C1E21', fontWeight: '500', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 10 },
  emptySection: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 16 },
  emptySectionText: { fontSize: 14, color: '#9CA3AF' },
  farmCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  farmInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  farmName: { fontSize: 15, fontWeight: '500', color: '#1C1E21', flex: 1 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeActive: { backgroundColor: '#D1FAE5' },
  badgeInactive: { backgroundColor: '#F3F4F6' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeTextActive: { color: '#059669' },
  badgeTextInactive: { color: '#6B7280' },
});
