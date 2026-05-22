/**
 * Frappe Provider for React Native
 * Uses frappe-js-sdk with token-based authentication
 */

import React, { createContext, useContext, useMemo, useRef, useCallback } from 'react';
import { FrappeApp } from 'frappe-js-sdk';
import { API_BASE_URL } from '@/constants/api';

// ============================================
// Types
// ============================================

interface TokenParams {
  useToken: boolean;
  token: () => string;
  type: 'Bearer' | 'token';
}

interface FrappeContextValue {
  url: string;
  app: FrappeApp | null;
  tokenRef: React.MutableRefObject<string | null>;
  setToken: (token: string | null) => void;
  call: <T>(method: string, params?: Record<string, unknown>) => Promise<T>;
  db: {
    getDoc: <T>(doctype: string, name: string) => Promise<T>;
    getDocList: <T>(doctype: string, params?: DocListParams) => Promise<T[]>;
    createDoc: <T>(doctype: string, doc: Partial<T>) => Promise<T>;
    updateDoc: <T>(doctype: string, name: string, doc: Partial<T>) => Promise<T>;
    deleteDoc: (doctype: string, name: string) => Promise<void>;
  };
}

interface DocListParams {
  fields?: string[];
  filters?: Array<[string, string, unknown]>;
  orderBy?: { field: string; order?: 'asc' | 'desc' };
  limit_start?: number;
  limit?: number;
}

// ============================================
// Context
// ============================================

const FrappeContext = createContext<FrappeContextValue | null>(null);

// ============================================
// Provider
// ============================================

interface FrappeProviderProps {
  children: React.ReactNode;
  url?: string;
}

export function FrappeProvider({ children, url = API_BASE_URL }: FrappeProviderProps) {
  // Store token in a ref so it can be accessed synchronously
  const tokenRef = useRef<string | null>(null);

  // Token getter function for FrappeApp
  const getToken = useCallback(() => {
    return tokenRef.current || '';
  }, []);

  // Create FrappeApp instance with token-based auth
  const app = useMemo(() => {
    const tokenParams: TokenParams = {
      useToken: true,
      token: getToken,
      type: 'token', // Frappe uses "token api_key:api_secret" format
    };

    return new FrappeApp(url, tokenParams);
  }, [url, getToken]);

  // Set token function
  const setToken = useCallback((token: string | null) => {
    tokenRef.current = token;
    if (__DEV__) {
      console.log('[Frappe] Token updated:', token ? 'SET' : 'CLEARED');
    }
  }, []);

  // Call method wrapper
  const call = useCallback(async <T,>(method: string, params?: Record<string, unknown>): Promise<T> => {
    if (__DEV__) {
      console.log('[Frappe] Calling method:', method);
    }
    const response = await app.call().post<T>(method, params);
    return response;
  }, [app]);

  // Database operations wrapper
  const db = useMemo(() => ({
    getDoc: async <T,>(doctype: string, name: string): Promise<T> => {
      if (__DEV__) {
        console.log('[Frappe] getDoc:', doctype, name);
      }
      return app.db().getDoc<T>(doctype, name);
    },

    getDocList: async <T,>(doctype: string, params?: DocListParams): Promise<T[]> => {
      if (__DEV__) {
        console.log('[Frappe] getDocList:', doctype, params);
      }
      return app.db().getDocList<T>(doctype, {
        fields: params?.fields as never,
        filters: params?.filters as never,
        orderBy: params?.orderBy,
        limit_start: params?.limit_start,
        limit: params?.limit,
      });
    },

    createDoc: async <T,>(doctype: string, doc: Partial<T>): Promise<T> => {
      if (__DEV__) {
        console.log('[Frappe] createDoc:', doctype);
      }
      return app.db().createDoc<T>(doctype, doc as T);
    },

    updateDoc: async <T,>(doctype: string, name: string, doc: Partial<T>): Promise<T> => {
      if (__DEV__) {
        console.log('[Frappe] updateDoc:', doctype, name);
      }
      return app.db().updateDoc<T>(doctype, name, doc as T);
    },

    deleteDoc: async (doctype: string, name: string): Promise<void> => {
      if (__DEV__) {
        console.log('[Frappe] deleteDoc:', doctype, name);
      }
      await app.db().deleteDoc(doctype, name);
    },
  }), [app]);

  const value: FrappeContextValue = {
    url,
    app,
    tokenRef,
    setToken,
    call,
    db,
  };

  return (
    <FrappeContext.Provider value={value}>
      {children}
    </FrappeContext.Provider>
  );
}

// ============================================
// Hooks
// ============================================

/**
 * Hook to access Frappe SDK context
 */
export function useFrappe() {
  const context = useContext(FrappeContext);
  if (!context) {
    throw new Error('useFrappe must be used within a FrappeProvider');
  }
  return context;
}

/**
 * Hook to call Frappe methods
 */
export function useFrappeCall<T = unknown>(method: string) {
  const { call } = useFrappe();

  const callMethod = useCallback(
    async (params?: Record<string, unknown>): Promise<T> => {
      return call<T>(method, params);
    },
    [call, method]
  );

  return { call: callMethod };
}

/**
 * Hook to get a document
 */
export function useFrappeGetDoc<T = unknown>(doctype: string, name: string) {
  const { db } = useFrappe();

  const getDoc = useCallback(async (): Promise<T> => {
    return db.getDoc<T>(doctype, name);
  }, [db, doctype, name]);

  return { getDoc };
}

/**
 * Hook to get a list of documents
 */
export function useFrappeGetDocList<T = unknown>(doctype: string) {
  const { db } = useFrappe();

  const getDocList = useCallback(
    async (params?: DocListParams): Promise<T[]> => {
      return db.getDocList<T>(doctype, params);
    },
    [db, doctype]
  );

  return { getDocList };
}

export { FrappeContext };
