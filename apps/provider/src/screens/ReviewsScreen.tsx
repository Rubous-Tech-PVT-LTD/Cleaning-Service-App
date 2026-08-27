import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../theme';
import api from '../api';
import i18n from '../i18n';
import { useTranslation } from 'react-i18next';

export const ReviewsScreen = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<{ reviews: any[], averageRating: number, totalReviews: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reviews/me');
      setData(res.data);
    } catch (e) {
      console.log('Failed to fetch reviews', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('provider.my_reviews')}</Text>
        <Text style={styles.headerSubtitle}>{t('provider.see_what_clients_say')}</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchReviews} colors={[Theme.primary]} />}
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t('provider.average_rating')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Text style={styles.averageRating}>{data?.averageRating ? data.averageRating.toFixed(1) : '0.0'}</Text>
            <Text style={styles.starIcon}>★</Text>
          </View>
          <Text style={styles.totalReviews}>{t('provider.based_on_reviews')} {data?.totalReviews || 0} {t('provider.reviews')}</Text>
        </View>

        <Text style={styles.sectionTitle}>{t('provider.recent_feedback')}</Text>

        {(!data?.reviews || data.reviews.length === 0) && !loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t('provider.no_reviews_yet')}</Text>
            <Text style={styles.emptyStateSub}>{t('provider.complete_jobs_feedback')}</Text>
          </View>
        ) : (
          data?.reviews.map((review: any) => {
            const date = new Date(review.createdAt).toLocaleDateString();
            const clientName = review.booking?.client?.fullName || 'Anonymous Client';
            
            // Handle service name with language support
            let serviceName = 'Service';
            const isHindi = i18n.language === 'hi';
            
            if (review.booking?.service) {
              // Try sync API format first (snake_case)
              if (isHindi && review.booking.service.name_hi) {
                serviceName = review.booking.service.name_hi;
              } else if (review.booking.service.name_en) {
                serviceName = review.booking.service.name_en;
              }
              // Try regular API format (camelCase with JSON object)
              else if (typeof review.booking.service.nameTranslations === 'object' && review.booking.service.nameTranslations.hi && isHindi) {
                serviceName = review.booking.service.nameTranslations.hi;
              } else if (typeof review.booking.service.nameTranslations === 'object' && review.booking.service.nameTranslations.en) {
                serviceName = review.booking.service.nameTranslations.en;
              }
              // Try if nameTranslations is a stringified JSON
              else if (typeof review.booking.service.nameTranslations === 'string') {
                try {
                  const parsed = JSON.parse(review.booking.service.nameTranslations);
                  if (isHindi && parsed.hi) {
                    serviceName = parsed.hi;
                  } else {
                    serviceName = parsed.en || review.booking.service.nameTranslations;
                  }
                } catch {
                  serviceName = review.booking.service.nameTranslations;
                }
              }
              // Fallback to name field
              else if (review.booking.service.name) {
                serviceName = review.booking.service.name;
              }
            }

            return (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.clientName}>{clientName}</Text>
                  <Text style={styles.reviewDate}>{date}</Text>
                </View>
                <Text style={styles.serviceName}>{serviceName}</Text>
                <Text style={styles.stars}>{renderStars(review.rating)}</Text>
                {review.comment ? (
                  <Text style={styles.comment}>"{review.comment}"</Text>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  header: { padding: 24, backgroundColor: Theme.background },
  headerTitle: { fontSize: 28, fontWeight: '900', color: Theme.primary, marginBottom: 4 },
  headerSubtitle: { fontSize: 14, fontWeight: '600', color: Theme.textSecondary },
  scrollContent: { padding: 24, paddingTop: 8 },
  summaryCard: { backgroundColor: Theme.primary, padding: 24, borderRadius: 24, alignItems: 'center', marginBottom: 32, elevation: 8, shadowColor: Theme.primary, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
  summaryLabel: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.8)', letterSpacing: 1 },
  averageRating: { fontSize: 48, fontWeight: '900', color: 'white' },
  starIcon: { fontSize: 32, color: '#FCD34D', marginLeft: 8, marginTop: -8 },
  totalReviews: { color: 'rgba(255,255,255,0.9)', marginTop: 8, fontWeight: '600' },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: Theme.textPrimary, marginBottom: 16 },
  emptyState: { padding: 40, alignItems: 'center', backgroundColor: Theme.white, borderRadius: 24, borderStyle: 'dashed', borderWidth: 2, borderColor: Theme.border },
  emptyStateText: { color: Theme.textSecondary, fontWeight: '700', fontSize: 16 },
  emptyStateSub: { color: Theme.textSecondary, fontWeight: '500', fontSize: 14, marginTop: 8, textAlign: 'center' },
  reviewCard: { backgroundColor: 'white', padding: 20, borderRadius: 24, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  clientName: { fontSize: 16, fontWeight: '800', color: Theme.textPrimary },
  reviewDate: { fontSize: 12, color: Theme.textSecondary, fontWeight: '600' },
  serviceName: { fontSize: 12, color: Theme.primary, fontWeight: '700', marginBottom: 8 },
  stars: { fontSize: 16, color: '#F59E0B', marginBottom: 8 },
  comment: { fontSize: 14, color: Theme.textSecondary, lineHeight: 22, fontStyle: 'italic' },
});
