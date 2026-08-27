import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Star, ArrowRight, Minus, Plus, ShieldCheck, Clock, Sparkles, User, Image as ImageIcon, Bell, MessageCircle, ShoppingCart, Check } from 'lucide-react-native';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';
import { switchMap } from 'rxjs/operators';
import { database } from '../db';
import { Theme } from '../theme';
import api from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ServiceDetailScreenBase = ({ route, navigation, service, relatedServices }: any) => {
  const { t, i18n } = useTranslation();
  const [bookingType, setBookingType] = useState<'day' | 'bulk'>('day');
  const [quantity, setQuantity] = useState(1);
  const [reviewsData, setReviewsData] = useState<{ reviews: any[], average: number, total: number }>({ reviews: [], average: 0, total: 0 });
  const [cart, setCart] = useState<any>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(1); // Multiplier for estimated time
  const [isCurrentServiceInCart, setIsCurrentServiceInCart] = useState(false);
  const [relatedServicesInCart, setRelatedServicesInCart] = useState<Set<string>>(new Set());

  // Parse estimated time to get base minutes
  const parseEstimatedTime = (timeString: string | null | undefined): number => {
    if (!timeString) return 60; // Default to 60 mins if not specified
    
    // Handle formats like "60 mins", "30 mins (12-15 garments)", "45 mins (up to 300sq ft)"
    const match = timeString.match(/(\d+)\s*mins/);
    if (match) {
      return parseInt(match[1], 10);
    }
    
    // Fallback for other formats
    const numericMatch = timeString.match(/(\d+)/);
    if (numericMatch) {
      return parseInt(numericMatch[1], 10);
    }
    
    return 60; // Default fallback
  };

  const baseEstimatedTime = parseEstimatedTime(service?.estimatedTime);
  const currentEstimatedTime = baseEstimatedTime * selectedDuration;

  useEffect(() => {
    fetchCart();
    
    const unsubscribe = navigation.addListener('focus', () => {
      fetchCart();
    });
    
    return unsubscribe;
  }, [navigation, service?.id, relatedServices]);

  useEffect(() => {
    if (service?.id) {
      api.get(`/reviews/service/${service.id}`)
        .then(res => {
          const fetchedReviews = res.data;
          const total = fetchedReviews.length;
          const avg = total > 0 ? fetchedReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / total : 0;
          setReviewsData({ reviews: fetchedReviews, average: avg, total });
        })
        .catch(err => console.log('Failed to fetch reviews', err));
    }
  }, [service?.id]);

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart');
      setCart(res.data);
      
      // Check if current service is in cart
      const currentServiceInCart = res.data?.items?.some((item: any) => item.serviceId === service?.id);
      setIsCurrentServiceInCart(currentServiceInCart);
      
      // Get cart item duration if exists
      if (currentServiceInCart) {
        const cartItem = res.data?.items?.find((item: any) => item.serviceId === service?.id);
        if (cartItem?.duration) {
          // Calculate duration multiplier from cart
          const cartBaseTime = parseEstimatedTime(service?.estimatedTime);
          const cartTime = parseEstimatedTime(cartItem.duration?.label || cartItem.duration);
          if (cartBaseTime > 0) {
            setSelectedDuration(Math.round(cartTime / cartBaseTime));
          }
        }
      }
      
      // Check which related services are in cart
      const relatedInCart = new Set<string>();
      if (relatedServices && res.data?.items) {
        relatedServices.forEach((related: any) => {
          const isInCart = res.data.items.some((item: any) => item.serviceId === related.id);
          if (isInCart) {
            relatedInCart.add(related.id);
          }
        });
      }
      setRelatedServicesInCart(relatedInCart);
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };
  
  // Calculate total based on type
  const basePrice = service?.basePrice || 0;
  const totalPrice = basePrice * quantity;

  // Check if service belongs to plumber or electrical subcategory
  const subcategoryName = (service?.subcategoryNameEn || '').toLowerCase();
  const isComingSoon = subcategoryName.includes('plumbing') || 
                       subcategoryName.includes('plumber') || 
                       subcategoryName.includes('electrical') || 
                       subcategoryName.includes('electrician');

  // Helper function to check if a service is coming soon
  const isServiceComingSoon = (serviceItem: any) => {
    const itemSubcategoryName = (serviceItem?.subcategoryNameEn || '').toLowerCase();
    return itemSubcategoryName.includes('plumbing') || 
           itemSubcategoryName.includes('plumber') || 
           itemSubcategoryName.includes('electrical') || 
           itemSubcategoryName.includes('electrician');
  };

  const handleNotifyMe = () => {
    console.log('Notify me for:', service?.nameEn);
    // You can implement notification logic here
  };

  const handleWhatsApp = () => {
    const message = `Hi, I'm interested in ${service?.nameEn} service. Please let me know when it's available.`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    Linking.openURL(whatsappUrl);
  };

  const handleAddToCart = async (serviceItem: any, bookingTypeParam?: string, quantityParam?: number, durationMultiplier: number = 1) => {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      if (!userId) {
        Alert.alert(t('cart.login_required'), t('cart.login_required_message'));
        return;
      }

      const itemBaseTime = parseEstimatedTime(serviceItem.estimatedTime);
      const itemDuration = itemBaseTime * durationMultiplier;

      const itemToAdd = {
        serviceId: serviceItem.id,
        title: i18n.language === 'hi' ? serviceItem.nameHi : serviceItem.nameEn,
        price: serviceItem.basePrice * durationMultiplier,
        quantity: quantityParam || quantity,
        type: 'service',
        duration: {
          label: `${itemDuration} mins`,
          price: serviceItem.basePrice * durationMultiplier
        }
      };

      await api.post('/cart', {
        item: itemToAdd,
        bookingType: 'instant'
      });

      await fetchCart(); // Refresh cart state
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert(t('common.error'), t('common.failed_add_cart'));
    }
  };

  const handleRemoveFromCart = async (serviceId: string) => {
    try {
      await api.delete('/cart', { serviceId });
      await fetchCart(); // Refresh cart state
    } catch (error) {
      console.error('Error removing from cart:', error);
      Alert.alert(t('common.error'), t('common.failed_remove_cart'));
    }
  };

  const handleBookButton = () => {
    // When user clicks Book, add service with default duration (1x)
    handleAddToCart(service, 'instant', quantity, 1);
  };

  const handleIncreaseDuration = () => {
    const newDuration = selectedDuration * 2;
    setSelectedDuration(newDuration);
    // Update cart with new duration
    handleAddToCart(service, 'instant', quantity, newDuration);
  };

  const handleDecreaseDuration = () => {
    if (selectedDuration > 1) {
      const newDuration = selectedDuration / 2;
      setSelectedDuration(newDuration);
      // Update cart with new duration
      handleAddToCart(service, 'instant', quantity, newDuration);
    } else {
      // Remove from cart if at minimum
      handleRemoveFromCart(service.id);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.background, position: 'relative' }}>
      <View style={{ position: 'absolute', top: 60, left: 24, zIndex: 100 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 10 }}>
          <ChevronLeft size={24} color={Theme.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
        <View style={{ width: '100%', height: 400, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
          <ImageIcon size={48} color={'#94A3B8'} style={{ position: 'absolute' }} />
          <Image source={{ uri: service?.imageUrl || 'https://images.unsplash.com/photo-1581578731548-c64695ce6958?q=80&w=800' }} style={{ width: '100%', height: '100%', position: 'absolute' }} />
        </View>
        <View style={{ paddingHorizontal: 24, paddingVertical: 32, marginTop: -40, backgroundColor: Theme.background, borderTopLeftRadius: 40, borderTopRightRadius: 40 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <Star size={18} color={Theme.accent} fill={Theme.accent} />
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: Theme.textPrimary, marginLeft: 8 }}>
              {reviewsData.total > 0 ? reviewsData.average.toFixed(1) : '5.0'}
            </Text>
            <Text style={{ fontSize: 14, color: Theme.textSecondary, marginLeft: 8 }}>
              ({reviewsData.total > 0 ? reviewsData.total : '0'} {t('common.reviews')})
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <Text style={{ fontSize: 32, fontWeight: '900', color: Theme.textPrimary, lineHeight: 38, flex: 1 }}>
              {i18n.language === 'hi' ? service?.nameHi : service?.nameEn}
            </Text>
            
            {!isComingSoon && (
              <View style={{ marginLeft: 16 }}>
                {isCurrentServiceInCart ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 18, padding: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
                    <TouchableOpacity onPress={handleDecreaseDuration} style={{ width: 40, height: 40, backgroundColor: '#F1F5F9', borderRadius: 14, justifyContent: 'center', alignItems: 'center' }}>
                      <Minus size={20} color={Theme.textPrimary} />
                    </TouchableOpacity>
                    <Text style={{ width: 48, textAlign: 'center', fontSize: 16, fontWeight: '900', color: Theme.primary }}>{currentEstimatedTime} mins</Text>
                    <TouchableOpacity onPress={handleIncreaseDuration} style={{ width: 40, height: 40, backgroundColor: Theme.primary, borderRadius: 14, justifyContent: 'center', alignItems: 'center' }}>
                      <Plus size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={handleBookButton}
                    style={{ backgroundColor: Theme.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, alignItems: 'center', shadowColor: Theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}
                  >
                    <Text style={{ color: 'white', fontWeight: '900', fontSize: 16 }}>{t('common.book')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

        

          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 24, borderRadius: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5, marginBottom: 32 }}>
            {isComingSoon ? (
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: Theme.textSecondary, fontWeight: '800', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('service.total_price')}</Text>
                <Text style={{ fontSize: 15, fontWeight: '900', color: Theme.primary }}>Coming Soon</Text>
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: Theme.textSecondary, fontWeight: '800', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('service.total_price')}</Text>
                <Text style={{ fontSize: 32, fontWeight: '900', color: Theme.primary }}>₹{totalPrice.toFixed(0)}</Text>
              </View>
            )}
            <View style={{ backgroundColor: Theme.infoLight, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 }}>
              <Text style={{ color: Theme.success, fontWeight: '900', fontSize: 11, textTransform: 'uppercase' }}>{t('service.verified')}</Text>
            </View>
          </View>


         


          

          {/* Standard Description for non-coming-soon services */}
          {!isComingSoon && (
            <View style={{ backgroundColor: '#F1F5F9', padding: 20, borderRadius: 24, marginBottom: 32 }}>
              <Text style={{ fontSize: 15, color: Theme.textSecondary, lineHeight: 24, fontWeight: '500' }}>
                {t('service.standard_desc')}
              </Text>
            </View>
          )}

          {/* Inclusions & Exclusions Section */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginBottom: 40 }}>
            {/* Left: What is Included */}
            <View style={{ flex: 1, backgroundColor: Theme.infoLight, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: Theme.border }}>
              <Text style={{ fontSize: 14, fontWeight: '900', color: Theme.info, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('service.included')}</Text>
              {service?.includedItems && service.includedItems.length > 0 ? (
                service.includedItems.map((item: any, index: number) => (
                  <InclusionItem key={index} text={i18n.language === 'hi' ? item.hi : item.en} included />
                ))
              ) : (
                <Text style={{ fontSize: 12, color: Theme.textSecondary, fontStyle: 'italic' }}>No items listed</Text>
              )}
            </View>

            {/* Right: What is NOT Included */}
            <View style={{ flex: 1, backgroundColor: Theme.background, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: Theme.border }}>
              <Text style={{ fontSize: 14, fontWeight: '900', color: Theme.error, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('service.not_included')}</Text>
              {service?.notIncludedItems && service.notIncludedItems.length > 0 ? (
                service.notIncludedItems.map((item: any, index: number) => (
                  <InclusionItem key={index} text={i18n.language === 'hi' ? item.hi : item.en} included={false} />
                ))
              ) : (
                <Text style={{ fontSize: 12, color: Theme.textSecondary, fontStyle: 'italic' }}>No items listed</Text>
              )}
            </View>
          </View>

          {/* How it Works Section */}
          <View style={{ marginBottom: 40 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: Theme.textPrimary, marginBottom: 20 }}>{t('service.how_it_works')}</Text>
            <View style={{ gap: 20 }}>
              {(t('service.steps', { returnObjects: true }) as any[]).map((step: any, index: number) => (
                <StepItem 
                  key={index}
                  icon={index === 0 ? <Sparkles size={20} color={Theme.primary} /> : index === 1 ? <ShieldCheck size={20} color={Theme.primary} /> : <Clock size={20} color={Theme.primary} />}
                  title={step.title} 
                  desc={step.desc} 
                />
              ))}
            </View>
          </View>

          {/* Customer Reviews Section */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: Theme.textPrimary }}>{t('service.reviews')}</Text>
              {reviewsData.total > 0 && (
                <TouchableOpacity>
                  <Text style={{ color: Theme.primary, fontWeight: '800' }}>{t('service.see_all')}</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {reviewsData.total === 0 ? (
              <Text style={{ fontSize: 14, color: Theme.textSecondary, fontStyle: 'italic' }}>{t('service.no_reviews')}</Text>
            ) : (
              reviewsData.reviews.slice(0, 3).map((r: any) => (
                <ReviewCard 
                  key={r.id}
                  name={r.booking?.client?.fullName || t('common.anonymous')} 
                  rating={r.rating} 
                  date={new Date(r.createdAt).toLocaleDateString()} 
                  comment={r.comment} 
                />
              ))
            )}
          </View>

          {/* Related Services Section */}
          {relatedServices && relatedServices.length > 0 && (
            <View style={{ marginBottom: 40 }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: Theme.textPrimary, marginBottom: 20 }}>{t('service.related_title')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                {relatedServices.map((item: any) => {
                  const isInCart = relatedServicesInCart.has(item.id);
                  const isItemComingSoon = isServiceComingSoon(item);
                  return (
                    <View
                      key={item.id}
                      style={{ width: 160, backgroundColor: 'white', borderRadius: 24, padding: 12, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10, elevation: 2 }}
                    >
                      <TouchableOpacity onPress={() => navigation.push('ServiceDetail', { serviceId: item.id })}>
                        <Image 
                          source={{ uri: item.imageUrl || 'https://via.placeholder.com/200' }} 
                          style={{ width: '100%', aspectRatio: 1, borderRadius: 16, marginBottom: 12 }} 
                          resizeMode="cover"
                        />
                        <Text style={{ fontSize: 14, fontWeight: '800', color: Theme.textPrimary, marginBottom: 4 }} numberOfLines={1}>
                          {i18n.language === 'hi' ? item.nameHi : item.nameEn}
                        </Text>
                        {isItemComingSoon ? (
                          <Text style={{ fontSize: 14, fontWeight: '900', color: Theme.textSecondary }}>Coming Soon</Text>
                        ) : (
                          <Text style={{ fontSize: 16, fontWeight: '900', color: Theme.primary }}>₹{Number(item.basePrice).toFixed(0)}</Text>
                        )}
                      </TouchableOpacity>
                      {!isItemComingSoon && (
                        <TouchableOpacity
                          onPress={() => isInCart ? handleRemoveFromCart(item.id) : handleAddToCart(item)}
                          style={{ position: 'absolute', top: 20, right: 20, width: 36, height: 36, borderRadius: 18, backgroundColor: isInCart ? '#22C55E' : Theme.primary, justifyContent: 'center', alignItems: 'center', shadowColor: isInCart ? '#22C55E' : Theme.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 }}
                        >
                          {isInCart ? <Check size={18} color="white" /> : <Plus size={18} color="white" />}
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingVertical: 20, paddingBottom: 32, backgroundColor: 'white', borderTopLeftRadius: 36, borderTopRightRadius: 36, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 25 }}>
        {isComingSoon ? (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={handleNotifyMe}
              style={{ flex: 1, backgroundColor: Theme.primary, paddingVertical: 16, borderRadius: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', shadowColor: Theme.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 }}
            >
              <Bell size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={{ color: 'white', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 }}>NOTIFY ME</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleWhatsApp}
              style={{ width: 60, backgroundColor: '#25D366', paddingVertical: 16, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#25D366', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 }}
            >
              <MessageCircle size={24} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => isCurrentServiceInCart ? navigation.navigate('Cart') : handleAddToCart(service)}
            style={{ backgroundColor: Theme.primary, paddingVertical: 16, borderRadius: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', shadowColor: Theme.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 }}
          >
            {isCurrentServiceInCart ? (
              <>
                <ShoppingCart size={20} color="white" style={{ marginRight: 10 }} />
                <Text style={{ color: 'white', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 }}>{t('common.go_to_cart').toUpperCase()}</Text>
              </>
            ) : (
              <>
                <ShoppingCart size={20} color="white" style={{ marginRight: 10 }} />
                <Text style={{ color: 'white', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 }}>{t('common.add_to_cart').toUpperCase()}</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

// Helper Component for Inclusions/Exclusions
// Helper Components
const StepItem = ({ icon, title, desc }: any) => (
  <View style={{ flexDirection: 'row', gap: 16 }}>
    <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#F4EDFF', justifyContent: 'center', alignItems: 'center' }}>
      {icon}
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 16, fontWeight: '800', color: Theme.textPrimary, marginBottom: 4 }}>{title}</Text>
      <Text style={{ fontSize: 14, color: Theme.textSecondary, lineHeight: 20 }}>{desc}</Text>
    </View>
  </View>
);

const ReviewCard = ({ name, rating, date, comment }: any) => (
  <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 24, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10, elevation: 2 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' }}>
          <User size={18} color={Theme.textSecondary} />
        </View>
        <View>
          <Text style={{ fontSize: 14, fontWeight: '800', color: Theme.textPrimary }}>{name}</Text>
          <Text style={{ fontSize: 12, color: Theme.textSecondary }}>{date}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} size={12} color={s <= rating ? '#f59e0b' : '#E2E8F0'} fill={s <= rating ? '#f59e0b' : 'transparent'} />
        ))}
      </View>
    </View>
    <Text style={{ fontSize: 14, color: Theme.textPrimary, lineHeight: 22 }}>{comment}</Text>
  </View>
);

const InclusionItem = ({ text, included }: { text: string; included: boolean }) => (
  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 8 }}>
    <View style={{ marginTop: 2, width: 16, height: 16, borderRadius: 8, backgroundColor: included ? '#22C55E' : '#EF4444', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: 'white', fontSize: 10, fontWeight: '900' }}>{included ? '✓' : '✕'}</Text>
    </View>
    <Text style={{ fontSize: 12, fontWeight: '600', color: included ? '#166534' : '#991B1B', flex: 1 }}>{text}</Text>
  </View>
);

export const ServiceDetailScreen = withObservables(['route'], ({ route }: any) => {
  const serviceId = route.params.serviceId;
  const serviceObs = database.collections.get('services').findAndObserve(serviceId);
  
  return {
    service: serviceObs,
    relatedServices: serviceObs.pipe(
      // Fetch other services in the same category
      switchMap((service: any) => 
        database.collections.get('services')
          .query(
            Q.where('category_id', service.categoryId),
            Q.where('id', Q.notEq(service.id))
          )
          .observe()
      )
    )
  };
})(ServiceDetailScreenBase);
