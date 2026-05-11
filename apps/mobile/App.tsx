import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { applyWorkarounds } from './src/utils/bootstrap';
import { AppNavigator } from './src/navigation/AppNavigator';
import { syncDatabase } from './src/db/sync';
import { NotificationService } from './src/services/NotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import './src/i18n';

// Apply critical React Native 0.81 bug fixes
applyWorkarounds();

export default function App() {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        const onboardingDone = await AsyncStorage.getItem('onboarding_done');
        const userToken = await AsyncStorage.getItem('user_token');

        if (!onboardingDone) {
          setInitialRoute('Onboarding');
        } else if (userToken) {
          setInitialRoute('Home');
        } else {
          setInitialRoute('Login');
        }
      } catch {
        setInitialRoute('Login');
      }
    };
    initApp();
  }, []);

  useEffect(() => {
    const startSync = async () => {
      try {
        console.log('📡 [Sync] Starting Background Sync...');
        await syncDatabase();
        console.log('✅ [Sync] Sync Complete!');
      } catch (error: any) {
        console.warn('⚠️ [Sync] Skipped:', error?.message);
      }
    };

    NotificationService.registerForPushNotificationsAsync();

    // Initial sync delay
    const initialDelay = setTimeout(startSync, 3000);
    // Periodic sync every minute
    const interval = setInterval(startSync, 60000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, []);

  // Wait until we know the initial route
  if (!initialRoute) return null;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator initialRouteName={initialRoute} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
