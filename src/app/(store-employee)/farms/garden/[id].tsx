/**
 * Garden Detail Screen
 */

import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import settingApp from '@/settingApp';
import { Card, Badge } from '@/components/ui';
import * as storeApi from '@/services/api/store';
import type { Garden, Farm, FarmOwner, CultivationLog } from '@/types/models';

export default function GardenDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [garden, setGarden] = useState<Garden | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [owner, setOwner] = useState<FarmOwner | null>(null);
  const [cultivations, setCultivations] = useState<CultivationLog[]>([]);
  const [careLogCounts, setCareLogCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (!id) return;

      // Fetch garden data first
      const gardenData = await storeApi.getGardenById(id);
      setGarden(gardenData);

      // Fetch farm, owner, and cultivations in parallel
      const [farmData, ownerData, cultivationsData] = await Promise.all([
        storeApi.getFarmById(gardenData.farm),
        storeApi.getFarmOwnerById(gardenData.farm_owner),
        storeApi.getCultivationLogsByGarden(id),
      ]);

      setFarm(farmData);
      setOwner(ownerData);
      setCultivations(cultivationsData);

      // Get care log counts for each cultivation
      const counts: Record<string, number> = {};
      await Promise.all(
        cultivationsData.map(async (cult) => {
          const careLogs = await storeApi.getCareLogsByCultivation(cult.name);
          counts[cult.name] = careLogs.length;
        })
      );
      setCareLogCounts(counts);
    } catch (error) {
      console.error('[GardenDetailScreen] Error fetching data:', error);
      setGarden(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress':
        return 'warning';
      case 'Completed':
        return 'success';
      case 'Cancelled':
        return 'error';
      default:
        return 'info';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'In Progress':
        return t('cultivation.statusActive');
      case 'Completed':
        return t('cultivation.statusCompleted');
      case 'Cancelled':
        return t('cultivation.statusCancelled');
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={settingApp.green_primery} />
        </View>
      </SafeAreaView>
    );
  }

  if (!garden) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('gardens.gardenDetail')}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('gardens.notFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const activeCultivations = cultivations.filter((c) => c.status === 'In Progress').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {garden.garden_name}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Garden Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.gardenIconLarge}>
            <Ionicons name="grid" size={36} color="#4CAF50" />
          </View>
          <Text style={styles.gardenName}>{garden.garden_name}</Text>
          <Text style={styles.gardenId}>{garden.name}</Text>
          <Badge
            label={garden.status === 'Active' ? t('common.active') : t('common.inactive')}
            variant={garden.status === 'Active' ? 'success' : 'error'}
            style={styles.badge}
          />

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{garden.area || 0}</Text>
              <Text style={styles.statLabel}>{garden.area_uom || 'm²'}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{cultivations.length}</Text>
              <Text style={styles.statLabel}>{t('gardens.cultivationCount')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{activeCultivations}</Text>
              <Text style={styles.statLabel}>{t('dashboard.activeCultivations')}</Text>
            </View>
          </View>

          {/* Details */}
          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Ionicons name="leaf-outline" size={18} color="#666" />
              <Text style={styles.detailLabel}>{t('cultivation.farm')}:</Text>
              <TouchableOpacity
                onPress={() =>
                  farm && router.push(`/(store-employee)/farms/farm/${farm.name}`)
                }
              >
                <Text style={styles.detailLink}>{farm?.farm_name || 'N/A'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={18} color="#666" />
              <Text style={styles.detailLabel}>{t('farmDetail.farmOwner')}:</Text>
              <TouchableOpacity
                onPress={() =>
                  owner && router.push(`/(store-employee)/farms/owner/${owner.name}`)
                }
              >
                <Text style={styles.detailLink}>{owner?.owner_name || 'N/A'}</Text>
              </TouchableOpacity>
            </View>
            {garden.soil_type && (
              <View style={styles.detailRow}>
                <Ionicons name="layers-outline" size={18} color="#666" />
                <Text style={styles.detailText}>{t('gardens.soilType')}: {garden.soil_type}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Cultivation Logs Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('gardens.cultivationHistory')}</Text>
            <Badge label={`${cultivations.length}`} variant="info" />
          </View>

          {cultivations.length > 0 ? (
            cultivations.map((cultivation) => (
              <TouchableOpacity
                key={cultivation.name}
                onPress={() =>
                  router.push(`/(store-employee)/farms/cultivation/${cultivation.name}`)
                }
              >
                <Card style={styles.cultivationCard}>
                  <View style={styles.cultivationHeader}>
                    <View style={styles.cultivationIcon}>
                      <Ionicons name="calendar" size={20} color="#FF9800" />
                    </View>
                    <View style={styles.cultivationInfo}>
                      <Text style={styles.cultivationType}>
                        {cultivation.cultivation_type}
                      </Text>
                      <Text style={styles.cultivationId}>{cultivation.name}</Text>
                    </View>
                    <Badge
                      label={getStatusText(cultivation.status)}
                      variant={getStatusColor(cultivation.status) as 'success' | 'warning' | 'error' | 'info'}
                    />
                  </View>

                  <View style={styles.cultivationDetails}>
                    <View style={styles.cultivationDate}>
                      <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
                      <Text style={styles.cultivationDateText}>
                        {formatDate(cultivation.from_date)}
                        {cultivation.to_date && ` - ${formatDate(cultivation.to_date)}`}
                      </Text>
                    </View>
                    <View style={styles.cultivationCare}>
                      <Ionicons name="document-text-outline" size={14} color="#9CA3AF" />
                      <Text style={styles.cultivationCareText}>
                        {t('gardens.careLogCount', { count: careLogCounts[cultivation.name] || 0 })}
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          ) : (
            <Card>
              <Text style={styles.emptyText}>{t('gardens.noCultivations')}</Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: settingApp.green_primery,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  infoCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  gardenIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  gardenName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  gardenId: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  badge: {
    marginTop: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    width: '100%',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 24,
    fontWeight: '600',
    color: settingApp.green_primery,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#F0F0F0',
  },
  detailsSection: {
    width: '100%',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  detailLink: {
    fontSize: 14,
    color: settingApp.green_primery,
    fontWeight: '500',
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cultivationCard: {
    marginBottom: 12,
  },
  cultivationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cultivationIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cultivationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cultivationType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cultivationId: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  cultivationDetails: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    justifyContent: 'space-between',
  },
  cultivationDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cultivationDateText: {
    fontSize: 13,
    color: '#666',
  },
  cultivationCare: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cultivationCareText: {
    fontSize: 13,
    color: '#666',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 8,
  },
});
