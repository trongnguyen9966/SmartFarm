/**
 * File Service using frappe-react-sdk
 * Provides hooks for file upload and API calls
 */

import { useFrappeFileUpload, FrappeContext } from 'frappe-react-sdk';
import { useCallback, useContext } from 'react';

// ============================================
// Types
// ============================================

export interface FileUploadArgs {
  /** Make the file private (default: false) */
  isPrivate?: boolean;
  /** Folder path (default: "Home") */
  folder?: string;
  /** Associated doctype */
  doctype?: string;
  /** Document name (required if doctype is provided) */
  docname?: string;
  /** Field name in the document to link the file */
  fieldname?: string;
}

export interface UploadedFile {
  name: string;
  file_name: string;
  file_url: string;
  is_private: number;
  file_size: number;
}

export interface UploadProgress {
  completed: number;
  total: number;
  percentage: number;
}

// ============================================
// useFileUpload Hook
// ============================================

/**
 * Hook for uploading files to Frappe backend
 * Uses frappe-react-sdk's useFrappeFileUpload under the hood
 *
 * @example
 * ```tsx
 * const { upload, progress, loading, error, reset } = useFileUpload();
 *
 * const handleUpload = async (file: File) => {
 *   try {
 *     const result = await upload(file, {
 *       doctype: 'Item',
 *       docname: 'ITEM-001',
 *       fieldname: 'image',
 *       isPrivate: false,
 *     });
 *     console.log('Uploaded:', result.file_url);
 *   } catch (err) {
 *     console.error('Upload failed:', err);
 *   }
 * };
 * ```
 */
export function useFileUpload() {
  const {
    upload: frappeUpload,
    progress,
    loading,
    error,
    reset,
    isCompleted,
  } = useFrappeFileUpload();

  /**
   * Upload a file to Frappe
   * @param file - File object or React Native file object { uri, name, type }
   * @param args - Upload options
   * Note: Use the `progress` value from the hook return to track upload progress
   */
  const upload = useCallback(
    async (
      file: File | { uri: string; name: string; type: string },
      args?: FileUploadArgs
    ): Promise<UploadedFile> => {
      const fileArgs = {
        isPrivate: args?.isPrivate ?? false,
        folder: args?.folder ?? 'Home',
        doctype: args?.doctype,
        docname: args?.docname,
        fieldname: args?.fieldname,
      };

      const result = await frappeUpload(file as File, fileArgs);

      return result as unknown as UploadedFile;
    },
    [frappeUpload]
  );

  return {
    upload,
    progress,
    loading,
    error,
    reset,
    isCompleted,
  };
}

// ============================================
// useFrappeApi Hook
// ============================================

/**
 * Hook for making API calls to Frappe backend
 * Provides get, post, put, delete methods
 *
 * @example
 * ```tsx
 * const { call } = useFrappeApi();
 *
 * // GET request
 * const data = await call.get('frappe.client.get', {
 *   doctype: 'Item',
 *   name: 'ITEM-001',
 * });
 *
 * // POST request
 * const result = await call.post('frappe.client.insert', {
 *   doc: { doctype: 'Item', item_name: 'New Item' },
 * });
 * ```
 */
export function useFrappeApi() {
  const context = useContext(FrappeContext);

  if (!context) {
    throw new Error('useFrappeApi must be used within a FrappeProvider');
  }

  const { call: frappeCall } = context;

  /**
   * Make a GET request to a Frappe method
   */
  const get = useCallback(
    async <T = unknown>(method: string, params?: Record<string, unknown>): Promise<T> => {
      const result = await frappeCall.get<T>(method, params);
      return result;
    },
    [frappeCall]
  );

  /**
   * Make a POST request to a Frappe method
   */
  const post = useCallback(
    async <T = unknown>(method: string, params?: Record<string, unknown>): Promise<T> => {
      const result = await frappeCall.post<T>(method, params);
      return result;
    },
    [frappeCall]
  );

  /**
   * Make a PUT request to a Frappe method
   */
  const put = useCallback(
    async <T = unknown>(method: string, params?: Record<string, unknown>): Promise<T> => {
      const result = await frappeCall.put<T>(method, params);
      return result;
    },
    [frappeCall]
  );

  /**
   * Make a DELETE request to a Frappe method
   */
  const del = useCallback(
    async <T = unknown>(method: string, params?: Record<string, unknown>): Promise<T> => {
      const result = await frappeCall.delete<T>(method, params);
      return result;
    },
    [frappeCall]
  );

  return {
    call: {
      get,
      post,
      put,
      delete: del,
    },
  };
}

// ============================================
// useFrappeDocument Hook
// ============================================

/**
 * Hook for document operations using Frappe API
 *
 * @example
 * ```tsx
 * const { getDoc, createDoc, updateDoc, deleteDoc } = useFrappeDocument();
 *
 * // Get a document
 * const item = await getDoc('Item', 'ITEM-001');
 *
 * // Create a document
 * const newItem = await createDoc('Item', { item_name: 'New Item' });
 *
 * // Update a document
 * await updateDoc('Item', 'ITEM-001', { item_name: 'Updated Name' });
 *
 * // Delete a document
 * await deleteDoc('Item', 'ITEM-001');
 * ```
 */
export function useFrappeDocument() {
  const { call } = useFrappeApi();

  /**
   * Get a single document
   */
  const getDoc = useCallback(
    async <T = unknown>(doctype: string, name: string): Promise<T> => {
      return call.get<T>('frappe.client.get', { doctype, name });
    },
    [call]
  );

  /**
   * Get a list of documents
   */
  const getList = useCallback(
    async <T = unknown>(
      doctype: string,
      options?: {
        fields?: string[];
        filters?: Record<string, unknown> | Array<[string, string, unknown]>;
        orderBy?: string;
        limitStart?: number;
        limitPageLength?: number;
      }
    ): Promise<T[]> => {
      return call.post<T[]>('frappe.client.get_list', {
        doctype,
        fields: options?.fields,
        filters: options?.filters,
        order_by: options?.orderBy,
        limit_start: options?.limitStart,
        limit_page_length: options?.limitPageLength,
      });
    },
    [call]
  );

  /**
   * Create a new document
   */
  const createDoc = useCallback(
    async <T = unknown>(doctype: string, data: Record<string, unknown>): Promise<T> => {
      return call.post<T>('frappe.client.insert', {
        doc: { doctype, ...data },
      });
    },
    [call]
  );

  /**
   * Update an existing document
   */
  const updateDoc = useCallback(
    async <T = unknown>(
      doctype: string,
      name: string,
      data: Record<string, unknown>
    ): Promise<T> => {
      return call.post<T>('frappe.client.set_value', {
        doctype,
        name,
        fieldname: data,
      });
    },
    [call]
  );

  /**
   * Delete a document
   */
  const deleteDoc = useCallback(
    async (doctype: string, name: string): Promise<void> => {
      await call.post('frappe.client.delete', { doctype, name });
    },
    [call]
  );

  /**
   * Submit a document
   */
  const submitDoc = useCallback(
    async <T = unknown>(doctype: string, name: string): Promise<T> => {
      return call.post<T>('frappe.client.submit', {
        doc: { doctype, name },
      });
    },
    [call]
  );

  /**
   * Cancel a submitted document
   */
  const cancelDoc = useCallback(
    async <T = unknown>(doctype: string, name: string): Promise<T> => {
      return call.post<T>('frappe.client.cancel', {
        doctype,
        name,
      });
    },
    [call]
  );

  return {
    getDoc,
    getList,
    createDoc,
    updateDoc,
    deleteDoc,
    submitDoc,
    cancelDoc,
  };
}
