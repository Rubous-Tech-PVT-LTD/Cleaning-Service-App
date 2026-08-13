import React, { useEffect, useState, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { applyWorkarounds } from './src/utils/bootstrap';
import { AppNavigator } from './src/navigation/AppNavigator';
import { syncDatabase } from './src/db/sync';
import { NotificationService } from './src/services/NotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import './src/i18n';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { fetchSupportedCities } from './src/services/locationService';

// Apply critical React Native 0.81 bug fixes
applyWorkarounds();

const AppContent = () => {
  const { isAuthenticated, isGuest, isLoading } = useAuth();
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    const initApp = async () => {
      try {
        const onboardingDone = await AsyncStorage.getItem('onboarding_done');

        if (!onboardingDone) {
          setInitialRoute('Onboarding');
        } else if (isAuthenticated || isGuest) {
          setInitialRoute('Home');
        } else {
          setInitialRoute('Login');
        }
      } catch {
        setInitialRoute('Login');
      }
    };
    
    if (!isLoading) {
      initApp();
    }
  }, [isAuthenticated, isGuest, isLoading]);

  useEffect(() => {
    fetchSupportedCities().catch((error) => {
      console.warn('[Location] Could not prefetch supported cities:', error?.message);
    });
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

    // Initial sync delay
    const initialDelay = setTimeout(startSync, 3000);
    // Periodic sync every minute
    const interval = setInterval(startSync, 60000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, []);

  // 🔔 Global: handle tap on push notification (works from background + killed state)
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as any;
        if (data?.bookingId && navigationRef.current) {
          // Small delay to ensure navigation container is ready
          setTimeout(() => {
            navigationRef.current?.navigate('BookingDetail', {
              bookingId: data.bookingId,
            });
          }, 500);
        }
      },
    );
    return () => subscription.remove();
  }, []);

  // Wait until we know the initial route and fonts are loaded
  if (!initialRoute || !fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <AppNavigator initialRouteName={initialRoute} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
