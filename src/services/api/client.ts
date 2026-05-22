/**
 * API Client
 * Base HTTP client for Frappe REST API
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/constants/api';
import type { ApiResponse, ApiError } from '@/types/api';

// Token getter function - will be set by auth service
let getAuthToken: (() => Promise<{ apiKey: string; apiSecret: string } | null>) | null = null;

export const setTokenGetter = (
  getter: () => Promise<{ apiKey: string; apiSecret: string } | null>
) => {
  getAuthToken = getter;
};

// Log API configuration in development
if (__DEV__) {
  console.log('[API] Base URL:', API_BASE_URL);
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor - add auth header and logging
apiClient.interceptors.request.use(
  async (config) => {
    if (getAuthToken) {
      const tokens = await getAuthToken();
      if (tokens) {
        config.headers.Authorization = `token ${tokens.apiKey}:${tokens.apiSecret}`;
      }
    }

    if (__DEV__) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
      console.tron?.display({
        name: 'API REQUEST',
        value: { method: config.method?.toUpperCase(), url: config.url, data: config.data },
        preview: `${config.method?.toUpperCase()} ${config.url}`,
      });
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors and logging
apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`[API] Response ${response.status}:`, response.config.url);
      console.tron?.display({
        name: 'API RESPONSE',
        value: { status: response.status, url: response.config.url, data: response.data },
        preview: `${response.status} ${response.config.url}`,
        important: false,
      });
    }
    return response;
  },
  (error: AxiosError<ApiError>) => {
    const status = error.response?.status;

    if (__DEV__) {
      console.error(`[API] Error ${status}:`, error.config?.url);
      console.error('[API] Error details:', error.message);
      if (error.response?.data) {
        console.error('[API] Response data:', JSON.stringify(error.response.data, null, 2));
      }
      console.tron?.display({
        name: 'API ERROR',
        value: { status, url: error.config?.url, message: error.message, data: error.response?.data },
        preview: `${status} ${error.config?.url}`,
        important: true,
      });
    }

    // Parse server messages for validation errors
    if (status === 417 && error.response?.data?._server_messages) {
      try {
        const messages = JSON.parse(error.response.data._server_messages);
        const parsedMessages = messages.map((msg: string) => {
          try {
            return JSON.parse(msg).message;
          } catch {
            return msg;
          }
        });
        error.message = parsedMessages.join('\n');
      } catch {
        // Keep original error message
      }
    }

    return Promise.reject(error);
  }
);

// ============================================
// API Methods
// ============================================

/**
 * Call a Frappe RPC method (POST /api/method/...)
 */
export async function callMethod<T>(
  method: string,
  params?: Record<string, unknown>
): Promise<T> {
  const response = await apiClient.post<ApiResponse<T>>(method, params);
  return response.data.message;
}

/**
 * Get a list of documents
 */
export async function getList<T>(
  doctype: string,
  params?: {
    fields?: string[];
    filters?: Array<[string, string, unknown]>;
    order_by?: string;
    limit_start?: number;
    limit_page_length?: number;
  }
): Promise<T[]> {
  const queryParams: Record<string, string> = {};

  if (params?.fields) {
    queryParams.fields = JSON.stringify(params.fields);
  }
  if (params?.filters) {
    queryParams.filters = JSON.stringify(params.filters);
  }
  if (params?.order_by) {
    queryParams.order_by = params.order_by;
  }
  if (params?.limit_start !== undefined) {
    queryParams.limit_start = String(params.limit_start);
  }
  if (params?.limit_page_length !== undefined) {
    queryParams.limit_page_length = String(params.limit_page_length);
  }

  const response = await apiClient.get<{ data: T[] }>(`/api/resource/${doctype}`, {
    params: queryParams,
  });

  return response.data.data;
}

/**
 * Get a single document by name
 */
export async function getDoc<T>(doctype: string, name: string): Promise<T> {
  const response = await apiClient.get<{ data: T }>(`/api/resource/${doctype}/${name}`);
  return response.data.data;
}

/**
 * Create a new document
 */
export async function createDoc<T>(doctype: string, data: Partial<T>): Promise<T> {
  const response = await apiClient.post<{ data: T }>(`/api/resource/${doctype}`, data);
  return response.data.data;
}

/**
 * Update an existing document
 */
export async function updateDoc<T>(
  doctype: string,
  name: string,
  data: Partial<T>
): Promise<T> {
  const response = await apiClient.put<{ data: T }>(`/api/resource/${doctype}/${name}`, data);
  return response.data.data;
}

/**
 * Delete a document
 */
export async function deleteDoc(doctype: string, name: string): Promise<void> {
  await apiClient.delete(`/api/resource/${doctype}/${name}`);
}

/**
 * Submit a document (change docstatus to 1)
 */
export async function submitDoc<T>(doctype: string, name: string): Promise<T> {
  return callMethod<T>('frappe.client.submit', {
    doc: { doctype, name },
  });
}

/**
 * Upload a file
 */
export async function uploadFile(
  file: {
    uri: string;
    name: string;
    type: string;
  },
  options?: {
    doctype?: string;
    docname?: string;
    fieldname?: string;
    isPrivate?: boolean;
  }
): Promise<{ file_url: string; name: string }> {
  const formData = new FormData();

  formData.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);

  if (options?.doctype) formData.append('doctype', options.doctype);
  if (options?.docname) formData.append('docname', options.docname);
  if (options?.fieldname) formData.append('fieldname', options.fieldname);
  if (options?.isPrivate) formData.append('is_private', '1');

  const response = await apiClient.post<{ message: { file_url: string; name: string } }>(
    '/api/method/upload_file',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data.message;
}

// Export the raw client for advanced use cases
export { apiClient };
