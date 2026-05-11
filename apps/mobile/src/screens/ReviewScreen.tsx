import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react-native';
import { database } from '../db';
import { Theme } from '../theme';

export const ReviewScreen = ({ route, navigation }: any) => {
  const { t } = useTranslation();
  const { bookingId, serviceName } = route.params;
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await database.write(async () => {
        await database.get('reviews').create((r: any) => {
          r.bookingId = bookingId;
          r.rating = rating;
          r.comment = comment;
          r.createdAt = Date.now();
        });
      });
      
      Alert.alert('Success', 'Thank you for your feedback!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', 'Could not submit review');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ padding: 32, flex: 1, justifyContent: 'center' }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: Theme.textPrimary }}>{t('common.rate_service')}</Text>
        <Text style={{ fontSize: 18, color: Theme.textSecondary, marginTop: 8 }}>{serviceName}</Text>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 40, marginBottom: 40 }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Star size={40} color={star <= rating ? Theme.accent : Theme.border} fill={star <= rating ? Theme.accent : 'none'} style={{ marginHorizontal: 8 }} />
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={{ backgroundColor: Theme.background, borderRadius: 24, padding: 24, height: 150, textAlignVertical: 'top', fontSize: 16 }}
          placeholder="Write your experience..."
          multiline
          value={comment}
          onChangeText={setComment}
        />

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={{ marginTop: 40, backgroundColor: Theme.primary, paddingVertical: 22, borderRadius: 24, alignItems: 'center' }}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>{t('common.submit_review')}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
