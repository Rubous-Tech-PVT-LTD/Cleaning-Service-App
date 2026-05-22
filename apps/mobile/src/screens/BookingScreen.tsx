import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Plus, X } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';
import { database } from '../db';
import { Theme } from '../theme';
import { SlotSelector } from '../components/SlotSelector';
import { NotificationService } from '../services/NotificationService';
import { syncDatabase } from '../db/sync';

const BookingScreenBase = ({ route, navigation, relatedServices, addresses }: any) => {
  const { t, i18n } = useTranslation();
  const { serviceId, title, price } = route.params;
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState({
    date: new Date(),
    time: '10:00 AM'
  });

  // Manage multiple items
  const [items, setItems] = useState<any[]>([
    { serviceId, title, price: Number(price), quantity: 1 }
  ]);

  const defaultAddress = addresses.find((a: any) => a.isDefault) || addresses[0];
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const addItem = (service: any) => {
    if (items.find(i => i.serviceId === service.id)) return;
    setItems([...items, { 
      serviceId: service.id, 
      title: i18n.language === 'hi' ? service.nameHi : service.nameEn, 
      price: Number(service.basePrice), 
      quantity: 1 
    }]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return; // Keep at least one
    setItems(items.filter(i => i.serviceId !== id));
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('user_id');
      if (!userId) throw new Error('User not logged in');

      const finalDate = new Date(selectedSlot.date);
      const [time, period] = selectedSlot.time.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (period === 'PM' && hours < 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      finalDate.setHours(hours, minutes, 0, 0);

      if (addresses.length === 0) {
        Alert.alert('Address Required', 'Please add a service address to proceed.');
        setLoading(false);
        return;
      }

      const newBookingId = await database.write(async () => {
        const nb = await database.get('bookings').create((booking: any) => {
          booking.serviceId = items[0].serviceId; // Primary service
          booking.clientId = userId;
          booking.addressId = defaultAddress.id;
          booking.status = 'PENDING';
          booking.scheduledAt = finalDate.getTime();
          booking.totalPrice = totalPrice;
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

      NotificationService.sendLocalNotification(
        'Booking Confirmed! 🎉',
        `Your booking for ${items[0].title} has been received successfully.`
      );

      navigation.navigate('BookingSuccess', { 
        bookingId: newBookingId, 
        totalPrice: totalPrice,
        date: finalDate.getTime()
      });
    } catch (error: any) {
      console.error('Booking Error:', error);
      Alert.alert('Error', 'Could not place booking.');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.background }}>
      <View style={{ paddingHorizontal: 24, paddingVertical: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 5, zIndex: 10 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.border, justifyContent: 'center', alignItems: 'center' }}>
          <ChevronLeft size={24} color={Theme.textPrimary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '900', color: Theme.textPrimary, marginLeft: 16 }}>{t('common.confirm_booking')}</Text>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={{ padding: 24 }}>
          {/* Selected Items List */}
          <View style={{ backgroundColor: 'white', padding: 24, borderRadius: 28, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, elevation: 5, marginBottom: 24 }}>
            <Text style={{ fontSize: 13, color: Theme.textSecondary, fontWeight: '800', marginBottom: 16, textTransform: 'uppercase' }}>{t('booking.selected_services')}</Text>
            {items.map((item, idx) => (
              <View key={item.serviceId}>
                {idx > 0 && <View style={{ height: 1, backgroundColor: Theme.muted, marginVertical: 12 }} />}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: Theme.textPrimary }}>{item.title}</Text>
                    <Text style={{ fontSize: 14, color: Theme.primary, fontWeight: '700', marginTop: 2 }}>₹{item.price}</Text>
                  </View>
                  {items.length > 1 && (
                    <TouchableOpacity onPress={() => removeItem(item.serviceId)} style={{ padding: 8 }}>
                      <X size={18} color={Theme.error} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
            <View style={{ height: 1, backgroundColor: Theme.border, marginVertical: 20 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 15, color: Theme.textSecondary, fontWeight: '800' }}>{t('booking.bill_total')}</Text>
              <Text style={{ fontSize: 24, fontWeight: '900', color: Theme.primary }}>₹{totalPrice}</Text>
            </View>
          </View>

          {/* Add More Items Section */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: Theme.textPrimary, marginBottom: 16 }}>{t('booking.frequently_added')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {relatedServices.filter((s: any) => !items.find(i => i.serviceId === s.id)).map((service: any) => (
                <TouchableOpacity
                  key={service.id}
                  onPress={() => addItem(service)}
                  style={{ width: 140, backgroundColor: 'white', borderRadius: 20, padding: 12, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOpacity: 0.02, elevation: 2 }}
                >
                  <Image source={{ uri: service.imageUrl || 'https://via.placeholder.com/100' }} style={{ width: '100%', aspectRatio: 1, borderRadius: 12, marginBottom: 8 }} />
                  <Text style={{ fontSize: 12, fontWeight: '800', color: Theme.textPrimary, height: 32 }} numberOfLines={2}>
                    {i18n.language === 'hi' ? service.nameHi : service.nameEn}
                  </Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: Theme.primary }}>₹{Number(service.basePrice)}</Text>
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: Theme.infoLight, justifyContent: 'center', alignItems: 'center' }}>
                      <Plus size={14} color={Theme.primary} />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Address Selection Section */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: Theme.textPrimary }}>{t('booking.service_address')}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AddressList')}>
                <Text style={{ color: Theme.primary, fontWeight: '800' }}>{t('booking.change')}</Text>
              </TouchableOpacity>
            </View>
            
            {defaultAddress ? (
              <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOpacity: 0.02, elevation: 2 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#F4EDFF', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: Theme.primary }}>{defaultAddress.label.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.textPrimary }} numberOfLines={1}>
                    {defaultAddress.addressLine1}
                  </Text>
                  <Text style={{ fontSize: 13, color: Theme.textSecondary, marginTop: 2 }} numberOfLines={1}>
                    {defaultAddress.city}, {defaultAddress.state}
                  </Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity 
                onPress={() => navigation.navigate('AddressPicker')}
                style={{ backgroundColor: '#F8FAFC', padding: 20, borderRadius: 24, borderStyle: 'dashed', borderWidth: 2, borderColor: '#E2E8F0', alignItems: 'center' }}
              >
                <Plus size={20} color={Theme.primary} style={{ marginBottom: 4 }} />
                <Text style={{ color: Theme.primary, fontWeight: '800' }}>{t('booking.add_address')}</Text>
              </TouchableOpacity>
            )}
          </View>

          <SlotSelector onSlotSelect={(date, time) => setSelectedSlot({ date, time })} />
        </View>
        <View style={{ height: 140 }} />
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingVertical: 20, paddingBottom: 32, backgroundColor: 'white', borderTopLeftRadius: 36, borderTopRightRadius: 36, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 25 }}>
        <TouchableOpacity onPress={handleConfirm} disabled={loading} style={{ backgroundColor: Theme.primary, paddingVertical: 16, borderRadius: 20, alignItems: 'center', shadowColor: Theme.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 }}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 }}>{t('booking.confirm_with_price')}{totalPrice}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export const BookingScreen = withObservables(['route'], ({ route }: any) => ({
  relatedServices: database.collections.get('services')
    .query(
      Q.where('id', Q.notEq(route.params.serviceId)),
      Q.take(5)
    )
    .observe(),
  addresses: database.collections.get('addresses').query().observe(),
}))(BookingScreenBase);
