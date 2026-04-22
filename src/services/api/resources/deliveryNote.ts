/**
 * Delivery Note Resource API
 */

import type { DeliveryNote } from '@/types/models';
import { getList, getDoc } from '../client';

const DOCTYPE = 'Delivery Note';

export async function list(params?: {
  fields?: string[];
  filters?: Array<[string, string, unknown]>;
  limit_start?: number;
  limit_page_length?: number;
  order_by?: string;
}): Promise<DeliveryNote[]> {
  return getList<DeliveryNote>(DOCTYPE, {
    fields: params?.fields || [
      'name', 'customer', 'customer_name', 'posting_date',
      'grand_total', 'status', 'custom_distribution_store'
    ],
    order_by: params?.order_by || 'posting_date desc',
    ...params,
  });
}

export async function get(name: string): Promise<DeliveryNote> {
  return getDoc<DeliveryNote>(DOCTYPE, name);
}
