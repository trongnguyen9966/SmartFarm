/**
 * Care Log Resource API
 */

import type { CareLog } from '@/types/models';
import { createDoc, getList, updateDoc } from '../client';

const DOCTYPE = 'Care Log';

export async function list(params?: {
  fields?: string[];
  filters?: Array<[string, string, unknown]>;
  limit_start?: number;
  limit_page_length?: number;
  order_by?: string;
}): Promise<CareLog[]> {
  return getList<CareLog>(DOCTYPE, {
    ...params,
  });
}

export async function get(name: string): Promise<CareLog> {
  const results = await getList<CareLog>(DOCTYPE, {
    filters: [['name', '=', name]],
    limit_page_length: 1,
  });
  if (!results.length) throw new Error(`Care Log not found: ${name}`);
  return results[0];
}

export async function create(data: Partial<CareLog>): Promise<CareLog> {
  return createDoc<CareLog>(DOCTYPE, data);
}

export async function update(name: string, data: Partial<CareLog>): Promise<CareLog> {
  return updateDoc<CareLog>(DOCTYPE, name, data);
}
