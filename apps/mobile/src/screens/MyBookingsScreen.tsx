import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Clock, MessageCircle } from 'lucide-react-native';
import withObservables from '@nozbe/with-observables';
import { database } from '../db';
import { Theme } from '../theme';

const BookingItemBase = ({ booking, service, navigation, t, i18n }: any) => {
  let items = [];
  try {
    items = booking.items ? JSON.parse(booking.items) : [];
  } catch (e) {
    items = [];
  }

  const primaryServiceTitle = service ? (i18n.language === 'hi' ? service.nameHi : service.nameEn) : 'Loading...';

  return (
    <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 28, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: Theme.textPrimary }}>
            {items.length > 0 ? items.map((it: any) => it.title).join(', ') : primaryServiceTitle}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Clock size={14} color={Theme.textSecondary} />
            <Text style={{ color: Theme.textSecondary, marginLeft: 6, fontSize: 13, fontWeight: '600' }}>
              {new Date(booking.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </Text>
          </View>
        </View>
        <View style={{ backgroundColor: booking.status === 'COMPLETED' ? '#ECFDF5' : '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
          <Text style={{ fontSize: 11, fontWeight: '900', color: booking.status === 'COMPLETED' ? '#10B981' : '#D97706', textTransform: 'uppercase' }}>
            {booking.status}
          </Text>
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 }} />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, fontWeight: '900', color: Theme.primary }}>₹{booking.totalPrice}</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Chat', { bookingId: booking.id, serviceName: primaryServiceTitle, providerId: booking.providerId })}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#F4EDFF', justifyContent: 'center', alignItems: 'center', marginRight: 8 }}
          >
            <MessageCircle size={20} color={Theme.primary} />
          </TouchableOpacity>
          {booking.status === 'COMPLETED' && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Review', { bookingId: booking.id, serviceName: primaryServiceTitle })}
              style={{ backgroundColor: Theme.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 12, fontWeight: '900', color: 'white' }}>{t('common.rate_service').toUpperCase()}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const BookingItem = withObservables(['booking'], ({ booking }: any) => ({
  booking: booking.observe(),
  service: booking.service.observe(),
}))(BookingItemBase);

const MyBookingsScreenBase = ({ navigation, bookings }: any) => {
  const { t, i18n } = useTranslation();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.background }}>
      <View style={{ padding: 24, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ChevronLeft size={28} /></TouchableOpacity>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginLeft: 16 }}>{t('common.my_bookings')}</Text>
      </View>
      <ScrollView style={{ flex: 1, padding: 24 }}>
        {bookings.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 100 }}>
            <Clock size={64} color={Theme.textSecondary} />
            <Text style={{ color: Theme.textSecondary, marginTop: 16 }}>No bookings yet.</Text>
          </View>
        ) : bookings.map((b: any) => (
          <BookingItem key={b.id} booking={b} navigation={navigation} t={t} i18n={i18n} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export const MyBookingsScreen = withObservables([], () => ({
  bookings: database.collections.get('bookings').query().observe(),
}))(MyBookingsScreenBase);
