/**
 * Authentication Service
 * Handles login, logout, and session management
 */

import { API_ENDPOINTS } from '@/constants/api';
import type { LoginResponse, SessionInfoResponse } from '@/types/api';
import { callMethod, setTokenGetter } from '../api/client';
import * as TokenStorage from './tokenStorage';

// ============================================
// Mock Data for Development
// ============================================

const MOCK_ENABLED = __DEV__; // Enable mock in development mode

const MOCK_USERS: Record<string, { password: string; data: LoginResponse }> = {
  // Store Employee
  'store@test.com': {
    password: '123456',
    data: {
      user: 'store@test.com',
      full_name: 'Nguyễn Văn Store',
      roles: ['ESF Store Manager'],
      primary_role: 'ESF Store Manager',
      api_key: 'mock_api_key_store',
      api_secret: 'mock_api_secret_store',
      context: {
        stores: [
          { name: 'DS-00001', store_name: 'Cửa Hàng Quận 1' },
          { name: 'DS-00002', store_name: 'Cửa Hàng Quận 7' },
        ],
      },
    },
  },
  // Farm Owner
  'farm@test.com': {
    password: '123456',
    data: {
      user: 'farm@test.com',
      full_name: 'Trần Văn Farm',
      roles: ['ESF Farm Owner'],
      primary_role: 'ESF Farm Owner',
      api_key: 'mock_api_key_farm',
      api_secret: 'mock_api_secret_farm',
      context: {
        farm_owner: { name: 'FO-00001', owner_name: 'Trần Văn Farm' },
      },
    },
  },
  // Investor
  'investor@test.com': {
    password: '123456',
    data: {
      user: 'investor@test.com',
      full_name: 'Lê Thị Investor',
      roles: ['ESF Investor'],
      primary_role: 'ESF Investor',
      api_key: 'mock_api_key_investor',
      api_secret: 'mock_api_secret_investor',
      context: {
        assigned_stores: [
          { name: 'DS-00001', store_name: 'Cửa Hàng Quận 1' },
          { name: 'DS-00003', store_name: 'Cửa Hàng Bình Thạnh' },
        ],
      },
    },
  },
};

async function mockLogin(username: string, password: string): Promise<LoginResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const user = MOCK_USERS[username.toLowerCase()];

  if (!user || user.password !== password) {
    throw new Error('Invalid username or password');
  }

  console.log('[Auth] Mock login successful:', username);
  return user.data;
}

async function mockGetSessionInfo(): Promise<SessionInfoResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const userData = await TokenStorage.getUserData();
  if (!userData) {
    throw new Error('No session');
  }

  // Find the mock user to get context
  const mockUser = Object.values(MOCK_USERS).find(
    (u) => u.data.user === userData.user
  );

  return {
    user: userData.user,
    full_name: userData.fullName,
    roles: userData.roles,
    primary_role: userData.primaryRole as LoginResponse['primary_role'],
    context: (mockUser?.data.context || userData.context) as LoginResponse['context'],
  };
}

// ============================================
// Auth State Type
// ============================================

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    email: string;
    fullName: string;
    roles: string[];
    primaryRole: string;
    context: LoginResponse['context'];
  } | null;
}

// ============================================
// Public API
// ============================================

/**
 * Initialize the auth service
 * Sets up the token getter for API client
 */
export function initializeAuth(): void {
  setTokenGetter(TokenStorage.getTokens);
}

/**
 * Login with username/email and password
 */
export async function login(
  username: string,
  password: string
): Promise<LoginResponse> {
  let response: LoginResponse;

  if (MOCK_ENABLED) {
    // Try mock login first in dev mode
    try {
      response = await mockLogin(username, password);
    } catch {
      // If mock fails, try real API
      console.log('[Auth] Mock login failed, trying real API...');
      response = await callMethod<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, {
        usr: username,
        pwd: password,
      });
    }
  } else {
    // Production: use real API only
    response = await callMethod<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, {
      usr: username,
      pwd: password,
    });
  }

  // Save tokens securely
  await TokenStorage.saveTokens({
    apiKey: response.api_key,
    apiSecret: response.api_secret,
  });

  // Save user data
  await TokenStorage.saveUserData({
    user: response.user,
    fullName: response.full_name,
    roles: response.roles,
    primaryRole: response.primary_role,
    context: response.context,
  });

  return response;
}

/**
 * Logout - clear all stored data
 */
export async function logout(): Promise<void> {
  await TokenStorage.clearAll();
}

/**
 * Get current session info from server
 * Used to refresh user context on app resume
 */
export async function getSessionInfo(): Promise<SessionInfoResponse> {
  if (MOCK_ENABLED) {
    try {
      return await mockGetSessionInfo();
    } catch {
      // If mock fails, try real API
      return callMethod<SessionInfoResponse>(API_ENDPOINTS.AUTH.SESSION_INFO);
    }
  }

  return callMethod<SessionInfoResponse>(API_ENDPOINTS.AUTH.SESSION_INFO);
}

/**
 * Restore session from stored credentials
 * Returns user data if valid session exists, null otherwise
 */
export async function restoreSession(): Promise<AuthState['user'] | null> {
  // Check if we have stored credentials
  const hasCredentials = await TokenStorage.hasStoredCredentials();
  if (!hasCredentials) {
    return null;
  }

  // Try to get stored user data first (for faster startup)
  const storedUser = await TokenStorage.getUserData();

  try {
    // Validate session with server
    const sessionInfo = await getSessionInfo();

    // Update stored user data with fresh info
    await TokenStorage.saveUserData({
      user: sessionInfo.user,
      fullName: sessionInfo.full_name,
      roles: sessionInfo.roles,
      primaryRole: sessionInfo.primary_role,
      context: sessionInfo.context,
    });

    return {
      email: sessionInfo.user,
      fullName: sessionInfo.full_name,
      roles: sessionInfo.roles,
      primaryRole: sessionInfo.primary_role,
      context: sessionInfo.context,
    };
  } catch (error) {
    // If session validation fails, check if we have stored data
    // This allows offline access with cached data
    if (storedUser) {
      return {
        email: storedUser.user,
        fullName: storedUser.fullName,
        roles: storedUser.roles,
        primaryRole: storedUser.primaryRole,
        context: storedUser.context as LoginResponse['context'],
      };
    }

    // No valid session, clear everything
    await TokenStorage.clearAll();
    return null;
  }
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: AuthState['user'], role: string): boolean {
  return user?.roles.includes(role) ?? false;
}

/**
 * Get the route name for user's primary role
 */
export function getRouteForRole(primaryRole: string): string {
  switch (primaryRole) {
    case 'ESF Store Manager':
      return '/(store-employee)/home';
    case 'ESF Farm Owner':
      return '/(farm-owner)/home';
    case 'ESF Investor':
      return '/(investor)/home';
    default:
      // Fallback to store employee as default
      return '/(store-employee)/home';
  }
}
