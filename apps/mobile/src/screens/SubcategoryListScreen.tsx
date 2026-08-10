import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Home } from 'lucide-react-native';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';
import { database } from '../db';
import { Theme } from '../theme';
import { Skeleton } from '../components/Skeleton';

const SubcategoryListScreenBase = ({ route, navigation, subcategories }: any) => {
  const { t, i18n } = useTranslation();
  const { categoryId, categoryName } = route.params;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.background }}>
      <View style={{ backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 5, zIndex: 10 }}>
        <View style={{ paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.muted, justifyContent: 'center', alignItems: 'center' }}>
            <ChevronLeft size={24} color={Theme.textPrimary} />
          </TouchableOpacity>
          <View style={{ marginLeft: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: Theme.textPrimary }}>{categoryName}</Text>
            <Text style={{ fontSize: 12, color: Theme.textSecondary, fontWeight: '700' }}>{subcategories.length} subcategories</Text>
          </View>
        </View>
      </View>
      
      <ScrollView style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 20, paddingVertical: 24, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
          {subcategories.length === 0 ? (
            <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
              <Home size={64} color={Theme.textSecondary} style={{ marginBottom: 16 }} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.textSecondary, textAlign: 'center', marginBottom: 8 }}>
                {t('common.noSubcategories')}
              </Text>
              <Text style={{ fontSize: 14, color: Theme.textSecondary, textAlign: 'center' }}>
                {t('common.noSubcategoriesDescription')}
              </Text>
            </View>
          ) : subcategories.map((subcategory: any, index: number) => {
            const nameEn = subcategory?.nameEn || '';
            const displayName = i18n.language === 'hi' ? (subcategory?.nameHi || nameEn) : nameEn;
            const imageSource = subcategory?.iconUrl ? { uri: subcategory.iconUrl } : null;

            return (
              <TouchableOpacity
                key={subcategory.id}
                onPress={() => navigation.navigate('ServiceList', { 
                  subcategoryId: subcategory.id, 
                  categoryId: categoryId,
                  title: displayName 
                })}
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
      </ScrollView>
    </SafeAreaView>
  );
};

export const SubcategoryListScreen = withObservables(['route'], ({ route }: any) => ({
  subcategories: database.collections.get('subcategories').query(
    Q.where('category_id', route.params.categoryId)
  ),
}))(SubcategoryListScreenBase);
