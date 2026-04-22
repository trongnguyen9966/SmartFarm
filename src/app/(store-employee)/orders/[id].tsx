/**
 * Sales Order Detail Screen
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
import { mockSalesOrders, mockDeliveryNotes } from '@/services/mock/storeData';
import type { SalesOrder, DeliveryNote } from '@/types/models';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const foundOrder = mockSalesOrders.find((o) => o.name === id);
    setOrder(foundOrder || null);

    // Find related delivery notes (in real app, this would be linked)
    if (foundOrder) {
      const relatedDNs = mockDeliveryNotes.filter(
        (dn) => dn.customer === foundOrder.customer
      );
      setDeliveryNotes(relatedDNs);
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={settingApp.green_primery} />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không tìm thấy đơn hàng</Text>
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
          {order.name}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.iconLarge}>
            <Ionicons name="receipt" size={36} color={settingApp.green_primery} />
          </View>
          <Text style={styles.orderId}>{order.name}</Text>
          <Text style={styles.orderDate}>{formatDate(order.transaction_date)}</Text>
          <Badge
            label={getStatusText(order.status)}
            variant={getStatusVariant(order.status)}
            style={styles.badge}
          />

          {/* Customer Info */}
          <View style={styles.customerSection}>
            <View style={styles.customerRow}>
              <Ionicons name="person" size={18} color="#666" />
              <View style={styles.customerInfo}>
                <Text style={styles.customerLabel}>Khách hàng</Text>
                <Text style={styles.customerName}>{order.customer_name}</Text>
                <Text style={styles.customerId}>{order.customer}</Text>
              </View>
            </View>
          </View>

          {/* Order Summary */}
          <View style={styles.summarySection}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tổng tiền hàng</Text>
              <Text style={styles.summaryValue}>{formatCurrency(order.total)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tổng cộng</Text>
              <Text style={styles.grandTotal}>{formatCurrency(order.grand_total)}</Text>
            </View>
          </View>
        </Card>

        {/* Items Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sản phẩm</Text>
            <Badge label={`${order.items.length}`} variant="info" />
          </View>

          {order.items.map((item, index) => (
            <Card key={index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemIcon}>
                  <Ionicons name="cube" size={20} color={settingApp.green_primery} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.item_name}</Text>
                  <Text style={styles.itemCode}>{item.item_code}</Text>
                </View>
              </View>

              <View style={styles.itemDetails}>
                <View style={styles.itemDetail}>
                  <Text style={styles.itemDetailLabel}>Số lượng</Text>
                  <Text style={styles.itemDetailValue}>
                    {item.qty} {item.uom}
                  </Text>
                </View>
                <View style={styles.itemDetail}>
                  <Text style={styles.itemDetailLabel}>Đơn giá</Text>
                  <Text style={styles.itemDetailValue}>
                    {formatCurrency(item.rate)}
                  </Text>
                </View>
                <View style={styles.itemDetail}>
                  <Text style={styles.itemDetailLabel}>Thành tiền</Text>
                  <Text style={styles.itemAmount}>
                    {formatCurrency(item.amount)}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Delivery Notes Section */}
        {deliveryNotes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Phiếu giao hàng</Text>
              <Badge label={`${deliveryNotes.length}`} variant="info" />
            </View>

            {deliveryNotes.map((dn) => (
              <Card key={dn.name} style={styles.deliveryCard}>
                <View style={styles.deliveryHeader}>
                  <View style={styles.deliveryIcon}>
                    <Ionicons name="car" size={20} color="#2196F3" />
                  </View>
                  <View style={styles.deliveryInfo}>
                    <Text style={styles.deliveryId}>{dn.name}</Text>
                    <Text style={styles.deliveryDate}>
                      {formatDate(dn.posting_date)}
                    </Text>
                  </View>
                  <Badge
                    label={getStatusText(dn.status)}
                    variant={getStatusVariant(dn.status)}
                  />
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Metadata Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin khác</Text>
          <Card style={styles.metadataCard}>
            <View style={styles.metadataRow}>
              <Ionicons name="storefront-outline" size={16} color="#9CA3AF" />
              <Text style={styles.metadataLabel}>Cửa hàng:</Text>
              <Text style={styles.metadataValue}>
                {order.custom_distribution_store || 'N/A'}
              </Text>
            </View>
            <View style={styles.metadataRow}>
              <Ionicons name="person-outline" size={16} color="#9CA3AF" />
              <Text style={styles.metadataLabel}>Người tạo:</Text>
              <Text style={styles.metadataValue}>{order.owner}</Text>
            </View>
            <View style={styles.metadataRow}>
              <Ionicons name="time-outline" size={16} color="#9CA3AF" />
              <Text style={styles.metadataLabel}>Ngày tạo:</Text>
              <Text style={styles.metadataValue}>{order.creation}</Text>
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
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderId: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
  },
  orderDate: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  badge: {
    marginTop: 12,
  },
  customerSection: {
    width: '100%',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  customerId: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  summarySection: {
    width: '100%',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
  },
  grandTotal: {
    fontSize: 20,
    fontWeight: '600',
    color: settingApp.green_primery,
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
  itemDetails: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    justifyContent: 'space-between',
  },
  itemDetail: {
    alignItems: 'center',
  },
  itemDetailLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  itemDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: settingApp.green_primery,
  },
  deliveryCard: {
    marginBottom: 10,
  },
  deliveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deliveryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  deliveryId: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  deliveryDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
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
