import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from './index';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SYNC_URL = 'http://192.168.0.199:3000/v1/sync';

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
    return { ...remote, is_default: local.is_default, latitude: local.latitude, longitude: local.longitude };
  }

  // ── Default: server wins ──────────────────────────────────────────────────
  return remote;
}

export async function syncDatabase() {
  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt }) => {
      const token = await AsyncStorage.getItem('user_token');
      const userId = await AsyncStorage.getItem('user_id');
      const queryParams = new URLSearchParams({ lastPulledAt: (lastPulledAt || 0).toString() });
      if (userId && userId !== 'null') queryParams.append('userId', userId);

      const response = await fetch(
        `${SYNC_URL}/pull?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`[Sync] Pull failed: ${response.status}`);
      }

      const data = await response.json();

      // WatermelonDB's native synchronize() will process the changesets
      // No manual database.write() needed - let WatermelonDB handle it
      return { changes: data.changes, timestamp: data.timestamp };
    },

    pushChanges: async ({ changes, lastPulledAt }) => {
      const token = await AsyncStorage.getItem('user_token');
      const response = await fetch(`${SYNC_URL}/push?lastPulledAt=${lastPulledAt || 0}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ changes, lastPulledAt }),
      });

      if (!response.ok) {
        throw new Error(`[Sync] Push failed: ${response.status}`);
      }
    },

    // ── Conflict resolution ─────────────────────────────────────────────────
    conflictResolver,
  });
}
