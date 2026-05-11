import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Star } from 'lucide-react-native';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';
import { database } from '../db';
import { Theme } from '../theme';
import { Skeleton } from '../components/Skeleton';

const ServiceListScreenBase = ({ route, navigation, services }: any) => {
  const { t, i18n } = useTranslation();
  const { title } = route.params;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.background }}>
      <View style={{ paddingHorizontal: 24, paddingVertical: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 5, zIndex: 10 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.border, justifyContent: 'center', alignItems: 'center' }}>
          <ChevronLeft size={24} color={Theme.textPrimary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 24, fontWeight: '900', color: Theme.textPrimary, marginLeft: 16 }}>{title}</Text>
      </View>
      <ScrollView style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 20, paddingVertical: 24, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {services.length === 0 ? (
            <>
              {[1, 2, 3, 4].map((i: number) => (
                <View key={i} style={{ width: '47.5%', backgroundColor: 'white', borderRadius: 24, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4 }}>
                  <Skeleton style={{ width: '100%', aspectRatio: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24 }} />
                  <View style={{ padding: 12 }}>
                    <Skeleton style={{ width: '80%', height: 16, borderRadius: 8, marginBottom: 8 }} />
                    <Skeleton style={{ width: '40%', height: 20, borderRadius: 8 }} />
                  </View>
                </View>
              ))}
            </>
          ) : services.map((service: any) => (
            <TouchableOpacity
              key={service.id}
              onPress={() => navigation.navigate('ServiceDetail', { serviceId: service.id })}
              style={{ width: '48%', backgroundColor: 'white', borderRadius: 28, marginBottom: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 15, elevation: 6 }}
            >
              <View style={{ width: '100%', aspectRatio: 1.1, backgroundColor: '#f1f5f9', position: 'relative' }}>
                <Image
                  source={{ uri: service.imageUrl || 'https://via.placeholder.com/200' }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
                <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, flexDirection: 'row', alignItems: 'center' }}>
                  <Star size={12} color="#f59e0b" fill="#f59e0b" />
                  <Text style={{ fontSize: 11, fontWeight: '800', color: Theme.textPrimary, marginLeft: 4 }}>4.9</Text>
                  <Text style={{ fontSize: 10, color: Theme.textSecondary, marginLeft: 2 }}>(3k)</Text>
                </View>
              </View>

              <View style={{ padding: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.textPrimary, lineHeight: 22, height: 44 }}>
                  {service[`name${i18n.language.charAt(0).toUpperCase() + i18n.language.slice(1)}`]}
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 12 }}>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: Theme.textPrimary }}>₹{service.basePrice}</Text>
                  <Text style={{ fontSize: 14, color: '#94a3b8', textDecorationLine: 'line-through', marginLeft: 8 }}>₹{Math.round(service.basePrice * 1.5)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export const ServiceListScreen = withObservables(['route'], ({ route }: any) => ({
  services: database.collections.get('services').query(
    Q.where('category_id', route.params.categoryId)
  ),
}))(ServiceListScreenBase);
