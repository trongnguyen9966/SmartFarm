/**
 * Care Log Resource API
 */

import type { CareLog } from '@/types/models';
import { getList, getDoc, createDoc, updateDoc } from '../client';

const DOCTYPE = 'Care Log';

export async function list(params?: {
  fields?: string[];
  filters?: Array<[string, string, unknown]>;
  limit_start?: number;
  limit_page_length?: number;
  order_by?: string;
}): Promise<CareLog[]> {
  return getList<CareLog>(DOCTYPE, {
    fields: params?.fields || [
      'name', 'cultivation_log', 'garden', 'garden_name',
      'care_date', 'efficiency_percent', 'owner'
    ],
    order_by: params?.order_by || 'care_date desc',
    ...params,
  });
}

export async function get(name: string): Promise<CareLog> {
  return getDoc<CareLog>(DOCTYPE, name);
}

export async function create(data: Partial<CareLog>): Promise<CareLog> {
  return createDoc<CareLog>(DOCTYPE, data);
}

export async function update(name: string, data: Partial<CareLog>): Promise<CareLog> {
  return updateDoc<CareLog>(DOCTYPE, name, data);
}
