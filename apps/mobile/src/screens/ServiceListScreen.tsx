import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Star, Image as ImageIcon, Home, Bell, MessageCircle, Plus, Minus } from 'lucide-react-native';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';
import { database } from '../db';
import { Theme } from '../theme';
import { Skeleton } from '../components/Skeleton';
import api from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseEstimatedTime, calculatePriceForDuration, getNextDuration, getPrevDuration, isDurationAtMaximum, getMaxDurationMessage, MAX_DURATION_MINS } from '../utils/durationPriceUtils';

const ServiceListScreenBase = ({ route, navigation, services }: any) => {
  const { t, i18n } = useTranslation();
  const { title } = route.params;
  const [activeSort, setActiveSort] = React.useState('popular'); // popular, low_price, top_rated
  const [cart, setCart] = React.useState<any>(null);
  const [cartItemsMap, setCartItemsMap] = React.useState<Record<string, any>>({});

  React.useEffect(() => {
    fetchCart();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchCart();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart');
      setCart(res.data);
      const itemsMap: Record<string, any> = {};
      if (res.data?.items) {
        res.data.items.forEach((item: any) => {
          itemsMap[item.serviceId] = item;
        });
      }
      setCartItemsMap(itemsMap);
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };



  const handleAddToCart = async (serviceItem: any, currentDuration: number) => {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      if (!userId) {
        Alert.alert(t('cart.login_required'), t('cart.login_required_message'));
        return;
      }
      
      const itemBaseTime = Math.round(parseEstimatedTime(serviceItem.estimatedTime));

      // Check if duration exceeds maximum
      if (currentDuration > MAX_DURATION_MINS) {
        Alert.alert(
          'Maximum Duration Reached',
          getMaxDurationMessage()
        );
        return;
      }

      // Backend will calculate price based on duration
      const isFlexible = serviceItem.durationType !== 'FIXED';
      const itemToAdd = {
        serviceId: serviceItem.id,
        title: i18n.language === 'hi' ? serviceItem.nameHi : serviceItem.nameEn,
        quantity: 1,
        type: 'service',
        duration: {
          label: isFlexible ? `${currentDuration} mins` : serviceItem.estimatedTime || `${currentDuration} mins`
        }
      };

      await api.post('/cart', {
        item: itemToAdd,
        bookingType: 'instant' // assuming these are instant services based on UI
      });
      await fetchCart();
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleRemoveFromCart = async (serviceId: string) => {
    try {
      await api.delete('/cart', { serviceId });
      await fetchCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const sortedServices = React.useMemo(() => {
    let list = [...services];
    if (activeSort === 'low_price') {
      return list.sort((a, b) => Number(a.basePrice) - Number(b.basePrice));
    }
    if (activeSort === 'top_rated') {
      return list.sort(() => Math.random() - 0.5); // Mock rating sort
    }
    return list;
  }, [services, activeSort]);

  // Check if service is coming soon based on database field
  const isComingSoonService = (service: any) => {
    return service?.isComingSoon || false;
  };

  const handleNotifyMe = (service: any) => {
    // Handle notify me action
    console.log('Notify me for:', service.nameEn);
    // You can implement notification logic here
  };

  const handleWhatsApp = (service: any) => {
    const message = `Hi, I'm interested in ${service.nameEn} service. Please let me know when it's available.`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    Linking.openURL(whatsappUrl);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.background }}>
      <View style={{ backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 5, zIndex: 10 }}>
        <View style={{ paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.muted, justifyContent: 'center', alignItems: 'center' }}>
            <ChevronLeft size={24} color={Theme.textPrimary} />
          </TouchableOpacity>
          <View style={{ marginLeft: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: Theme.textPrimary }}>{title}</Text>
            <Text style={{ fontSize: 12, color: Theme.textSecondary, fontWeight: '700' }}>{services.length} services available</Text>
          </View>
        </View>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}>
          {[
            { id: 'popular', label: '🔥 Popular' },
            { id: 'low_price', label: '💰 Lowest Price' },
            { id: 'top_rated', label: '⭐ Top Rated' },
          ].map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => setActiveSort(item.id)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 14,
                backgroundColor: activeSort === item.id ? Theme.primary : Theme.muted,
                marginRight: 8,
                borderWidth: 1.5,
                borderColor: activeSort === item.id ? Theme.primary : Theme.border
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '800', color: activeSort === item.id ? 'white' : Theme.textSecondary }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <ScrollView style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 24, flexDirection: 'row', flexWrap: 'wrap' }}>
          {sortedServices.length === 0 ? (
            <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
              <Home size={64} color={Theme.textSecondary} style={{ marginBottom: 16 }} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.textSecondary, textAlign: 'center', marginBottom: 8 }}>
                {t('common.noServices')}
              </Text>
              <Text style={{ fontSize: 14, color: Theme.textSecondary, textAlign: 'center' }}>
                {t('common.noServicesDescription')}
              </Text>
            </View>
          ) : sortedServices.map((service: any, index: number) => {
            const isComingSoon = isComingSoonService(service);
            const cartItem = cartItemsMap[service.id];
            const isInCart = !!cartItem;
            
            // Check if service has flexible or fixed duration
            const isFlexibleDuration = service.durationType !== 'FIXED';
            
            // Calculate current duration for UI
            const baseTime = Math.round(parseEstimatedTime(service.estimatedTime));
            let currentDuration = baseTime;
            
            // For FIXED duration services, always use the base time
            // For FLEXIBLE duration services, use cart duration if available
            if (isFlexibleDuration && cartItem && cartItem.duration) {
              const cartTime = Math.round(parseEstimatedTime(cartItem.duration.label || cartItem.duration));
              if (baseTime > 0) {
                currentDuration = cartTime;
              }
            }

            // Calculate estimated price for display
            const basePrice = Number(service.basePrice);
            const currentEstimatedPrice = isFlexibleDuration 
              ? Math.round(calculatePriceForDuration(basePrice, baseTime, currentDuration))
              : basePrice; // FIXED duration services always use base price

            const handleIncrease = () => {
              // Prevent duration changes for FIXED duration services
              if (!isFlexibleDuration) {
                return;
              }
              
              const newDuration = Math.round(getNextDuration(currentDuration, baseTime));
              if (isDurationAtMaximum(newDuration)) {
                Alert.alert(
                  'Maximum Duration Reached',
                  getMaxDurationMessage()
                );
                return;
              }
              handleAddToCart(service, newDuration);
            };

            const handleDecrease = () => {
              // Prevent duration changes for FIXED duration services
              if (!isFlexibleDuration) {
                return;
              }
              
              // If already at base duration, remove from cart
              if (currentDuration === baseTime) {
                handleRemoveFromCart(service.id);
                return;
              }
              
              const newDuration = Math.round(getPrevDuration(currentDuration, baseTime));
              handleAddToCart(service, newDuration);
            };

            return (
            <TouchableOpacity
              key={service.id}
              onPress={() => navigation.navigate('ServiceDetail', { serviceId: service.id })}
              activeOpacity={0.9}
              style={{ width: '31.33%', marginRight: (index + 1) % 3 === 0 ? 0 : '3%', backgroundColor: 'white', borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, paddingBottom: 12 }}
            >
              <View style={{ width: '100%', aspectRatio: 1, backgroundColor: '#F8FAFC', borderTopLeftRadius: 16, borderTopRightRadius: 16, position: 'relative', overflow: 'hidden' }}>
                <ImageIcon size={24} color={'#CBD5E1'} style={{ position: 'absolute', alignSelf: 'center', top: '40%' }} />
                <Image
                  source={{ uri: service.imageUrl || 'https://images.unsplash.com/photo-1581578731548-c64695ce6958?q=80&w=400' }}
                  style={{ width: '100%', height: '100%', position: 'absolute' }}
                  resizeMode="cover"
                />
                <View style={{ position: 'absolute', top: 6, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, elevation: 2 }}>
                  <Star size={10} color="#f59e0b" fill="#f59e0b" />
                  <Text style={{ fontSize: 9, fontWeight: '800', color: Theme.textPrimary, marginLeft: 4 }}>4.9 (4k)</Text>
                </View>
              </View>

              <View style={{ paddingHorizontal: 8, paddingTop: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: Theme.textPrimary, lineHeight: 16, height: 32 }} numberOfLines={2}>
                  {i18n.language === 'hi' ? service.nameHi : service.nameEn}
                </Text>

                {isComingSoon ? (
                  <View style={{ marginTop: 8 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: Theme.accent }}>Coming Soon</Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: Theme.textPrimary }}>
                      ₹{currentEstimatedPrice}
                    </Text>
                    <Text style={{ fontSize: 10, color: Theme.textSecondary, textDecorationLine: 'line-through', marginLeft: 4 }}>
                      ₹{Math.round(currentEstimatedPrice * 1.4)}
                    </Text>
                  </View>
                )}
              </View>
              
              {/* Plus Button / Increment Decrement */}
              {!isComingSoon && (
                <View style={{ position: 'absolute', right: 8, top: '48%', zIndex: 10 }}>
                  {isInCart ? (
                    isFlexibleDuration ? (
                      <View style={{ backgroundColor: 'white', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4, flexDirection: 'row', alignItems: 'center', minWidth: 70, justifyContent: 'space-between' }}>
                        <TouchableOpacity onPress={handleDecrease} style={{ padding: 2 }}>
                          <Minus size={14} color={Theme.primary} />
                        </TouchableOpacity>
                        <View style={{ alignItems: 'center', paddingHorizontal: 2 }}>
                          <Text style={{ fontSize: 12, fontWeight: '900', color: Theme.primary }}>
                            {isFlexibleDuration ? Math.round(currentDuration) : service.estimatedTime}
                          </Text>
                          <Text style={{ fontSize: 8, color: Theme.textSecondary, marginTop: -2 }}>
                            {isFlexibleDuration ? 'Mins' : ''}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={handleIncrease} style={{ padding: 2 }}>
                          <Plus size={14} color={Theme.primary} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        onPress={() => handleRemoveFromCart(service.id)}
                        style={{ backgroundColor: 'white', borderRadius: 8, width: 32, height: 32, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 }}
                      >
                        <Minus size={18} color={Theme.primary} />
                      </TouchableOpacity>
                    )
                  ) : (
                    <TouchableOpacity 
                      onPress={() => handleAddToCart(service, baseTime)}
                      style={{ backgroundColor: 'white', borderRadius: 8, width: 32, height: 32, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 }}
                    >
                      <Plus size={18} color={Theme.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export const ServiceListScreen = withObservables(['route'], ({ route }: any) => {
  const { categoryId, subcategoryId } = route.params;
  
  if (subcategoryId) {
    return {
      services: database.collections.get('services').query(
        Q.where('subcategory_id', subcategoryId)
      ),
    };
  } else if (categoryId) {
    return {
      services: database.collections.get('services').query(
        Q.where('category_id', categoryId)
      ),
    };
  }
  
  return {
    services: database.collections.get('services').query(),
  };
})(ServiceListScreenBase);
