/**
 * Hook for Store Employee Dashboard data
 */

import { useState, useEffect, useCallback } from 'react';
import type { StoreDashboardResponse } from '@/types/api';
import * as storeApi from '@/services/api/store';
import { mockDashboard } from '@/services/mock/storeData';

const MOCK_ENABLED = __DEV__;

interface UseStoreDashboardResult {
  data: StoreDashboardResponse | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useStoreDashboard(): UseStoreDashboardResult {
  const [data, setData] = useState<StoreDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (MOCK_ENABLED) {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 800));
        setData(mockDashboard);
      } else {
        const response = await storeApi.getDashboard();
        setData(response);
      }
    } catch (err) {
      console.error('[useStoreDashboard] Error:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch dashboard'));

      // Fallback to mock data in dev mode
      if (MOCK_ENABLED) {
        setData(mockDashboard);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchData,
  };
}
