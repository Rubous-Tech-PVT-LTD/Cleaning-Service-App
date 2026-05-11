import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';
import { Theme } from '../theme';

export const OtpVerifyScreen = ({ route, navigation }: any) => {
  const { t } = useTranslation();
  const { phone } = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (otp.length < 6) return;
    setLoading(true);
    try {
      console.log('Verifying OTP for:', phone, 'Code:', otp);
      const response = await api.post('/auth/otp/verify', { phone, code: otp });
      if (response.data.accessToken) {
        await AsyncStorage.setItem('user_token', response.data.accessToken);
        await AsyncStorage.setItem('user_id', response.data.user.id);
        navigation.navigate('Home');
      } else {
        Alert.alert('Error', 'No access token received');
      }
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Verification Failed', error.response?.data?.message || 'Invalid OTP');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ padding: 32, flex: 1, justifyContent: 'center' }}>
        <Text style={{ fontSize: 32, fontWeight: '800', color: Theme.textPrimary }}>{t('common.verify_identity')}</Text>
        <TextInput
          style={{ fontSize: 48, fontWeight: 'bold', marginTop: 40, letterSpacing: 10, color: Theme.textPrimary }}
          placeholder="000000"
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={setOtp}
          autoFocus
        />
        <TouchableOpacity
          onPress={handleVerify}
          disabled={loading || otp.length < 6}
          style={{ marginTop: 40, backgroundColor: Theme.primary, paddingVertical: 20, borderRadius: 24, alignItems: 'center' }}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>{t('common.verify_continue')}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
