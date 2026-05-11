import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Dimensions, Animated, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Search, ArrowRight, WifiOff, History, ShieldCheck, Clock, Star, Phone, ChevronDown, Home, Zap, MessageCircle, User, MapPin } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme } from '../theme';
import { Skeleton } from '../components/Skeleton';
import { FAQItem } from '../components/FAQItem';
import { QUICK_CATEGORIES, SEARCH_PLACEHOLDERS } from '../constants';
import { syncDatabase } from '../db/sync';

export const HomeScreen = ({ navigation, categories }: any) => {
  const { t, i18n } = useTranslation();
  const [isOffline, setIsOffline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { width, height } = Dimensions.get('window');
  const { top: safeTop, bottom: safeBottom } = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [savedAddress, setSavedAddress] = useState<any>(null);

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
    const data = await AsyncStorage.getItem('user_address');
    if (data) setSavedAddress(JSON.parse(data));
  };

  // Sticky header animation
  const stickyOpacity = scrollY.interpolate({ inputRange: [300, 450], outputRange: [0, 1], extrapolate: 'clamp' });
  const stickyTranslate = scrollY.interpolate({ inputRange: [300, 450], outputRange: [-70, 0], extrapolate: 'clamp' });

  const bannerScrollRef = useRef<ScrollView>(null);
  const [activeBanner, setActiveBanner] = useState(0);

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const placeholderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (activeBanner + 1) % 3;
      setActiveBanner(nextIndex);
      bannerScrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
    }, 5000);
    return () => clearInterval(timer);
  }, [activeBanner]);

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

      
      {/* ===== PURPLE STICKY HEADER ===== */}
      <Animated.View style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 999,
        opacity: stickyOpacity,
        transform: [{ translateY: stickyTranslate }],
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 12,
        paddingTop: safeTop,
      }}>
        <LinearGradient
          colors={[Theme.primary, Theme.primaryDark]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
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
                onPress={() => catId && navigation.navigate('ServiceList', { categoryId: catId, title: cat.nameEn })}
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
        <LinearGradient
          colors={[Theme.primary, Theme.primaryDark]}
          style={{ paddingTop: 0, paddingBottom: 30 }}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          {/* Header */}
          <View style={{ paddingHorizontal: 24, paddingTop: 10, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('AddressPicker')}
              style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                <MapPin size={22} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)' }}>{savedAddress?.label || t('common.location')}</Text>
                <Text style={{ fontSize: 15, fontWeight: '800', color: 'white' }} numberOfLines={1}>
                  {savedAddress?.address || 'Select Location'}
                </Text>
              </View>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {isOffline && <WifiOff size={20} color={Theme.accent} style={{ marginRight: 16 }} />}
              <TouchableOpacity onPress={() => navigation.navigate('MyBookings')} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                <History size={20} color="white" />
              </TouchableOpacity>
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

          {/* Promo Banner Carousel */}
          <View style={{ marginTop: 4 }}>
            <ScrollView 
              ref={bannerScrollRef}
              horizontal 
              pagingEnabled 
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
                setActiveBanner(newIndex);
              }}
            >
              {/* Promo Cards */}
              <View style={{ width: width, height: 180 }}>
                <View style={{ flex: 1, marginHorizontal: 24, borderRadius: 24, overflow: 'hidden' }}>
                  <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={{ flex: 1, padding: 24, justifyContent: 'center' }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <View style={{ width: '65%', zIndex: 10 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>Home Services</Text>
                      <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '900', lineHeight: 28, marginBottom: 16 }}>Quick. Reliable.{'\n'}At Your Doorstep.</Text>
                      <TouchableOpacity style={{ backgroundColor: '#FFFFFF', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ color: '#312E81', fontWeight: '800', fontSize: 13 }}>Book Now</Text>
                        <ArrowRight size={14} color="#312E81" style={{ marginLeft: 6 }} />
                      </TouchableOpacity>
                    </View>
                    <Image source={require('../assets/Cleaning-Kit-Image.png')} style={{ position: 'absolute', right: -10, bottom: -10, width: 170, height: 170, opacity: 0.9 }} resizeMode="contain" />
                  </LinearGradient>
                </View>
              </View>

              <View style={{ width: width, height: 180 }}>
                <View style={{ flex: 1, marginHorizontal: 24, borderRadius: 24, overflow: 'hidden' }}>
                  <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={{ flex: 1, padding: 24, justifyContent: 'center' }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <View style={{ width: '65%', zIndex: 10 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>Expert Repairs</Text>
                      <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '900', lineHeight: 28, marginBottom: 16 }}>Expert Fixing.{'\n'}Zero Stress.</Text>
                      <TouchableOpacity style={{ backgroundColor: '#FFFFFF', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ color: '#4C1D95', fontWeight: '800', fontSize: 13 }}>Fix Now</Text>
                        <ArrowRight size={14} color="#4C1D95" style={{ marginLeft: 6 }} />
                      </TouchableOpacity>
                    </View>
                    <Image source={require('../assets/plumbing_studio.png')} style={{ position: 'absolute', right: 5, bottom: 5, width: 150, height: 150 }} resizeMode="contain" />
                  </LinearGradient>
                </View>
              </View>

              {/* CARD 3: Electrical Expert */}
              <View style={{ width: width, height: 180 }}>
                <View style={{ flex: 1, marginHorizontal: 24, borderRadius: 24, overflow: 'hidden', backgroundColor: '#8B5CF6' }}>
                  <Image 
                    source={require('../assets/electrical_promo_final.png')} 
                    style={{ position: 'absolute', width: '100%', height: '100%' }} 
                    resizeMode="cover" 
                  />
                  <LinearGradient
                    colors={['rgba(0,0,0,0.4)', 'transparent']}
                    style={{ flex: 1, padding: 24, justifyContent: 'center' }}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0.6, y: 0 }}
                  >
                    <View style={{ width: '60%', zIndex: 10 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 6, textTransform: 'uppercase' }}>Expert Electricals</Text>
                      <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '900', lineHeight: 28, marginBottom: 16 }}>
                        Spark-Free{'\n'}Fixing.
                      </Text>
                      <TouchableOpacity style={{ backgroundColor: '#FFFFFF', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 }}>
                        <Text style={{ color: '#5B21B6', fontWeight: '900', fontSize: 13 }}>Book Now</Text>
                        <ArrowRight size={14} color="#5B21B6" style={{ marginLeft: 6 }} />
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </View>
              </View>
            </ScrollView>
          </View>
        </LinearGradient>

        {/* Bottom Section */}
        <View style={{ backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: 12, paddingTop: 24, minHeight: height * 0.6 }}>
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
              ) : categories.filter((c: any) => c && c.nameEn).reduce((acc: any[], current: any) => {
                if (!acc.find((item: any) => item.nameEn === current.nameEn)) {
                  acc.push(current);
                }
                return acc;
              }, []).map((item: any, index: number) => {
                const nameEn = item?.nameEn || '';
                const displayName = i18n.language === 'hi' ? (item?.nameHi || nameEn) : nameEn;
                const imageSource = item?.iconUrl ? { uri: item.iconUrl } : null;

                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => navigation.navigate('ServiceList', { categoryId: item.id, title: nameEn })}
                    style={{ width: '31.33%', marginRight: (index + 1) % 3 === 0 ? 0 : '3%', marginBottom: 20, backgroundColor: 'white', borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4 }}
                  >
                    <View style={{ width: '100%', aspectRatio: 1.1, backgroundColor: '#F4EDFF', justifyContent: 'center', alignItems: 'center' }}>
                      {imageSource ? (
                        <Image source={imageSource} style={{ width: '70%', height: '70%' }} resizeMode="contain" />
                      ) : (
                        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.border, justifyContent: 'center', alignItems: 'center' }}>
                          <Home size={20} color={Theme.textSecondary} />
                        </View>
                      )}
                    </View>
                    <View style={{ paddingVertical: 10, paddingHorizontal: 4 }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: Theme.textPrimary, textAlign: 'center' }}>{displayName}</Text>
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

      {/* Bottom Nav */}
      <BottomNav 
        active="home" 
        onTabPress={(tab: string) => {
          if (tab === 'profile') navigation.navigate('Profile');
          if (tab === 'services') navigation.navigate('Search');
          if (tab === 'chat') navigation.navigate('MyBookings'); // Placeholder for chat
        }} 
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

const TrendingCard = ({ title, price, image }: any) => (
  <TouchableOpacity style={{ width: 160, marginRight: 16 }}>
    <View style={{ width: 160, height: 160, borderRadius: 32, backgroundColor: 'white', padding: 20, elevation: 5, marginBottom: 12, justifyContent: 'center', alignItems: 'center' }}>
      <Image source={image} style={{ width: '80%', height: '80%' }} resizeMode="contain" />
    </View>
    <Text style={{ fontWeight: '800', color: Theme.textPrimary, fontSize: 14 }}>{title}</Text>
    <Text style={{ color: Theme.primary, fontWeight: '900', marginTop: 4 }}>{price}</Text>
  </TouchableOpacity>
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
      <NavTab icon={<Zap size={24} />} label="Services" active={active === 'services'} onPress={() => onTabPress('services')} />
      <NavTab icon={<MessageCircle size={24} />} label="Chat" active={active === 'chat'} onPress={() => onTabPress('chat')} />
      <NavTab icon={<User size={24} />} label="Profile" active={active === 'profile'} onPress={() => onTabPress('profile')} />
    </View>
  );
};

const NavTab = ({ icon, label, active, onPress }: any) => (
  <TouchableOpacity onPress={onPress} style={{ alignItems: 'center', padding: 10 }}>
    {React.cloneElement(icon, { color: active ? Theme.primary : Theme.textSecondary })}
    <Text style={{ fontSize: 10, fontWeight: '700', marginTop: 4, color: active ? Theme.primary : Theme.textSecondary }}>{label}</Text>
  </TouchableOpacity>
);
