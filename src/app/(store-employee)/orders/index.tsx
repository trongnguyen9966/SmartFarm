/**
 * Store Employee - Sales Orders List
 */

import { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import settingApp from '@/settingApp';
import { Card, SearchBar, Badge, EmptyState } from '@/components/ui';
import { mockSalesOrders } from '@/services/mock/storeData';
import type { SalesOrder } from '@/types/models';

type FilterStatus = 'all' | 'pending' | 'completed';

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setOrders(mockSalesOrders);
    setIsLoading(false);
  };

  const filteredOrders = useMemo(() => {
    let result = orders;

    // Filter by status
    if (filterStatus === 'pending') {
      result = result.filter(
        (o) => o.status === 'To Deliver and Bill' || o.status === 'To Deliver' || o.status === 'To Bill'
      );
    } else if (filterStatus === 'completed') {
      result = result.filter((o) => o.status === 'Completed');
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.name.toLowerCase().includes(query) ||
          o.customer_name.toLowerCase().includes(query)
      );
    }

    return result;
  }, [orders, filterStatus, searchQuery]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'To Deliver and Bill':
      case 'To Deliver':
      case 'To Bill':
        return 'warning';
      case 'Cancelled':
        return 'error';
      default:
        return 'info';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'Completed':
        return 'Hoàn thành';
      case 'To Deliver and Bill':
        return 'Chờ giao & thanh toán';
      case 'To Deliver':
        return 'Chờ giao hàng';
      case 'To Bill':
        return 'Chờ thanh toán';
      case 'Cancelled':
        return 'Đã hủy';
      case 'Draft':
        return 'Nháp';
      default:
        return status;
    }
  };

  const pendingCount = orders.filter(
    (o) => o.status === 'To Deliver and Bill' || o.status === 'To Deliver' || o.status === 'To Bill'
  ).length;

  const completedCount = orders.filter((o) => o.status === 'Completed').length;

  const renderOrder = ({ item }: { item: SalesOrder }) => {
    return (
      <TouchableOpacity
        onPress={() => router.push(`/(store-employee)/orders/${item.name}`)}
      >
        <Card style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <View style={styles.orderIcon}>
              <Ionicons name="receipt" size={22} color={settingApp.green_primery} />
            </View>
            <View style={styles.orderInfo}>
              <Text style={styles.orderId}>{item.name}</Text>
              <Text style={styles.orderDate}>{formatDate(item.transaction_date)}</Text>
            </View>
            <Badge
              label={getStatusText(item.status)}
              variant={getStatusVariant(item.status)}
            />
          </View>

          <View style={styles.orderCustomer}>
            <Ionicons name="person-outline" size={16} color="#9CA3AF" />
            <Text style={styles.customerName}>{item.customer_name}</Text>
          </View>

          <View style={styles.orderFooter}>
            <View style={styles.orderItems}>
              <Ionicons name="cube-outline" size={16} color="#9CA3AF" />
              <Text style={styles.itemCount}>{item.items.length} sản phẩm</Text>
            </View>
            <Text style={styles.orderTotal}>{formatCurrency(item.grand_total)}</Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Đơn hàng</Text>
        <Text style={styles.subtitle}>{orders.length} đơn hàng</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Tìm theo mã đơn, khách hàng..."
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, filterStatus === 'all' && styles.filterTabActive]}
          onPress={() => setFilterStatus('all')}
        >
          <Text
            style={[
              styles.filterTabText,
              filterStatus === 'all' && styles.filterTabTextActive,
            ]}
          >
            Tất cả ({orders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filterStatus === 'pending' && styles.filterTabActive]}
          onPress={() => setFilterStatus('pending')}
        >
          <Text
            style={[
              styles.filterTabText,
              filterStatus === 'pending' && styles.filterTabTextActive,
            ]}
          >
            Đang xử lý ({pendingCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filterStatus === 'completed' && styles.filterTabActive]}
          onPress={() => setFilterStatus('completed')}
        >
          <Text
            style={[
              styles.filterTabText,
              filterStatus === 'completed' && styles.filterTabTextActive,
            ]}
          >
            Hoàn thành ({completedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.name}
        renderItem={renderOrder}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchData}
            tintColor={settingApp.green_primery}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title={searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có đơn hàng'}
            message={
              searchQuery
                ? 'Thử tìm với từ khóa khác'
                : 'Các đơn hàng sẽ hiển thị ở đây'
            }
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: settingApp.green_primery,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: settingApp.green_primery,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  orderCard: {
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  orderDate: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  orderCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  customerName: {
    fontSize: 14,
    color: '#666',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  orderItems: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemCount: {
    fontSize: 13,
    color: '#666',
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '600',
    color: settingApp.green_primery,
  },
});
