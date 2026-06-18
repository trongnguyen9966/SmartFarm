/**
 * Delivery Note Resource API
 */

import type { DeliveryNote } from '@/types/models';
import { getDoc, getList } from '../client';

const DOCTYPE = 'Delivery Note';

export async function list(params?: {
  fields?: string[];
  filters?: Array<[string, string, unknown]>;
  limit_start?: number;
  limit_page_length?: number;
  order_by?: string;
}): Promise<DeliveryNote[]> {
  return getList<DeliveryNote>(DOCTYPE, {
    ...params,
  });
}

export async function get(name: string): Promise<DeliveryNote> {
  return getDoc<DeliveryNote>(DOCTYPE, name);
}
