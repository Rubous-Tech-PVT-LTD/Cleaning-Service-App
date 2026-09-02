import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';
import api, { SOCKET_URL } from '../api';

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
      console.error('Failed to fetch bookings:', e.message);
    } finally {
      setLoading(false);
    }
  };

  // Play premium sound function
  const playSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/notification.mp3')
      );
      await sound.playAsync();
    } catch (error) {
      console.log('Error playing sound', error);
    }
  };

  useEffect(() => {
    let newSocket: Socket | null = null;
    
    const initSocket = async () => {
      const userId = await AsyncStorage.getItem('provider_id');
      if (userId && newSocket) {
        newSocket.emit('register', { userId, role: 'PROVIDER' });
      }
    };

    const setup = async () => {
      // 1. Initial fetch
      await fetchBookings();

      // 2. Setup centralized WebSocket
      newSocket = io(SOCKET_URL, { autoConnect: false });
      setSocket(newSocket);

      newSocket.on('connect', () => {
        initSocket();
      });

      newSocket.on('new_booking', async (booking: any) => {
        const currentStatus = await AsyncStorage.getItem('provider_online');
        if (currentStatus === 'false') return;

        console.log('Received new booking:', booking);
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
        
        // Update context bookings
        setBookings(prev => {
          // Remove duplicate if it somehow exists, then prepend
          const filtered = prev.filter(b => b.id !== booking.id);
          return [booking, ...filtered];
        });
      });

      newSocket.on('booking_status_changed', (payload: { bookingId: string, status: string, updatedAt?: string }) => {
        console.log('Booking status changed via WS:', payload);
        
        setBookings(prev => 
          prev.map(booking => 
            booking.id === payload.bookingId 
              ? { ...booking, status: payload.status, updatedAt: payload.updatedAt || booking.updatedAt }
              : booking
          )
        );
      });

      // Connect if provider is online
      const isOnline = await AsyncStorage.getItem('provider_online');
      if (isOnline !== 'false') {
        newSocket.connect();
      }
    };

    setup();

    return () => {
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
