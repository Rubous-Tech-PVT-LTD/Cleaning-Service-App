import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, 
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  static async registerForPushNotificationsAsync() {
    let token: string | undefined;

    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        }).catch(() => {});
      }

      if (Device.isDevice || Platform.OS === 'android') {
        const { status: existingStatus } = await Notifications.getPermissionsAsync().catch(() => ({ status: 'undetermined' }));
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const res = await Notifications.requestPermissionsAsync().catch(() => ({ status: 'denied' }));
          finalStatus = res.status;
        }
        if (finalStatus !== 'granted') {
          return undefined;
        }

        try {
          const pushTokenData = await Notifications.getExpoPushTokenAsync();
          token = pushTokenData?.data;
          if (token) {
            await AsyncStorage.setItem('push_token', token);
          }
        } catch (e) {
          // Expo Go on Android SDK 53+ does not support remote push tokens
        }

        const userId = await AsyncStorage.getItem('user_id');
        if (userId && token) {
          try {
            await api.post('/auth/push-token', { userId, token });
          } catch (e) {
          }
        }
      }
    } catch (err) {
      // Graceful fallback for simulator / Expo Go
    }

    return token;
  }

  static async sendLocalNotification(title: string, body: string, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: null,
      });
    } catch (e) {
    }
  }
}
