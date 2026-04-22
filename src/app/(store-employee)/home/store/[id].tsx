/**
 * Store Detail Screen
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
import { mockStores, mockStockLevels } from '@/services/mock/storeData';
import type { DistributionStore } from '@/types/models';
import type { StockLevelsResponse } from '@/types/api';

export default function StoreDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [store, setStore] = useState<DistributionStore | null>(null);
  const [stock, setStock] = useState<StockLevelsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    const foundStore = mockStores.find((s) => s.name === id);
    setStore(foundStore || null);
    setStock(mockStockLevels);
    setIsLoading(false);
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

  if (!store) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết cửa hàng</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không tìm thấy cửa hàng</Text>
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
          {store.store_name}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Store Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.storeIconLarge}>
            <Ionicons name="storefront" size={32} color={settingApp.green_primery} />
          </View>
          <Text style={styles.storeName}>{store.store_name}</Text>
          <Text style={styles.storeId}>{store.name}</Text>
          <Badge
            label={store.status === 'Active' ? 'Hoạt động' : 'Ngừng hoạt động'}
            variant={store.status === 'Active' ? 'success' : 'error'}
            style={styles.statusBadge}
          />

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color="#666" />
            <Text style={styles.infoText}>{store.address || 'Chưa cập nhật địa chỉ'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color="#666" />
            <Text style={styles.infoText}>{store.phone || 'Chưa cập nhật SĐT'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="cube-outline" size={18} color="#666" />
            <Text style={styles.infoText}>Kho: {store.warehouse}</Text>
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="people" size={24} color={settingApp.green_primery} />
            </View>
            <Text style={styles.actionLabel}>Chủ trại</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="leaf" size={24} color="#2196F3" />
            </View>
            <Text style={styles.actionLabel}>Nông trại</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="receipt" size={24} color="#FF9800" />
            </View>
            <Text style={styles.actionLabel}>Đơn hàng</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="document-text" size={24} color="#9C27B0" />
            </View>
            <Text style={styles.actionLabel}>Nhật ký</Text>
          </TouchableOpacity>
        </View>

        {/* Stock Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tồn kho</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          {stock?.items.slice(0, 4).map((item) => (
            <Card key={item.item_code} style={styles.stockItem}>
              <View style={styles.stockItemContent}>
                <View style={styles.stockItemIcon}>
                  <Ionicons name="cube" size={20} color={settingApp.green_primery} />
                </View>
                <View style={styles.stockItemInfo}>
                  <Text style={styles.stockItemName} numberOfLines={1}>
                    {item.item_name}
                  </Text>
                  <Text style={styles.stockItemCode}>{item.item_code}</Text>
                </View>
                <View style={styles.stockItemQty}>
                  <Text style={styles.stockQtyNum}>{item.actual_qty}</Text>
                  <Text style={styles.stockQtyUom}>{item.uom}</Text>
                </View>
              </View>
            </Card>
          ))}
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
  storeIconLarge: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  storeName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  storeId: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  statusBadge: {
    marginTop: 12,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginVertical: 20,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  section: {
    marginBottom: 20,
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
  seeAllText: {
    fontSize: 14,
    color: settingApp.green_primery,
    fontWeight: '500',
  },
  stockItem: {
    marginBottom: 8,
  },
  stockItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  stockItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  stockItemCode: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  stockItemQty: {
    alignItems: 'flex-end',
  },
  stockQtyNum: {
    fontSize: 16,
    fontWeight: '600',
    color: settingApp.green_primery,
  },
  stockQtyUom: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
