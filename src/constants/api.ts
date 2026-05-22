/**
 * API Configuration
 */

// Base URL for Frappe backend - configured via EXPO_PUBLIC_API_URL environment variable
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://34.27.1.2';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/login',
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

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  DEFAULT_ORDER_BY: 'modified desc',
} as const;
