/**
 * API Configuration
 */

// Base URL for Frappe backend - configured via EXPO_PUBLIC_API_URL environment variable
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://34.27.1.2';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/method/login',
    SESSION_INFO: '/api/method/esf.api.auth.get_session_info',
  },

  // Store Employee
  STORE: {
    DASHBOARD: '/api/method/esf.api.store.get_dashboard',
    STOCK_LEVELS: '/api/method/esf.api.store.get_stock_levels',
  },

  // Farm Owner
  FARM_OWNER: {
    DASHBOARD: '/api/method/esf.api.farm_owner.get_dashboard',
    MY_FARM_OWNER: '/api/method/esf.api.farm_owner.get_my_farm_owner',
    CREATE_PURCHASE_REQUEST: '/api/method/esf.api.farm_owner.create_purchase_request',
    NEAREST_STORE: '/api/method/esf.api.farm_owner.get_nearest_store',
  },

  // Investor
  INVESTOR: {
    DASHBOARD: '/api/method/esf.api.investor.get_dashboard',
    REVENUE_DETAIL: '/api/method/esf.api.investor.get_revenue_detail',
    ASSIGNED_STORES: '/api/method/esf.api.investor.get_assigned_stores',
    FARM_OWNERS: '/api/method/esf.api.investor.get_farm_owners',
  },

  // Standard REST resource endpoint builder
  resource: (doctype: string) => `/api/resource/${doctype}`,
} as const;

// User roles
export const USER_ROLES = {
  STORE_EMPLOYEE: 'ESF Store Manager',
  FARM_OWNER: 'ESF Farm Owner',
  INVESTOR: 'ESF Investor',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Feature keys enabled per role
// Used by menu/index.tsx to filter which tiles to show
export const ROLE_FEATURES: Record<string, string[]> = {
  [USER_ROLES.STORE_EMPLOYEE]: ['farms', 'orders', 'farmOwners', 'careLogs', 'deliveryNotes', 'inventory'],
  [USER_ROLES.FARM_OWNER]: ['myFarms', 'gardens', 'careLogs', 'cultivationLogs', 'purchaseRequests'],
  [USER_ROLES.INVESTOR]: ['stores', 'revenue', 'farmOwners', 'reports'],
};

// Maps feature key → Frappe DocType for permission read check
// If a feature key is NOT listed here, it is always visible (no DocType gate)
export const FEATURE_DOCTYPE_MAP: Record<string, string> = {
  farms:           DOCTYPES.FARM,
  myFarms:         DOCTYPES.FARM,
  orders:          DOCTYPES.SALES_ORDER,
  gardens:         DOCTYPES.GARDEN,
  careLogs:        DOCTYPES.CARE_LOG,
  cultivationLogs: DOCTYPES.CULTIVATION_LOG,
  farmOwners:      DOCTYPES.FARM_OWNER,
  stores:          DOCTYPES.DISTRIBUTION_STORE,
  deliveryNotes:   DOCTYPES.DELIVERY_NOTE,
};

// Frappe DocType names — single source of truth
// If BE renames a DocType, only change here
export const DOCTYPES = {
  FARM: 'Farm',
  GARDEN: 'Garden',
  CARE_LOG: 'Care Log',
  CULTIVATION_LOG: 'Cultivation Log',
  CULTIVATION_MASTER: 'Cultivation Master',
  FARM_OWNER: 'Farm Owner',
  SALES_ORDER: 'Sales Order',
  DELIVERY_NOTE: 'Delivery Note',
  DISTRIBUTION_STORE: 'Distribution Store',
  ITEM: 'Item',
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  DEFAULT_ORDER_BY: 'modified desc',
} as const;
