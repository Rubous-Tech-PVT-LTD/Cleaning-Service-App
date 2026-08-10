import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Star, Image as ImageIcon, Home } from 'lucide-react-native';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';
import { database } from '../db';
import { Theme } from '../theme';
import { Skeleton } from '../components/Skeleton';

const ServiceListScreenBase = ({ route, navigation, services }: any) => {
  const { t, i18n } = useTranslation();
  const { title } = route.params;
  const [activeSort, setActiveSort] = React.useState('popular'); // popular, low_price, top_rated

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
        <View style={{ paddingHorizontal: 20, paddingVertical: 24, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
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
          ) : sortedServices.map((service: any) => (
            <TouchableOpacity
              key={service.id}
              onPress={() => navigation.navigate('ServiceDetail', { serviceId: service.id })}
              activeOpacity={0.9}
              style={{ width: '48%', backgroundColor: 'white', borderRadius: 28, marginBottom: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5 }}
            >
              <View style={{ width: '100%', aspectRatio: 1.1, backgroundColor: Theme.muted, position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
                <ImageIcon size={32} color={'#CBD5E1'} style={{ position: 'absolute' }} />
                <Image
                  source={{ uri: service.imageUrl || 'https://images.unsplash.com/photo-1581578731548-c64695ce6958?q=80&w=400' }}
                  style={{ width: '100%', height: '100%', position: 'absolute' }}
                  resizeMode="cover"
                />
                <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, elevation: 2 }}>
                  <Star size={12} color="#f59e0b" fill="#f59e0b" />
                  <Text style={{ fontSize: 11, fontWeight: '800', color: Theme.textPrimary, marginLeft: 4 }}>4.9</Text>
                </View>
                {/* Save Badge */}
                <View style={{ position: 'absolute', bottom: 12, left: 12, backgroundColor: Theme.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                   <Text style={{ color: 'white', fontSize: 10, fontWeight: '900' }}>30% OFF</Text>
                </View>
              </View>

              <View style={{ padding: 16 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: Theme.textPrimary, lineHeight: 20, height: 40 }} numberOfLines={2}>
                  {i18n.language === 'hi' ? service.nameHi : service.nameEn}
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: Theme.primary }}>₹{Number(service.basePrice).toFixed(0)}</Text>
                  <Text style={{ fontSize: 12, color: Theme.textSecondary, textDecorationLine: 'line-through', marginLeft: 8 }}>₹{(Number(service.basePrice) * 1.4).toFixed(0)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
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
