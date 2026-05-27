/**
 * Investor Dashboard
 */

import { StyleSheet, Text, View, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import settingApp from '@/settingApp';
import { useAuth } from '@/hooks/useAuth';

export default function InvestorDashboard() {
  const { t } = useTranslation();
  const { userInfo } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // TODO: Fetch dashboard data
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View>
          <Text style={styles.greeting}>{t('dashboard.greeting')}</Text>
          <Text style={styles.userName}>{userInfo?.full_name || t('investorHome.defaultUser')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={settingApp.green_primery}
          />
        }
      >
        {/* Revenue Card */}
        <View style={styles.revenueCard}>
          <Text style={styles.revenueLabel}>{t('dashboard.totalRevenueThisMonth')}</Text>
          <Text style={styles.revenueAmount}>{formatCurrency(0)}</Text>
          <View style={styles.revenueMeta}>
            <Text style={styles.revenueChange}>{t('dashboard.comparedLastMonth')}</Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>{t('dashboard.stores')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>{t('dashboard.orders')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>{t('dashboard.farms')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>{t('dashboard.gardens')}</Text>
          </View>
        </View>

        {/* Revenue Trend */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.revenueTrend')}</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{t('dashboard.chartInProgress')}</Text>
          </View>
        </View>

        {/* Stores Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.revenueByStore')}</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{t('common.noData')}</Text>
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
    paddingVertical: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  revenueCard: {
    backgroundColor: settingApp.green_primery,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  revenueLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  revenueAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  revenueMeta: {
    marginTop: 12,
  },
  revenueChange: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});
