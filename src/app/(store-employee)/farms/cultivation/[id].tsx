/**
 * Cultivation Log Detail Screen
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
  mockCultivationLogs,
  mockGardens,
  mockFarms,
  getCareLogsByCultivation,
} from '@/services/mock/storeData';
import type { CultivationLog, Garden, Farm, CareLog } from '@/types/models';

export default function CultivationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [cultivation, setCultivation] = useState<CultivationLog | null>(null);
  const [garden, setGarden] = useState<Garden | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [careLogs, setCareLogs] = useState<CareLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const foundCultivation = mockCultivationLogs.find((c) => c.name === id);
    setCultivation(foundCultivation || null);

    if (foundCultivation) {
      const foundGarden = mockGardens.find((g) => g.name === foundCultivation.garden);
      setGarden(foundGarden || null);

      const foundFarm = mockFarms.find((f) => f.name === foundCultivation.farm);
      setFarm(foundFarm || null);

      const logs = getCareLogsByCultivation(foundCultivation.name);
      setCareLogs(logs);
    }

    setIsLoading(false);
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
        return 'Đang canh tác';
      case 'Completed':
        return 'Hoàn thành';
      case 'Cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const calculateDuration = (fromDate: string, toDate?: string) => {
    const from = new Date(fromDate);
    const to = toDate ? new Date(toDate) : new Date();
    const diffTime = Math.abs(to.getTime() - from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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

  if (!cultivation) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết canh tác</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không tìm thấy dữ liệu canh tác</Text>
        </View>
      </SafeAreaView>
    );
  }

  const duration = calculateDuration(cultivation.from_date, cultivation.to_date);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {cultivation.cultivation_type}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cultivation Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.iconLarge}>
            <Ionicons name="calendar" size={36} color="#FF9800" />
          </View>
          <Text style={styles.cultivationType}>{cultivation.cultivation_type}</Text>
          <Text style={styles.cultivationId}>{cultivation.name}</Text>
          <Badge
            label={getStatusText(cultivation.status)}
            variant={getStatusColor(cultivation.status) as 'success' | 'warning' | 'error' | 'info'}
            style={styles.badge}
          />

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{duration}</Text>
              <Text style={styles.statLabel}>Ngày</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{careLogs.length}</Text>
              <Text style={styles.statLabel}>Nhật ký</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>
                {careLogs.length > 0
                  ? Math.round(
                      careLogs.reduce((sum, l) => sum + (l.efficiency_percent || 0), 0) /
                        careLogs.length
                    )
                  : 0}
                %
              </Text>
              <Text style={styles.statLabel}>Hiệu quả TB</Text>
            </View>
          </View>

          {/* Details */}
          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Ionicons name="grid-outline" size={18} color="#666" />
              <Text style={styles.detailLabel}>Vườn:</Text>
              <TouchableOpacity
                onPress={() =>
                  garden && router.push(`/(store-employee)/farms/garden/${garden.name}`)
                }
              >
                <Text style={styles.detailLink}>
                  {cultivation.garden_name || garden?.garden_name || 'N/A'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="leaf-outline" size={18} color="#666" />
              <Text style={styles.detailLabel}>Nông trại:</Text>
              <TouchableOpacity
                onPress={() =>
                  farm && router.push(`/(store-employee)/farms/farm/${farm.name}`)
                }
              >
                <Text style={styles.detailLink}>{farm?.farm_name || 'N/A'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={18} color="#666" />
              <Text style={styles.detailText}>
                Bắt đầu: {formatDate(cultivation.from_date)}
              </Text>
            </View>
            {cultivation.to_date && (
              <View style={styles.detailRow}>
                <Ionicons name="flag-outline" size={18} color="#666" />
                <Text style={styles.detailText}>
                  Kết thúc: {formatDate(cultivation.to_date)}
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Care Logs Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nhật ký chăm sóc</Text>
            <Badge label={`${careLogs.length}`} variant="info" />
          </View>

          {careLogs.length > 0 ? (
            careLogs.map((careLog) => (
              <TouchableOpacity
                key={careLog.name}
                onPress={() =>
                  router.push(`/(store-employee)/farms/care/${careLog.name}`)
                }
              >
                <Card style={styles.careLogCard}>
                  <View style={styles.careLogHeader}>
                    <View style={styles.careLogIcon}>
                      <Ionicons name="document-text" size={20} color="#9C27B0" />
                    </View>
                    <View style={styles.careLogInfo}>
                      <Text style={styles.careLogDate}>
                        {formatDate(careLog.care_date)}
                      </Text>
                      <Text style={styles.careLogContent} numberOfLines={1}>
                        {careLog.content || 'Không có mô tả'}
                      </Text>
                    </View>
                    <View style={styles.careLogRight}>
                      {careLog.efficiency_percent && (
                        <Badge
                          label={`${careLog.efficiency_percent}%`}
                          variant={
                            careLog.efficiency_percent >= 80
                              ? 'success'
                              : careLog.efficiency_percent >= 60
                              ? 'warning'
                              : 'error'
                          }
                        />
                      )}
                      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </View>
                  </View>

                  {careLog.items && careLog.items.length > 0 && (
                    <View style={styles.careLogItems}>
                      <Ionicons name="cube-outline" size={14} color="#9CA3AF" />
                      <Text style={styles.careLogItemsText}>
                        {careLog.items.length} vật tư sử dụng
                      </Text>
                    </View>
                  )}
                </Card>
              </TouchableOpacity>
            ))
          ) : (
            <Card>
              <Text style={styles.emptyText}>Chưa có nhật ký chăm sóc</Text>
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
  iconLarge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cultivationType: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  cultivationId: {
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
  careLogCard: {
    marginBottom: 12,
  },
  careLogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  careLogIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  careLogInfo: {
    flex: 1,
    marginLeft: 12,
  },
  careLogDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  careLogContent: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  careLogRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  careLogItems: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 6,
  },
  careLogItemsText: {
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
