/**
 * Hook for Store Employee Dashboard data
 * Uses frappe-react-sdk's useFrappeGetCall
 */

import { useFrappeGetCall } from 'frappe-react-sdk';
import type { StoreDashboardResponse } from '@/types/api';

interface UseStoreDashboardResult {
  data: StoreDashboardResponse | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useStoreDashboard(): UseStoreDashboardResult {
  const { data, error, isLoading, mutate } = useFrappeGetCall<{ message: StoreDashboardResponse }>(
    'esf.api.store.get_dashboard',
  );

  const refresh = async () => {
    await mutate();
  };

  return {
    data: data?.message ?? null,
    isLoading,
    error: error ? new Error(error.message ?? 'Failed to fetch dashboard') : null,
    refresh,
  };
}
