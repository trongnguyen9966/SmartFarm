/**
 * Menu Screen
 * Shows feature tiles based on user's permissions (role-based).
 * All roles share this single screen; visibility is controlled by useFeatures() + ROLE_FEATURES map.
 */

import { useAuth } from '@/hooks/useAuth';
import { useFeatures, usePrimaryRole } from '@/hooks/usePermission';
import { USER_ROLES } from '@/constants/api';
import { MENU_ITEM_CONFIGS } from '@/constants/quickMenu';
import settingApp from '@/settingApp';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MenuScreen() {
  const { userInfo } = useAuth();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const primaryRole = usePrimaryRole();
  const features = useFeatures();

  // Attach translated labels and filter by user's enabled features
  const menuItems = MENU_ITEM_CONFIGS
    .filter(item => features.includes(item.key))
    .map(item => ({ ...item, label: t(`menu.${item.key}`) }));

  const getRoleLabel = () => {
    switch (primaryRole) {
      case USER_ROLES.STORE_EMPLOYEE: return t('profile.roleStoreEmployee');
      case USER_ROLES.FARM_OWNER:     return t('profile.roleFarmOwner');
      case USER_ROLES.INVESTOR:       return t('profile.roleInvestor');
      default:                        return primaryRole || '';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>{t('tabs.menu')}</Text>
        {primaryRole && (
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>{getRoleLabel()}</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User greeting */}
        <View style={styles.greetCard}>
          <View style={styles.greetAvatar}>
            <Ionicons name="person" size={28} color="#FFFFFF" />
          </View>
          <View style={styles.greetText}>
            <Text style={styles.greetName}>{userInfo?.full_name || t('profile.defaultUser')}</Text>
            <Text style={styles.greetSub}>{t('menu.selectFeature')}</Text>
          </View>
        </View>

        {/* Feature grid */}
        {menuItems.length > 0 ? (
          <View style={styles.grid}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.tile}
                onPress={() => {
                  if (item.route) {
                    router.push(item.route as never);
                  }
                }}
              >
                <View style={[styles.tileIcon, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={28} color={item.color} />
                </View>
                <Text style={styles.tileLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="lock-closed-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>{t('menu.noFeatures')}</Text>
          </View>
        )}
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
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  rolePill: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rolePillText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  greetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  greetAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: settingApp.green_primery,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetText: {
    marginLeft: 14,
  },
  greetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1E21',
  },
  greetSub: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tile: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tileIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  tileLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#9CA3AF',
  },
});
