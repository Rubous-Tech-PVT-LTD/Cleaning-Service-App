import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Calendar, X, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../theme';
import api from '../api';

const CANCEL_REASONS = [
  'Plans changed',
  'Found another service provider',
  'Provider not responding',
  'Service no longer needed',
  'Scheduled wrong time',
  'Other',
];

export const CancellationScreen = ({ navigation, route }: any) => {
  const { bookingId, bookingTitle, scheduledAt } = route.params || {};
  const [selectedReason, setSelectedReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'cancel' | 'reschedule'>('cancel');

  const handleCancel = async () => {
    if (!selectedReason) {
      Alert.alert('Select Reason', 'Please select a reason for cancellation.');
      return;
    }
    Alert.alert(
      'Confirm Cancellation',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await api.put(`/bookings/${bookingId}/cancel`, { reason: selectedReason });
              Alert.alert('Cancelled', 'Your booking has been cancelled successfully.', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (e) {
              Alert.alert('Error', 'Could not cancel booking. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const scheduledDate = scheduledAt ? new Date(scheduledAt) : new Date();
  const formattedDate = scheduledDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const formattedTime = scheduledDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'white', elevation: 2 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}>
          <ChevronLeft size={22} color={Theme.textPrimary} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 20, fontWeight: '900', color: Theme.textPrimary, marginLeft: 16 }}>Manage Booking</Text>
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
                {m === 'cancel' ? '❌ Cancel' : '📅 Reschedule'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {mode === 'cancel' ? (
          <>
            <Text style={{ fontSize: 16, fontWeight: '800', color: Theme.textPrimary, marginBottom: 16 }}>Why are you cancelling?</Text>
            <View style={{ gap: 12, marginBottom: 32 }}>
              {CANCEL_REASONS.map((reason) => (
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
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#92400E' }}>📋 Cancellation Policy</Text>
              <Text style={{ fontSize: 13, color: '#92400E', marginTop: 6, lineHeight: 20 }}>
                • Free cancellation up to 2 hours before the appointment{'\n'}
                • 50% charge if cancelled within 2 hours{'\n'}
                • No refund for same-day cancellations
              </Text>
            </View>

            <TouchableOpacity onPress={handleCancel} disabled={loading || !selectedReason} style={{ borderRadius: 18, overflow: 'hidden' }}>
              <LinearGradient colors={['#EF4444', '#DC2626']} style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 18 }}>
                {loading ? <ActivityIndicator color="white" /> : (
                  <>
                    <X size={20} color="white" />
                    <Text style={{ marginLeft: 10, fontSize: 16, fontWeight: '900', color: 'white' }}>Cancel Booking</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📅</Text>
            <Text style={{ fontSize: 20, fontWeight: '900', color: Theme.textPrimary, marginBottom: 8 }}>Reschedule Coming Soon</Text>
            <Text style={{ fontSize: 14, color: Theme.textSecondary, textAlign: 'center', lineHeight: 22 }}>
              Rescheduling will be available in the next update. For urgent changes, please contact support.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('HelpCenter')}
              style={{ marginTop: 24, backgroundColor: Theme.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 16 }}
            >
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 14 }}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
