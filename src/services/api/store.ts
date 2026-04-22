/**
 * Store Employee API Service
 * Custom endpoints for Store Employee module
 */

import { API_ENDPOINTS } from '@/constants/api';
import type {
  StoreDashboardResponse,
  StockLevelsResponse,
} from '@/types/api';
import { callMethod } from './client';

/**
 * Get Store Employee dashboard data
 * Returns stores with counts and recent care logs
 */
export async function getDashboard(): Promise<StoreDashboardResponse> {
  return callMethod<StoreDashboardResponse>(API_ENDPOINTS.STORE.DASHBOARD);
}

/**
 * Get stock levels for a distribution store
 */
export async function getStockLevels(params: {
  distribution_store: string;
  item_group?: string;
  search?: string;
  limit_start?: number;
  limit_page_length?: number;
}): Promise<StockLevelsResponse> {
  return callMethod<StockLevelsResponse>(API_ENDPOINTS.STORE.STOCK_LEVELS, params);
}
