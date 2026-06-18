import type { Ionicons } from '@expo/vector-icons';
import { USER_ROLES } from './api';

export const MAX_QUICK_MENU = 5;

export type MenuGroup = 'garden' | 'store' | 'report';

export interface MenuItemConfig {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  route: string;
  group: MenuGroup;
}

/** Single source of truth for all menu item appearance config */
export const MENU_ITEM_CONFIGS: MenuItemConfig[] = [
  { key: 'farms',           icon: 'leaf-outline',        color: '#2E7D32', bg: '#E8F5E9', route: '/(main)/farms',              group: 'garden' },
  { key: 'myFarms',         icon: 'leaf-outline',        color: '#2E7D32', bg: '#E8F5E9', route: '/(main)/farms',              group: 'garden' },
  { key: 'gardens',         icon: 'flower-outline',      color: '#4CAF50', bg: '#F1F8E9', route: '/(main)/gardens',            group: 'garden' },
  { key: 'careLogs',        icon: 'clipboard-outline',   color: '#FF5722', bg: '#FBE9E7', route: '/(main)/care-logs',          group: 'garden' },
  { key: 'cultivationLogs', icon: 'leaf-outline',        color: '#8BC34A', bg: '#F9FBE7', route: '/(main)/cultivation-logs',   group: 'garden' },
  { key: 'farmOwners',      icon: 'people-outline',      color: '#00BCD4', bg: '#E0F7FA', route: '/(main)/farm-owners',        group: 'garden' },
  { key: 'orders',          icon: 'receipt-outline',     color: '#2196F3', bg: '#E3F2FD', route: '/(main)/orders',             group: 'store'  },
  { key: 'deliveryNotes',   icon: 'car-outline',         color: '#4CAF50', bg: '#E8F5E9', route: '/(main)/delivery-notes',     group: 'store'  },
  { key: 'inventory',       icon: 'cube-outline',        color: '#FF9800', bg: '#FFF3E0', route: '/(main)/stock',              group: 'store'  },
  { key: 'stores',          icon: 'storefront-outline',  color: '#2196F3', bg: '#E3F2FD', route: '/(main)/stores',             group: 'store'  },
  { key: 'purchaseRequests',icon: 'cart-outline',        color: '#FF9800', bg: '#FFF3E0', route: '',                                group: 'store'  },
  { key: 'revenue',         icon: 'bar-chart-outline',   color: '#9C27B0', bg: '#F3E5F5', route: '',                                group: 'report' },
  { key: 'reports',         icon: 'stats-chart-outline', color: '#FF5722', bg: '#FBE9E7', route: '',                                group: 'report' },
];

/** Helper: look up config by key */
export function getMenuItemConfig(key: string): MenuItemConfig | undefined {
  return MENU_ITEM_CONFIGS.find(c => c.key === key);
}

/** Default quick menu tiles per role (max MAX_QUICK_MENU) */
export const DEFAULT_QUICK_MENU: Record<string, string[]> = {
  [USER_ROLES.FARM_OWNER]:     ['myFarms', 'careLogs', 'gardens', 'purchaseRequests'],
  [USER_ROLES.STORE_EMPLOYEE]: ['farmOwners', 'inventory', 'orders', 'deliveryNotes'],
  [USER_ROLES.INVESTOR]:       ['revenue', 'stores', 'farmOwners'],
};
