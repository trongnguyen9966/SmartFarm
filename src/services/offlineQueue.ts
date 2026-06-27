/**
 * Offline Queue Service
 * Saves pending documents to AsyncStorage when offline.
 * Syncs them to the backend when connectivity is restored.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { createDoc, updateDoc } from './api/client';

const QUEUE_KEY = 'esf_offline_queue';

export type QueueAction = 'create' | 'update';

export interface QueuedDoc {
  id: string;
  action: QueueAction;
  doctype: string;
  docname?: string; // only for update
  data: Record<string, unknown>;
  createdAt: string;
  retries: number;
}

// ─── Queue CRUD ───────────────────────────────────────────────────────────────

async function getQueue(): Promise<QueuedDoc[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveQueue(queue: QueuedDoc[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function enqueue(doc: Omit<QueuedDoc, 'id' | 'createdAt' | 'retries'>): Promise<string> {
  const queue = await getQueue();
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  queue.push({
    ...doc,
    id,
    createdAt: new Date().toISOString(),
    retries: 0,
  });
  await saveQueue(queue);
  return id;
}

export async function removeFromQueue(id: string): Promise<void> {
  const queue = await getQueue();
  await saveQueue(queue.filter(q => q.id !== id));
}

export async function getPendingCount(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}

export async function getPendingDocs(): Promise<QueuedDoc[]> {
  return getQueue();
}

// ─── Sync ─────────────────────────────────────────────────────────────────────

export async function syncOne(doc: QueuedDoc): Promise<boolean> {
  try {
    if (doc.action === 'create') {
      await createDoc(doc.doctype, doc.data);
    } else if (doc.action === 'update' && doc.docname) {
      await updateDoc(doc.doctype, doc.docname, doc.data);
    }
    await removeFromQueue(doc.id);
    return true;
  } catch (err) {
    // Increment retry count
    const queue = await getQueue();
    const idx = queue.findIndex(q => q.id === doc.id);
    if (idx >= 0) {
      queue[idx].retries += 1;
      await saveQueue(queue);
    }
    if (__DEV__) console.warn('[OfflineQueue] Sync failed:', doc.doctype, err);
    return false;
  }
}

export async function syncAll(): Promise<{ synced: number; failed: number }> {
  const state = await NetInfo.fetch();
  if (!state.isConnected) return { synced: 0, failed: 0 };

  const queue = await getQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const doc of queue) {
    const ok = await syncOne(doc);
    if (ok) synced++;
    else failed++;
  }

  return { synced, failed };
}

// ─── Save or Sync ─────────────────────────────────────────────────────────────

/**
 * Try to save to backend. If offline, queue for later sync.
 * Returns { synced: true } if saved online, { synced: false, queueId } if queued.
 */
export async function saveOrQueue(params: {
  action: QueueAction;
  doctype: string;
  docname?: string;
  data: Record<string, unknown>;
}): Promise<{ synced: boolean; queueId?: string; result?: unknown }> {
  const state = await NetInfo.fetch();

  if (state.isConnected) {
    try {
      let result: unknown;
      if (params.action === 'create') {
        result = await createDoc(params.doctype, params.data);
      } else if (params.action === 'update' && params.docname) {
        result = await updateDoc(params.doctype, params.docname, params.data);
      }
      return { synced: true, result };
    } catch {
      // If API fails, queue it
      const queueId = await enqueue(params);
      return { synced: false, queueId };
    }
  }

  const queueId = await enqueue(params);
  return { synced: false, queueId };
}
