/**
 * Sales Order Resource API
 */

import type { SalesOrder } from '@/types/models';
import { getList, getDoc, createDoc, submitDoc } from '../client';

const DOCTYPE = 'Sales Order';

export async function list(params?: {
  fields?: string[];
  filters?: Array<[string, string, unknown]>;
  limit_start?: number;
  limit_page_length?: number;
  order_by?: string;
}): Promise<SalesOrder[]> {
  return getList<SalesOrder>(DOCTYPE, {
    ...params,
  });
}

export async function get(name: string): Promise<SalesOrder> {
  return getDoc<SalesOrder>(DOCTYPE, name);
}

export async function create(data: Partial<SalesOrder>): Promise<SalesOrder> {
  return createDoc<SalesOrder>(DOCTYPE, data);
}

export async function submit(name: string): Promise<SalesOrder> {
  return submitDoc<SalesOrder>(DOCTYPE, name);
}
