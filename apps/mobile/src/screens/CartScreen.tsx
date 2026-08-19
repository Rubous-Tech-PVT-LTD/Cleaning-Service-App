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
import { ArrowLeft, Trash2, Phone, AlertCircle, MapIcon, MapPin } from 'lucide-react-native';
import { Theme } from '../theme';
import api from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import withObservables from '@nozbe/with-observables';
import { database } from '../db';
import { NotificationService } from '../services/NotificationService';
import { syncDatabase } from '../db/sync';
import { getActiveLocation, ActiveLocation } from '../services/locationService';

const CartScreenBase = ({ navigation, addresses }: any) => {
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [userPhone, setUserPhone] = useState('');
  const [userAddress, setUserAddress] = useState<any>(null);
  const [activeLocation, setActiveLocation] = useState<ActiveLocation | null>(null);
  const insets = useSafeAreaInsets();

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
    if (addresses?.length > 0) {
      setUserAddress(addresses.find((a: any) => a.isDefault) || addresses[0]);
    }
  }, [addresses]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchCart();
      fetchUserData();
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

      const defaultAddress =
        addresses?.length > 0
          ? addresses.find((a: any) => a.isDefault) || addresses[0]
          : null;
      setUserAddress(defaultAddress);
    } catch (e) {
      console.error('Error fetching user data:', e);
    }
  };

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cart');
      setCart(res.data);
    } catch (e) {
      console.error('Error fetching cart:', e);
      Alert.alert('Error', 'Failed to load cart');
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
      console.error('Error removing item:', e);
      Alert.alert('Error', 'Failed to remove item');
    } finally {
      setUpdating(false);
    }
  };

  const getTotalPrice = () => {
    if (!cart?.items) return 0;
    return cart.items.reduce(
      (total: number, item: any) => total + item.price * (item.quantity || 1),
      0,
    );
  };

  const calculateGST = (amount: number) => Math.round(amount * 0.18);
  const calculateServiceFee = (amount: number) => Math.round(amount * 0.05);
  const getFinalAmount = () => {
    const subtotal = getTotalPrice();
    return subtotal + calculateGST(subtotal) + calculateServiceFee(subtotal);
  };

  const handleConfirmBooking = async () => {
    try {
      setConfirming(true);

      const userId = await AsyncStorage.getItem('user_id');
      if (!userId) {
        Alert.alert('Login Required', 'Please login to confirm booking');
        return;
      }

      if (!activeLocation) {
        Alert.alert('Location Required', 'Please set your location to continue');
        return;
      }

      const items = cart?.items || [];
      if (items.length === 0) return;

      const primaryItem = items[0];
      const scheduledItem = items.find(
        (item: any) => item.bookingType === 'scheduled' && item.scheduledAt,
      );

      const scheduledAt = scheduledItem?.scheduledAt
        ? new Date(scheduledItem.scheduledAt).getTime()
        : new Date().getTime();

      // Use saved address if activeLocation has savedAddressId, otherwise use userAddress
      const bookingAddress = activeLocation.savedAddressId
        ? addresses.find((a: any) => a.id === activeLocation.savedAddressId) || userAddress
        : userAddress;

      if (!bookingAddress) {
        Alert.alert('Address Required', 'Please add an address to continue');
        return;
      }

      // Create booking locally in WatermelonDB
      const newBookingId = await database.write(async () => {
        const nb = await database.get('bookings').create((booking: any) => {
          booking.serviceId = primaryItem.serviceId;
          booking.clientId = userId;
          booking.addressId = bookingAddress.id;
          booking.status = 'PENDING';
          booking.scheduledAt = scheduledAt;
          booking.totalPrice = getFinalAmount();
          booking.items = JSON.stringify(items);
        });

        await database.get('chats').create((chat: any) => {
          chat.bookingId = nb.id;
          chat.clientId = userId;
          chat.providerId = 'system';
        });
        return nb.id;
      });

      // Trigger sync immediately to push booking to server
      syncDatabase().catch(err => {
        console.error('Booking Sync Error:', err);
        Alert.alert('Sync Error', err.message);
      });

      // Clear cart after successful booking
      await api.delete('/cart/clear');

      // Send local notification
      NotificationService.sendLocalNotification(
        'Booking Confirmed! 🎉',
        `Your booking for ${primaryItem.title} has been received successfully.`
      );

      // Navigate to success screen
      navigation.navigate('BookingSuccess', {
        bookingId: newBookingId,
        totalPrice: getFinalAmount(),
        date: scheduledAt,
      });
    } catch (e) {
      console.error('Error confirming booking:', e);
      Alert.alert('Error', 'Failed to confirm booking');
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
  const subtotal = getTotalPrice();
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
          Review Booking
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
              Your cart is empty
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
                Continue Shopping
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
                Review Booking
              </Text>
              {items.map((item: any, index: number) => (
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
                      {item.title}
                    </Text>
                    {item.duration && (
                      <Text style={{ fontSize: 14, color: Theme.textSecondary, marginBottom: 4 }}>
                        {item.duration.label}
                      </Text>
                    )}
                    {item.bookingType === 'scheduled' && item.schedule ? (
                      <Text style={{ fontSize: 13, color: Theme.textSecondary, marginBottom: 4 }}>
                        {item.schedule.dayLabel}, {item.schedule.dateLabel} · {item.schedule.time}
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
                        Instant
                      </Text>
                    )}
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: Theme.primary }}>
                      ₹{item.price}
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
              ))}
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
                  Booking Details
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('AddressPicker')}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#10B981' }}>Change</Text>
                </TouchableOpacity>
              </View>

              {activeLocation ? (
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
                    <Text style={{ fontSize: 10, fontWeight: '900', color: Theme.primary }}>
                      {/* {activeLocation.label?.toUpperCase() || 'HOME'} */}
                      <MapPin />
                    </Text>
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
              ) : (
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
                  <Text style={{ color: Theme.primary, fontWeight: '800' }}>Add Address</Text>
                </TouchableOpacity>
              )}

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
                    Phone Number
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
                Bill Details
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 14, color: Theme.textSecondary }}>Item Total</Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: Theme.textPrimary }}>
                  ₹{subtotal}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 14, color: Theme.textSecondary }}>GST (18%)</Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: Theme.textPrimary }}>
                  ₹{gst}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 14, color: Theme.textSecondary }}>Service Fee (5%)</Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: Theme.textPrimary }}>
                  ₹{serviceFee}
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
                  To Pay
                </Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: Theme.primary }}>
                  ₹{finalAmount}
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
          {activeLocation && !activeLocation.isSupported ? (
            <View style={{ alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <AlertCircle size={24} color={Theme.error} style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.textPrimary }}>Not serviceable at your location</Text>
              </View>
              <Text style={{ fontSize: 13, color: Theme.textSecondary, marginBottom: 16, textAlign: 'center' }}>The location is out of our serviceable area</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('SearchLocation')}
                style={{ backgroundColor: Theme.primary, paddingVertical: 16, borderRadius: 20, alignItems: 'center', width: '100%', shadowColor: Theme.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 }}
              >
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>Change location</Text>
              </TouchableOpacity>
            </View>
          ) : (
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
                  Confirm Booking • ₹{finalAmount}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

export const CartScreen = withObservables([], () => ({
  addresses: database.collections.get('addresses').query().observe(),
}))(CartScreenBase);
