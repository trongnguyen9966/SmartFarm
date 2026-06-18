/**
 * Farm Owner Resource API
 */

import type { FarmOwner } from '@/types/models';
import { createDoc, getDoc, getList, updateDoc } from '../client';

const DOCTYPE = 'Farm Owner';

export async function list(params?: {
  fields?: string[];
  filters?: Array<[string, string, unknown]>;
  limit_start?: number;
  limit_page_length?: number;
  order_by?: string;
}): Promise<FarmOwner[]> {
  return getList<FarmOwner>(DOCTYPE, {
    ...params,
  });
}

export async function get(name: string): Promise<FarmOwner> {
  return getDoc<FarmOwner>(DOCTYPE, name);
}

export async function create(data: Partial<FarmOwner>): Promise<FarmOwner> {
  return createDoc<FarmOwner>(DOCTYPE, data);
}

export async function update(name: string, data: Partial<FarmOwner>): Promise<FarmOwner> {
  return updateDoc<FarmOwner>(DOCTYPE, name, data);
}
