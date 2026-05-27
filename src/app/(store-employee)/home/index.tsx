/**
 * Store Employee Dashboard
 */

import { Badge, Card } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useStoreDashboard } from '@/hooks/useStoreDashboard';
import settingApp from '@/settingApp';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function StoreEmployeeDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userInfo } = useAuth();
  const { t } = useTranslation();
  const { data, isLoading, error, refresh } = useStoreDashboard();
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  // Calculate totals from all stores
  const totals = data?.stores.reduce(
    (acc, store) => ({
      stores: acc.stores + 1,
      farms: acc.farms + store.farm_count,
      gardens: acc.gardens + store.garden_count,
      cultivations: acc.cultivations + store.active_cultivation_count,
    }),
    { stores: 0, farms: 0, gardens: 0, cultivations: 0 }
  ) || { stores: 0, farms: 0, gardens: 0, cultivations: 0 };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View>
          <Text style={styles.greeting}>{t('dashboard.greeting')}</Text>
          <Text style={styles.userName}>{userInfo?.full_name || t('dashboard.defaultUser')}</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn}>
          <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor={settingApp.green_primery}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totals.stores}</Text>
            <Text style={styles.statLabel}>{t('dashboard.stores')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totals.farms}</Text>
            <Text style={styles.statLabel}>{t('dashboard.farms')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totals.gardens}</Text>
            <Text style={styles.statLabel}>{t('dashboard.gardens')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totals.cultivations}</Text>
            <Text style={styles.statLabel}>{t('dashboard.cultivations')}</Text>
          </View>
        </View>

        {/* Stores List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('dashboard.yourStores')}</Text>
          </View>

          {isLoading && !data ? (
            <Card>
              <ActivityIndicator color={settingApp.green_primery} />
            </Card>
          ) : data?.stores && data.stores.length > 0 ? (
            data.stores.map((store) => (
              <TouchableOpacity
                key={store.name}
                onPress={() => router.push(`/(store-employee)/home/store/${store.name}`)}
              >
                <Card style={styles.storeCard}>
                  <View style={styles.storeHeader}>
                    <View style={styles.storeIcon}>
                      <Ionicons name="storefront" size={24} color={settingApp.green_primery} />
                    </View>
                    <View style={styles.storeInfo}>
                      <Text style={styles.storeName}>{store.store_name}</Text>
                      <Text style={styles.storeId}>{store.name}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </View>
                  <View style={styles.storeStats}>
                    <View style={styles.storeStat}>
                      <Text style={styles.storeStatNum}>{store.farm_count}</Text>
                      <Text style={styles.storeStatLabel}>{t('dashboard.farms')}</Text>
                    </View>
                    <View style={styles.storeStat}>
                      <Text style={styles.storeStatNum}>{store.garden_count}</Text>
                      <Text style={styles.storeStatLabel}>{t('dashboard.gardens')}</Text>
                    </View>
                    <View style={styles.storeStat}>
                      <Text style={styles.storeStatNum}>{store.active_cultivation_count}</Text>
                      <Text style={styles.storeStatLabel}>{t('dashboard.cultivations')}</Text>
                    </View>
                    <View style={styles.storeStat}>
                      <Text style={styles.storeStatNum}>{store.farm_owner_count}</Text>
                      <Text style={styles.storeStatLabel}>{t('dashboard.farmOwners')}</Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          ) : (
            <Card>
              <Text style={styles.emptyText}>{t('dashboard.noStores')}</Text>
            </Card>
          )}
        </View>

        {/* Recent Care Logs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('dashboard.recentCareLogs')}</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>{t('common.seeAll')}</Text>
            </TouchableOpacity>
          </View>

          {data?.recent_care_logs && data.recent_care_logs.length > 0 ? (
            data.recent_care_logs.map((log) => (
              <TouchableOpacity key={log.name}>
                <Card style={styles.careLogCard}>
                  <View style={styles.careLogHeader}>
                    <View style={styles.careLogIcon}>
                      <Ionicons name="leaf" size={18} color={settingApp.green_primery} />
                    </View>
                    <View style={styles.careLogInfo}>
                      <Text style={styles.careLogGarden}>{log.garden_name}</Text>
                      <Text style={styles.careLogId}>{log.name}</Text>
                    </View>
                    <Badge label={formatDate(log.care_date)} variant="info" />
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          ) : (
            <Card>
              <Text style={styles.emptyText}>{t('dashboard.noCareLogs')}</Text>
            </Card>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.quickActions')}</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/(store-employee)/farms')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="people" size={22} color={settingApp.green_primery} />
              </View>
              <Text style={styles.quickActionText}>{t('dashboard.farmOwners')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/(store-employee)/orders')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="receipt" size={22} color="#2196F3" />
              </View>
              <Text style={styles.quickActionText}>{t('dashboard.orders')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickAction}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="cube" size={22} color="#FF9800" />
              </View>
              <Text style={styles.quickActionText}>{t('dashboard.inventory')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickAction}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="stats-chart" size={22} color="#9C27B0" />
              </View>
              <Text style={styles.quickActionText}>{t('dashboard.reports')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
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
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: settingApp.green_primery,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
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
  storeCard: {
    marginBottom: 12,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  storeId: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  storeStats: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  storeStat: {
    flex: 1,
    alignItems: 'center',
  },
  storeStatNum: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  storeStatLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  careLogCard: {
    marginBottom: 8,
  },
  careLogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  careLogIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  careLogInfo: {
    flex: 1,
    marginLeft: 12,
  },
  careLogGarden: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  careLogId: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  quickAction: {
    width: '22%',
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 8,
  },
});
