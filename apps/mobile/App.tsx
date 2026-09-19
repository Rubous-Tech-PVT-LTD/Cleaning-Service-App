import React, { useEffect, useState, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { applyWorkarounds } from './src/utils/bootstrap';
import { AppNavigator } from './src/navigation/AppNavigator';
import { syncDatabase } from './src/db/sync';
import { database } from './src/db';
import { io } from 'socket.io-client';
import { SOCKET_URL } from './src/api';
import { NotificationService } from './src/services/NotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokenStorage } from './src/utils/tokenStorage';

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

applyWorkarounds();

const AppContent = () => {
  const { isAuthenticated, isGuest, isLoading, user } = useAuth();
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
    });
  }, []);

  useEffect(() => {
    const startSync = async () => {
      try {
        await syncDatabase();
      } catch (error: any) {
      }
    };

    const initialDelay = setTimeout(startSync, 3000);
    const interval = setInterval(startSync, 60000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    let socket: any = null;
    let reconnectTimer: NodeJS.Timeout | null = null;

    const connectSocket = async () => {
      const token = await tokenStorage.getAccessToken();
      if (!token) return;

      if (socket) {
        socket.disconnect();
      }

      socket = io(SOCKET_URL, {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      socket.on('connect', () => {
        socket.emit('register', { userId: user.id, role: 'CLIENT' });
      });

      socket.on('sync_ping', () => {
        syncDatabase().catch((err) => {});
      });

      socket.on('booking_status_changed', async (payload: { bookingId: string, offlineId?: string, status: string, otp?: string, updatedAt?: string }) => {
        try {
          const bookingsCollection = database.collections.get('bookings');
          const targetId = payload.offlineId || payload.bookingId;
          const booking = await bookingsCollection.find(targetId);
          
          await database.write(async () => {
            await booking.update((b: any) => {
              b.status = payload.status;
              if (payload.otp) {
                b.otp = payload.otp;
              }
              if (payload.updatedAt) {
                b.updatedAt = new Date(payload.updatedAt);
              }
            });
          });
        } catch (err) {
        }
      });

      socket.on('booking_accepted', async (payload: any) => {
        syncDatabase().catch((err) => {});
      });

      socket.on('disconnect', () => {
        if (isAuthenticated) {
          reconnectTimer = setTimeout(connectSocket, 2000);
        }
      });
    };

    connectSocket();

    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
  }, []);

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
