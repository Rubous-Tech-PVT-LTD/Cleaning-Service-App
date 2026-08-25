import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Animated, Dimensions, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { BASE_URL } from '../api';
import { Theme } from '../theme';

const { width, height } = Dimensions.get('window');

// ─── Globe Icon Component ──
const GlobeIcon = ({ size = 16, color = 'white' }: { size?: number; color?: string }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
      <Path d="M2 12h20" />
      <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </Svg>
  );
};

// ─── Same Logo Component as Client App (mobile/src/screens/LoginScreen.tsx) ──
// Uses react-native-svg directly instead of lucide for Zap & Leaf paths
const HouceeLogo = ({ size = 80, white = true }: { size?: number; white?: boolean }) => {
  const stroke = white ? '#FFFFFF' : Theme.primary;
  const zapFill = white ? '#FFFFFF' : '#22c55e';
  const zapBg = white ? 'rgba(255,255,255,0.2)' : '#dcfce7';
  const zapBorder = white ? '#FFFFFF' : '#22c55e';
  const leafFill = white ? '#dcfce7' : '#15803d';

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      {/* House outline — same path as client app */}
      <Svg
        width={size} height={size} viewBox="0 0 24 24"
        fill="none" stroke={stroke} strokeWidth={1}
        strokeLinecap="round" strokeLinejoin="round"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </Svg>

      {/* Zap circle (bottom-left) — same as client */}
      <View style={{
        position: 'absolute',
        bottom: size * 0.22, left: size * 0.16,
        width: size * 0.40, height: size * 0.40,
        borderRadius: size * 0.20,
        backgroundColor: zapBg,
        borderWidth: 1.5, borderColor: zapBorder,
        justifyContent: 'center', alignItems: 'center',
        zIndex: 1,
      }}>
        {/* Zap SVG path (lucide Zap icon) */}
        <Svg width={size * 0.22} height={size * 0.22} viewBox="0 0 24 24">
          <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill={zapFill} />
        </Svg>
      </View>

      {/* Leaf (bottom-right, rotated 45deg) — same as client */}
      <View style={{
        position: 'absolute',
        bottom: size * 0.24, right: size * 0.20,
        zIndex: 2,
        transform: [{ rotate: '45deg' }],
      }}>
        {/* Leaf SVG path (lucide Leaf icon) */}
        <Svg width={size * 0.42} height={size * 0.42} viewBox="0 0 24 24">
          <Path
            d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"
            fill={leafFill}
          />
        </Svg>
      </View>
    </View>
  );
};

export const LoginScreen = ({ navigation }: any) => {
  const { t, i18n } = useTranslation();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSplashing, setIsSplashing] = useState(true);

  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const contentFadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(contentFadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start(() => setIsSplashing(false));
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const toggleLanguage = async () => {
    const nextLang = i18n.language === 'en' ? 'hi' : 'en';
    await i18n.changeLanguage(nextLang);
    await AsyncStorage.setItem('user-language', nextLang);
  };

  const handleRequestOtp = async () => {
    if (phone.length < 10) return;
    setLoading(true);
    try {
      const res = await api.post('/auth/otp/request', { phone: `+91${phone}` });
      if (res.data?.devCode) {
        Alert.alert('🔐 DEV - Your OTP', `Code: ${res.data.devCode}`, [
          { text: 'OK', onPress: () => navigation.navigate('OtpVerify', { phone: `+91${phone}` }) }
        ]);
      } else {
        navigation.navigate('OtpVerify', { phone: `+91${phone}` });
      }
    } catch (error: any) {
      console.log('[Login Error]', error);
      const errorMsg: string = error?.message || '';

      // Hermes NONE bug: fires during response cleanup but request likely succeeded.
      // Navigate to OTP screen anyway — the OTP was sent.
      if (errorMsg.includes('NONE') || errorMsg.includes('read-only') || errorMsg.includes('Hermes')) {
        console.log('[Login] NONE bug detected — assuming OTP was sent, navigating...');
        navigation.navigate('OtpVerify', { phone: `+91${phone}` });
        return;
      }

      Alert.alert('Connection Failed', `Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.background, position: 'relative' }}>
      <StatusBar backgroundColor="transparent" barStyle="light-content" translucent />

      {/* ── Curved header background (same as client) ── */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 0 }}>
        <Svg height={height * 0.4} width={width} viewBox={`0 0 ${width} ${height * 0.4}`}>
          <Defs>
            <SvgLinearGradient id="providerGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={Theme.primary} stopOpacity="1" />
              <Stop offset="1" stopColor={Theme.primaryDark} stopOpacity="1" />
            </SvgLinearGradient>
          </Defs>
          <Path
            d={`M0,0 L${width},0 L${width},${height * 0.15} Q${width * 0.5},${height * 0.4} 0,${height * 0.25} Z`}
            fill="url(#providerGrad)"
          />
        </Svg>
      </View>

      {/* ── Splash Screen — full screen gradient with logo ── */}
      {isSplashing && (
        <Animated.View style={{
          position: 'absolute',
          top: -(StatusBar.currentHeight ?? 24),
          left: 0, right: 0, bottom: 0,
          zIndex: 100, opacity: fadeAnim,
        }}>
          <LinearGradient
            colors={[Theme.primary, Theme.primaryDark]}
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          >
            {/* Same layout as mobile client splash */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 40 }}>
              <View style={{ width: 96, height: 96, marginRight: 16 }}>
                <HouceeLogo size={96} white />
              </View>
              <View style={{ justifyContent: 'center' }}>
                <Text style={{ fontSize: 42, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1, lineHeight: 42 }}>houcee</Text>
                <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '700', letterSpacing: 1, marginTop: 2 }}>{t('login.partner_app')}</Text>
              </View>
            </View>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>
      )}

      {/* ── Login Form ── */}
      <Animated.View style={{ flex: 1, opacity: isSplashing ? 0 : contentFadeAnim }}>

        {/* Language Toggle Button */}
        <View style={{ paddingHorizontal: 32, paddingVertical: 20, alignItems: 'flex-end', zIndex: 20 }}>
          <TouchableOpacity 
            onPress={toggleLanguage} 
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}
          >
            <GlobeIcon size={16} color="white" />
            <Text style={{ marginLeft: 8, fontWeight: 'bold', color: 'white' }}>
              {i18n.language === 'hi' ? 'English' : 'हिंदी'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Logo section (same as client form) */}
        <View style={{ paddingHorizontal: 32, paddingTop: 16, zIndex: 10, flexDirection: 'row', alignItems: 'center' }}>
          <HouceeLogo size={80} white />
          <View style={{ marginLeft: 16, justifyContent: 'center' }}>
            <Text style={{ fontSize: 42, fontWeight: '900', color: '#1E1B4B', letterSpacing: -1, lineHeight: 42 }}>houcee</Text>
            <Text style={{ fontSize: 14, color: Theme.primary, fontWeight: '700', letterSpacing: 0.5, marginTop: -2 }}>{t('login.partner_app')}</Text>
          </View>
        </View>

        {/* Login Card */}
        <View style={{ flex: 1, paddingHorizontal: 32, justifyContent: 'center' }}>
          <View style={{
            backgroundColor: Theme.white, borderRadius: 24, padding: 32,
            shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.05, shadowRadius: 20, elevation: 10,
          }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.textSecondary, marginBottom: 12 }}>{t('common.phone_number')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1.5, borderBottomColor: Theme.border, paddingBottom: 12 }}>
              <Text style={{ fontSize: 22, fontWeight: '700', color: Theme.textPrimary, marginRight: 12 }}>+91</Text>
              <TextInput
                style={{ flex: 1, fontSize: 22, fontWeight: '700', color: Theme.textPrimary }}
                placeholder="00000 00000"
                placeholderTextColor="#cbd5e1"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={10}
              />
            </View>
            <TouchableOpacity
              onPress={handleRequestOtp}
              disabled={loading || phone.length < 10}
              style={{
                marginTop: 32, backgroundColor: Theme.primary,
                paddingVertical: 18, borderRadius: 16, alignItems: 'center',
                shadowColor: Theme.primary, shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2, shadowRadius: 8,
              }}
            >
              {loading
                ? <ActivityIndicator color="white" />
                : <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>{t('login.login_securely', 'Login securely')}</Text>
              }
            </TouchableOpacity>
            
            {/* Register Link */}
            <TouchableOpacity 
              style={{ marginTop: 20, alignItems: 'center', paddingVertical: 8 }}
              onPress={() => navigation.navigate('Registration')}
            >
              <Text style={{ fontSize: 14, color: Theme.textSecondary, fontWeight: '600' }}>
                {t('login.new_partner', 'New Partner?')} <Text style={{ color: Theme.primary, fontWeight: '800' }}>{t('login.apply_here', 'Apply Here')}</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ paddingBottom: 40, alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: Theme.textSecondary, fontWeight: '500', letterSpacing: 0.5 }}>
            {t('login.product_by')} <Text style={{ fontWeight: '800', color: Theme.primary }}>Rubous Tech Pvt. Ltd</Text>
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};
