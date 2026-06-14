import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './useAuth';
import { useFeatures, usePrimaryRole } from './usePermission';
import { DEFAULT_QUICK_MENU, MAX_QUICK_MENU } from '@/constants/quickMenu';

const storageKey = (user: string) => `quick_menu_${user}`;

export function useQuickMenu() {
  const { currentUser } = useAuth();
  const primaryRole = usePrimaryRole();
  const allFeatures = useFeatures();
  const [quickKeys, setQuickKeys] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!currentUser || !primaryRole) return;
    try {
      const saved = await AsyncStorage.getItem(storageKey(currentUser));
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        setQuickKeys(parsed.filter(k => allFeatures.includes(k)));
      } else {
        const defaults = (DEFAULT_QUICK_MENU[primaryRole] ?? [])
          .filter(k => allFeatures.includes(k))
          .slice(0, MAX_QUICK_MENU);
        setQuickKeys(defaults);
      }
    } catch {
      // ignore storage errors
    } finally {
      setLoaded(true);
    }
  }, [currentUser, primaryRole, allFeatures]);

  // Load saved quick menu or fall back to role defaults
  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, primaryRole]);

  const persist = useCallback(async (keys: string[]) => {
    if (!currentUser) return;
    setQuickKeys(keys);
    await AsyncStorage.setItem(storageKey(currentUser), JSON.stringify(keys));
  }, [currentUser]);

  /**
   * Toggle a feature key on/off.
   * Returns 'max' if already at MAX_QUICK_MENU and trying to enable — caller must show Alert.
   * Returns 'ok' on success.
   */
  const toggle = useCallback(async (key: string): Promise<'ok' | 'max'> => {
    if (quickKeys.includes(key)) {
      await persist(quickKeys.filter(k => k !== key));
      return 'ok';
    }
    if (quickKeys.length >= MAX_QUICK_MENU) {
      return 'max';
    }
    await persist([...quickKeys, key]);
    return 'ok';
  }, [quickKeys, persist]);

  return { quickKeys, toggle, reload: load, loaded, allFeatures };
}
