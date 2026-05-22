import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StatusBar, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme } from '../theme';
import api, { SOCKET_URL } from '../api';
import { io, Socket } from 'socket.io-client';
import { Audio } from 'expo-av';
import { Switch } from 'react-native';

export const DashboardScreen = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

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

  const loadOnlineStatus = async () => {
    const saved = await AsyncStorage.getItem('provider_online');
    if (saved !== null) {
      setIsOnline(saved === 'true');
    }
  };

  const toggleOnline = async (val: boolean) => {
    setIsOnline(val);
    await AsyncStorage.setItem('provider_online', String(val));
    if (val && socket) {
      socket.connect();
    } else if (!val && socket) {
      socket.disconnect();
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings');
      const pending = res.data.filter((b: any) => b.status === 'PENDING');
      setBookings(pending);
    } catch (e: any) {
      Alert.alert('Network Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    loadOnlineStatus();
    
    const newSocket = io(SOCKET_URL, { autoConnect: false });
    setSocket(newSocket);
    
    const initSocket = async () => {
      const userId = await AsyncStorage.getItem('provider_id');
      if (userId) {
        newSocket.emit('register', { userId, role: 'PROVIDER' });
      }
    };

    newSocket.on('connect', () => {
      initSocket();
    });

    newSocket.on('new_booking', async (booking) => {
      // Get latest state directly from AsyncStorage to avoid closure staleness
      const currentStatus = await AsyncStorage.getItem('provider_online');
      if (currentStatus === 'false') return;

      console.log('Received new booking:', booking);
      await playSound();
      Alert.alert(
        "🚨 New Job Request!",
        "A new booking has been requested. Go to New Requests to accept!"
      );
      setBookings((prev) => [booking, ...prev.filter(b => b.id !== booking.id)]);
    });

    // Connect initially if online
    AsyncStorage.getItem('provider_online').then((val) => {
      if (val !== 'false') {
        newSocket.connect();
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleAccept = async (booking: any) => {
    try {
      await api.patch(`/bookings/${booking.id}/status`, { status: 'ACCEPTED' });
      setBookings(prev => prev.filter(b => b.id !== booking.id));
      Alert.alert('✅ Accepted!', 'Booking accepted successfully');
    } catch (e: any) {
      Alert.alert('Error', 'Could not accept booking: ' + e.message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={Theme.background} />

      {/* Header with Online Toggle */}
      <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16, backgroundColor: Theme.background, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ fontSize: 14, fontWeight: '800', color: Theme.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>WELCOME BACK,</Text>
          <Text style={{ fontSize: 28, fontWeight: '900', color: Theme.primary }}>Provider</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: isOnline ? Theme.success : Theme.textSecondary, marginBottom: 4 }}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </Text>
          <Switch 
            value={isOnline} 
            onValueChange={toggleOnline} 
            trackColor={{ false: '#d1d5db', true: Theme.success + '80' }}
            thumbColor={isOnline ? Theme.success : '#f3f4f6'}
          />
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ padding: 24, paddingTop: 8 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchBookings} colors={[Theme.primary]} />
        }
      >
        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 16, marginBottom: 32 }}>
          <View style={{ flex: 1, backgroundColor: Theme.white, padding: 24, borderRadius: 24, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: Theme.textSecondary, marginBottom: 8 }}>PENDING JOBS</Text>
            <Text style={{ fontSize: 32, fontWeight: '900', color: Theme.primary }}>{bookings.length}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: Theme.primary, padding: 24, borderRadius: 24, elevation: 8, shadowColor: Theme.primary, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.8)', marginBottom: 8 }}>EARNINGS</Text>
            <Text style={{ fontSize: 32, fontWeight: '900', color: Theme.white }}>₹12.4k</Text>
          </View>
        </View>

        {/* Bookings Header */}
        <Text style={{ fontSize: 20, fontWeight: '900', color: Theme.textPrimary, marginBottom: 16 }}>New Requests</Text>

        {bookings.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center', backgroundColor: Theme.white, borderRadius: 24, borderStyle: 'dashed', borderWidth: 2, borderColor: Theme.border, marginTop: 16 }}>
            <Text style={{ color: Theme.textSecondary, fontWeight: '700', textAlign: 'center', fontSize: 16 }}>No pending requests.</Text>
            <Text style={{ color: Theme.textSecondary, fontWeight: '500', textAlign: 'center', fontSize: 14, marginTop: 4 }}>Pull down to refresh.</Text>
          </View>
        ) : (
          bookings.map((item: any) => {
            const bookingDate = item.scheduled_at ? new Date(item.scheduled_at).toLocaleDateString() : 'Today';
            const bookingTime = item.scheduled_at ? new Date(item.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            return (
              <View key={item.id} style={{ backgroundColor: Theme.white, padding: 20, borderRadius: 24, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ backgroundColor: Theme.infoLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                    <Text style={{ color: Theme.info, fontWeight: '800', fontSize: 12 }}>{item.status}</Text>
                  </View>
                  <Text style={{ color: Theme.textSecondary, fontSize: 12, fontWeight: '700' }}>#{item.id.slice(-6).toUpperCase()}</Text>
                </View>
                <Text style={{ fontSize: 18, fontWeight: '900', color: Theme.textPrimary, marginBottom: 8 }}>Service Request</Text>
                <Text style={{ color: Theme.textSecondary, fontWeight: '600', marginBottom: 4, fontSize: 14 }}>📅 {bookingDate} • {bookingTime}</Text>
                <Text style={{ color: Theme.primary, fontWeight: '800', marginBottom: 20, fontSize: 16 }}>💰 Total: ₹{item.total_price}</Text>
                <TouchableOpacity
                  onPress={() => handleAccept(item)}
                  style={{ backgroundColor: Theme.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center' }}>
                  <Text style={{ color: Theme.white, fontWeight: '900', fontSize: 16, letterSpacing: 0.5 }}>ACCEPT JOB</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
