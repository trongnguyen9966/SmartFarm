/**
 * Cultivation Log Resource API
 */

import type { CultivationLog } from '@/types/models';
import { getList, getDoc, createDoc, updateDoc } from '../client';

const DOCTYPE = 'Cultivation Log';

export async function list(params?: {
  fields?: string[];
  filters?: Array<[string, string, unknown]>;
  limit_start?: number;
  limit_page_length?: number;
  order_by?: string;
}): Promise<CultivationLog[]> {
  return getList<CultivationLog>(DOCTYPE, {
    fields: params?.fields || [
      'name', 'garden', 'garden_name', 'farm', 'farm_owner',
      'cultivation_master', 'cultivation_type', 'from_date', 'to_date', 'status'
    ],
    order_by: params?.order_by || 'from_date desc',
    ...params,
  });
}

export async function get(name: string): Promise<CultivationLog> {
  return getDoc<CultivationLog>(DOCTYPE, name);
}

export async function create(data: Partial<CultivationLog>): Promise<CultivationLog> {
  return createDoc<CultivationLog>(DOCTYPE, data);
}

export async function update(name: string, data: Partial<CultivationLog>): Promise<CultivationLog> {
  return updateDoc<CultivationLog>(DOCTYPE, name, data);
}
