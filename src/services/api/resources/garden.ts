/**
 * Garden Resource API
 */

import type { Garden } from '@/types/models';
import { createDoc, getDoc, getList, updateDoc } from '../client';

const DOCTYPE = 'Garden';

export async function list(params?: {
  fields?: string[];
  filters?: Array<[string, string, unknown]>;
  limit_start?: number;
  limit_page_length?: number;
  order_by?: string;
}): Promise<Garden[]> {
  return getList<Garden>(DOCTYPE, {
    fields: params?.fields || [],
    ...params,
  });
}

export async function get(name: string): Promise<Garden> {
  return getDoc<Garden>(DOCTYPE, name);
}

export async function create(data: Partial<Garden>): Promise<Garden> {
  return createDoc<Garden>(DOCTYPE, data);
}

export async function update(name: string, data: Partial<Garden>): Promise<Garden> {
  return updateDoc<Garden>(DOCTYPE, name, data);
}
