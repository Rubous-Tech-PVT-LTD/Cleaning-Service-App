import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Camera, User, Phone, Check, Info } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Theme } from '../theme';
import api from '../api';
import { profileSchema } from '../validation/schemas';

type ProfileFormData = z.infer<typeof profileSchema>;

export const ProfileEditScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const { control, handleSubmit, formState: { errors, isDirty, isValid, dirtyFields }, reset, watch, trigger } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      phone: ''
    },
    mode: 'onChange'
  });

  const fullName = watch('fullName');

  useFocusEffect(
    useCallback(() => {
      const loadUser = async () => {
        const storedName = await AsyncStorage.getItem('user_name');
        const storedPhone = await AsyncStorage.getItem('user_phone');
        const storedAvatar = await AsyncStorage.getItem('user_avatar');
        if (storedName) reset({ fullName: storedName, phone: storedPhone || '' });
        if (storedAvatar) setAvatarUrl(storedAvatar);
      };
      loadUser();
    }, [reset])
  );

  const handleSave = async (data: ProfileFormData) => {
    const isFormValid = await trigger();
    if (!isFormValid) {
      Alert.alert('Validation Error', 'Please fix the errors before saving.');
      return;
    }

    if (!data.fullName || data.fullName.trim().length < 2) {
      Alert.alert('Validation Error', 'Name must be at least 2 characters.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.patch('/users/profile', { name: data.fullName.trim() });

      const savedName = response.data?.data?.name || response.data?.data?.fullName || data.fullName.trim();
      await AsyncStorage.setItem('user_name', savedName);

      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        navigation.goBack();
      }, 1200);
    } catch (e) {
      await AsyncStorage.setItem('user_name', data.fullName.trim());
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        navigation.goBack();
      }, 1200);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: Theme.surface, elevation: 2 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.muted, justifyContent: 'center', alignItems: 'center' }}>
            <ChevronLeft size={22} color={Theme.textPrimary} />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: '900', color: Theme.textPrimary, marginLeft: 16 }}>{t('profile.edit_profile')}</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={handleSubmit(handleSave)} disabled={loading || !isDirty || !isValid} style={{ backgroundColor: saved ? Theme.success : Theme.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14, opacity: (!isDirty || loading || !isValid) ? 0.5 : 1 }}>
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : saved ? (
              <Check size={18} color="white" />
            ) : (
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 14 }}>{t('common.save')}</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 24 }}>
          <View style={{ alignItems: 'center', marginBottom: 36 }}>
            <View style={{ position: 'relative' }}>
              <LinearGradient
                colors={[Theme.primary, '#7C3AED']}
                style={{ width: 110, height: 110, borderRadius: 55, justifyContent: 'center', alignItems: 'center' }}
              >
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={{ width: 110, height: 110, borderRadius: 55 }} />
                ) : (
                  <User size={52} color="white" />
                )}
              </LinearGradient>
              <TouchableOpacity
                style={{ position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderRadius: 18, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 }}
                onPress={() => Alert.alert('Coming Soon', 'Photo upload will be available in the next update.')}
              >
                <Camera size={18} color={Theme.primary} />
              </TouchableOpacity>
            </View>
            <Text style={{ marginTop: 12, fontSize: 13, color: Theme.textSecondary, fontWeight: '600' }}>{t('profile.tap_to_change')}</Text>
          </View>

          <View style={{ gap: 20 }}>
            <View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: Theme.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('profile.full_name')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 16, borderWidth: 2, borderColor: errors.fullName ? Theme.error : Theme.border, paddingHorizontal: 16 }}>
                <User size={18} color={Theme.textSecondary} />
                <Controller
                  control={control}
                  name="fullName"
                  render={({ field: { onChange, value, onBlur } }) => (
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder={t('profile.enter_name')}
                      placeholderTextColor={Theme.textSecondary}
                      style={{ flex: 1, paddingVertical: 16, marginLeft: 12, fontSize: 16, fontWeight: '600', color: Theme.textPrimary }}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  )}
                />
              </View>
              {errors.fullName && (
                <Text style={{ marginTop: 4, fontSize: 12, color: Theme.error }}>{errors.fullName.message}</Text>
              )}
            </View>

            <View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: Theme.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('profile.phone_number')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.background, borderRadius: 16, borderWidth: 2, borderColor: Theme.border, paddingHorizontal: 16 }}>
                <Phone size={18} color={Theme.textSecondary} />
                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { value } }) => (
                    <TextInput
                      value={value}
                      editable={false}
                      style={{ flex: 1, paddingVertical: 16, marginLeft: 12, fontSize: 16, fontWeight: '600', color: Theme.textSecondary }}
                    />
                  )}
                />
                <View style={{ backgroundColor: Theme.muted, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: Theme.textSecondary }}>{t('profile.locked')}</Text>
                </View>
              </View>
              <Text style={{ marginTop: 6, fontSize: 12, color: Theme.textSecondary }}>{t('profile.phone_note')}</Text>
            </View>
          </View>

          <View style={{ marginTop: 32, backgroundColor: Theme.infoLight, borderRadius: 16, padding: 16, flexDirection: 'row' }}>
            <Info size={20} color={Theme.info} />
            <Text style={{ flex: 1, marginLeft: 12, fontSize: 13, color: Theme.info, lineHeight: 20, fontWeight: '600' }}>
              {t('profile.info_note')}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
