import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';
import { Alert } from 'react-native';

import api, { SOCKET_URL } from '../api';
import { tokenStorage } from '../utils/tokenStorage';
type BookingContextValue = {
  bookings: any[];
  setBookings: React.Dispatch<React.SetStateAction<any[]>>;
  refreshBookings: () => Promise<void>;
  loading: boolean;
  socket: Socket | null;
};
const BookingContext = createContext<BookingContextValue | undefined>(undefined);
export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings');
      setBookings(res.data);
    } catch (e: any) {
    } finally {
      setLoading(false);
    }
  };
  const playSound = async () => {
    try {
    } catch (error) {
    }
  };
  useEffect(() => {
    let newSocket: Socket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const initSocket = async () => {
      const token = await tokenStorage.getAccessToken();
      if (newSocket && token) {
        newSocket.emit('register', { role: 'PROVIDER' });
      }
    };
    const setup = async () => {
      // First, disconnect any existing socket connection
      const existingSocketId = await AsyncStorage.getItem('socket_id');
      if (existingSocketId) {
      }

      await fetchBookings();
      const token = await tokenStorage.getAccessToken();
      const isOnline = await AsyncStorage.getItem('provider_online');
      newSocket = io(SOCKET_URL, {
        autoConnect: false,
        auth: { token },
        reconnection: false, // Disable auto reconnection to prevent unwanted connects
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });
      setSocket(newSocket);
      newSocket.on('connect', async () => {
        initSocket(); // Always register as provider when socket connects
        const isOnline = await AsyncStorage.getItem('provider_online');
        if (isOnline === 'true') {
          try {
            await api.patch('/users/online-status', { isOnline: true });
            // Auto-refresh bookings when socket connects (provider comes online)
            await fetchBookings();
          } catch (error) {
          }
        } else {
          if (newSocket) {
            newSocket.disconnect();
          }
        }
      });
      newSocket.on('new_booking', async (booking: any) => {
        const currentStatus = await AsyncStorage.getItem('provider_online');
        if (currentStatus === 'false') {
          return;
        }
        await playSound();
        const currentLang = await AsyncStorage.getItem('user-language');
        const isHindi = currentLang === 'hi';
        let serviceName = 'Service Request';
        if (booking.service) {
          if (isHindi && booking.service.name_hi) serviceName = booking.service.name_hi;
          else if (booking.service.name_en) serviceName = booking.service.name_en;
          else if (typeof booking.service.nameTranslations === 'object' && booking.service.nameTranslations.hi && isHindi) serviceName = booking.service.nameTranslations.hi;
          else if (typeof booking.service.nameTranslations === 'object' && booking.service.nameTranslations.en) serviceName = booking.service.nameTranslations.en;
          else if (typeof booking.service.nameTranslations === 'string') {
            try {
              const parsed = JSON.parse(booking.service.nameTranslations);
              serviceName = isHindi && parsed.hi ? parsed.hi : (parsed.en || booking.service.nameTranslations);
            } catch {
              serviceName = booking.service.nameTranslations;
            }
          }
          else if (booking.service.name) serviceName = booking.service.name;
        } else if (booking.items && Array.isArray(booking.items) && booking.items.length > 0) {
          const firstItem = booking.items[0];
          if (firstItem.title) serviceName = firstItem.title;
        }
        const alertTitle = "🚨 " + (isHindi ? 'नई कार्य अनुरोध!' : 'New Job Request!');
        const alertMessage = isHindi 
          ? `${serviceName} - एक नई बुकिंग का अनुरोध किया गया है। स्वीकार करने के लिए नई अनुरोध पर जाएं!`
          : `${serviceName} - A new booking has been requested. Go to New Requests to accept!`;
        Alert.alert(alertTitle, alertMessage);
        setBookings(prev => {
          const filtered = prev.filter(b => b.id !== booking.id);
          return [booking, ...filtered];
        });
      });
      newSocket.on('booking_status_changed', (payload: { bookingId: string, status: string, updatedAt?: string }) => {
        setBookings(prev => 
          prev.map(booking => 
            booking.id === payload.bookingId 
              ? { ...booking, status: payload.status, updatedAt: payload.updatedAt || booking.updatedAt }
              : booking
          )
        );
      });
      newSocket.on('booking_accepted', async (payload: any) => {
        await fetchBookings();
      });
      newSocket.on('disconnect', () => {
        // Auto-refresh bookings when socket disconnects (provider goes offline)
        fetchBookings();
        reconnectTimer = setTimeout(async () => {
          const onlineStatus = await AsyncStorage.getItem('provider_online');
          if (onlineStatus === 'true') {
            const newToken = await tokenStorage.getAccessToken();
            if (newToken && newSocket) {
              newSocket.auth = { token: newToken };
              newSocket.connect();
            }
          }
        }, 2000);
      });
      // Only connect socket if provider is explicitly online
      if (isOnline === 'true') {
        newSocket.connect();
      } else {
      }
    };
    setup();
    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);
  return (
    <BookingContext.Provider
      value={{
        bookings,
        setBookings,
        refreshBookings: fetchBookings,
        loading,
        socket
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};
export const useBookings = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBookings must be used within a BookingProvider');
  }
  return context;
};
