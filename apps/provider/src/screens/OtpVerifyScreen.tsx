import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
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
      const response = await api.post('/auth/otp/verify', { phone, code: otp });
      if (response.data.accessToken) {
        await AsyncStorage.setItem('provider_token', response.data.accessToken);
        await AsyncStorage.setItem('provider_id', response.data.user.id);
        navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
      } else {
        Alert.alert('Error', t('otp.no_access_token'));
        setLoading(false);
      }
    } catch (error: any) {
      let msg: string = error?.response?.data?.message || error?.message || '';
      if (msg.includes('NONE') || msg.includes('read-only')) {
        msg = t('otp.network_error');
      }
      setLoading(false);
      Alert.alert(t('otp.verification_failed'), msg || t('otp.invalid_otp'));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ padding: 32, flex: 1, justifyContent: 'center' }}>
        <Text style={{ fontSize: 28, fontWeight: '900', color: Theme.textPrimary }}>{t('otp.verify_otp')}</Text>
        <Text style={{ fontSize: 14, color: Theme.textSecondary, marginTop: 8, marginBottom: 40 }}>
          {t('otp.code_sent_to')} {phone}
        </Text>

        <TextInput
          style={{
            fontSize: 48, fontWeight: 'bold', letterSpacing: 10,
            color: Theme.textPrimary, borderBottomWidth: 2,
            borderBottomColor: Theme.primary, paddingBottom: 8,
          }}
          placeholder="000000"
          placeholderTextColor="#cbd5e1"
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={setOtp}
          autoFocus
        />

        <TouchableOpacity
          onPress={handleVerify}
          disabled={loading || otp.length < 6}
          style={{
            marginTop: 48, backgroundColor: otp.length >= 6 ? Theme.primary : Theme.border,
            paddingVertical: 20, borderRadius: 24, alignItems: 'center',
          }}
        >
          {loading
            ? <ActivityIndicator color="white" />
            : <Text style={{ color: 'white', fontWeight: '800', fontSize: 18 }}>{t('otp.verify_continue')}</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20, alignItems: 'center' }}>
          <Text style={{ color: Theme.primary, fontWeight: '600' }}>{t('otp.change_number')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
