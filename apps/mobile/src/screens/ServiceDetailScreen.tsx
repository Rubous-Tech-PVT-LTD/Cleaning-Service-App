import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Star, ArrowRight, Minus, Plus, ShieldCheck, Clock, Sparkles, User } from 'lucide-react-native';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';
import { switchMap } from 'rxjs/operators';
import { database } from '../db';
import { Theme } from '../theme';

const ServiceDetailScreenBase = ({ route, navigation, service, relatedServices }: any) => {
  const { t, i18n } = useTranslation();
  const [bookingType, setBookingType] = useState<'day' | 'bulk'>('day');
  const [quantity, setQuantity] = useState(1);
  
  // Calculate total based on type (for bulk, we can offer a slight discount or just multiply)
  const isLabour = service?.nameEn?.toLowerCase().includes('labour');
  const basePrice = service?.basePrice || 0;
  const totalPrice = bookingType === 'bulk' && isLabour ? (basePrice * quantity * 0.9) : (basePrice * quantity);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.background, position: 'relative' }}>
      <View style={{ position: 'absolute', top: 60, left: 24, zIndex: 100 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 10 }}>
          <ChevronLeft size={24} color={Theme.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
        <Image source={{ uri: service?.imageUrl || 'https://images.unsplash.com/photo-1581578731548-c64695ce6958?q=80&w=800' }} style={{ width: '100%', height: 400 }} />
        <View style={{ paddingHorizontal: 24, paddingVertical: 32, marginTop: -40, backgroundColor: Theme.background, borderTopLeftRadius: 40, borderTopRightRadius: 40 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <Star size={18} color={Theme.accent} fill={Theme.accent} />
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: Theme.textPrimary, marginLeft: 8 }}>4.8</Text>
            <Text style={{ fontSize: 14, color: Theme.textSecondary, marginLeft: 8 }}>(120+ reviews)</Text>
          </View>

          <Text style={{ fontSize: 32, fontWeight: '900', color: Theme.textPrimary, lineHeight: 38, marginBottom: 32 }}>
            {i18n.language === 'hi' ? service?.nameHi : service?.nameEn}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 24, borderRadius: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5, marginBottom: 32 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: Theme.textSecondary, fontWeight: '800', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Price</Text>
              <Text style={{ fontSize: 32, fontWeight: '900', color: Theme.primary }}>₹{totalPrice.toFixed(0)}</Text>
            </View>
            <View style={{ backgroundColor: '#ECFDF5', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 }}>
              <Text style={{ color: '#10B981', fontWeight: '900', fontSize: 11, textTransform: 'uppercase' }}>Verified</Text>
            </View>
          </View>

          {/* Dynamic Booking Options - Only for Labour or specific services */}
          {isLabour && (
            <View style={{ marginBottom: 32, backgroundColor: '#F8FAFC', borderRadius: 28, padding: 24, borderWidth: 1, borderColor: '#F1F5F9' }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: Theme.textPrimary, marginBottom: 20 }}>Booking Options</Text>
              
              <View style={{ flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 16, padding: 4, marginBottom: 24 }}>
                <TouchableOpacity 
                  onPress={() => setBookingType('day')}
                  style={{ flex: 1, paddingVertical: 12, backgroundColor: bookingType === 'day' ? 'white' : 'transparent', borderRadius: 12, alignItems: 'center', shadowColor: bookingType === 'day' ? '#000' : 'transparent', shadowOpacity: 0.05, shadowRadius: 4, elevation: bookingType === 'day' ? 2 : 0 }}
                >
                  <Text style={{ fontWeight: '800', color: bookingType === 'day' ? Theme.primary : Theme.textSecondary }}>Day-wise</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setBookingType('bulk')}
                  style={{ flex: 1, paddingVertical: 12, backgroundColor: bookingType === 'bulk' ? 'white' : 'transparent', borderRadius: 12, alignItems: 'center', shadowColor: bookingType === 'bulk' ? '#000' : 'transparent', shadowOpacity: 0.05, shadowRadius: 4, elevation: bookingType === 'bulk' ? 2 : 0 }}
                >
                  <Text style={{ fontWeight: '800', color: bookingType === 'bulk' ? Theme.primary : Theme.textSecondary }}>Bulk Hiring</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: Theme.textSecondary }}>
                  {bookingType === 'day' ? 'Number of Days' : 'Number of Labourers'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 18, padding: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
                  <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: 40, height: 40, backgroundColor: '#F1F5F9', borderRadius: 14, justifyContent: 'center', alignItems: 'center' }}>
                    <Minus size={20} color={Theme.textPrimary} />
                  </TouchableOpacity>
                  <Text style={{ width: 48, textAlign: 'center', fontSize: 20, fontWeight: '900', color: Theme.primary }}>{quantity}</Text>
                  <TouchableOpacity onPress={() => setQuantity(quantity + 1)} style={{ width: 40, height: 40, backgroundColor: Theme.primary, borderRadius: 14, justifyContent: 'center', alignItems: 'center' }}>
                    <Plus size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          <View style={{ backgroundColor: '#F1F5F9', padding: 20, borderRadius: 24, marginBottom: 32 }}>
            <Text style={{ fontSize: 15, color: Theme.textSecondary, lineHeight: 24, fontWeight: '500' }}>
              {bookingType === 'bulk' && isLabour ? "Bulk hiring includes a flat 10% discount on total wages. Tools and materials are not included." : "Professional service delivered right to your doorstep. We ensure 100% safety and high-quality standards with our verified experts."}
            </Text>
          </View>

          {/* Inclusions & Exclusions Section */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginBottom: 40 }}>
            {/* Left: What is Included */}
            <View style={{ flex: 1, backgroundColor: '#F0FDF4', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#DCFCE7' }}>
              <Text style={{ fontSize: 14, fontWeight: '900', color: '#166534', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>What's Included</Text>
              <InclusionItem text="Professional Equipment" included />
              <InclusionItem text="Verified Partner" included />
              <InclusionItem text="Post-service Cleanup" included />
              <InclusionItem text="Service Warranty" included />
            </View>

            {/* Right: What is NOT Included */}
            <View style={{ flex: 1, backgroundColor: '#FEF2F2', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#FEE2E2' }}>
              <Text style={{ fontSize: 14, fontWeight: '900', color: '#991B1B', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>What's Not</Text>
              <InclusionItem text="Material Costs" included={false} />
              <InclusionItem text="Extra Spare Parts" included={false} />
              <InclusionItem text="Deep Stains removal" included={false} />
              <InclusionItem text="Furniture Moving" included={false} />
            </View>
          </View>

          {/* How it Works Section */}
          <View style={{ marginBottom: 40 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: Theme.textPrimary, marginBottom: 20 }}>How it works</Text>
            <View style={{ gap: 20 }}>
              <StepItem 
                icon={<Sparkles size={20} color={Theme.primary} />} 
                title="1. Choose your service" 
                desc="Select from our range of verified services and choose a slot." 
              />
              <StepItem 
                icon={<ShieldCheck size={20} color={Theme.primary} />} 
                title="2. Expert matches with you" 
                desc="We assign the best-rated professional near your location." 
              />
              <StepItem 
                icon={<Clock size={20} color={Theme.primary} />} 
                title="3. Relax & Get it done" 
                desc="Our pro arrives on time and completes the job with care." 
              />
            </View>
          </View>

          {/* Customer Reviews Section */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: Theme.textPrimary }}>Customer Reviews</Text>
              <TouchableOpacity>
                <Text style={{ color: Theme.primary, fontWeight: '800' }}>See All</Text>
              </TouchableOpacity>
            </View>
            
            <ReviewCard 
              name="Rahul Sharma" 
              rating={5} 
              date="2 days ago" 
              comment="The cleaning was extremely thorough. The professional was very polite and arrived exactly on time. Highly recommended!" 
            />
            <ReviewCard 
              name="Priya Singh" 
              rating={4} 
              date="1 week ago" 
              comment="Great service. They used professional chemicals and equipment. My sofa looks brand new now. Minor delay in starting but overall good." 
            />
          </View>

          {/* Related Services Section */}
          {relatedServices && relatedServices.length > 0 && (
            <View style={{ marginBottom: 40 }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: Theme.textPrimary, marginBottom: 20 }}>You might also like</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                {relatedServices.map((item: any) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => navigation.push('ServiceDetail', { serviceId: item.id })}
                    style={{ width: 160, backgroundColor: 'white', borderRadius: 24, padding: 12, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10, elevation: 2 }}
                  >
                    <Image 
                      source={{ uri: item.imageUrl || 'https://via.placeholder.com/200' }} 
                      style={{ width: '100%', aspectRatio: 1, borderRadius: 16, marginBottom: 12 }} 
                      resizeMode="cover"
                    />
                    <Text style={{ fontSize: 14, fontWeight: '800', color: Theme.textPrimary, marginBottom: 4 }} numberOfLines={1}>
                      {i18n.language === 'hi' ? item.nameHi : item.nameEn}
                    </Text>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: Theme.primary }}>₹{Number(item.basePrice).toFixed(0)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingVertical: 20, paddingBottom: 32, backgroundColor: 'white', borderTopLeftRadius: 36, borderTopRightRadius: 36, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 25 }}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Booking', {
            serviceId: service.id,
            title: i18n.language === 'hi' ? service.nameHi : service.nameEn,
            price: totalPrice.toFixed(0),
            bookingType: bookingType,
            quantity: quantity
          })}
          style={{ backgroundColor: Theme.primary, paddingVertical: 16, borderRadius: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', shadowColor: Theme.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 }}
        >
          <Text style={{ color: 'white', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 }}>{t('common.proceed_to_booking').toUpperCase()}</Text>
          <ArrowRight size={20} color="white" style={{ marginLeft: 10 }} />
        </TouchableOpacity>
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
