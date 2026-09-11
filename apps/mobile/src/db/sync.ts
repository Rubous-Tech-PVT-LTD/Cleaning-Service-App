import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from './index';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SYNC_URL = 'http://192.168.234.209:3000/v1/sync';

let isSyncing = false;
let pendingSyncRequested = false;

const STATUS_PRIORITY: Record<string, number> = {
  PENDING: 1,
  ACCEPTED: 2,
  IN_PROGRESS: 3,
  COMPLETED: 4,
  CANCELLED: 5,
};

function conflictResolver(
  table: string,
  local: Record<string, any>,
  remote: Record<string, any>,
): Record<string, any> {
  if (table === 'bookings') {
    const localStatus = local.status as string;
    const remoteStatus = remote.status as string;

    if (localStatus === 'CANCELLED') {
      return { ...remote, status: 'CANCELLED' };
    }

    const localPriority = STATUS_PRIORITY[localStatus] ?? 0;
    const remotePriority = STATUS_PRIORITY[remoteStatus] ?? 0;

    if (remotePriority > localPriority) {
      return remote;
    }

    return { ...remote, status: localStatus, scheduled_at: local.scheduled_at };
  }

  if (table === 'addresses') {
    return { ...remote, is_default: local.is_default, latitude: local.latitude, longitude: local.longitude };
  }

  return remote;
}

export async function syncDatabase() {
  if (isSyncing) {
    pendingSyncRequested = true;
    return;
  }

  isSyncing = true;
  pendingSyncRequested = false;

  try {
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

      conflictResolver,
    });
  } finally {
    isSyncing = false;

    if (pendingSyncRequested) {
      pendingSyncRequested = false;
      syncDatabase().catch(err => {});
    }
  }
}
