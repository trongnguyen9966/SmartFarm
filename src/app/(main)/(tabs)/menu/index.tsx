/**
 * Menu Screen
 * Features grouped by category, 4 tiles per row.
 */

import { useAuth } from '@/hooks/useAuth';
import { useFeatures, usePrimaryRole } from '@/hooks/usePermission';
import { USER_ROLES } from '@/constants/api';
import { MENU_ITEM_CONFIGS, type MenuGroup } from '@/constants/quickMenu';
import { getAvatarColor, getInitials } from '@/utils/avatar';
import settingApp from '@/settingApp';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;
// 4 tiles per row:
//   - scroll padding: 16 × 2 = 32
//   - section paddingHorizontal: 16 × 2 = 32
//   - 3 gaps of 8px between 4 tiles: 24
const TILE_W = Math.floor((SCREEN_WIDTH - 32 - 32 - 8 * 3) / 4);

interface MenuItem {
  key: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  bg: string;
  route: string;
  group: MenuGroup;
  label: string;
}

const GROUP_ORDER: MenuGroup[] = ['garden', 'store', 'report'];

const GROUP_TITLE_KEY: Record<MenuGroup, string> = {
  garden: 'menu.groupGarden',
  store:  'menu.groupStore',
  report: 'menu.groupReport',
};

const GROUP_ICON: Record<MenuGroup, React.ComponentProps<typeof Ionicons>['name']> = {
  garden: 'leaf',
  store:  'storefront',
  report: 'bar-chart',
};

const GROUP_COLORS: Record<MenuGroup, { bg: string; icon: string }> = {
  garden: { bg: '#E8F5E9', icon: '#2E7D32' },
  store:  { bg: '#E3F2FD', icon: '#1565C0' },
  report: { bg: '#F3E5F5', icon: '#6A1B9A' },
};

export default function MenuScreen() {
  const { userInfo } = useAuth();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const primaryRole = usePrimaryRole();
  const features = useFeatures();

  const menuItems: MenuItem[] = MENU_ITEM_CONFIGS
    .filter(item => features.includes(item.key))
    .map(item => ({ ...item, label: t(`menu.${item.key}`) }));

  const grouped: Partial<Record<MenuGroup, MenuItem[]>> = {};
  for (const item of menuItems) {
    if (!grouped[item.group]) grouped[item.group] = [];
    grouped[item.group]!.push(item);
  }

  const visibleGroups = GROUP_ORDER.filter(g => (grouped[g]?.length ?? 0) > 0);

  const getRoleLabel = () => {
    switch (primaryRole) {
      case USER_ROLES.STORE_EMPLOYEE: return t('profile.roleStoreEmployee');
      case USER_ROLES.FARM_OWNER:     return t('profile.roleFarmOwner');
      case USER_ROLES.INVESTOR:       return t('profile.roleInvestor');
      default:                        return primaryRole || '';
    }
  };

  const name = userInfo?.full_name || t('profile.defaultUser');

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
        {/* Greeting */}
        <View style={styles.greetCard}>
          <View style={[styles.greetAvatar, { backgroundColor: getAvatarColor(name) }]}>
            <Text style={styles.greetAvatarText}>{getInitials(name)}</Text>
          </View>
          <View style={styles.greetText}>
            <Text style={styles.greetName}>{name}</Text>
            <Text style={styles.greetSub}>{t('menu.selectFeature')}</Text>
          </View>
        </View>

        {/* Grouped sections */}
        {visibleGroups.length > 0 ? (
          visibleGroups.map(groupKey => {
            const items = grouped[groupKey]!;
            const gc = GROUP_COLORS[groupKey];
            // Pad to multiple of 4 with spacers
            const padCount = (4 - (items.length % 4)) % 4;

            return (
              <View key={groupKey} style={styles.section}>
                {/* Section header */}
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconBox, { backgroundColor: gc.bg }]}>
                    <Ionicons name={GROUP_ICON[groupKey]} size={14} color={gc.icon} />
                  </View>
                  <Text style={styles.sectionTitle}>{t(GROUP_TITLE_KEY[groupKey])}</Text>
                </View>

                {/* 4-per-row grid */}
                <View style={styles.tileGrid}>
                  {items.map(item => (
                    <TouchableOpacity
                      key={item.key}
                      style={styles.tile}
                      activeOpacity={0.7}
                      onPress={() => { if (item.route) router.push(item.route as never); }}
                    >
                      <View style={[styles.tileIconBox, { backgroundColor: item.bg }]}>
                        <Ionicons name={item.icon} size={24} color={item.color} />
                      </View>
                      <Text style={styles.tileLabel} numberOfLines={2}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                  {Array.from({ length: padCount }).map((_, i) => (
                    <View key={`sp-${i}`} style={[styles.tile, { opacity: 0 }]} />
                  ))}
                </View>
              </View>
            );
          })
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
  container: { flex: 1, backgroundColor: '#F5F5F5' },

  header: {
    backgroundColor: settingApp.green_primery,
    paddingHorizontal: 20, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  rolePill: {
    backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  rolePillText: { fontSize: 12, color: '#FFFFFF', fontWeight: '500' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },

  greetCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3, elevation: 2,
  },
  greetAvatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  greetAvatarText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  greetText: { marginLeft: 14 },
  greetName: { fontSize: 16, fontWeight: '600', color: '#1C1E21' },
  greetSub: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },

  section: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 16,
    marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 2, elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12,
  },
  sectionIconBox: {
    width: 26, height: 26, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#374151' },

  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: {
    width: TILE_W,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tileIconBox: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginBottom: 7,
  },
  tileLabel: {
    fontSize: 11, fontWeight: '500', color: '#374151',
    textAlign: 'center', lineHeight: 15,
  },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: '#9CA3AF' },
});
