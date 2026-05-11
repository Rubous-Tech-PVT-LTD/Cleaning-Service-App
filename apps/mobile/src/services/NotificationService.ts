import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';

// Configure how notifications are displayed when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Legacy support
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  static async registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice || Platform.OS === 'android') { // Allow android emulators for local testing
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.warn('❌ [Notification] Permission not granted!');
        return;
      }
      
      try {
        token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log('✅ [Notification] Push Token:', token);
        await AsyncStorage.setItem('push_token', token);
      } catch (e) {
        console.warn('⚠️ [Notification] Could not get push token (probably emulator/Expo Go issue):', e);
      }
      
      // Send to backend if logged in
      const userId = await AsyncStorage.getItem('user_id');
      if (userId && token) {
        try {
          await api.post('/auth/push-token', { userId, token });
        } catch (e) {
          console.error('❌ [Notification] Backend sync failed:', e);
        }
      }
    } else {
      console.log('ℹ️ [Notification] Physical device recommended for push tokens.');
    }

    return token;
  }

  static async sendLocalNotification(title: string, body: string, data = {}) {
    console.log('🔔 [Notification] Sending local notification:', title);
    // Debug Alert to confirm the function is called
    Alert.alert(title, body);

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
      console.log('✅ [Notification] Notification scheduled successfully');
    } catch (e) {
      console.error('❌ [Notification] Failed to schedule notification:', e);
    }
  }
}
