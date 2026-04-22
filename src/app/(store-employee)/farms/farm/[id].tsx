/**
 * Farm Detail Screen
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
import settingApp from '@/settingApp';
import { Card, Badge } from '@/components/ui';
import {
  mockFarms,
  mockFarmOwners,
  getGardensByFarm,
  getCultivationLogsByGarden,
} from '@/services/mock/storeData';
import type { Farm, FarmOwner, Garden, CultivationLog } from '@/types/models';

export default function FarmDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [owner, setOwner] = useState<FarmOwner | null>(null);
  const [gardens, setGardens] = useState<Garden[]>([]);
  const [cultivationMap, setCultivationMap] = useState<Record<string, CultivationLog[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const foundFarm = mockFarms.find((f) => f.name === id);
    setFarm(foundFarm || null);

    if (foundFarm) {
      const foundOwner = mockFarmOwners.find((o) => o.name === foundFarm.farm_owner);
      setOwner(foundOwner || null);

      const farmGardens = getGardensByFarm(foundFarm.name);
      setGardens(farmGardens);

      // Get cultivation logs for each garden
      const cultMap: Record<string, CultivationLog[]> = {};
      farmGardens.forEach((garden) => {
        cultMap[garden.name] = getCultivationLogsByGarden(garden.name);
      });
      setCultivationMap(cultMap);
    }

    setIsLoading(false);
  };

  const getActiveCultivations = (gardenId: string): number => {
    const logs = cultivationMap[gardenId] || [];
    return logs.filter((l) => l.status === 'In Progress').length;
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

  if (!farm) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết nông trại</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không tìm thấy nông trại</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalArea = gardens.reduce((sum, g) => sum + (g.area || 0), 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {farm.farm_name}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Farm Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.farmIconLarge}>
            <Ionicons name="leaf" size={36} color={settingApp.green_primery} />
          </View>
          <Text style={styles.farmName}>{farm.farm_name}</Text>
          <Text style={styles.farmId}>{farm.name}</Text>
          <Badge
            label={farm.status === 'Active' ? 'Hoạt động' : 'Ngừng hoạt động'}
            variant={farm.status === 'Active' ? 'success' : 'error'}
            style={styles.badge}
          />

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{gardens.length}</Text>
              <Text style={styles.statLabel}>Vườn</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{farm.area || 0}</Text>
              <Text style={styles.statLabel}>{farm.area_uom || 'm²'}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{totalArea}</Text>
              <Text style={styles.statLabel}>m² canh tác</Text>
            </View>
          </View>

          {/* Details */}
          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={18} color="#666" />
              <Text style={styles.detailLabel}>Chủ trại:</Text>
              <TouchableOpacity
                onPress={() =>
                  owner && router.push(`/(store-employee)/farms/owner/${owner.name}`)
                }
              >
                <Text style={styles.detailLink}>{owner?.owner_name || 'N/A'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={18} color="#666" />
              <Text style={styles.detailText} numberOfLines={2}>
                {farm.address || 'Chưa cập nhật địa chỉ'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="storefront-outline" size={18} color="#666" />
              <Text style={styles.detailText}>
                Cửa hàng: {farm.distribution_store}
              </Text>
            </View>
          </View>
        </Card>

        {/* Gardens Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Danh sách vườn</Text>
            <Badge label={`${gardens.length}`} variant="info" />
          </View>

          {gardens.length > 0 ? (
            gardens.map((garden) => {
              const activeCults = getActiveCultivations(garden.name);
              return (
                <TouchableOpacity
                  key={garden.name}
                  onPress={() =>
                    router.push(`/(store-employee)/farms/garden/${garden.name}`)
                  }
                >
                  <Card style={styles.gardenCard}>
                    <View style={styles.gardenHeader}>
                      <View style={styles.gardenIcon}>
                        <Ionicons name="grid" size={20} color="#4CAF50" />
                      </View>
                      <View style={styles.gardenInfo}>
                        <Text style={styles.gardenName}>{garden.garden_name}</Text>
                        <Text style={styles.gardenId}>{garden.name}</Text>
                      </View>
                      <View style={styles.gardenRight}>
                        {activeCults > 0 && (
                          <Badge
                            label={`${activeCults} canh tác`}
                            variant="warning"
                          />
                        )}
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                      </View>
                    </View>

                    <View style={styles.gardenDetails}>
                      <View style={styles.gardenDetail}>
                        <Ionicons name="resize-outline" size={14} color="#9CA3AF" />
                        <Text style={styles.gardenDetailText}>
                          {garden.area || 0} {garden.area_uom || 'm²'}
                        </Text>
                      </View>
                      {garden.soil_type && (
                        <View style={styles.gardenDetail}>
                          <Ionicons name="layers-outline" size={14} color="#9CA3AF" />
                          <Text style={styles.gardenDetailText}>
                            {garden.soil_type}
                          </Text>
                        </View>
                      )}
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })
          ) : (
            <Card>
              <Text style={styles.emptyText}>Chưa có vườn</Text>
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
  farmIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  farmName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  farmId: {
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
  gardenCard: {
    marginBottom: 12,
  },
  gardenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gardenIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gardenInfo: {
    flex: 1,
    marginLeft: 12,
  },
  gardenName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  gardenId: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  gardenRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gardenDetails: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 20,
  },
  gardenDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gardenDetailText: {
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
