import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from './index';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SYNC_URL = 'http://192.168.92.209:3000/v1/sync';

// ─── Status priority: higher number = "more final" state ─────────────────────
// Server wins if its status is more advanced than the local status.
// Example: Server = COMPLETED (4) vs Local = CANCELLED (5) → Local wins (cancellation is intentional)
// Example: Server = ACCEPTED (2) vs Local = PENDING (1)  → Server wins
const STATUS_PRIORITY: Record<string, number> = {
  PENDING: 1,
  ACCEPTED: 2,
  IN_PROGRESS: 3,
  COMPLETED: 4,
  CANCELLED: 5,
};

/**
 * Conflict resolver called by WatermelonDB when a record exists in both
 * local `updated` and server `updated` changesets simultaneously.
 * Strategy:
 *   - For bookings: use the record with the "higher priority" status.
 *     CANCELLED always wins locally (user's explicit intent).
 *   - For all other tables: server wins (safe default).
 */
function conflictResolver(
  table: string,
  local: Record<string, any>,
  remote: Record<string, any>,
): Record<string, any> {
  if (table === 'bookings') {
    const localStatus = local.status as string;
    const remoteStatus = remote.status as string;

    // If user explicitly cancelled → always honour their intent
    if (localStatus === 'CANCELLED') {
      console.log(
        `[Conflict] Booking ${local.id}: Local=CANCELLED vs Server=${remoteStatus} → keeping CANCELLED`,
      );
      return { ...remote, status: 'CANCELLED' };
    }

    // If server has moved further along (ACCEPTED, IN_PROGRESS, COMPLETED) → server wins
    const localPriority = STATUS_PRIORITY[localStatus] ?? 0;
    const remotePriority = STATUS_PRIORITY[remoteStatus] ?? 0;

    if (remotePriority > localPriority) {
      console.log(
        `[Conflict] Booking ${local.id}: Server(${remoteStatus}) > Local(${localStatus}) → server wins`,
      );
      return remote;
    }

    // Otherwise keep local (user rescheduled, etc.)
    console.log(
      `[Conflict] Booking ${local.id}: Local(${localStatus}) kept over Server(${remoteStatus})`,
    );
    return { ...remote, status: localStatus, scheduled_at: local.scheduled_at };
  }

  // ── Addresses: merge server data but keep local isDefault preference ──────
  if (table === 'addresses') {
    return { ...remote, is_default: local.is_default };
  }

  // ── Default: server wins ──────────────────────────────────────────────────
  return remote;
}

/**
 * XHR-based fetch replacement to avoid Event.NONE crash on physical devices.
 */
function xhrFetch(method: string, url: string, headers: Record<string, string>, body?: string): Promise<{ ok: boolean; status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.timeout = 15000;
    Object.keys(headers).forEach(k => xhr.setRequestHeader(k, headers[k]));
    xhr.onload = () => resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, text: xhr.responseText });
    xhr.onerror = () => reject(new Error(`[Sync] Network error reaching ${SYNC_URL}`));
    xhr.ontimeout = () => reject(new Error(`[Sync] Request timed out`));
    xhr.send(body || null);
  });
}

export async function syncDatabase() {
  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt }) => {
      const token = await AsyncStorage.getItem('provider_token');
      const userId = await AsyncStorage.getItem('provider_id');
      const url = `${SYNC_URL}/pull?lastPulledAt=${lastPulledAt || 0}&userId=${userId || ''}&role=PROVIDER`;
      const headers: Record<string, string> = { 
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await xhrFetch('GET', url, headers);

      if (!response.ok) {
        throw new Error(`[Sync] Pull failed: ${response.status}`);
      }

      const data = JSON.parse(response.text);

      // WatermelonDB's native synchronize() will process the changesets
      // No manual database.write() needed - let WatermelonDB handle it
      return { changes: data.changes, timestamp: data.timestamp };
    },

    pushChanges: async ({ changes, lastPulledAt }) => {
      const token = await AsyncStorage.getItem('provider_token');
      const url = `${SYNC_URL}/push?lastPulledAt=${lastPulledAt || 0}`;
      const headers: Record<string, string> = { 
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await xhrFetch('POST', url, headers, JSON.stringify({ changes, lastPulledAt }));

      if (!response.ok) {
        throw new Error(`[Sync] Push failed: ${response.status}`);
      }
    },

    // ── Conflict resolution ─────────────────────────────────────────────────
    conflictResolver,
  });
}
