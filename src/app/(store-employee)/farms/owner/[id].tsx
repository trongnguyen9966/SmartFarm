/**
 * Farm Owner Detail Screen
 */

import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import settingApp from '@/settingApp';
import { Card, Badge } from '@/components/ui';
import * as storeApi from '@/services/api/store';
import type { FarmOwner, Farm } from '@/types/models';

export default function FarmOwnerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [owner, setOwner] = useState<FarmOwner | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (!id) return;

      const [ownerData, farmsData] = await Promise.all([
        storeApi.getFarmOwnerById(id),
        storeApi.getFarmsByOwner(id),
      ]);

      setOwner(ownerData);
      setFarms(farmsData);
    } catch (error) {
      console.error('[FarmOwnerDetailScreen] Error fetching data:', error);
      setOwner(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
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

  if (!owner) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết chủ trại</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không tìm thấy chủ trại</Text>
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
          {owner.owner_name}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Owner Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarTextLarge}>
              {owner.owner_name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.ownerName}>{owner.owner_name}</Text>
          <Text style={styles.ownerId}>{owner.name}</Text>
          <Badge
            label={`${farms.length} nông trại`}
            variant="success"
            style={styles.badge}
          />

          {/* Contact Actions */}
          <View style={styles.contactActions}>
            {owner.phone && (
              <TouchableOpacity
                style={styles.contactAction}
                onPress={() => handleCall(owner.phone!)}
              >
                <View style={[styles.contactIcon, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="call" size={22} color={settingApp.green_primery} />
                </View>
                <Text style={styles.contactLabel}>Gọi điện</Text>
              </TouchableOpacity>
            )}
            {owner.email && (
              <TouchableOpacity
                style={styles.contactAction}
                onPress={() => handleEmail(owner.email!)}
              >
                <View style={[styles.contactIcon, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="mail" size={22} color="#2196F3" />
                </View>
                <Text style={styles.contactLabel}>Email</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Contact Details */}
          <View style={styles.detailsSection}>
            {owner.phone && (
              <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={18} color="#666" />
                <Text style={styles.detailText}>{owner.phone}</Text>
              </View>
            )}
            {owner.email && (
              <View style={styles.detailRow}>
                <Ionicons name="mail-outline" size={18} color="#666" />
                <Text style={styles.detailText}>{owner.email}</Text>
              </View>
            )}
            {owner.address && (
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={18} color="#666" />
                <Text style={styles.detailText}>{owner.address}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Farms Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Danh sách nông trại</Text>
            <Badge label={`${farms.length}`} variant="info" />
          </View>

          {farms.length > 0 ? (
            farms.map((farm) => (
              <TouchableOpacity
                key={farm.name}
                onPress={() => router.push(`/(store-employee)/farms/farm/${farm.name}`)}
              >
                <Card style={styles.farmCard}>
                  <View style={styles.farmHeader}>
                    <View style={styles.farmIcon}>
                      <Ionicons name="leaf" size={22} color={settingApp.green_primery} />
                    </View>
                    <View style={styles.farmInfo}>
                      <Text style={styles.farmName}>{farm.farm_name}</Text>
                      <Text style={styles.farmId}>{farm.name}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </View>

                  <View style={styles.farmDetails}>
                    <View style={styles.farmDetail}>
                      <Ionicons name="location-outline" size={14} color="#9CA3AF" />
                      <Text style={styles.farmDetailText} numberOfLines={1}>
                        {farm.address || 'Chưa cập nhật'}
                      </Text>
                    </View>
                    <View style={styles.farmStats}>
                      <View style={styles.farmStat}>
                        <Text style={styles.farmStatNum}>{farm.garden_count || 0}</Text>
                        <Text style={styles.farmStatLabel}>Vườn</Text>
                      </View>
                      <View style={styles.farmStat}>
                        <Text style={styles.farmStatNum}>{farm.total_area || 0}</Text>
                        <Text style={styles.farmStatLabel}>m²</Text>
                      </View>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          ) : (
            <Card>
              <Text style={styles.emptyText}>Chưa có nông trại</Text>
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
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: settingApp.green_primery,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarTextLarge: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  ownerName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  ownerId: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  badge: {
    marginTop: 12,
  },
  contactActions: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 24,
  },
  contactAction: {
    alignItems: 'center',
  },
  contactIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  contactLabel: {
    fontSize: 12,
    color: '#666',
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
    gap: 12,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
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
  farmCard: {
    marginBottom: 12,
  },
  farmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  farmIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  farmInfo: {
    flex: 1,
    marginLeft: 12,
  },
  farmName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  farmId: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  farmDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  farmDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  farmDetailText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
  },
  farmStats: {
    flexDirection: 'row',
    gap: 24,
  },
  farmStat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  farmStatNum: {
    fontSize: 16,
    fontWeight: '600',
    color: settingApp.green_primery,
  },
  farmStatLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 8,
  },
});
