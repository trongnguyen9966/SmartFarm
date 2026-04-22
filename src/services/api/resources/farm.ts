/**
 * Farm Resource API
 */

import type { Farm } from '@/types/models';
import { getList, getDoc, createDoc, updateDoc } from '../client';

const DOCTYPE = 'Farm';

export async function list(params?: {
  fields?: string[];
  filters?: Array<[string, string, unknown]>;
  limit_start?: number;
  limit_page_length?: number;
  order_by?: string;
}): Promise<Farm[]> {
  return getList<Farm>(DOCTYPE, {
    fields: params?.fields || ['name', 'farm_name', 'farm_owner', 'distribution_store', 'status'],
    order_by: params?.order_by || 'farm_name asc',
    ...params,
  });
}

export async function get(name: string): Promise<Farm> {
  return getDoc<Farm>(DOCTYPE, name);
}

export async function create(data: Partial<Farm>): Promise<Farm> {
  return createDoc<Farm>(DOCTYPE, data);
}

export async function update(name: string, data: Partial<Farm>): Promise<Farm> {
  return updateDoc<Farm>(DOCTYPE, name, data);
}
