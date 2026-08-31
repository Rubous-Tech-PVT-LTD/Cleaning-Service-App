import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Star, Image as ImageIcon, Home } from 'lucide-react-native';
import { Theme } from '../theme';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { LoginRequiredModal } from '../components/LoginRequiredModal';

type Category = {
  id: string;
  nameTranslations: { en: string; hi: string };
  slug: string;
  services: Service[];
};

type Service = {
  id: string;
  nameTranslations: { en: string; hi: string };
  basePrice: number;
  imageUrl?: string;
  estimatedTime?: string;
  categoryId: string;
};

export const ServiceSelectionScreen = ({ navigation }: any) => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { requireAuth, showLoginModal, handleLoginPress, handleCloseModal } = useAuthGuard();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchCategoriesWithServices();
  }, []);

  const fetchCategoriesWithServices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      const categoriesData = res.data || [];

      // Fetch services for each category
      const categoriesWithServices = await Promise.all(
        categoriesData.map(async (category: any) => {
          try {
            const servicesRes = await api.get(`/services?categoryId=${category.id}`);
            return {
              ...category,
              services: servicesRes.data || [],
            };
          } catch (error) {
            console.error(`Error fetching services for category ${category.id}:`, error);
            return {
              ...category,
              services: [],
            };
          }
        })
      );

      // Filter out categories with no services
      const filteredCategories = categoriesWithServices.filter(
        (cat: Category) => cat.services.length > 0
      );

      setCategories(filteredCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (service: Service) => {
    if (!requireAuth()) return;

    setSelectedService(service);
    navigation.navigate('ScheduleForLater', {
      selectedService: service,
    });
  };

  const getCategoryName = (category: Category) => {
    return i18n.language === 'hi' 
      ? category.nameTranslations?.hi || category.nameTranslations?.en 
      : category.nameTranslations?.en;
  };

  const getServiceName = (service: Service) => {
    return i18n.language === 'hi' 
      ? service.nameTranslations?.hi || service.nameTranslations?.en 
      : service.nameTranslations?.en;
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' }}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={Theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('schedule.select_service', 'Select Service')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {categories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Home size={64} color={Theme.textSecondary} />
            <Text style={styles.emptyText}>{t('common.noServices', 'No services available')}</Text>
          </View>
        ) : (
          categories.map((category) => (
            <View key={category.id} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{getCategoryName(category)}</Text>
              <View style={styles.servicesGrid}>
                {category.services.map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    onPress={() => handleServiceSelect(service)}
                    style={styles.serviceCard}
                    activeOpacity={0.9}
                  >
                    <View style={styles.serviceImageContainer}>
                      {service.imageUrl ? (
                        <Image
                          source={{ uri: service.imageUrl }}
                          style={styles.serviceImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.serviceImagePlaceholder}>
                          <ImageIcon size={32} color={Theme.textSecondary} />
                        </View>
                      )}
                      <View style={styles.ratingBadge}>
                        <Star size={10} color="#f59e0b" fill="#f59e0b" />
                        <Text style={styles.ratingText}>4.9</Text>
                      </View>
                    </View>
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName} numberOfLines={2}>
                        {getServiceName(service)}
                      </Text>
                      <Text style={styles.servicePrice}>₹{Math.round(Number(service.basePrice))}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

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
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.textSecondary,
    marginTop: 16,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.textPrimary,
    marginBottom: 12,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  serviceCard: {
    width: '48%',
    marginHorizontal: '1%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  serviceImageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  serviceImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    elevation: 2,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.textPrimary,
    marginLeft: 4,
  },
  serviceInfo: {
    padding: 12,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.textPrimary,
    lineHeight: 18,
    height: 36,
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.textPrimary,
  },
});
