/**
 * Token Storage Service
 * Securely stores authentication tokens using expo-secure-store
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { Storage } from '../storage';

const STORAGE_KEYS = {
  API_KEY: 'esf_api_key',
  API_SECRET: 'esf_api_secret',
  USER_DATA: 'esf_user_data',
  CRED_USR: 'esf_cred_usr',
  CRED_PWD: 'esf_cred_pwd',
  SESSION_INFO: 'esf_session_info',
} as const;

// Check if secure store is available (not available on web)
const isSecureStoreAvailable = Platform.OS !== 'web';

/**
 * Save a value securely
 */
async function saveSecure(key: string, value: string): Promise<void> {
  if (isSecureStoreAvailable) {
    await SecureStore.setItemAsync(key, value);
  } else {
    // Fallback to regular storage on web
    await Storage.setItem(key, value);
  }
}

/**
 * Get a value securely
 */
async function getSecure(key: string): Promise<string | null> {
  if (isSecureStoreAvailable) {
    return SecureStore.getItemAsync(key);
  } else {
    return Storage.getItem(key);
  }
}

/**
 * Delete a value securely
 */
async function deleteSecure(key: string): Promise<void> {
  if (isSecureStoreAvailable) {
    await SecureStore.deleteItemAsync(key);
  } else {
    await Storage.removeItem(key);
  }
}

// ============================================
// Public API
// ============================================

export interface AuthTokens {
  apiKey: string;
  apiSecret: string;
}

export interface StoredUserData {
  user: string;
  fullName: string;
  roles: string[];
  primaryRole: string;
  context: unknown;
}

/**
 * Save authentication tokens
 */
export async function saveTokens(tokens: AuthTokens): Promise<void> {
  await Promise.all([
    saveSecure(STORAGE_KEYS.API_KEY, tokens.apiKey),
    saveSecure(STORAGE_KEYS.API_SECRET, tokens.apiSecret),
  ]);
}

/**
 * Get stored authentication tokens
 */
export async function getTokens(): Promise<AuthTokens | null> {
  const [apiKey, apiSecret] = await Promise.all([
    getSecure(STORAGE_KEYS.API_KEY),
    getSecure(STORAGE_KEYS.API_SECRET),
  ]);

  if (apiKey && apiSecret) {
    return { apiKey, apiSecret };
  }

  return null;
}

/**
 * Clear authentication tokens
 */
export async function clearTokens(): Promise<void> {
  await Promise.all([
    deleteSecure(STORAGE_KEYS.API_KEY),
    deleteSecure(STORAGE_KEYS.API_SECRET),
  ]);
}

/**
 * Save user data (non-sensitive)
 */
export async function saveUserData(data: StoredUserData): Promise<void> {
  await Storage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data));
}

/**
 * Get stored user data
 */
export async function getUserData(): Promise<StoredUserData | null> {
  const data = await Storage.getItem(STORAGE_KEYS.USER_DATA);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Clear user data
 */
export async function clearUserData(): Promise<void> {
  await Storage.removeItem(STORAGE_KEYS.USER_DATA);
}

/**
 * Save login credentials securely (for cookie-based re-login)
 */
export async function saveCredentials(username: string, password: string): Promise<void> {
  await Promise.all([
    saveSecure(STORAGE_KEYS.CRED_USR, username),
    saveSecure(STORAGE_KEYS.CRED_PWD, password),
  ]);
}

/**
 * Get stored login credentials
 */
export async function getCredentials(): Promise<{ username: string; password: string } | null> {
  const [username, password] = await Promise.all([
    getSecure(STORAGE_KEYS.CRED_USR),
    getSecure(STORAGE_KEYS.CRED_PWD),
  ]);

  if (username && password) {
    return { username, password };
  }
  return null;
}

/**
 * Clear stored credentials
 */
export async function clearCredentials(): Promise<void> {
  await Promise.all([
    deleteSecure(STORAGE_KEYS.CRED_USR),
    deleteSecure(STORAGE_KEYS.CRED_PWD),
  ]);
}

/**
 * Clear all auth data (tokens + credentials + user data)
 */
export async function clearAll(): Promise<void> {
  await Promise.all([clearTokens(), clearCredentials(), clearUserData()]);
}

/**
 * Check if user has stored credentials
 */
export async function hasStoredCredentials(): Promise<boolean> {
  const creds = await getCredentials();
  return creds !== null;
}

/**
 * Save session info (roles, permissions, primary_role)
 */
export async function saveSessionInfo(data: unknown): Promise<void> {
  await Storage.setItem(STORAGE_KEYS.SESSION_INFO, JSON.stringify(data));
}

/**
 * Get stored session info
 */
export async function getSessionInfo(): Promise<unknown | null> {
  const data = await Storage.getItem(STORAGE_KEYS.SESSION_INFO);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Clear stored session info
 */
export async function clearSessionInfo(): Promise<void> {
  await Storage.removeItem(STORAGE_KEYS.SESSION_INFO);
}
