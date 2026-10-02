import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../api';
import { Theme } from '../theme';
import { reviewSchema } from '../validation/schemas';

type ReviewFormData = z.infer<typeof reviewSchema>;

export const ReviewScreen = ({ route, navigation }: any) => {
  const { t } = useTranslation();
  const { bookingId, serviceName } = route.params;
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors }, watch } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      comment: ''
    }
  });

  const rating = watch('rating');

  const onSubmit = async (data: ReviewFormData) => {
    if (!bookingId) {
      Alert.alert('Error', 'Booking ID is missing');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/reviews', {
        bookingId,
        rating: Number(data.rating),
        comment: data.comment || undefined,
      });

      Alert.alert('Success', 'Thank you for your feedback!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Could not submit review';
      Alert.alert('Error', errorMessage);
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ padding: 32, flex: 1, justifyContent: 'center' }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: Theme.textPrimary }}>{t('common.rate_service')}</Text>
        <Text style={{ fontSize: 18, color: Theme.textSecondary, marginTop: 8 }}>{serviceName}</Text>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 40, marginBottom: 40 }}>
          <Controller
            control={control}
            name="rating"
            render={({ field: { onChange, value } }) => (
              <>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => onChange(star)}>
                    <Star size={40} color={star <= value ? Theme.accent : Theme.border} fill={star <= value ? Theme.accent : 'none'} style={{ marginHorizontal: 8 }} />
                  </TouchableOpacity>
                ))}
              </>
            )}
          />
        </View>

        <Controller
          control={control}
          name="comment"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={{ backgroundColor: Theme.background, borderRadius: 24, padding: 24, height: 150, textAlignVertical: 'top', fontSize: 16, borderWidth: 2, borderColor: errors.comment ? Theme.error : 'transparent' }}
              placeholder="Write your experience..."
              multiline
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        {errors.comment && (
          <Text style={{ marginTop: 4, fontSize: 12, color: Theme.error }}>{errors.comment.message}</Text>
        )}

        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
          style={{ marginTop: 40, backgroundColor: Theme.primary, paddingVertical: 22, borderRadius: 24, alignItems: 'center', opacity: loading ? 0.5 : 1 }}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>{t('common.submit_review')}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
