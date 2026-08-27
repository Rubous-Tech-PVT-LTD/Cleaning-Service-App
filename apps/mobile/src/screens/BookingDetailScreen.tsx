import React from 'react';
import { switchMap } from 'rxjs/operators';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, MapPin, Calendar, Clock, Phone, MessageCircle, ShieldCheck, CreditCard } from 'lucide-react-native';
import withObservables from '@nozbe/with-observables';
import MapView, { Marker } from 'react-native-maps';
import { io } from 'socket.io-client';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { database } from '../db';
import { Theme } from '../theme';
import api, { SOCKET_URL } from '../api';

const BookingDetailScreenBase = ({ navigation, booking, service, address, services }: any) => {
  const { t, i18n } = useTranslation();
  const [providerLocation, setProviderLocation] = React.useState<{ latitude: number, longitude: number } | null>(null);
  const [sosLoading, setSosLoading] = React.useState(false);

  // Helper function to get translated service name by ID
  const getServiceTitle = (item: any) => {
    // Always try to translate based on service ID when available
    if (item.serviceId) {
      const itemService = services ? services.find((s: any) => s.id === item.serviceId) : null;
      if (itemService) {
        return i18n.language === 'hi' ? itemService.nameHi : itemService.nameEn;
      }
    }
    // Fallback to stored title only if service ID is not available or service not found
    return item.title || 'Service';
  };

  if (!booking || !service) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>{t('booking_detail.loading')}</Text>
      </View>
    );
  }

  React.useEffect(() => {
    if (!isAcceptedOrInProgress) return;

    const socket = io(SOCKET_URL);

    const initSocket = async () => {
      const clientId = await AsyncStorage.getItem('user_id');
      if (clientId) {
        socket.emit('register', { userId: clientId, role: 'CLIENT' });
      }
    };

    socket.on('connect', () => {
      initSocket();
    });

    socket.on('provider_location', (data: any) => {
      setProviderLocation({ latitude: data.latitude, longitude: data.longitude });
    });

    return () => {
      socket.disconnect();
    };
  }, [booking.status]);

  const handleTriggerSos = async () => {
    if (sosLoading) return;

    Alert.alert(
      t('booking_detail.emergency_sos'),
      t('booking_detail.sos_confirm_message'),
      [
        { text: t('profile.cancel'), style: 'cancel' },
        {
          text: t('booking_detail.yes_trigger_sos'),
          style: 'destructive',
          onPress: async () => {
            try {
              setSosLoading(true);

              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert(t('booking_detail.permission_denied'), t('booking_detail.location_permission_required'));
                return;
              }

              const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
              });

              const payload = {
                bookingId: booking.id,
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
              };

              await api.post('/sos', payload);

              Alert.alert(
                t('booking_detail.sos_sent'),
                t('booking_detail.sos_sent_message')
              );
            } catch (err: any) {
              const msg = err?.response?.data?.message || err.message || t('booking_detail.sos_failed_message');
              Alert.alert(t('booking_detail.sos_failed'), msg);
            } finally {
              setSosLoading(false);
            }
          },
        },
      ]
    );
  };

  const items = booking.items ? JSON.parse(booking.items) : [];
  const scheduledDate = new Date(booking.scheduledAt);

  const isAcceptedOrInProgress = booking.status === 'ACCEPTED' || booking.status === 'IN_PROGRESS';
  const isNotCancelledOrCompleted = booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={Theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('booking_detail.title')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, { backgroundColor: booking.status === 'COMPLETED' ? '#ECFDF5' : '#FFFBEB' }]}>
            <Text style={[styles.statusText, { color: booking.status === 'COMPLETED' ? Theme.success : '#D97706' }]}>
              {booking.status === 'COMPLETED' ? t('booking_detail.status_completed') :
               booking.status === 'ACCEPTED' ? t('booking_detail.status_accepted') :
               booking.status === 'IN_PROGRESS' ? t('booking_detail.status_in_progress') :
               booking.status === 'CANCELLED' ? t('booking_detail.status_cancelled') :
               booking.status}
            </Text>
          </View>
          <Text style={styles.bookingId}>ID: #{booking.id.slice(-8).toUpperCase()}</Text>
          <Text style={styles.serviceName}>{i18n.language === 'hi' ? (service.nameHi || service.nameEn) : service.nameEn}</Text>
          
          {/* OTP Section */}
          {isAcceptedOrInProgress && booking.otp && (
            <View style={{ marginTop: 24, padding: 16, backgroundColor: '#F1F5F9', borderRadius: 16, alignItems: 'center', width: '100%' }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.textSecondary, marginBottom: 8 }}>{t('booking_detail.provide_pin')}</Text>
              <Text style={{ fontSize: 32, fontWeight: '900', color: Theme.primary, letterSpacing: 8 }}>{booking.otp}</Text>
            </View>
          )}
        </View>

        {/* Live Tracking Map */}
        {isAcceptedOrInProgress && (
          <View style={styles.mapContainer}>
            <Text style={styles.sectionTitle}>{t('booking_detail.live_tracking')}</Text>
            {providerLocation ? (
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: providerLocation.latitude,
                  longitude: providerLocation.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={providerLocation}
                  title="Provider"
                  description={t('booking_detail.on_the_way')}
                >
                  <View style={{ width: 44, height: 44, backgroundColor: Theme.primary, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'white', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 }}>
                    <Text style={{ fontSize: 22 }}>🛵</Text>
                  </View>
                </Marker>
              </MapView>
            ) : (
              <View style={styles.mapPlaceholder}>
                <Text style={styles.mapPlaceholderText}>{t('booking_detail.waiting_provider')}</Text>
              </View>
            )}
          </View>
        )}

        {/* Appointment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('booking_detail.appointment')}</Text>
          <View style={styles.detailRow}>
            <Calendar size={20} color={Theme.primary} />
            <Text style={styles.detailText}>{scheduledDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          </View>
          <View style={styles.detailRow}>
            <Clock size={20} color={Theme.primary} />
            <Text style={styles.detailText}>{scheduledDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
          <View style={styles.detailRow}>
            <MapPin size={20} color={Theme.primary} />
            <Text style={styles.detailText} numberOfLines={2}>
              {address ? `${address.addressLine1}, ${address.city}` : t('booking_detail.no_address')}
            </Text>
          </View>
        </View>

        {/* Items Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('booking_detail.order_summary')}</Text>
          {items.map((item: any, idx: number) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemName}>{getServiceTitle(item)} x {item.quantity || 1}</Text>
              <Text style={styles.itemPrice}>₹{item.price * (item.quantity || 1)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.itemRow}>
            <Text style={[styles.itemName, { fontWeight: '900' }]}>{t('booking_detail.total_amount')}</Text>
            <Text style={[styles.itemPrice, { color: Theme.primary, fontSize: 20 }]}>₹{booking.totalPrice}</Text>
          </View>
        </View>

     

        {/* Help Center Shortcut */}
        <TouchableOpacity
          onPress={() => navigation.navigate('HelpCenter')}
          style={styles.helpCard}
        >
          <ShieldCheck size={24} color={Theme.primary} />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.helpTitle}>{t('booking_detail.need_help')}</Text>
            <Text style={styles.helpSubtitle}>{t('booking_detail.contact_support')}</Text>
          </View>
          <ChevronLeft size={20} color={Theme.textSecondary} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        {/* SOS Emergency Button - only for active bookings */}
        {isAcceptedOrInProgress && (
          <TouchableOpacity
            onPress={handleTriggerSos}
            disabled={sosLoading}
            style={[styles.sosButton, sosLoading && { opacity: 0.6 }]}
          >
            {sosLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.sosEmoji}>🚨</Text>
                <Text style={styles.sosButtonText}>{t('booking_detail.emergency_sos_button')}</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        {/* Action Buttons */}
        {isNotCancelledOrCompleted && (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Cancellation', { bookingId: booking.id })}
              style={styles.manageButton}
            >
              <Text style={styles.manageButtonText}>{t('booking_detail.reschedule_cancel')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Theme.textPrimary,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  bookingId: {
    fontSize: 12,
    color: Theme.textSecondary,
    fontWeight: '700',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 24,
    fontWeight: '900',
    color: Theme.textPrimary,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Theme.textPrimary,
    marginBottom: 20,
  },
  mapContainer: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    elevation: 2,
  },
  map: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    color: Theme.textSecondary,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailText: {
    marginLeft: 16,
    fontSize: 15,
    fontWeight: '700',
    color: Theme.textSecondary,
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.textPrimary,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: Theme.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },
  helpCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    elevation: 2,
  },
  helpTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.textPrimary,
  },
  helpSubtitle: {
    fontSize: 12,
    color: Theme.textSecondary,
    marginTop: 2,
  },
  actionContainer: {
    marginBottom: 40,
  },
  manageButton: {
    backgroundColor: Theme.primary,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: Theme.primary,
    shadowOpacity: 0.2,
    elevation: 8,
  },
  manageButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
  },
  sosButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    flexDirection: 'row',
    shadowColor: '#DC2626',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#FCA5A5',
  },
  sosEmoji: {
    fontSize: 22,
    marginRight: 10,
  },
  sosButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});

export const BookingDetailScreen = withObservables(['route'], ({ route }: any) => {
  const booking = database.collections.get('bookings').findAndObserve(route.params.bookingId);
  return {
    booking,
    service: booking.pipe(
      // @ts-ignore
      switchMap(b => b.service.observe())
    ),
    address: booking.pipe(
      // @ts-ignore
      switchMap(b => b.address.observe())
    ),
    services: database.collections.get('services').query().observe(),
  };
})(BookingDetailScreenBase);
