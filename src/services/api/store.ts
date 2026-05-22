/**
 * Store Employee API Service
 * Custom endpoints for Store Employee module
 */

import { API_ENDPOINTS } from '@/constants/api';
import type {
  StoreDashboardResponse,
  StockLevelsResponse,
} from '@/types/api';
import type {
  DistributionStore,
  FarmOwner,
  Farm,
  Garden,
  CultivationLog,
  CareLog,
  SalesOrder,
  DeliveryNote,
} from '@/types/models';
import { callMethod, getList, getDoc } from './client';

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

// ============================================
// Distribution Store APIs
// ============================================

/**
 * Get all distribution stores
 */
export async function getStores(): Promise<DistributionStore[]> {
  return getList<DistributionStore>('ESF Distribution Store', {
    fields: ['name', 'store_name', 'warehouse', 'address', 'phone', 'status'],
    order_by: 'store_name asc',
  });
}

/**
 * Get a single distribution store by ID
 */
export async function getStoreById(storeId: string): Promise<DistributionStore> {
  return getDoc<DistributionStore>('ESF Distribution Store', storeId);
}

// ============================================
// Farm Owner APIs
// ============================================

/**
 * Get all farm owners
 */
export async function getFarmOwners(): Promise<FarmOwner[]> {
  return getList<FarmOwner>('ESF Farm Owner', {
    fields: ['name', 'owner_name', 'phone', 'email', 'address'],
    order_by: 'owner_name asc',
  });
}

/**
 * Get a single farm owner by ID
 */
export async function getFarmOwnerById(farmOwnerId: string): Promise<FarmOwner> {
  return getDoc<FarmOwner>('ESF Farm Owner', farmOwnerId);
}

// ============================================
// Farm APIs
// ============================================

/**
 * Get all farms
 */
export async function getFarms(): Promise<Farm[]> {
  return getList<Farm>('ESF Farm', {
    fields: ['name', 'farm_name', 'farm_owner', 'distribution_store', 'address', 'area', 'area_uom', 'status'],
    order_by: 'farm_name asc',
  });
}

/**
 * Get farms by owner
 */
export async function getFarmsByOwner(farmOwnerId: string): Promise<Farm[]> {
  return getList<Farm>('ESF Farm', {
    fields: ['name', 'farm_name', 'farm_owner', 'distribution_store', 'address', 'area', 'area_uom', 'status'],
    filters: [['farm_owner', '=', farmOwnerId]],
    order_by: 'farm_name asc',
  });
}

/**
 * Get a single farm by ID
 */
export async function getFarmById(farmId: string): Promise<Farm> {
  return getDoc<Farm>('ESF Farm', farmId);
}

// ============================================
// Garden APIs
// ============================================

/**
 * Get all gardens
 */
export async function getGardens(): Promise<Garden[]> {
  return getList<Garden>('ESF Garden', {
    fields: ['name', 'garden_name', 'farm', 'farm_owner', 'area', 'area_uom', 'soil_type', 'status'],
    order_by: 'garden_name asc',
  });
}

/**
 * Get gardens by farm
 */
export async function getGardensByFarm(farmId: string): Promise<Garden[]> {
  return getList<Garden>('ESF Garden', {
    fields: ['name', 'garden_name', 'farm', 'farm_owner', 'area', 'area_uom', 'soil_type', 'status'],
    filters: [['farm', '=', farmId]],
    order_by: 'garden_name asc',
  });
}

/**
 * Get a single garden by ID
 */
export async function getGardenById(gardenId: string): Promise<Garden> {
  return getDoc<Garden>('ESF Garden', gardenId);
}

// ============================================
// Cultivation Log APIs
// ============================================

/**
 * Get cultivation logs by garden
 */
export async function getCultivationLogsByGarden(gardenId: string): Promise<CultivationLog[]> {
  return getList<CultivationLog>('ESF Cultivation Log', {
    fields: ['name', 'garden', 'garden_name', 'farm', 'farm_owner', 'cultivation_master', 'cultivation_type', 'from_date', 'to_date', 'status'],
    filters: [['garden', '=', gardenId]],
    order_by: 'from_date desc',
  });
}

/**
 * Get a single cultivation log by ID
 */
export async function getCultivationLogById(cultivationLogId: string): Promise<CultivationLog> {
  return getDoc<CultivationLog>('ESF Cultivation Log', cultivationLogId);
}

// ============================================
// Care Log APIs
// ============================================

/**
 * Get care logs by cultivation log
 */
export async function getCareLogsByCultivation(cultivationLogId: string): Promise<CareLog[]> {
  return getList<CareLog>('ESF Care Log', {
    fields: ['name', 'cultivation_log', 'garden', 'garden_name', 'care_date', 'content', 'efficiency_percent'],
    filters: [['cultivation_log', '=', cultivationLogId]],
    order_by: 'care_date desc',
  });
}

/**
 * Get a single care log by ID
 */
export async function getCareLogById(careLogId: string): Promise<CareLog> {
  return getDoc<CareLog>('ESF Care Log', careLogId);
}

// ============================================
// Sales Order APIs
// ============================================

/**
 * Get sales orders
 */
export async function getSalesOrders(params?: {
  distribution_store?: string;
  status?: string;
  limit_start?: number;
  limit_page_length?: number;
}): Promise<SalesOrder[]> {
  const filters: Array<[string, string, unknown]> = [];

  if (params?.distribution_store) {
    filters.push(['custom_distribution_store', '=', params.distribution_store]);
  }
  if (params?.status) {
    filters.push(['status', '=', params.status]);
  }

  return getList<SalesOrder>('Sales Order', {
    fields: ['name', 'customer', 'customer_name', 'transaction_date', 'custom_distribution_store', 'total', 'grand_total', 'status'],
    filters: filters.length > 0 ? filters : undefined,
    order_by: 'transaction_date desc',
    limit_start: params?.limit_start,
    limit_page_length: params?.limit_page_length,
  });
}

/**
 * Get a single sales order by ID
 */
export async function getSalesOrderById(orderId: string): Promise<SalesOrder> {
  return getDoc<SalesOrder>('Sales Order', orderId);
}

// ============================================
// Delivery Note APIs
// ============================================

/**
 * Get delivery notes
 */
export async function getDeliveryNotes(params?: {
  distribution_store?: string;
  limit_start?: number;
  limit_page_length?: number;
}): Promise<DeliveryNote[]> {
  const filters: Array<[string, string, unknown]> = [];

  if (params?.distribution_store) {
    filters.push(['custom_distribution_store', '=', params.distribution_store]);
  }

  return getList<DeliveryNote>('Delivery Note', {
    fields: ['name', 'customer', 'customer_name', 'posting_date', 'custom_distribution_store', 'total', 'grand_total', 'status'],
    filters: filters.length > 0 ? filters : undefined,
    order_by: 'posting_date desc',
    limit_start: params?.limit_start,
    limit_page_length: params?.limit_page_length,
  });
}

/**
 * Get a single delivery note by ID
 */
export async function getDeliveryNoteById(deliveryNoteId: string): Promise<DeliveryNote> {
  return getDoc<DeliveryNote>('Delivery Note', deliveryNoteId);
}
