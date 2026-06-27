/**
 * Cultivation Master Resource API
 */

import type { CultivationMaster } from '@/types/models';
import { getDoc, getList } from '../client';

const DOCTYPE = 'Cultivation Master';

export async function list(params?: {
  fields?: string[];
  filters?: Array<[string, string, unknown]>;
  limit_start?: number;
  limit_page_length?: number;
  order_by?: string;
}): Promise<CultivationMaster[]> {
  return getList<CultivationMaster>(DOCTYPE, {
    ...params,
  });
}

export async function get(name: string): Promise<CultivationMaster> {
  return getDoc<CultivationMaster>(DOCTYPE, name);
}
