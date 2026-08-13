import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronUp, ChevronDown } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme } from '../theme';
import api from '../api';
import { CartFooter } from '../components/CartFooter';
import { useAuth } from '../contexts/AuthContext';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { LoginRequiredModal } from '../components/LoginRequiredModal';

const DURATIONS = [
  { id: '0.5', label: '0.5 hr', price: 25, oldPrice: 125 },
  { id: '1', label: '1 hr', price: 49, oldPrice: 250 },
  { id: '1.5', label: '1.5 hrs', price: 74, oldPrice: 375 },
  { id: '2', label: '2 hrs', price: 98, oldPrice: 500 },
];

type ScheduleDate = {
  id: number;
  dateLabel: string;
  dayLabel: string;
  dateISO: string;
};

export const ScheduleForLaterScreen = ({ navigation }: any) => {
  const { isAuthenticated } = useAuth();
  const { requireAuth, showLoginModal, handleLoginPress, handleCloseModal } = useAuthGuard();
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showAllSlots, setShowAllSlots] = useState(false);
  const [dates, setDates] = useState<ScheduleDate[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [cartItem, setCartItem] = useState<any>(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const syncingRef = useRef(false);
  const restoredRef = useRef(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchScheduleOptions = async () => {
      try {
        setLoading(true);
        const res = await api.get('/services/schedule-options');
        setDates(res.data.dates || []);
        setTimeSlots(res.data.timeSlots || []);
      } catch (error) {
        console.error('Error fetching schedule options:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchScheduleOptions();
  }, []);

  useEffect(() => {
    fetchCartData();

    const unsubscribe = navigation.addListener('focus', () => {
      restoredRef.current = false;
      fetchCartData();
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (restoredRef.current || !dates.length || !cartItem) return;
    if (cartItem.bookingType !== 'scheduled') return;

    restoredRef.current = true;
    setSelectedDuration(cartItem.duration?.id || null);

    const dateMatch = dates.find(
      (d) =>
        d.dateISO === cartItem.schedule?.dateISO || d.id === cartItem.schedule?.dateId,
    );
    setSelectedDate(dateMatch?.id ?? cartItem.schedule?.dateId ?? null);
    setSelectedTime(cartItem.schedule?.time || null);
  }, [dates, cartItem]);

  useEffect(() => {
    if (selectedDuration == null || selectedDate == null || !selectedTime) return;
    if (!dates.length) return;
    syncScheduledToCart(selectedDuration, selectedDate, selectedTime);
  }, [selectedDuration, selectedDate, selectedTime, dates]);

  const fetchCartData = async () => {
    try {
      if (!isAuthenticated) {
        setCartItem(null);
        return;
      }

      const res = await api.get('/cart');
      console.log('Cart response:', res.data);
      
      // Handle both old JSON format and new CartItem table format
      let items = res.data.items || [];
      
      // If items is empty, check if cartItems array exists (new format)
      if (!items || items.length === 0) {
        items = res.data.cartItems || [];
      }
      
      const hourlyItem = items.find((item: any) => item.type === 'hourly');
      console.log('Hourly item found:', hourlyItem);
      setCartItem(hourlyItem || null);
    } catch (e) {
      console.error('Error fetching cart:', e);
      setCartItem(null);
    }
  };

  const syncScheduledToCart = async (
    durationId: string,
    dateId: number,
    time: string,
  ) => {
    if (!requireAuth()) return;
    if (syncingRef.current) return;

    const duration = DURATIONS.find((d) => d.id === durationId);
    const dateInfo = dates.find((d) => d.id === dateId);
    if (!duration || !dateInfo) return;

    if (
      cartItem?.bookingType === 'scheduled' &&
      cartItem?.duration?.id === durationId &&
      cartItem?.schedule?.dateId === dateId &&
      cartItem?.schedule?.time === time
    ) {
      return;
    }

    try {
      syncingRef.current = true;
      setCartLoading(true);

      const item = {
        type: 'hourly',
        serviceId: 'hourly-service',
        title: 'Hourly Service',
        duration,
        price: duration.price,
        quantity: 1,
      };

      const schedule = {
        dateId: dateInfo.id,
        dateLabel: dateInfo.dateLabel,
        dayLabel: dateInfo.dayLabel,
        dateISO: dateInfo.dateISO,
        time,
      };

      const res = await api.post('/cart', {
        item,
        bookingType: 'scheduled',
        schedule,
      });

      console.log('Cart add response:', res.data);
      
      // Handle both old JSON format and new CartItem table format
      let items = res.data?.items || [];
      
      // If items is empty, check if cartItems array exists (new format)
      if (!items || items.length === 0) {
        items = res.data?.cartItems || [];
      }
      
      const hourlyItem = items.find((i: any) => i.type === 'hourly');
      console.log('Setting cart item:', hourlyItem);
      setCartItem(hourlyItem || null);
    } catch (e) {
      console.error('Error adding scheduled service to cart:', e);
      Alert.alert('Error', 'Failed to add to cart');
    } finally {
      setCartLoading(false);
      syncingRef.current = false;
    }
  };

  const displayedSlots = showAllSlots ? timeSlots : timeSlots.slice(0, 9);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#FFFFFF',
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginRight: 8 }}>
          <ArrowLeft size={24} color={Theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule for later</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Duration</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {DURATIONS.map((dur) => (
              <TouchableOpacity
                key={dur.id}
                disabled={cartLoading}
                style={[styles.card, selectedDuration === dur.id && styles.selectedCard]}
                onPress={() => setSelectedDuration(dur.id)}
              >
                <Text style={styles.cardTitle}>{dur.label}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>₹{dur.price}</Text>
                  <Text style={styles.oldPrice}>₹{dur.oldPrice}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {dates.map((date) => (
              <TouchableOpacity
                key={date.id}
                disabled={cartLoading}
                style={[styles.card, selectedDate === date.id && styles.selectedCard]}
                onPress={() => setSelectedDate(date.id)}
              >
                <Text style={styles.cardTitle}>{date.dateLabel}</Text>
                <Text style={styles.cardSubtitle}>{date.dayLabel}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select time</Text>
          <View style={styles.grid}>
            {displayedSlots.map((time) => (
              <TouchableOpacity
                key={time}
                disabled={cartLoading}
                style={[styles.gridCard, selectedTime === time && styles.selectedCard]}
                onPress={() => setSelectedTime(time)}
              >
                <Text style={styles.cardTitle}>{time}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {timeSlots.length > 9 && (
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setShowAllSlots(!showAllSlots)}
            >
              <Text style={styles.toggleText}>
                {showAllSlots ? 'Hide slots' : 'View all slots'}
              </Text>
              {showAllSlots ? (
                <ChevronUp size={16} color={Theme.primary} />
              ) : (
                <ChevronDown size={16} color={Theme.primary} />
              )}
            </TouchableOpacity>
          )}
        </View>

        {cartLoading && (
          <View style={{ paddingVertical: 16, alignItems: 'center' }}>
            <ActivityIndicator color={Theme.primary} />
          </View>
        )}

        <View style={{ height: 160 }} />
      </ScrollView>

      <CartFooter
        itemCount={cartItem ? 1 : 0}
        onNavigateToCart={() => navigation.navigate('Cart')}
        show={!!cartItem}
      />
      <LoginRequiredModal
        visible={showLoginModal}
        onClose={handleCloseModal}
        onLogin={handleLoginPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.textPrimary,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    minWidth: 80,
    backgroundColor: '#FFFFFF',
    marginRight: 12,
  },
  selectedCard: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.textPrimary,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Theme.textSecondary,
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  price: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Theme.textPrimary,
  },
  oldPrice: {
    fontSize: 10,
    color: Theme.textSecondary,
    textDecorationLine: 'line-through',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '31%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  toggleButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.primary,
  },
});
