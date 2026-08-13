import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Dimensions, Animated, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Search, WifiOff, History, ShieldCheck, Clock, Star, Phone, ChevronDown, Home, Zap, MessageCircle, User, MapPin, Calendar, ChevronDown as DownArrow} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme } from '../theme'
import { Skeleton } from '../components/Skeleton';
import { FAQItem } from '../components/FAQItem';
import { QUICK_CATEGORIES, SEARCH_PLACEHOLDERS } from '../constants';
import { syncDatabase } from '../db/sync';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { LoginRequiredModal } from '../components/LoginRequiredModal';
import { getActiveLocation, ActiveLocation } from '../services/locationService';
import withObservables from '@nozbe/with-observables';
import { database } from '../db';

const HomeScreen = ({ navigation, categories }: any) => {
  const { t, i18n } = useTranslation();
  const { requireAuth, showLoginModal, handleLoginPress, handleCloseModal } = useAuthGuard();
  const [isOffline, setIsOffline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { width, height } = Dimensions.get('window');
  const { top: safeTop, bottom: safeBottom } = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [savedAddress, setSavedAddress] = useState<ActiveLocation | null>(null);

  useEffect(() => {
    loadAddress();
  }, [navigation]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadAddress();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await syncDatabase();
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

  // Sticky header animation
  const stickyOpacity = scrollY.interpolate({ inputRange: [300, 450], outputRange: [0, 1], extrapolate: 'clamp' });
  const stickyTranslate = scrollY.interpolate({ inputRange: [300, 450], outputRange: [-70, 0], extrapolate: 'clamp' });

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const placeholderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(placeholderAnim, { toValue: -30, duration: 800, useNativeDriver: true }).start(() => {
        setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
        placeholderAnim.setValue(30);
        Animated.timing(placeholderAnim, { toValue: 0, duration: 800, useNativeDriver: true }).start();
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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
            <Text style={{ marginLeft: 8, fontSize: 13, color: Theme.textSecondary, fontWeight: '500' }}>Search services...</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10 }} style={{ height: 56 }}>
          {QUICK_CATEGORIES.map((cat) => {
            const catId = (categories || []).find((c: any) => c?.slug === cat.slug || c?.nameEn === cat.nameEn)?.id;
            return (
              <TouchableOpacity
                key={cat.slug}
                onPress={() => {
                  if (catId) {
                    const category = (categories || []).find((c: any) => c?.id === catId);
                    if (category?.hasSubcategories) {
                      navigation.navigate('SubcategoryList', {
                        categoryId: catId,
                        categoryName: cat.nameEn
                      });
                    } else {
                      navigation.navigate('ServiceList', {
                        categoryId: catId,
                        title: cat.nameEn
                      });
                    }
                  }
                }}
                style={{ alignItems: 'center', marginRight: 16, flexDirection: 'row', gap: 6, backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}
              >
                <Image source={cat.img} style={{ width: 22, height: 22 }} resizeMode="contain" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: Theme.primary }}>{cat.nameEn}</Text>
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
                {savedAddress?.address || 'Select Location'}
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
                Search for "{SEARCH_PLACEHOLDERS[placeholderIndex]}"
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
                <Text style={{ fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: Theme.textPrimary, lineHeight: 20, marginBottom: 12 }}>Get Instant{'\n'}Service</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.muted, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start' }}>
                  <Zap size={14} color={Theme.primary} />
                  <Text style={{ fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: Theme.primary, marginLeft: 4 }}>15 mins</Text>
                </View>
                <View style={{ position: 'absolute', right: -6, bottom: -6 }}>
                  <Zap size={48} color={Theme.primary} opacity={0.1} />
                </View>
              </TouchableOpacity>

            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('ScheduleForLater')}
                style={{ flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 16, height: 110, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4 }}
              >
                <Text style={{ fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: Theme.textPrimary, lineHeight: 20, marginBottom: 12 }}>Schedule for{'\n'}Later</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.muted, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start' }}>
                  <Text style={{ fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: Theme.primary }}>Today, 
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
                WE ARE COMING <Text style={{ color: Theme.primary }}>SOON</Text>
              </Text>
              
              <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 24, paddingHorizontal: 16 }}>
                We're bringing our amazing cleaning and home services to your location. Stay tuned!
              </Text>

           
              {/* Notify Me Button */}
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 30, marginBottom: 16, shadowColor: Theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}>
                <MessageCircle size={18} color="white" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 15, fontWeight: '700', color: 'white' }}>Notify me!</Text>
              </TouchableOpacity>

              {/* Change Location Link */}
              <TouchableOpacity 
                onPress={() => navigation.navigate('SearchLocation')}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
              >
                <MapPin size={14} color={Theme.primary} style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.primary }}>Change location</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bottom Section */}
        <View style={{ backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: 40, paddingTop: 24, minHeight: height * 0.6 }}>
          <View style={{ paddingHorizontal: 24, paddingBottom: 40 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: Theme.textPrimary, marginBottom: 20 }}>{t('common.services')}</Text>

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
                          categoryName: nameEn
                        });
                      } else {
                        navigation.navigate('ServiceList', {
                          categoryId: item.id,
                          title: nameEn
                        });
                      }
                    }}
                    style={{ width: '31.33%', marginRight: (index + 1) % 3 === 0 ? 0 : '3%', marginBottom: 24, backgroundColor: 'white', borderRadius: 16 }}
                  >
                    <View style={{ width: '100%', aspectRatio: 1.1, backgroundColor: '#F4F5F5', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}>
                      {isNew && (
                        <View style={{ position: 'absolute', top: 0, left: 0, backgroundColor: '#FF0000', paddingHorizontal: 6, paddingVertical: 2, borderBottomRightRadius: 8, borderTopLeftRadius: 12, zIndex: 10 }}>
                          <Text style={{ color: 'white', fontFamily: 'Poppins_600SemiBold', fontSize: 9 }}>NEW</Text>
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
              <Text style={{ fontSize: 20, fontWeight: '900', color: Theme.textPrimary }}>Exclusive Offers</Text>
              <TouchableOpacity><Text style={{ color: Theme.primary, fontWeight: '700' }}>See All</Text></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
              <OfferCard title="Flat ₹200 OFF" subtitle="On all cleaning services" code="CLEAN200" label="FIRST ORDER" />
              <OfferCard title="Earn ₹500" subtitle="Invite friends to Houcee" code="SHARE NOW →" label="REFER & EARN" />
            </ScrollView>
          </View>

          {/* Trust Section */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 40 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: Theme.textPrimary, marginBottom: 20 }}>Why Houcee?</Text>
            <View style={{ backgroundColor: Theme.background, borderRadius: 32, padding: 28, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <TrustItem icon={<ShieldCheck size={24} color={Theme.primary} />} label="Verified Pro" />
              <TrustItem icon={<Clock size={24} color={Theme.primary} />} label="On-Time" />
              <TrustItem icon={<Star size={24} color={Theme.primary} />} label="5★ Quality" />
              <TrustItem icon={<Phone size={24} color={Theme.primary} />} label="24/7 Support" />
            </View>
          </View>
          
          {/* Trending Services */}
         <View style={{ paddingBottom: 60 }}>
            <View style={{ paddingHorizontal: 24, marginBottom: 16 }}><Text style={{ fontSize: 20, fontWeight: '900', color: Theme.textPrimary }}>Trending Now</Text></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
              <TrendingCard title="Full Deep Cleaning" price="₹2,499" image={require('../assets/Cleaning-Kit-Image.png')} />
              <TrendingCard title="Bathroom Fitting" price="₹599" image={require('../assets/plumbing_studio.png')} />
              <TrendingCard title="Fan Installation" price="₹199" image={require('../assets/electrical_studio.png')} />
            </ScrollView>
          </View>

          {/* FAQ Section */}
   <View style={{ paddingHorizontal: 24, paddingBottom: 120, marginTop: 10 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: Theme.textPrimary, marginBottom: 20 }}>Common Questions</Text>
            <FAQItem question="How do I book a service?" answer="Simply select a category, choose your preferred service, select a date and time, and confirm your booking." />
            <FAQItem question="Are the professionals verified?" answer="Yes, every professional on our platform undergoes a rigorous background check and skills verification." />
            <FAQItem question="What if I need to cancel or reschedule?" answer="You can cancel or reschedule your booking for free up to 2 hours before the scheduled time via the 'My Bookings' section." />
            <FAQItem question="How do I pay for the service?" answer="You can pay online via UPI, Credit/Debit cards, or choose to pay in cash after the service is completed." />
            <FAQItem question="Is there any warranty on repairs?" answer="Yes, we provide a 30-day service warranty on all our repair works for your peace of mind." />
          </View>
        </View>
      </Animated.ScrollView>
     <BottomNav
        active="home"
        onTabPress={(tab: string) => {
          if (tab === 'profile') requireAuth(() => navigation.navigate('Profile'));
          if (tab === 'services') navigation.navigate('Search');
          if (tab === 'chat') requireAuth(() => navigation.navigate('MyBookings')); // Placeholder for chat
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


const OfferCard = ({ title, subtitle, code, label }: any) => (
  <TouchableOpacity style={{ width: 300, height: 160, borderRadius: 32, marginRight: 20, overflow: 'hidden' }}>
    <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={{ flex: 1, padding: 24 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <Text style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 }}>{label}</Text>
      <Text style={{ color: 'white', fontWeight: '900', fontSize: 28, marginTop: 4 }}>{title}</Text>
      <Text style={{ color: 'white', fontSize: 14, marginTop: 8, opacity: 0.9 }}>{subtitle}</Text>
      <View style={{ position: 'absolute', bottom: 16, left: 24, backgroundColor: 'white', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 }}>
        <Text style={{ color: '#7C3AED', fontWeight: 'bold', fontSize: 12 }}>USE: {code}</Text>
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
      <NavTab icon={<Home size={24} />} label="Home" active={active === 'home'} onPress={() => onTabPress('home')} />
     
      <NavTab icon={<History size={24} />} label="My Booking" active={active === 'chat'} onPress={() => onTabPress('chat')} />
      <NavTab icon={<User size={24} />} label="Profile" active={active === 'profile'} onPress={() => onTabPress('profile')} />
    </View>
  );
};
const NavTab = ({ icon, label, active, onPress }: any) => (
  <TouchableOpacity onPress={onPress} style={{ alignItems: 'center', padding: 10 }}>
    {React.cloneElement(icon, { color: active ? Theme.primary : Theme.textSecondary })}
    <Text style={{ fontSize: 10, fontFamily: 'Poppins_500Medium', marginTop: 4, color: active ? Theme.primary : Theme.textSecondary }}>{label}</Text>
  </TouchableOpacity>
);
const TrendingCard = ({ title, price, image }: any) => (
  <TouchableOpacity style={{ width: 160, marginRight: 16 }}>
    <View style={{ width: 160, height: 160, borderRadius: 32, backgroundColor: 'white', padding: 20, elevation: 5, marginBottom: 12, justifyContent: 'center', alignItems: 'center' }}>
      <Image source={image} style={{ width: '80%', height: '80%' }} resizeMode="contain" />
    </View>
    <Text style={{ fontFamily: 'Poppins_600SemiBold', color: Theme.textPrimary, fontSize: 14 }}>{title}</Text>
    <Text style={{ color: Theme.primary, fontFamily: 'Poppins_700Bold', marginTop: 4 }}>{price}</Text>
  </TouchableOpacity>
);

export const EnhancedHomeScreen = withObservables([], () => ({
  categories: database.collections.get('categories').query().observeWithColumns(['order']),
}))(HomeScreen);

