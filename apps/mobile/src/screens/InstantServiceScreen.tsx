import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle, XCircle, Trash2, AlertCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme } from '../theme';
import api from '../api';
import { FAQItem } from '../components/FAQItem';
import { CartFooter } from '../components/CartFooter';
import { getActiveLocation, ActiveLocation } from '../services/locationService';
import { useAuth } from '../contexts/AuthContext';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { LoginRequiredModal } from '../components/LoginRequiredModal';

export const InstantServiceScreen = ({ navigation }: any) => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { requireAuth, showLoginModal, handleLoginPress, handleCloseModal } = useAuthGuard();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [cartItem, setCartItem] = useState<any>(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [activeLocation, setActiveLocation] = useState<ActiveLocation | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchHourlyServiceData();
    fetchCartData();
    loadLocation();

    const unsubscribe = navigation.addListener('focus', () => {
      fetchCartData();
      loadLocation();
    });

    return unsubscribe;
  }, [navigation]);

  const loadLocation = async () => {
    const location = await getActiveLocation();
    setActiveLocation(location);
  };

  const fetchCartData = async () => {
    try {
      if (!isAuthenticated) {
        setCartItem(null);
        setSelectedDuration(null);
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

      if (hourlyItem && hourlyItem.bookingType !== 'scheduled') {
        setCartItem(hourlyItem);
        setSelectedDuration(hourlyItem.duration?.id || null);
      } else {
        setCartItem(hourlyItem || null);
        setSelectedDuration(null);
      }
    } catch (e) {
      console.error('Error fetching cart:', e);
      setCartItem(null);
      setSelectedDuration(null);
    }
  };

  const addToCart = async (durationId: string) => {
    if (!requireAuth()) return;

    try {
      setCartLoading(true);

      if (cartItem) {
        await api.delete('/cart', { serviceId: 'hourly-service' });
      }

      const duration = data.durations.find((d: any) => d.id === durationId);
      if (!duration) {
        Alert.alert('Error', 'Invalid duration selected');
        return;
      }

      const item = {
        type: 'hourly',
        serviceId: 'hourly-service',
        title: 'Hourly Service',
        duration,
        price: duration.price,
        quantity: 1,
      };

      const res = await api.post('/cart', {
        item,
        bookingType: 'instant',
      });

      console.log('Cart add response:', res.data);
      
      // Handle both old JSON format and new CartItem table format
      let items = res.data?.items || [];
      
      // If items is empty, check if cartItems array exists (new format)
      if (!items || items.length === 0) {
        items = res.data?.cartItems || [];
      }
      
      const hourlyItem = items.find((i: any) => i.type === 'hourly') || {
        ...item,
        bookingType: 'instant',
      };

      console.log('Setting cart item:', hourlyItem);
      setCartItem(hourlyItem);
      setSelectedDuration(durationId);
    } catch (e) {
      console.error('Error adding to cart:', e);
      Alert.alert('Error', 'Failed to add to cart');
    } finally {
      setCartLoading(false);
    }
  };

  const removeFromCart = async () => {
    if (!requireAuth()) return;

    try {
      setCartLoading(true);
      setCartItem(null);
      setSelectedDuration(null);

      await api.delete('/cart', { serviceId: 'hourly-service' });
      await fetchCartData();
    } catch (e) {
      console.error('Error removing from cart:', e);
      Alert.alert('Error', 'Failed to remove from cart');
      await fetchCartData();
    } finally {
      setCartLoading(false);
    }
  };

  const fetchHourlyServiceData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/services/hourly');
      setData(res.data);
    } catch (e) {
      console.error('Error fetching hourly services:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Failed to load data.</Text>
      </View>
    );
  }

  const estimationColumns = [];
  if (data.estimations) {
    for (let i = 0; i < data.estimations.length; i += 2) {
      estimationColumns.push(data.estimations.slice(i, i + 2));
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
        <View style={styles.headerImageContainer}>
          <Image
            source={require('../assets/Header.png')}
            style={styles.headerImage}
            resizeMode="cover"
          />
          <TouchableOpacity style={styles.backButtonOverlay} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{t('instant_service.title', 'Hourly Services')}</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.star}>⭐</Text>
            <Text style={styles.ratingText}>{t('instant_service.ratings_count', '4.9 (61k ratings)')}</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.durationsScroll}
            contentContainerStyle={styles.durationsContainer}
          >
            {data.durations.map((dur: any) => {
              const isAdded =
                cartItem?.bookingType !== 'scheduled' && cartItem?.duration?.id === dur.id;
              
              const label = typeof dur.label === 'string' 
                ? dur.label 
                : (dur.label?.[i18n.language === 'hi' ? 'hi' : 'en'] || dur.label?.en || String(dur.label || ''));

              return (
                <View
                  key={dur.id}
                  style={[styles.durationCard, isAdded && styles.durationCardSelected]}
                >
                  <Text style={styles.durationTitle}>{label}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>₹{dur.price}</Text>
                    <Text style={styles.oldPrice}>₹{dur.oldPrice}</Text>
                  </View>
                  <Text style={styles.saveText}>{t('instant_service.save', 'Save ₹')}{dur.saveAmount}</Text>
                  <TouchableOpacity
                    style={isAdded ? styles.addedBtn : styles.bookBtn}
                    disabled={cartLoading}
                    onPress={() => {
                      if (isAdded) {
                        removeFromCart();
                      } else {
                        addToCart(dur.id);
                      }
                    }}
                  >
                    {isAdded ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.addedBtnText}>{t('instant_service.added', 'ADDED')}</Text>
                        <Trash2 size={16} color="#FFFFFF" />
                      </View>
                    ) : (
                      <Text style={styles.bookBtnText}>{cartLoading ? '...' : t('instant_service.book', 'BOOK')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.descriptionSection}>
            <Text style={styles.descTitle}>{t('instant_service.one_booking', 'One Booking. Countless Tasks.')}</Text>
            <Text style={styles.descText}>
              {t('instant_service.one_booking_desc', 'Let our professionals take care of everyday household tasks while you focus on work, family and everything else on your schedule.')}
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{t('instant_service.how_long', 'How long does it take?')}</Text>
              <Text style={styles.linkText}>{t('instant_service.how_its_done', "How it's done?")}</Text>
            </View>
            <Text style={styles.subtitle}>{t('instant_service.estimations_based', 'Estimations are based on 2BHK')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 16, paddingRight: 20 }}
            >
              {estimationColumns.map((col, colIdx) => (
                <View key={colIdx} style={{ gap: 16 }}>
                  {col.map((est: any) => {
                    const title = typeof est.title === 'string' 
                      ? est.title 
                      : (est.title?.[i18n.language === 'hi' ? 'hi' : 'en'] || est.title?.en || String(est.title || ''));
                    return (
                      <View key={est.id} style={styles.estimationCard}>
                        <View style={styles.estimationImagePlaceholder}>
                          <Text style={{ fontSize: 24 }}>🧼</Text>
                        </View>
                        <Text style={styles.estimationTitle}>{title}</Text>
                        <Text style={styles.estimationTime}>{est.time}</Text>
                      </View>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('instant_service.why_customers_love', 'Why Customers Love Hourly Services')}</Text>
            {data.whyCustomersLove.map((item: any, index: number) => {
              const text = typeof item === 'string' 
                ? item 
                : (item?.[i18n.language === 'hi' ? 'hi' : 'en'] || item?.en || String(item || ''));
              return (
                <View key={index} style={styles.listItem}>
                  <CheckCircle size={20} color="#10B981" />
                  <Text style={styles.listItemText}>{text}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('instant_service.does_not_include', 'Does not include')}</Text>
            {data.doesNotInclude.map((item: any, index: number) => {
              const text = typeof item === 'string' 
                ? item 
                : (item?.[i18n.language === 'hi' ? 'hi' : 'en'] || item?.en || String(item || ''));
              return (
                <View key={index} style={styles.listItem}>
                  <XCircle size={20} color="#EF4444" />
                  <Text style={styles.listItemText}>{text}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('instant_service.how_its_done', "How it's done?")}</Text>
            <View style={styles.stepItem}>
              <View style={styles.stepIconPlaceholder}>
                <Text>📋</Text>
              </View>
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepTitle}>{t('instant_service.step1_title', 'Plan the Work')}</Text>
                <Text style={styles.stepDesc}>
                  {t('instant_service.step1_desc', 'Your professional plans the tasks as per your needs and time booked.')}
                </Text>
              </View>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepIconPlaceholder}>
                <Text>🧹</Text>
              </View>
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepTitle}>{t('instant_service.step2_title', 'Start Cleaning')}</Text>
                <Text style={styles.stepDesc}>
                  {t('instant_service.step2_desc', "They'll begin with the tasks you want like sweeping, mopping, or bathroom cleaning.")}
                </Text>
              </View>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepIconPlaceholder}>
                <Text>✨</Text>
              </View>
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepTitle}>{t('instant_service.step3_title', 'Final Checks')}</Text>
                <Text style={styles.stepDesc}>
                  {t('instant_service.step3_desc', "Before finishing, they'll give a quick wipe and make sure everything looks clean and tidy.")}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('instant_service.faqs', 'FAQs')}</Text>
            {data.faqs.map((faq: any, index: number) => {
              const question = typeof faq.question === 'string' 
                ? faq.question 
                : (faq.question?.[i18n.language === 'hi' ? 'hi' : 'en'] || faq.question?.en || String(faq.question || ''));
              const answer = typeof faq.answer === 'string' 
                ? faq.answer 
                : (faq.answer?.[i18n.language === 'hi' ? 'hi' : 'en'] || faq.answer?.en || String(faq.answer || ''));
              return (
                <FAQItem key={index} question={question} answer={answer} />
              );
            })}
          </View>

          <View style={{ height: 160 }} />
        </View>
      </ScrollView>

      <CartFooter
        itemCount={cartItem ? 1 : 0}
        onNavigateToCart={() => navigation.navigate('Cart')}
        show={true}
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
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flex: 1,
  },
  headerImageContainer: {
    width: '100%',
    height: 250,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  backButtonOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Theme.textPrimary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  star: {
    fontSize: 14,
  },
  ratingText: {
    fontSize: 14,
    color: Theme.textSecondary,
    marginLeft: 6,
  },
  durationsScroll: {
    marginTop: 20,
  },
  durationsContainer: {
    gap: 16,
    paddingRight: 20,
  },
  durationCard: {
    width: 120,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginRight: 16,
  },
  durationCardSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#bbf7d0',
  },
  durationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.textPrimary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.textPrimary,
  },
  oldPrice: {
    fontSize: 12,
    color: Theme.textSecondary,
    textDecorationLine: 'line-through',
  },
  saveText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginTop: 8,
  },
  bookBtn: {
    marginTop: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  addedBtn: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
  },
  bookBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981',
  },
  addedBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  descriptionSection: {
    marginTop: 30,
  },
  descTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.textPrimary,
  },
  descText: {
    marginTop: 8,
    fontSize: 14,
    color: Theme.textSecondary,
    lineHeight: 22,
  },
  section: {
    marginTop: 30,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.textPrimary,
    marginBottom: 8,
  },
  linkText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981',
  },
  subtitle: {
    fontSize: 14,
    color: Theme.textSecondary,
    marginBottom: 16,
  },
  estimationCard: {
    width: 90,
    alignItems: 'center',
  },
  estimationImagePlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  estimationTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  estimationTime: {
    fontSize: 10,
    color: Theme.textSecondary,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  listItemText: {
    flex: 1,
    fontSize: 14,
    color: Theme.textPrimary,
    lineHeight: 20,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 16,
  },
  stepIconPlaceholder: {
    width: 48,
    height: 48,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.textPrimary,
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 14,
    color: Theme.textSecondary,
    lineHeight: 20,
  },
});
