import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StatusBar, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme } from '../theme';
import api from '../api';
import { Switch } from 'react-native';
import i18n from '../i18n';
import { useTranslation } from 'react-i18next';
import { useBookings } from '../context/BookingContext';

export const DashboardScreen = () => {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(true);
  
  const { bookings, loading, refreshBookings, socket } = useBookings();
  
  const pendingBookings = bookings.filter((b: any) => b.status === 'PENDING');
  const completedBookings = bookings.filter((b: any) => b.status === 'COMPLETED');
  const totalEarnings = completedBookings.reduce((sum: number, job: any) => sum + Number(job.totalPrice || job.total_price || 0), 0);

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

  useEffect(() => {
    loadOnlineStatus();
  }, []);

  const handleAccept = async (booking: any) => {
    try {
      await api.patch(`/bookings/${booking.id}/status`, { status: 'ACCEPTED' });
      await refreshBookings();
      Alert.alert('✅ ' + t('provider.booking_accepted'), t('provider.booking_accepted_message'));
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
          <Text style={{ fontSize: 14, fontWeight: '800', color: Theme.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>{t('provider.welcome_back')},</Text>
          <Text style={{ fontSize: 28, fontWeight: '900', color: Theme.primary }}>{t('provider.provider')}</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: isOnline ? Theme.success : Theme.textSecondary, marginBottom: 4 }}>
            {isOnline ? t('provider.online') : t('provider.offline')}
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
          <RefreshControl refreshing={loading} onRefresh={refreshBookings} colors={[Theme.primary]} />
        }
      >
        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 16, marginBottom: 32 }}>
          <View style={{ flex: 1, backgroundColor: Theme.white, padding: 24, borderRadius: 24, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: Theme.textSecondary, marginBottom: 8 }}>{t('provider.pending_jobs')}</Text>
            <Text style={{ fontSize: 32, fontWeight: '900', color: Theme.primary }}>{pendingBookings.length}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: Theme.primary, padding: 24, borderRadius: 24, elevation: 8, shadowColor: Theme.primary, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.8)', marginBottom: 8 }}>{t('provider.earnings')}</Text>
            <Text style={{ fontSize: 32, fontWeight: '900', color: Theme.white }}>₹{totalEarnings.toLocaleString()}</Text>
          </View>
        </View>

        {/* Bookings Header */}
        <Text style={{ fontSize: 20, fontWeight: '900', color: Theme.textPrimary, marginBottom: 16 }}>{t('provider.new_requests')}</Text>

        {pendingBookings.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center', backgroundColor: Theme.white, borderRadius: 24, borderStyle: 'dashed', borderWidth: 2, borderColor: Theme.border, marginTop: 16 }}>
            <Text style={{ color: Theme.textSecondary, fontWeight: '700', textAlign: 'center', fontSize: 16 }}>{t('provider.no_pending_requests')}</Text>
            <Text style={{ color: Theme.textSecondary, fontWeight: '500', textAlign: 'center', fontSize: 14, marginTop: 4 }}>{t('provider.pull_to_refresh')}</Text>
          </View>
        ) : (
          pendingBookings.map((item: any) => {
            const bookingDate = item.scheduledAt ? new Date(item.scheduledAt).toLocaleDateString() : 
                               item.scheduled_at ? new Date(item.scheduled_at).toLocaleDateString() : 'Today';
            const bookingTime = item.scheduledAt ? new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                                item.scheduled_at ? new Date(item.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            
            // Handle service name from different possible data structures
            let serviceName = 'Service Request';
            
            // Check language preference for Hindi
            const isHindi = i18n.language === 'hi';
            
            // First try to get from service object with language support
            if (item.service) {
              // Try sync API format first (snake_case)
              if (isHindi && item.service.name_hi) {
                serviceName = item.service.name_hi;
              } else if (item.service.name_en) {
                serviceName = item.service.name_en;
              }
              // Try regular API format (camelCase with JSON object)
              else if (typeof item.service.nameTranslations === 'object' && item.service.nameTranslations.hi && isHindi) {
                serviceName = item.service.nameTranslations.hi;
              } else if (typeof item.service.nameTranslations === 'object' && item.service.nameTranslations.en) {
                serviceName = item.service.nameTranslations.en;
              }
              // Try if nameTranslations is a stringified JSON
              else if (typeof item.service.nameTranslations === 'string') {
                try {
                  const parsed = JSON.parse(item.service.nameTranslations);
                  if (isHindi && parsed.hi) {
                    serviceName = parsed.hi;
                  } else {
                    serviceName = parsed.en || item.service.nameTranslations;
                  }
                } catch {
                  serviceName = item.service.nameTranslations;
                }
              }
              // Fallback to name field
              else if (item.service.name) {
                serviceName = item.service.name;
              }
            }
            // Then try to get from items array (this is what the API currently returns)
            else if (item.items && Array.isArray(item.items) && item.items.length > 0) {
              const firstItem = item.items[0];
              if (firstItem.title) {
                serviceName = firstItem.title;
              }
            }
            
            const clientName = item.client?.fullName || item.client?.full_name || 'Client';
            const price = item.totalPrice || item.total_price || 0;
            
            return (
              <View key={item.id} style={{ backgroundColor: Theme.white, padding: 20, borderRadius: 24, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ backgroundColor: Theme.infoLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                    <Text style={{ color: Theme.info, fontWeight: '800', fontSize: 12 }}>{item.status}</Text>
                  </View>
                  <Text style={{ color: Theme.textSecondary, fontSize: 12, fontWeight: '700' }}>#{item.id.slice(-6).toUpperCase()}</Text>
                </View>
                <Text style={{ fontSize: 18, fontWeight: '900', color: Theme.textPrimary, marginBottom: 8 }}>{serviceName}</Text>
                <Text style={{ color: Theme.textSecondary, fontWeight: '600', marginBottom: 4, fontSize: 14 }}>📅 {bookingDate} • {bookingTime}</Text>
                <Text style={{ color: Theme.textSecondary, fontWeight: '600', marginBottom: 4, fontSize: 14 }}>👤 {clientName}</Text>
                <Text style={{ color: Theme.primary, fontWeight: '800', marginBottom: 20, fontSize: 16 }}>💰 {t('provider.total')}: ₹{price}</Text>
                <TouchableOpacity
                  onPress={() => handleAccept(item)}
                  style={{ backgroundColor: Theme.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center' }}>
                  <Text style={{ color: Theme.white, fontWeight: '900', fontSize: 16, letterSpacing: 0.5 }}>{t('provider.accept_job')}</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
