import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from './index';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SYNC_URL = 'http://10.0.2.2:3000/v1/sync';

export async function syncDatabase() {
  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt }) => {
      const token = await AsyncStorage.getItem('user_token');
      const response = await fetch(`${SYNC_URL}/pull?lastPulledAt=${lastPulledAt || 0}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to pull changes');
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
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ changes, lastPulledAt })
      });

      if (!response.ok) {
        throw new Error('Failed to push changes');
      }
    },
  });
}
