/**
 * Distribution Store Resource API
 */

import type { DistributionStore } from '@/types/models';
import { getList, getDoc } from '../client';

const DOCTYPE = 'Distribution Store';

export async function list(params?: {
  fields?: string[];
  filters?: Array<[string, string, unknown]>;
  limit_start?: number;
  limit_page_length?: number;
}): Promise<DistributionStore[]> {
  return getList<DistributionStore>(DOCTYPE, {
    fields: params?.fields || ['name', 'store_name', 'warehouse', 'address', 'phone', 'status'],
    ...params,
  });
}

export async function get(name: string): Promise<DistributionStore> {
  return getDoc<DistributionStore>(DOCTYPE, name);
}
