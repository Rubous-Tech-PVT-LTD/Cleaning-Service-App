import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Trash2, Phone, AlertCircle, MapIcon, MapPin } from 'lucide-react-native';
import { Theme } from '../theme';
import api from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import withObservables from '@nozbe/with-observables';
import { database } from '../db';
import { NotificationService } from '../services/NotificationService';
import { syncDatabase } from '../db/sync';
import { getActiveLocation, ActiveLocation } from '../services/locationService';
import { parseEstimatedTime } from '../utils/durationPriceUtils';

const CartScreenBase = ({ navigation, addresses, services }: any) => {
  const { t, i18n } = useTranslation();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [userPhone, setUserPhone] = useState('');
  const [activeLocation, setActiveLocation] = useState<ActiveLocation | null>(null);
  const insets = useSafeAreaInsets();


  const getServiceTitle = (item: any) => {

    if (item.serviceId) {
      const service = services ? services.find((s: any) => s.id === item.serviceId) : null;
      if (service) {
        return i18n.language === 'hi' ? service.nameHi : service.nameEn;
      }
    }

    return item.title || 'Service';
  };

  useEffect(() => {
    fetchCart();
    fetchUserData();
    loadLocation();
  }, []);

  const loadLocation = async () => {
    const location = await getActiveLocation();
    setActiveLocation(location);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchCart();
      fetchUserData();
      loadLocation();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchUserData = async () => {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      if (userId) {
        const res = await api.get(`/users/${userId}`);
        setUserPhone(res.data.phone || '+91 99999 00000');
      } else {
        const phone = await AsyncStorage.getItem('user_phone');
        setUserPhone(phone || '+91 99999 00000');
      }
    } catch (e) {
    }
  };

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cart');
      setCart(res.data);
    } catch (e) {
      Alert.alert(t('common.error'), t('cart.error_loading_cart'));
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (serviceId: string) => {
    try {
      setUpdating(true);
      await api.delete('/cart', { serviceId });
      await fetchCart();
    } catch (e) {
      Alert.alert(t('common.error'), t('cart.error_removing_item'));
    } finally {
      setUpdating(false);
    }
  };

  const getTotalPrice = () => {
    if (!cart?.items) return 0;
    return cart.items.reduce(
      (total: number, item: any) => {

        const itemPrice = Math.round(item.duration?.price || item.price);
        return total + itemPrice * (item.quantity || 1);
      },
      0,
    );
  };

  const calculateGST = (amount: number) => Math.round(amount * 0.18);
  const calculateServiceFee = (amount: number) => Math.round(amount * 0.05);
  const getFinalAmount = () => {
    const subtotal = Math.round(getTotalPrice());
    return Math.round(subtotal + calculateGST(subtotal) + calculateServiceFee(subtotal));
  };

  const handleConfirmBooking = async () => {
    try {
      setConfirming(true);

      const userId = await AsyncStorage.getItem('user_id');
      if (!userId) {
        Alert.alert(t('cart.login_required'), t('cart.login_required_message'));
        return;
      }

      const cartItems = cart?.items || [];
      if (cartItems.length === 0) return;

      const primaryItem = cartItems[0];


      const defaultAddress = addresses?.length > 0
        ? addresses.find((a: any) => a.isDefault) || addresses[0]
        : null;


      const bookingAddress = activeLocation?.savedAddressId
        ? addresses.find((a: any) => a.id === activeLocation.savedAddressId) || defaultAddress
        : defaultAddress;

      if (!bookingAddress) {
        Alert.alert(t('cart.address_required'), t('cart.address_required_message'));
        return;
      }

      const newBookingId = await database.write(async () => {
        let firstBookingId = '';

        for (const item of cartItems) {
          const itemPrice = Math.round(item.duration?.price || item.price);
          const quantity = item.quantity || 1;
          const scheduledAt = item.bookingType === 'scheduled' && item.scheduledAt
            ? new Date(item.scheduledAt).getTime()
            : new Date().getTime();

          const booking = await database.get('bookings').create((localBooking: any) => {
            localBooking.serviceId = item.serviceId;
            localBooking.clientId = userId;
            localBooking.addressId = bookingAddress.id;
            localBooking.status = 'PENDING';
            localBooking.scheduledAt = scheduledAt;
            localBooking.totalPrice = itemPrice * quantity;
            localBooking.items = JSON.stringify([{ serviceId: item.serviceId, price: itemPrice, quantity }]);
          });

          if (!firstBookingId) firstBookingId = booking.id;

          await database.get('chats').create((chat: any) => {
            chat.bookingId = booking.id;
            chat.clientId = userId;
            chat.providerId = 'system';
          });
        }

        return firstBookingId;
      });


      syncDatabase().catch(err => {
        Alert.alert(t('cart.sync_error'), err.message);
      });


      await api.delete('/cart/clear');


      const itemTitle = getServiceTitle(primaryItem);
      
      NotificationService.sendLocalNotification(
        t('cart.booking_confirmed'),
        i18n.language === 'hi' 
          ? `आपकी बुकिंग ${itemTitle} सफलतापूर्वक प्राप्त हो गई है।`
          : `Your booking for ${itemTitle} has been received successfully.`
      );


      navigation.navigate('BookingSuccess', {
        bookingId: newBookingId,
        totalPrice: Math.round(getFinalAmount()),
        date: primaryItem.scheduledAt
          ? new Date(primaryItem.scheduledAt).getTime()
          : new Date().getTime(),
        addressLabel: bookingAddress.label,
        addressLine1: bookingAddress.addressLine1,
        addressCity: bookingAddress.city
      });
    } catch (e) {
      Alert.alert(t('common.error'), t('cart.error_confirming_booking'));
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  const items = cart?.items || [];
  const subtotal = Math.round(getTotalPrice());
  const gst = calculateGST(subtotal);
  const serviceFee = calculateServiceFee(subtotal);
  const finalAmount = getFinalAmount();

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FA', paddingTop: insets.top }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#FFFFFF',
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 8, marginRight: 8 }}
        >
          <ArrowLeft size={24} color={Theme.textPrimary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: Theme.textPrimary, flex: 1 }}>
          {t('cart.title')}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 16 }}
        contentContainerStyle={{ paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
      >
        {items.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 100 }}>
            <Text style={{ fontSize: 18, color: Theme.textSecondary, marginBottom: 20 }}>
              {t('cart.empty')}
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: Theme.primary,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 8,
              }}
              onPress={() => navigation.goBack()}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>
                {t('cart.continue_shopping')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: Theme.textPrimary,
                  marginBottom: 8,
                }}
              >
                {t('cart.review_booking')}
              </Text>
              {items.map((item: any, index: number) => {
                const title = getServiceTitle(item);

                const itemPrice = Math.round(item.duration?.price || item.price);
                
                return (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#F8FAFC',
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 8,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: 'bold',
                        color: Theme.textPrimary,
                        marginBottom: 4,
                      }}
                    >
                      {title}
                    </Text>
                    {item.duration && (
                      <Text style={{ fontSize: 14, color: Theme.textSecondary, marginBottom: 4 }}>
                        {typeof item.duration.label === 'string' 
                          ? item.duration.label 
                          : (item.duration.label?.[i18n.language === 'hi' ? 'hi' : 'en'] || item.duration.label?.en || String(item.duration.label || ''))}
                      </Text>
                    )}
                    {item.bookingType === 'scheduled' && item.schedule ? (
                      <Text style={{ fontSize: 13, color: Theme.textSecondary, marginBottom: 4 }}>
                        {typeof item.schedule.dayLabel === 'string' 
                          ? item.schedule.dayLabel 
                          : (item.schedule.dayLabel?.[i18n.language === 'hi' ? 'hi' : 'en'] || item.schedule.dayLabel?.en || String(item.schedule.dayLabel || ''))}, 
                        {typeof item.schedule.dateLabel === 'string' 
                          ? item.schedule.dateLabel 
                          : (item.schedule.dateLabel?.[i18n.language === 'hi' ? 'hi' : 'en'] || item.schedule.dateLabel?.en || String(item.schedule.dateLabel || ''))} · 
                        {item.schedule.time}
                      </Text>
                    ) : (
                      <Text
                        style={{
                          fontSize: 13,
                          color: '#10B981',
                          marginBottom: 4,
                          fontWeight: '600',
                        }}
                      >
                        {t('cart.instant')}
                      </Text>
                    )}
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: Theme.primary }}>
                      ₹{itemPrice}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeItem(item.serviceId)}
                    style={{ padding: 8 }}
                    disabled={updating}
                  >
                    <Trash2 size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                );
              })}
               {/* Add More Services Button */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 16,
                marginBottom: 10,
              borderTopWidth:1,
                
                borderColor: '#E5E7EB',
              }}
            >
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={{ fontSize: 16, color: Theme.textSecondary }}>
                  {t('cart.missed_something')}{' '}
                  <Text style={{ fontSize: 16, color: Theme.primaryDark, fontWeight: '600' }}>
                    {t('cart.add_more_services')}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
            </View>

           

            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: Theme.textPrimary }}>
                  {t('cart.booking_details')}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('AddressPicker')}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#10B981' }}>{t('cart.change')}</Text>
                </TouchableOpacity>
              </View>

              {(() => {

                const defaultAddress = addresses?.length > 0
                  ? addresses.find((a: any) => a.isDefault) || addresses[0]
                  : null;

                if (activeLocation) {
                  return (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          backgroundColor: '#F0FDF4',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 12,
                        }}
                      >
                        <MapPin size={20} color={Theme.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: Theme.textPrimary }}>
                          {activeLocation.address}
                        </Text>
                        <Text style={{ fontSize: 13, color: Theme.textSecondary, marginTop: 2 }}>
                          {activeLocation.city}, {activeLocation.state}
                        </Text>
                      </View>
                    </View>
                  );
                } else if (defaultAddress) {
                  return (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          backgroundColor: '#F0FDF4',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 12,
                        }}
                      >
                        <MapPin size={20} color={Theme.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: Theme.textPrimary }}>
                          {defaultAddress.addressLine1}
                        </Text>
                        <Text style={{ fontSize: 13, color: Theme.textSecondary, marginTop: 2 }}>
                          {defaultAddress.city}, {defaultAddress.state}
                        </Text>
                      </View>
                    </View>
                  );
                } else {
                  return (
                    <TouchableOpacity
                      onPress={() => navigation.navigate('AddressPicker')}
                      style={{
                        backgroundColor: '#F8FAFC',
                        padding: 20,
                        borderRadius: 24,
                        borderStyle: 'dashed',
                        borderWidth: 2,
                        borderColor: '#E2E8F0',
                        alignItems: 'center',
                        marginBottom: 12,
                      }}
                    >
                      <Text style={{ color: Theme.primary, fontWeight: '800' }}>{t('cart.add_address')}</Text>
                    </TouchableOpacity>
                  );
                }
              })()}

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: '#F0FDF4',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                  }}
                >
                  <Phone size={20} color={Theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: Theme.textSecondary, marginBottom: 2 }}>
                    {t('cart.phone_number')}
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: Theme.textPrimary }}>
                    {userPhone}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: Theme.textPrimary,
                  marginBottom: 8,
                }}
              >
                {t('cart.bill_details')}
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 14, color: Theme.textSecondary }}>{t('cart.item_total')}</Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: Theme.textPrimary }}>
                  ₹{Math.round(subtotal)}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 14, color: Theme.textSecondary }}>{t('cart.gst')}</Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: Theme.textPrimary }}>
                  ₹{Math.round(gst)}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 14, color: Theme.textSecondary }}>{t('cart.service_fee')}</Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: Theme.textPrimary }}>
                  ₹{Math.round(serviceFee)}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: '#E5E7EB',
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: Theme.textPrimary }}>
                  {t('cart.to_pay')}
                </Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: Theme.primary }}>
                  ₹{Math.round(finalAmount)}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {items.length > 0 && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#FFFFFF',
            paddingHorizontal: 24,
            paddingVertical: 20,
            paddingBottom: 32,
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
          }}
        >
          {(() => {

            const defaultAddress = addresses?.length > 0
              ? addresses.find((a: any) => a.isDefault) || addresses[0]
              : null;


            if (activeLocation && !activeLocation.isSupported) {
              return (
                <View style={{ alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <AlertCircle size={24} color={Theme.error} style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.textPrimary }}>{t('cart.not_serviceable')}</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: Theme.textSecondary, marginBottom: 16, textAlign: 'center' }}>{t('cart.location_out_of_service')}</Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('SearchLocation')}
                    style={{ backgroundColor: Theme.primary, paddingVertical: 16, borderRadius: 20, alignItems: 'center', width: '100%', shadowColor: Theme.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 }}
                  >
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>{t('cart.change_location')}</Text>
                  </TouchableOpacity>
                </View>
              );
            }

            return (
              <TouchableOpacity
                style={{
                  backgroundColor: Theme.primary,
                  paddingVertical: 16,
                  borderRadius: 20,
                  alignItems: 'center',
                }}
                onPress={handleConfirmBooking}
                disabled={confirming || updating}
              >
                {confirming ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>
                    {t('cart.confirm_booking')} • ₹{Math.round(finalAmount)}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })()}
        </View>
      )}
    </View>
  );
};

export const CartScreen = withObservables([], () => ({
  addresses: database.collections.get('addresses').query().observe(),
  services: database.collections.get('services').query().observe(),
}))(CartScreenBase);
