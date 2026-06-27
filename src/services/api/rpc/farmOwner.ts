/**
 * Farm Owner RPC Services
 * Custom aggregated endpoints for Farm Owner role
 */

import { callMethod } from '../client';
import type { FarmOwner } from '@/types/models';

export interface FarmDashboardItem {
  name: string;
  farm_name: string;
  distribution_store?: string;
  store_name?: string;
  status: string;
  garden_count: number;
  active_cultivation_count: number;
}

export interface RecentCareLog {
  name: string;
  care_date: string;
  garden_name?: string;
}

export interface FarmOwnerDashboard {
  farm_owner: FarmOwner;
  farms: FarmDashboardItem[];
  recent_care_logs: RecentCareLog[];
  total_gardens: number;
  active_cultivations: number;
}

export async function getDashboard(): Promise<FarmOwnerDashboard> {
  return callMethod<FarmOwnerDashboard>('/api/method/esf.api.farm_owner.get_dashboard', {});
}

export async function getMyFarmOwner(): Promise<FarmOwner> {
  return callMethod<FarmOwner>('/api/method/esf.api.farm_owner.get_my_farm_owner', {});
}

export interface CreatePurchaseRequestParams {
  farm: string;
  items: Array<{ item: string; quantity: number; uom: string }>;
  notes?: string;
}

export interface CreatePurchaseRequestResponse {
  name: string;
  distribution_store: string;
  store_name: string;
  status: string;
}

export async function createPurchaseRequest(
  params: CreatePurchaseRequestParams
): Promise<CreatePurchaseRequestResponse> {
  return callMethod<CreatePurchaseRequestResponse>(
    '/api/method/esf.api.farm_owner.create_purchase_request',
    params
  );
}

export interface NearestStore {
  name: string;
  store_name: string;
  distance_km: number;
}

export async function getNearestStore(
  latitude: number,
  longitude: number
): Promise<NearestStore> {
  return callMethod<NearestStore>('/api/method/esf.api.farm_owner.get_nearest_store', {
    latitude,
    longitude,
  });
}
