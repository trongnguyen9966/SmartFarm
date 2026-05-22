/**
 * Store Employee - Farm Owners List
 */

import { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import settingApp from '@/settingApp';
import { Card, SearchBar, Badge, EmptyState } from '@/components/ui';
import * as storeApi from '@/services/api/store';
import type { FarmOwner, Farm } from '@/types/models';

export default function FarmOwnersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [farmOwners, setFarmOwners] = useState<FarmOwner[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [ownersData, farmsData] = await Promise.all([
        storeApi.getFarmOwners(),
        storeApi.getFarms(),
      ]);
      setFarmOwners(ownersData);
      setFarms(farmsData);
    } catch (error) {
      console.error('[FarmOwnersScreen] Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get farms count for a specific owner
  const getFarmCountForOwner = (ownerId: string): number => {
    return farms.filter((f) => f.farm_owner === ownerId).length;
  };

  // Filter farm owners by search query
  const filteredOwners = useMemo(() => {
    if (!searchQuery.trim()) return farmOwners;

    const query = searchQuery.toLowerCase();
    return farmOwners.filter(
      (owner) =>
        owner.owner_name.toLowerCase().includes(query) ||
        owner.phone?.toLowerCase().includes(query) ||
        owner.email?.toLowerCase().includes(query)
    );
  }, [farmOwners, searchQuery]);

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const renderFarmOwner = ({ item }: { item: FarmOwner }) => {
    const farmCount = getFarmCountForOwner(item.name);

    return (
      <TouchableOpacity
        onPress={() => router.push(`/(store-employee)/farms/owner/${item.name}`)}
      >
        <Card style={styles.ownerCard}>
          <View style={styles.ownerHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.owner_name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.ownerInfo}>
              <Text style={styles.ownerName}>{item.owner_name}</Text>
              <Text style={styles.ownerId}>{item.name}</Text>
            </View>
            <Badge
              label={`${farmCount} trại`}
              variant="success"
            />
          </View>

          {/* Contact Info */}
          <View style={styles.contactRow}>
            {item.phone && (
              <TouchableOpacity
                style={styles.contactBtn}
                onPress={() => handleCall(item.phone!)}
              >
                <Ionicons name="call" size={16} color={settingApp.green_primery} />
                <Text style={styles.contactText}>{item.phone}</Text>
              </TouchableOpacity>
            )}
            {item.email && (
              <TouchableOpacity
                style={styles.contactBtn}
                onPress={() => handleEmail(item.email!)}
              >
                <Ionicons name="mail" size={16} color={settingApp.green_primery} />
                <Text style={styles.contactText} numberOfLines={1}>
                  {item.email}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Address */}
          {item.address && (
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={16} color="#9CA3AF" />
              <Text style={styles.addressText} numberOfLines={2}>
                {item.address}
              </Text>
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Status bar background */}
      <View style={[styles.statusBarBg, { height: insets.top }]} />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Chủ nông trại</Text>
        <Text style={styles.subtitle}>{farmOwners.length} chủ trại</Text>
      </View>

      {/* Content Area */}
      <View style={styles.content}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Tìm theo tên, SĐT, email..."
          />
        </View>

        {/* List */}
        <FlatList
          data={filteredOwners}
          keyExtractor={(item) => item.name}
          renderItem={renderFarmOwner}
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
              icon="people-outline"
              title={searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có chủ trại'}
              message={
                searchQuery
                  ? 'Thử tìm với từ khóa khác'
                  : 'Các chủ nông trại sẽ hiển thị ở đây'
              }
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  statusBarBg: {
    backgroundColor: settingApp.green_primery,
  },
  header: {
    backgroundColor: settingApp.green_primery,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  ownerCard: {
    marginBottom: 12,
  },
  ownerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: settingApp.green_primery,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  ownerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  ownerId: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  contactRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactText: {
    fontSize: 13,
    color: settingApp.green_primery,
  },
  addressRow: {
    flexDirection: 'row',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});
