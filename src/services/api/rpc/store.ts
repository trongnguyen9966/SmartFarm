/**
 * Store RPC Services
 * Custom aggregated endpoints for Store Employee role
 */

import { callMethod } from '../client';

export interface StoreDashboardStore {
  name: string;
  store_name: string;
  warehouse?: string;
  farm_count: number;
  garden_count: number;
  active_cultivation_count: number;
  farm_owner_count: number;
}

export interface RecentCareLog {
  name: string;
  care_date: string;
  garden: string;
  garden_name?: string;
  cultivation_log?: string;
}

export interface StoreDashboard {
  stores: StoreDashboardStore[];
  recent_care_logs: RecentCareLog[];
}

export interface StockItem {
  item_code: string;
  item_name: string;
  item_group: string;
  custom_usage_type?: string;
  actual_qty: number;
  uom: string;
  image?: string;
}

export interface StockLevelResult {
  warehouse: string;
  items: StockItem[];
  total_count: number;
}

export async function getDashboard(): Promise<StoreDashboard> {
  return callMethod<StoreDashboard>('/api/method/esf.api.store.get_dashboard', {});
}

export async function getStockLevels(params: {
  distribution_store: string;
  item_group?: string;
  search?: string;
  limit_start?: number;
  limit_page_length?: number;
}): Promise<StockLevelResult> {
  return callMethod<StockLevelResult>('/api/method/esf.api.store.get_stock_levels', params);
}
