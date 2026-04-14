/**
 * Storage Service
 * 
 * Abstraction layer for storing data locally.
 * Uses AsyncStorage on native, localStorage on web.
 * Falls back to in-memory storage if neither available.
 */

interface IStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

// In-memory fallback storage
const memoryStore = new Map<string, string>();

class MemoryStorage implements IStorage {
  async getItem(key: string): Promise<string | null> {
    return memoryStore.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    memoryStore.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    memoryStore.delete(key);
  }
}

// Try to use AsyncStorage if available, fall back to memory
let storage: IStorage = new MemoryStorage();

try {
  // Try dynamic import for AsyncStorage
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  if (AsyncStorage) {
    storage = AsyncStorage;
  }
} catch (e) {
  // AsyncStorage not available, use memory storage
  console.log('[Storage] AsyncStorage not available, using in-memory storage');
}

// Try to use localStorage on web
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  class WebStorage implements IStorage {
    async getItem(key: string): Promise<string | null> {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.error('[WebStorage] getItem error:', e);
        return null;
      }
    }

    async setItem(key: string, value: string): Promise<void> {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.error('[WebStorage] setItem error:', e);
      }
    }

    async removeItem(key: string): Promise<void> {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error('[WebStorage] removeItem error:', e);
      }
    }
  }

  storage = new WebStorage();
}

export const Storage = storage;
