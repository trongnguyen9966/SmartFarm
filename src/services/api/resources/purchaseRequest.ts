/**
 * Farm Purchase Request Resource API
 */

import type { FarmPurchaseRequest } from '@/types/models';
import { getDoc, getList } from '../client';

const DOCTYPE = 'Farm Purchase Request';

export async function list(params?: {
  fields?: string[];
  filters?: Array<[string, string, unknown]>;
  limit_start?: number;
  limit_page_length?: number;
  order_by?: string;
}): Promise<FarmPurchaseRequest[]> {
  return getList<FarmPurchaseRequest>(DOCTYPE, {
    ...params,
  });
}

export async function get(name: string): Promise<FarmPurchaseRequest> {
  return getDoc<FarmPurchaseRequest>(DOCTYPE, name);
}
