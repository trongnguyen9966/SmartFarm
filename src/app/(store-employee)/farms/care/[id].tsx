/**
 * Care Log Detail Screen
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
  mockCareLogs,
  mockCultivationLogs,
  mockGardens,
} from '@/services/mock/storeData';
import type { CareLog, CultivationLog, Garden } from '@/types/models';

export default function CareLogDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [careLog, setCareLog] = useState<CareLog | null>(null);
  const [cultivation, setCultivation] = useState<CultivationLog | null>(null);
  const [garden, setGarden] = useState<Garden | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const foundCareLog = mockCareLogs.find((c) => c.name === id);
    setCareLog(foundCareLog || null);

    if (foundCareLog) {
      const foundCultivation = mockCultivationLogs.find(
        (c) => c.name === foundCareLog.cultivation_log
      );
      setCultivation(foundCultivation || null);

      const foundGarden = mockGardens.find((g) => g.name === foundCareLog.garden);
      setGarden(foundGarden || null);
    }

    setIsLoading(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getEfficiencyColor = (percent?: number) => {
    if (!percent) return 'info';
    if (percent >= 80) return 'success';
    if (percent >= 60) return 'warning';
    return 'error';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
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

  if (!careLog) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết nhật ký</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không tìm thấy nhật ký</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Nhật ký chăm sóc
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Care Log Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.iconLarge}>
            <Ionicons name="document-text" size={36} color="#9C27B0" />
          </View>
          <Text style={styles.careDate}>{formatDate(careLog.care_date)}</Text>
          <Text style={styles.careLogId}>{careLog.name}</Text>

          {careLog.efficiency_percent && (
            <View style={styles.efficiencyContainer}>
              <Text style={styles.efficiencyLabel}>Hiệu quả</Text>
              <Badge
                label={`${careLog.efficiency_percent}%`}
                variant={getEfficiencyColor(careLog.efficiency_percent) as 'success' | 'warning' | 'error' | 'info'}
                style={styles.efficiencyBadge}
              />
            </View>
          )}

          {/* Links */}
          <View style={styles.linksSection}>
            <View style={styles.linkRow}>
              <Ionicons name="grid-outline" size={18} color="#666" />
              <Text style={styles.linkLabel}>Vườn:</Text>
              <TouchableOpacity
                onPress={() =>
                  garden && router.push(`/(store-employee)/farms/garden/${garden.name}`)
                }
              >
                <Text style={styles.linkText}>
                  {careLog.garden_name || garden?.garden_name || 'N/A'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.linkRow}>
              <Ionicons name="calendar-outline" size={18} color="#666" />
              <Text style={styles.linkLabel}>Canh tác:</Text>
              <TouchableOpacity
                onPress={() =>
                  cultivation &&
                  router.push(`/(store-employee)/farms/cultivation/${cultivation.name}`)
                }
              >
                <Text style={styles.linkText}>
                  {cultivation?.cultivation_type || careLog.cultivation_log}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Content Section */}
        {careLog.content && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nội dung công việc</Text>
            <Card style={styles.contentCard}>
              <Text style={styles.contentText}>{careLog.content}</Text>
            </Card>
          </View>
        )}

        {/* Materials Used Section */}
        {careLog.items && careLog.items.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Vật tư sử dụng</Text>
              <Badge label={`${careLog.items.length}`} variant="info" />
            </View>

            {careLog.items.map((item, index) => (
              <Card key={index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemIcon}>
                    <Ionicons name="cube" size={20} color={settingApp.green_primery} />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>
                      {item.item_name || item.item}
                    </Text>
                    <Text style={styles.itemCode}>{item.item}</Text>
                  </View>
                  <View style={styles.itemQty}>
                    <Text style={styles.itemQtyNum}>{item.quantity}</Text>
                    <Text style={styles.itemQtyUom}>{item.uom}</Text>
                  </View>
                </View>
                {item.notes && (
                  <View style={styles.itemNotes}>
                    <Ionicons name="chatbubble-outline" size={14} color="#9CA3AF" />
                    <Text style={styles.itemNotesText}>{item.notes}</Text>
                  </View>
                )}
              </Card>
            ))}
          </View>
        )}

        {/* Metadata Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin khác</Text>
          <Card style={styles.metadataCard}>
            <View style={styles.metadataRow}>
              <Ionicons name="person-outline" size={16} color="#9CA3AF" />
              <Text style={styles.metadataLabel}>Người tạo:</Text>
              <Text style={styles.metadataValue}>{careLog.owner}</Text>
            </View>
            <View style={styles.metadataRow}>
              <Ionicons name="time-outline" size={16} color="#9CA3AF" />
              <Text style={styles.metadataLabel}>Ngày tạo:</Text>
              <Text style={styles.metadataValue}>{careLog.creation}</Text>
            </View>
            <View style={styles.metadataRow}>
              <Ionicons name="refresh-outline" size={16} color="#9CA3AF" />
              <Text style={styles.metadataLabel}>Cập nhật:</Text>
              <Text style={styles.metadataValue}>{careLog.modified}</Text>
            </View>
          </Card>
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
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  careDate: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  careLogId: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  efficiencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 10,
  },
  efficiencyLabel: {
    fontSize: 14,
    color: '#666',
  },
  efficiencyBadge: {
    paddingHorizontal: 16,
  },
  linksSection: {
    width: '100%',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  linkLabel: {
    fontSize: 14,
    color: '#666',
  },
  linkText: {
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
    marginBottom: 12,
  },
  contentCard: {
    paddingVertical: 16,
  },
  contentText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  itemCard: {
    marginBottom: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  itemCode: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  itemQty: {
    alignItems: 'flex-end',
  },
  itemQtyNum: {
    fontSize: 18,
    fontWeight: '600',
    color: settingApp.green_primery,
  },
  itemQtyUom: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  itemNotes: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 8,
  },
  itemNotesText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  metadataCard: {
    paddingVertical: 12,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 10,
  },
  metadataLabel: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  metadataValue: {
    flex: 1,
    fontSize: 13,
    color: '#666',
  },
});
