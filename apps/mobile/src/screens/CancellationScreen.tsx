import React, { useState } from 'react';
import { switchMap } from 'rxjs/operators';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Calendar, X, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../theme';
import api from '../api';
import { SlotSelector } from '../components/SlotSelector';

import withObservables from '@nozbe/with-observables';
import { database } from '../db';

const CancellationScreenBase = ({ navigation, route, booking, service }: any) => {
  const { t, i18n } = useTranslation();
  const [selectedReason, setSelectedReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'cancel' | 'reschedule'>('cancel');
  const [newDate, setNewDate] = useState(new Date());

  const bookingTitle = service ? (i18n.language === 'hi' ? service.nameHi : service.nameEn) : 'Loading...';

  const cancelReasons = [
    t('manage_booking.reason_plans_changed'),
    t('manage_booking.reason_found_another'),
    t('manage_booking.reason_provider_not_responding'),
    t('manage_booking.reason_not_needed'),
    t('manage_booking.reason_wrong_time'),
    t('manage_booking.reason_other')
  ];

  const handleCancel = async () => {
    if (!selectedReason) {
      Alert.alert(t('common.error'), t('manage_booking.why_cancelling'));
      return;
    }
    Alert.alert(
      t('manage_booking.cancel'),
      t('manage_booking.cancel_booking'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('manage_booking.cancel_booking'),
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await database.write(async () => {
                await booking.update((record: any) => {
                  record.status = 'CANCELLED';
                });
              });
              Alert.alert(t('manage_booking.cancel'), t('booking_detail.status_cancelled'), [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (e) {
              Alert.alert(t('common.error'), t('cart.error_confirming_booking'));
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const scheduledDate = booking?.scheduledAt ? new Date(booking.scheduledAt) : new Date();
  const formattedDate = scheduledDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const formattedTime = scheduledDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'white', elevation: 2 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}>
          <ChevronLeft size={22} color={Theme.textPrimary} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 20, fontWeight: '900', color: Theme.textPrimary, marginLeft: 16 }}>{t('manage_booking.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {/* Booking Card */}
        <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 24, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: Theme.textPrimary, marginBottom: 12 }}>
            {bookingTitle || 'Home Cleaning'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Calendar size={16} color={Theme.primary} />
              <Text style={{ marginLeft: 6, fontSize: 13, fontWeight: '700', color: Theme.textSecondary }}>{formattedDate}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Clock size={16} color={Theme.primary} />
              <Text style={{ marginLeft: 6, fontSize: 13, fontWeight: '700', color: Theme.textSecondary }}>{formattedTime}</Text>
            </View>
          </View>
        </View>

        {/* Mode Toggle */}
        <View style={{ flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 16, padding: 4, marginBottom: 28 }}>
          {(['cancel', 'reschedule'] as const).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setMode(m)}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: mode === m ? 'white' : 'transparent', alignItems: 'center', elevation: mode === m ? 2 : 0 }}
            >
              <Text style={{ fontSize: 14, fontWeight: '800', color: mode === m ? Theme.primary : Theme.textSecondary }}>
                {m === 'cancel' ? t('manage_booking.cancel') : t('manage_booking.reschedule')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {mode === 'cancel' ? (
          <>
            <Text style={{ fontSize: 16, fontWeight: '800', color: Theme.textPrimary, marginBottom: 16 }}>{t('manage_booking.why_cancelling')}</Text>
            <View style={{ gap: 12, marginBottom: 32 }}>
              {cancelReasons.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  onPress={() => setSelectedReason(reason)}
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 2, borderColor: selectedReason === reason ? Theme.primary : '#E2E8F0' }}
                >
                  <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: selectedReason === reason ? Theme.primary : '#CBD5E1', backgroundColor: selectedReason === reason ? Theme.primary : 'transparent', justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                    {selectedReason === reason && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'white' }} />}
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: Theme.textPrimary }}>{reason}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Policy note */}
            <View style={{ backgroundColor: '#FEF3C7', borderRadius: 16, padding: 16, marginBottom: 28 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#92400E' }}>{t('manage_booking.cancellation_policy')}</Text>
              <Text style={{ fontSize: 13, color: '#92400E', marginTop: 6, lineHeight: 20 }}>
                {t('manage_booking.cancellation_policy_text')}
              </Text>
            </View>

            <TouchableOpacity onPress={handleCancel} disabled={loading || !selectedReason} style={{ borderRadius: 18, overflow: 'hidden' }}>
              <LinearGradient colors={['#EF4444', '#DC2626']} style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 18 }}>
                {loading ? <ActivityIndicator color="white" /> : (
                  <>
                    <X size={20} color="white" />
                    <Text style={{ marginLeft: 10, fontSize: 16, fontWeight: '900', color: 'white' }}>{t('manage_booking.cancel_booking')}</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          <View style={{ paddingVertical: 10 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: Theme.textPrimary, marginBottom: 16 }}>{t('manage_booking.select_new_slot')}</Text>
            <SlotSelector
              onSlotSelect={(date, time) => {
                const finalDate = new Date(date);
                const [timeStr, period] = time.split(' ');
                let [hours, minutes] = timeStr.split(':').map(Number);
                if (period === 'PM' && hours < 12) hours += 12;
                if (period === 'AM' && hours === 12) hours = 0;
                finalDate.setHours(hours, minutes, 0, 0);
                setNewDate(finalDate);
              }}
            />

            <TouchableOpacity
              onPress={async () => {
                setLoading(true);
                try {
                  await database.write(async () => {
                    await booking.update((record: any) => {
                      record.scheduledAt = newDate.getTime();
                    });
                  });
                  Alert.alert(t('manage_booking.reschedule'), t('cart.booking_confirmed'));
                  navigation.goBack();
                } catch (e) {
                  Alert.alert(t('common.error'), t('cart.error_confirming_booking'));
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              style={{ marginTop: 32, backgroundColor: Theme.primary, paddingVertical: 18, borderRadius: 16, alignItems: 'center' }}
            >
              {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: '900', fontSize: 16 }}>{t('manage_booking.confirm_reschedule')}</Text>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export const CancellationScreen = withObservables(['route'], ({ route }: any) => {
  const booking = database.collections.get('bookings').findAndObserve(route.params.bookingId);
  return {
    booking,
    service: booking.pipe(
      // @ts-ignore
      switchMap(b => b.service.observe())
    )
  };
})(CancellationScreenBase);
