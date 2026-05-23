/**
 * API Types
 */

import type { UserRole } from '@/constants/api';

// Generic API Response wrapper
export interface ApiResponse<T> {
  message: T;
}

// Error response from Frappe
export interface ApiError {
  exc_type?: string;
  exc?: string;
  _server_messages?: string;
}

// Pagination parameters
export interface PaginationParams {
  limit_start?: number;
  limit_page_length?: number;
  order_by?: string;
  fields?: string[];
  filters?: Array<[string, string, unknown]>;
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  total_count?: number;
}

// ============================================
// Auth Types
// ============================================

export interface LoginRequest {
  usr: string;
  pwd: string;
  [key: string]: unknown;
}

export interface StoreContext {
  name: string;
  store_name: string;
}

export interface FarmOwnerContext {
  name: string;
  owner_name: string;
}

// Response from Frappe built-in /api/method/login
export interface FrappeLoginResponse {
  message: string; // "Logged In"
  home_page: string;
  full_name: string;
}

// Unified user context used throughout the app
export interface UserContext {
  stores?: StoreContext[];
  farm_owner?: FarmOwnerContext;
  assigned_stores?: StoreContext[];
}

export interface LoginResponse {
  user: string;
  full_name: string;
  roles: string[];
  primary_role: UserRole;
  context: UserContext;
}

export interface SessionInfoResponse {
  user: string;
  full_name: string;
  roles: string[];
  primary_role: UserRole;
  context: UserContext;
}

// ============================================
// Store Employee Types
// ============================================

export interface StoreDashboardStore {
  name: string;
  store_name: string;
  warehouse: string;
  farm_count: number;
  garden_count: number;
  active_cultivation_count: number;
  farm_owner_count: number;
}

export interface RecentCareLog {
  name: string;
  care_date: string;
  garden: string;
  garden_name: string;
  cultivation_log: string;
}

export interface StoreDashboardResponse {
  stores: StoreDashboardStore[];
  recent_care_logs: RecentCareLog[];
}

export interface StockItem {
  item_code: string;
  item_name: string;
  item_group: string;
  custom_usage_type: string;
  actual_qty: number;
  uom: string;
  image?: string;
}

export interface StockLevelsResponse {
  warehouse: string;
  items: StockItem[];
  total_count: number;
}

// ============================================
// Farm Owner Types
// ============================================

export interface FarmOwnerInfo {
  name: string;
  owner_name: string;
  phone: string;
  email: string;
}

export interface FarmDashboardFarm {
  name: string;
  farm_name: string;
  distribution_store: string;
  store_name: string;
  status: string;
  garden_count: number;
  active_cultivation_count: number;
}

export interface FarmOwnerDashboardResponse {
  farm_owner: FarmOwnerInfo;
  farms: FarmDashboardFarm[];
  recent_care_logs: RecentCareLog[];
  total_gardens: number;
  active_cultivations: number;
}

// ============================================
// Investor Types
// ============================================

export interface InvestorDashboardStore {
  name: string;
  store_name: string;
  total_revenue: number;
  order_count: number;
  farm_count: number;
  garden_count: number;
}

export interface RevenueTrend {
  month: string;
  revenue: number;
}

export interface InvestorDashboardResponse {
  stores: InvestorDashboardStore[];
  total_revenue: number;
  total_orders: number;
  total_farms: number;
  total_gardens: number;
  revenue_trend: RevenueTrend[];
}

export interface RevenueDetailOrder {
  name: string;
  customer_name: string;
  grand_total: number;
  transaction_date: string;
  status: string;
}

export interface RevenueByItemGroup {
  item_group: string;
  total: number;
}

export interface RevenueDetailResponse {
  distribution_store: string;
  store_name: string;
  total_revenue: number;
  orders: RevenueDetailOrder[];
  revenue_by_item_group: RevenueByItemGroup[];
}
