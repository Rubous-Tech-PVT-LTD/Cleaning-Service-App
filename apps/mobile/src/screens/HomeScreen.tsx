import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Dimensions, Animated, TextInput, RefreshControl, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Search, WifiOff, History, ShieldCheck, Clock, Star, Phone, ChevronDown, Home, Zap, MessageCircle, User, MapPin, Calendar, ChevronDown as DownArrow, Plus, Minus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme } from '../theme'
import { Skeleton } from '../components/Skeleton';
import { FAQItem } from '../components/FAQItem';
import { QUICK_CATEGORIES } from '../constants';
import { syncDatabase } from '../db/sync';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { LoginRequiredModal } from '../components/LoginRequiredModal';
import { getActiveLocation, ActiveLocation } from '../services/locationService';
import withObservables from '@nozbe/with-observables';
import { database } from '../db';
import api from '../api';
import { parseEstimatedTime, calculatePriceForDuration, getNextDuration, getPrevDuration, isDurationAtMaximum, getMaxDurationMessage, DURATION_INCREMENT_MINS, MAX_DURATION_MINS } from '../utils/durationPriceUtils';

const HomeScreen = ({ navigation, categories, services }: any) => {
  const { t, i18n } = useTranslation();
  const { requireAuth, showLoginModal, handleLoginPress, handleCloseModal } = useAuthGuard();
  const [isOffline, setIsOffline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { width, height } = Dimensions.get('window');
  const { top: safeTop, bottom: safeBottom } = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [savedAddress, setSavedAddress] = useState<ActiveLocation | null>(null);
  const [trendingServices, setTrendingServices] = useState<any[]>([]);
  
  const [cart, setCart] = useState<any>(null);
  const [cartItemsMap, setCartItemsMap] = useState<Record<string, any>>({});

  useEffect(() => {
    loadAddress();
    fetchTrendingServices();
    fetchCart();
  }, [navigation]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadAddress();
      fetchTrendingServices();
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
      const itemToAdd = {
        serviceId: serviceItem.id,
        title: i18n.language === 'hi' ? serviceItem.nameHi : serviceItem.nameEn,
        quantity: 1,
        type: 'service',
        duration: {
          label: `${currentDuration} mins`
        }
      };

      await api.post('/cart', {
        item: itemToAdd,
        bookingType: 'instant' 
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

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await syncDatabase();
      await fetchCart();
    } catch (e) {
      console.error('Manual sync failed:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const loadAddress = async () => {
    const data = await getActiveLocation();
    if (data) setSavedAddress(data);
  };

  const fetchTrendingServices = async () => {
    try {
      const response = await api.get('/services/trending');
      setTrendingServices(response.data);
    } catch (error) {
      console.error('Failed to fetch trending services:', error);
    }
  };

  const searchPlaceholders = t('search.placeholders', { returnObjects: true }) as string[];
  const quickCategoryNames = t('home.quick_categories', { returnObjects: true }) as any;
  const offers = t('home.offers', { returnObjects: true }) as Array<{ label: string; title: string; subtitle: string; code_prefix: string; code: string }>;
  const faqs = t('home.faqs', { returnObjects: true }) as Array<{ q: string; a: string }>;

  const stickyOpacity = scrollY.interpolate({ inputRange: [300, 450], outputRange: [0, 1], extrapolate: 'clamp' });
  const stickyTranslate = scrollY.interpolate({ inputRange: [300, 450], outputRange: [-70, 0], extrapolate: 'clamp' });

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const placeholderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const safePlaceholders = Array.isArray(searchPlaceholders) && searchPlaceholders.length ? searchPlaceholders : [''];
    const interval = setInterval(() => {
      Animated.timing(placeholderAnim, { toValue: -30, duration: 800, useNativeDriver: true }).start(() => {
        setPlaceholderIndex((prev) => (prev + 1) % safePlaceholders.length);
        placeholderAnim.setValue(30);
        Animated.timing(placeholderAnim, { toValue: 0, duration: 800, useNativeDriver: true }).start();
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [searchPlaceholders, i18n.language]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: Theme.primary }}>
      <View style={{ height: safeTop }} />

    {!(savedAddress && !savedAddress.isSupported) && (
      <Image 
          source={require('../assets/Home.png')}
          style={{ position: 'absolute', top: 160, left: 0, right: 0, height: '20%',width:'100%', zIndex: 0 }}
          resizeMode="cover"
        />
    )}
      {/* ===== PURPLE STICKY HEADER ===== */}
      <Animated.View style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 999,
        opacity: stickyOpacity,
        transform: [{ translateY: stickyTranslate }],
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 12,
        paddingTop: safeTop,
      }}>
        
        <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 }}>
            
            <Search size={14} color={Theme.textSecondary} />
            <Text style={{ marginLeft: 8, fontSize: 13, color: Theme.textSecondary, fontWeight: '500' }}>{t('search.sticky_placeholder')}</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10 }} style={{ height: 56 }}>
          {QUICK_CATEGORIES.map((cat) => {
            const catId = (categories || []).find((c: any) => c?.slug === cat.slug || c?.nameEn === cat.nameEn)?.id;
            const category = (categories || []).find((c: any) => c?.id === catId);
            const displayName = category ? (i18n.language === 'hi' ? (category?.nameHi || category?.nameEn) : category?.nameEn) : cat.nameEn;
            return (
              <TouchableOpacity
                key={cat.slug}
                onPress={() => {
                  if (catId) {
                    if (category?.hasSubcategories) {
                      navigation.navigate('SubcategoryList', {
                        categoryId: catId,
                        categoryName: displayName
                      });
                    } else {
                      navigation.navigate('ServiceList', {
                        categoryId: catId,
                        title: displayName
                      });
                    }
                  }
                }}
                style={{ alignItems: 'center', marginRight: 16, flexDirection: 'row', gap: 6, backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}
              >
                <Image source={cat.img} style={{ width: 22, height: 22 }} resizeMode="contain" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: Theme.primary }}>{displayName}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        style={{ zIndex: 10 }}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="white"
            colors={[Theme.primary]}
            progressViewOffset={safeTop + 60}
          />
        }
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 10, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('SearchLocation')}
            style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}
          >
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <MapPin size={22} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontFamily: 'Poppins_500Medium', color: 'rgba(255,255,255,0.7)' }}>{savedAddress?.label || t('common.location')}</Text>
              <Text style={{ fontSize: 15, fontFamily: 'Poppins_500Medium', color: 'white' }} numberOfLines={1}>
                {savedAddress?.address || t('address.select_location')}
              </Text>
            </View>
            <DownArrow size={20} color="white" />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {isOffline && <WifiOff size={20} color={Theme.accent} style={{ marginRight: 16 }} />}

          </View>
        </View>

        {/* Search Bar */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24, marginTop: 4 }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Search')}
            activeOpacity={0.8}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 8 }}
          >
            <Search size={20} color={Theme.textSecondary} />
            <View style={{ flex: 1, marginLeft: 12, height: 22, justifyContent: 'center', overflow: 'hidden' }}>
              <Animated.Text style={{
                position: 'absolute',
                color: Theme.textSecondary,
                fontSize: 15,
                fontWeight: '600',
                transform: [{ translateY: placeholderAnim }]
              }}>
                {t('search.for_prefix')}{(Array.isArray(searchPlaceholders) && searchPlaceholders[placeholderIndex]) || ''}{t('search.for_suffix')}
              </Animated.Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Action Cards */}
        {!(savedAddress && !savedAddress.isSupported) && (
          <View style={{ paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', gap: 12,marginTop:150}}>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('InstantService')}
                style={{ flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 16, height: 110, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4 }}
              >
                <Text style={{ fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: Theme.textPrimary, lineHeight: 20, marginBottom: 12 }}>{t('home.instant_service')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.muted, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start' }}>
                  <Zap size={14} color={Theme.primary} />
                  <Text style={{ fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: Theme.primary, marginLeft: 4 }}>{t('home.instant_eta')}</Text>
                </View>
                <View style={{ position: 'absolute', right: -6, bottom: -6 }}>
                  <Zap size={48} color={Theme.primary} opacity={0.1} />
                </View>
              </TouchableOpacity>

            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('ServiceSelection')}
                style={{ flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 16, height: 110, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4 }}
              >
                <Text style={{ fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: Theme.textPrimary, lineHeight: 20, marginBottom: 12 }}>{t('home.schedule_later')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.muted, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start' }}>
                  <Text style={{ fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: Theme.primary }}>{t('home.schedule_prefix')}
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={{ position: 'absolute', right: -6, bottom: -6 }}>
                  <Calendar size={48} color={Theme.primary} opacity={0.1} />
                </View>
              </TouchableOpacity>
          </View>
        )}

        {/* Coming Soon Section - Full width when location not supported */}
        {savedAddress && !savedAddress.isSupported && (
          <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
            <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4 }}>
              <Text style={{ fontSize: 28, fontWeight: '900', color: '#6B7280', textAlign: 'center', lineHeight: 36, marginBottom: 12 }}>
                {t('home.coming_soon_title_prefix')}<Text style={{ color: Theme.primary }}>{t('home.coming_soon_title_suffix')}</Text>
              </Text>
              
              <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 24, paddingHorizontal: 16 }}>
                {t('home.coming_soon_body')}
              </Text>

           
              {/* Notify Me Button */}
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 30, marginBottom: 16, shadowColor: Theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}>
                <MessageCircle size={18} color="white" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 15, fontWeight: '700', color: 'white' }}>{t('home.notify_me')}</Text>
              </TouchableOpacity>

              {/* Change Location Link */}
              <TouchableOpacity 
                onPress={() => navigation.navigate('SearchLocation')}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
              >
                <MapPin size={14} color={Theme.primary} style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.primary }}>{t('home.change_location')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bottom Section */}
        <View style={{ backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: 40, paddingTop: 24, minHeight: height * 0.6 }}>
          <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
            <View style={{ marginBottom: 20, paddingHorizontal: 8 }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: Theme.textPrimary }}>All house help services</Text>
              <Text style={{ fontSize: 14, color: Theme.textSecondary, marginTop: 4 }}>Schedule & book for later</Text>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
              {(!services || services.length === 0) ? (
                  [1, 2, 3, 4, 5, 6].map((i) => (
                  <View key={i} style={{ width: '31.33%', marginRight: i % 3 === 0 ? 0 : '3%', marginBottom: 16, alignItems: 'center' }}>
                    <Skeleton style={{ width: '100%', aspectRatio: 1, borderRadius: 24, marginBottom: 12 }} />
                    <Skeleton style={{ width: '70%', height: 12, borderRadius: 6 }} />
                  </View>
                ))
              ) : (() => {
                  const dailyHomeHelpCategory = (categories || []).find((c: any) => c?.nameEn === 'Daily Home Help');
                  const dailyHomeHelpCategoryId = dailyHomeHelpCategory?.id;
                  const filteredServices = services.filter((s: any) => s.categoryId === dailyHomeHelpCategoryId);

                  return filteredServices.map((service: any, index: number) => {
                    const isComingSoon = service.subcategoryNameEn ? 
                      (service.subcategoryNameEn.toLowerCase().includes('plumbing') || 
                      service.subcategoryNameEn.toLowerCase().includes('plumber') || 
                      service.subcategoryNameEn.toLowerCase().includes('electrical') || 
                      service.subcategoryNameEn.toLowerCase().includes('electrician')) : false;

                    const cartItem = cartItemsMap[service.id];
                    const isInCart = !!cartItem;
                    
                    // Calculate current duration for UI
                    const baseTime = Math.round(parseEstimatedTime(service.estimatedTime));
                    let currentDuration = baseTime;
                    if (cartItem && cartItem.duration) {
                      const cartTime = Math.round(parseEstimatedTime(cartItem.duration.label || cartItem.duration));
                      if (baseTime > 0) {
                        currentDuration = cartTime;
                      }
                    }

                    // Calculate estimated price for display
                    const basePrice = Number(service.basePrice);
                    const currentEstimatedPrice = Math.round(calculatePriceForDuration(basePrice, baseTime, currentDuration));

                    const handleIncrease = () => {
                      const newDuration = Math.round(getNextDuration(currentDuration));
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
                        {service.imageUrl ? (
                          <Image source={{ uri: service.imageUrl }} style={{ width: '100%', height: '100%', position: 'absolute' }} resizeMode="cover" />
                        ) : (
                          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.border, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', top: '30%' }}>
                            <Home size={20} color={Theme.textSecondary} />
                          </View>
                        )}
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
                            <View style={{ backgroundColor: 'white', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4, flexDirection: 'row', alignItems: 'center', minWidth: 70, justifyContent: 'space-between' }}>
                              <TouchableOpacity onPress={handleDecrease} style={{ padding: 2 }}>
                                <Minus size={14} color={Theme.primary} />
                              </TouchableOpacity>
                              <View style={{ alignItems: 'center', paddingHorizontal: 2 }}>
                                <Text style={{ fontSize: 12, fontWeight: '900', color: Theme.primary }}>{Math.round(currentDuration)}</Text>
                                <Text style={{ fontSize: 8, color: Theme.textSecondary, marginTop: -2 }}>Mins</Text>
                              </View>
                              <TouchableOpacity onPress={handleIncrease} style={{ padding: 2 }}>
                                <Plus size={14} color={Theme.primary} />
                              </TouchableOpacity>
                            </View>
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
                  });
              })()}
              </View>
          </View>

          {/* Categories Section Restored */}
          <View style={{ paddingHorizontal: 24, paddingBottom: 40, marginTop: 10 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: Theme.textPrimary, marginBottom: 20 }}>{t('common.categories', 'Categories')}</Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                {(!categories || categories.length === 0) ? (
                  [1, 2, 3, 4, 5, 6].map((i) => (
                  <View key={i} style={{ width: '31.33%', marginRight: i % 3 === 0 ? 0 : '3%', marginBottom: 16, alignItems: 'center' }}>
                    <Skeleton style={{ width: '100%', aspectRatio: 1, borderRadius: 24, marginBottom: 12 }} />
                    <Skeleton style={{ width: '70%', height: 12, borderRadius: 6 }} />
                  </View>
                ))
              ) : categories.filter((c: any) => c && c.nameEn && c.nameEn !== 'Hourly Services').reduce((acc: any[], current: any) => {
                if (!acc.find((item: any) => item.nameEn === current.nameEn)) {
                  acc.push(current);
                }
                return acc;
              }, []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((item: any, index: number) => {
                const nameEn = item?.nameEn || '';
                const displayName = i18n.language === 'hi' ? (item?.nameHi || nameEn) : nameEn;
                const imageSource = item?.iconUrl ? { uri: item.iconUrl } : null;

                const mockPrice = 25 + (index * 5);
                const mockOldPrice = mockPrice + 100;
                const mockRating = (4.5 + (index % 5) * 0.1).toFixed(1);
                const mockReviews = `${(2 + index * 1.5).toFixed(1)}k`;
                const isNew = index === 0 || index === 7;

                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => {
                      if (item.hasSubcategories) {
                        navigation.navigate('SubcategoryList', {
                          categoryId: item.id,
                          categoryName: displayName
                        });
                      } else {
                        navigation.navigate('ServiceList', {
                          categoryId: item.id,
                          title: displayName
                        });
                      }
                    }}
                    style={{ width: '31.33%', marginRight: (index + 1) % 3 === 0 ? 0 : '3%', marginBottom: 24, backgroundColor: 'white', borderRadius: 16 }}
                  >
                    <View style={{ width: '100%', aspectRatio: 1.1, backgroundColor: '#F4F5F5', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}>
                      {isNew && (
                        <View style={{ position: 'absolute', top: 0, left: 0, backgroundColor: '#FF0000', paddingHorizontal: 6, paddingVertical: 2, borderBottomRightRadius: 8, borderTopLeftRadius: 12, zIndex: 10 }}>
                          <Text style={{ color: 'white', fontFamily: 'Poppins_600SemiBold', fontSize: 9 }}>{t('home.new_badge')}</Text>
                        </View>
                      )}
                      <View style={{ position: 'absolute', top: -6, right: 6, backgroundColor: 'white', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, flexDirection: 'row', alignItems: 'center', zIndex: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }}>
                        <Text style={{ fontSize: 9 }}>⭐</Text>
                        <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 9, color: '#666', marginLeft: 2 }}>{mockRating} ({mockReviews})</Text>
                      </View>
                      {imageSource ? (
                        <Image source={imageSource} style={{ width: '85%', height: '85%' }} resizeMode="contain" />
                      ) : (
                        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.border, justifyContent: 'center', alignItems: 'center' }}>
                          <Home size={20} color={Theme.textSecondary} />
                        </View>
                      )}
                    </View>
                    <View style={{ paddingTop: 8, paddingHorizontal: 2 }}>
                      <Text
                        style={{ fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#111', lineHeight: 18 }}
                        numberOfLines={2}
                      >
                        {displayName}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                        <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 14, color: '#111' }}>₹{mockPrice}</Text>
                        <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#999', textDecorationLine: 'line-through', marginLeft: 6 }}>₹{mockOldPrice}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
              </View>
          </View>

          {/* Exclusive Offers */}
        
           <View style={{ paddingBottom: 40 }}>
            <View style={{ paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: Theme.textPrimary }}>{t('home.exclusive_offers')}</Text>
              <TouchableOpacity><Text style={{ color: Theme.primary, fontWeight: '700' }}>{t('home.see_all')}</Text></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
              {Array.isArray(offers) && offers.map((offer: any, i: number) => (
                <OfferCard
                  key={i}
                  title={offer.title}
                  subtitle={offer.subtitle}
                  code={offer.code}
                  codePrefix={offer.code_prefix || ''}
                  label={offer.label}
                />
              ))}
            </ScrollView>
          </View>

          {/* Trust Section */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 40 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: Theme.textPrimary, marginBottom: 20 }}>{t('home.why_houcee')}</Text>
            <View style={{ backgroundColor: Theme.background, borderRadius: 32, padding: 28, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <TrustItem icon={<ShieldCheck size={24} color={Theme.primary} />} label={t('home.trust_verified_pro')} />
              <TrustItem icon={<Clock size={24} color={Theme.primary} />} label={t('home.trust_on_time')} />
              <TrustItem icon={<Star size={24} color={Theme.primary} />} label={t('home.trust_quality')} />
              <TrustItem icon={<Phone size={24} color={Theme.primary} />} label={t('home.trust_support')} />
            </View>
          </View>
          
          {/* Trending Services */}
         <View style={{ paddingBottom: 60 }}>
            <View style={{ paddingHorizontal: 24, marginBottom: 16 }}><Text style={{ fontSize: 20, fontWeight: '900', color: Theme.textPrimary }}>{t('home.trending_now')}</Text></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
              {trendingServices.map((service: any, index: number) => {
                const isComingSoon = service.subcategoryNameEn ? 
                  (service.subcategoryNameEn.toLowerCase().includes('plumbing') || 
                   service.subcategoryNameEn.toLowerCase().includes('plumber') || 
                   service.subcategoryNameEn.toLowerCase().includes('electrical') || 
                   service.subcategoryNameEn.toLowerCase().includes('electrician')) : false;
                return (
                <TrendingCard
                  key={service.id}
                  index={index}
                  title={i18n.language === 'hi' ? service.nameTranslations?.hi : service.nameTranslations?.en}
                  price={`₹${service.basePrice}`}
                  image={service.imageUrl ? { uri: service.imageUrl } : require('../assets/Cleaning-Kit-Image.png')}
                  onPress={() => navigation.navigate('ServiceDetail', { serviceId: service.id })}
                  isComingSoon={isComingSoon}
                />
                );
              })}
            </ScrollView>
          </View>

          {/* FAQ Section */}
   <View style={{ paddingHorizontal: 24, paddingBottom: 120, marginTop: 10 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: Theme.textPrimary, marginBottom: 20 }}>{t('home.common_questions')}</Text>
            {Array.isArray(faqs) && faqs.map((f: any, i: number) => (
              <FAQItem key={i} question={f.q} answer={f.a} />
            ))}
          </View>
        </View>
      </Animated.ScrollView>
     <BottomNav
        active="home"
        onTabPress={(tab: string) => {
          if (tab === 'profile') requireAuth(() => navigation.navigate('Profile'));
          if (tab === 'services') navigation.navigate('Search');
          if (tab === 'chat') requireAuth(() => navigation.navigate('MyBookings'));
        }}
      />
      <LoginRequiredModal
        visible={showLoginModal}
        onClose={handleCloseModal}
        onLogin={handleLoginPress}
      />
    </View>
  );
};


const OfferCard = ({ title, subtitle, code, codePrefix, label }: any) => (
  <TouchableOpacity style={{ width: 300, height: 160, borderRadius: 32, marginRight: 20, overflow: 'hidden' }}>
    <LinearGradient colors={[Theme.primary, Theme.primary]} style={{ flex: 1, padding: 24 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <Text style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 }}>{label}</Text>
      <Text style={{ color: 'white', fontWeight: '900', fontSize: 28, marginTop: 4 }}>{title}</Text>
      <Text style={{ color: 'white', fontSize: 14, marginTop: 8, opacity: 0.9 }}>{subtitle}</Text>
      <View style={{ position: 'absolute', bottom: 16, left: 24, backgroundColor: 'white', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 }}>
        <Text style={{ color: Theme.primary, fontWeight: 'bold', fontSize: 12 }}>{codePrefix}{code}</Text>
      </View>
    </LinearGradient>
  </TouchableOpacity>
);
const TrustItem = ({ icon, label }: any) => (
  <View style={{ width: '45%', marginBottom: 24, alignItems: 'center' }}>
    <View style={{ width: 56, height: 56, borderRadius: 20, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', marginBottom: 12, elevation: 3 }}>{icon}</View>
    <Text style={{ fontSize: 13, fontWeight: '800', color: Theme.textPrimary, textAlign: 'center' }}>{label}</Text>
  </View>
);
const BottomNav = ({ active, onTabPress }: any) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  return (
    <View style={{ 
      position: 'absolute', 
      bottom: 0, 
      left: 0, 
      right: 0, 
      height: 65 + insets.bottom, 
      backgroundColor: 'white', 
      flexDirection: 'row', 
      borderTopLeftRadius: 30, 
      borderTopRightRadius: 30, 
      shadowColor: '#000', 
      shadowOffset: { width: 0, height: -10 }, 
      shadowOpacity: 0.05, 
      shadowRadius: 15, 
      elevation: 20, 
      zIndex: 999,
      paddingHorizontal: 20, 
      justifyContent: 'space-between', 
      alignItems: 'center',
      paddingBottom: insets.bottom
    }}>
      <NavTab icon={<Home size={24} />} label={t('home.nav_home')} active={active === 'home'} onPress={() => onTabPress('home')} />
     
      <NavTab icon={<History size={24} />} label={t('home.nav_my_booking')} active={active === 'chat'} onPress={() => onTabPress('chat')} />
      <NavTab icon={<User size={24} />} label={t('home.nav_profile')} active={active === 'profile'} onPress={() => onTabPress('profile')} />
    </View>
  );
};
const NavTab = ({ icon, label, active, onPress }: any) => (
  <TouchableOpacity onPress={onPress} style={{ alignItems: 'center', padding: 10 }}>
    {React.cloneElement(icon, { color: active ? Theme.primary : Theme.textSecondary })}
    <Text style={{ fontSize: 10, fontFamily: 'Poppins_500Medium', marginTop: 4, color: active ? Theme.primary : Theme.textSecondary }}>{label}</Text>
  </TouchableOpacity>
);
const TrendingCard = ({ title, price, image, onPress, index, isComingSoon }: any) => {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: (index || 0) * 100,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 6,
        tension: 40,
        delay: (index || 0) * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, fadeAnim, slideAnim]);

  return (
    <Animated.View style={{ transform: [{ translateX: slideAnim }], opacity: fadeAnim }}>
      <TouchableOpacity style={{ width: 160, marginRight: 16 }} onPress={onPress}>
        <View style={{ width: 160, height: 160, borderRadius: 32, backgroundColor: 'white', elevation: 5, marginBottom: 12, overflow: 'hidden' }}>
          <Image source={typeof image === 'string' ? { uri: image } : image} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>
        <Text style={{ fontFamily: 'Poppins_600SemiBold', color: Theme.textPrimary, fontSize: 14 }}>{title}</Text>
        {isComingSoon ? (
          <Text style={{ color: Theme.accent, fontFamily: 'Poppins_700Bold', marginTop: 4 }}>Coming Soon</Text>
        ) : (
          <Text style={{ color: Theme.primary, fontFamily: 'Poppins_700Bold', marginTop: 4 }}>{price}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export const EnhancedHomeScreen = withObservables([], () => ({
  categories: database.collections.get('categories').query().observeWithColumns(['order']),
  services: database.collections.get('services').query().observe(),
}))(HomeScreen);

