import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';

export class NotificationService {
  static async registerForPushNotificationsAsync() {
    return null;
  }

  static async sendLocalNotification(title: string, body: string, data = {}) {
  }
}
