/**
 * Item Resource API
 */

import type { Item } from '@/types/models';
import { getDoc, getList } from '../client';

const DOCTYPE = 'Item';

export async function list(params?: {
  fields?: string[];
  filters?: Array<[string, string, unknown]>;
  limit_start?: number;
  limit_page_length?: number;
  order_by?: string;
}): Promise<Item[]> {
  return getList<Item>(DOCTYPE, {
    ...params,
  });
}

export async function get(name: string): Promise<Item> {
  return getDoc<Item>(DOCTYPE, name);
}
