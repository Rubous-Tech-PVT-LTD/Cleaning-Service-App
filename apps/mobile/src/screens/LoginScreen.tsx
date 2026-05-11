import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Dimensions, Animated, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Phone, Lock, Globe, Zap, Leaf } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import api from '../api';
import { Theme } from '../theme';

export const LoginScreen = ({ navigation }: any) => {
  const { t, i18n } = useTranslation();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSplashing, setIsSplashing] = useState(true);
  const { width, height } = Dimensions.get('window');

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const contentFadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(contentFadeAnim, { toValue: 1, duration: 400, useNativeDriver: true })
      ]).start(() => setIsSplashing(false));
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const toggleLanguage = () => {
    const nextLng = i18n.language === 'hi' ? 'en' : 'hi';
    i18n.changeLanguage(nextLng);
  };

  const handleRequestOtp = async () => {
    if (phone.length < 10) return;
    setPhone(''); // Clear for security
    setLoading(true);
    try {
      await api.post('/auth/otp/request', { phone: `+91${phone}` });
      navigation.navigate('OtpVerify', { phone: `+91${phone}` });
    } catch (error: any) {
      setLoading(false);
      console.error('OTP Error:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || error.message || 'Service unavailable.');
    }
  };

  const CurvedHeader = () => (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 0 }}>
      <Svg height={height * 0.4} width={width} viewBox={`0 0 ${width} ${height * 0.4}`}>
        <Defs>
          <SvgLinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Theme.primary} stopOpacity="1" />
            <Stop offset="1" stopColor={Theme.primaryDark} stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>
        <Path
          d={`M0,0 L${width},0 L${width},${height * 0.15} Q${width * 0.5},${height * 0.4} 0,${height * 0.25} Z`}
          fill="url(#grad)"
        />
      </Svg>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.background, position: 'relative' }}>
      <CurvedHeader />

      {/* Splash State Layer */}
      {isSplashing && (
        <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, opacity: fadeAnim }}>
          <LinearGradient
            colors={[Theme.primary, Theme.primaryDark]}
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 40 }}>
              <View style={{ width: 96, height: 96, marginRight: 16, position: 'relative' }}>
                <Svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', top: 0, left: 0 }}>
                  <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                </Svg>
                <View style={{ position: 'absolute', bottom: 18, left: 16, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1.5, borderColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', zIndex: 1 }}>
                  <Zap size={22} color="#FFFFFF" fill="#FFFFFF" />
                </View>
                <View style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 2 }}>
                  <Leaf size={34} color="#dcfce7" fill="#dcfce7" style={{ transform: [{ rotate: '45deg' }] }} />
                </View>
              </View>
              <View style={{ justifyContent: 'center' }}>
                <Text style={{ fontSize: 42, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1, lineHeight: 42 }}>houcee</Text>
                <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', fontWeight: '700', letterSpacing: 0.5, marginTop: -2 }}>one tap away</Text>
              </View>
            </View>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>
      )}

      {/* Login Form Layer */}
      <Animated.View style={{ flex: 1, opacity: isSplashing ? 0 : contentFadeAnim }}>
        <View style={{ paddingHorizontal: 32, paddingVertical: 20, alignItems: 'flex-end', zIndex: 20 }}>
          <TouchableOpacity onPress={toggleLanguage} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}>
            <Globe size={16} color="white" />
            <Text style={{ marginLeft: 8, fontWeight: 'bold', color: 'white' }}>{i18n.language === 'hi' ? 'English' : 'हिंदी'}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, paddingHorizontal: 32, justifyContent: 'center', marginTop: -20 }}>
          <View style={{ alignItems: 'center', marginBottom: 50, flexDirection: 'row', justifyContent: 'center' }}>
            <View style={{ width: 80, height: 80, marginRight: 16, position: 'relative' }}>
              <Svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke={Theme.primary} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', top: 0, left: 0 }}>
                <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              </Svg>
              <View style={{ position: 'absolute', bottom: 16, left: 14, width: 34, height: 34, borderRadius: 17, backgroundColor: '#dcfce7', borderWidth: 1.5, borderColor: '#22c55e', justifyContent: 'center', alignItems: 'center', zIndex: 1 }}>
                <Zap size={18} color="#22c55e" fill="#22c55e" />
              </View>
              <View style={{ position: 'absolute', bottom: 18, right: 16, zIndex: 2 }}>
                <Leaf size={28} color="#15803d" fill="#15803d" style={{ transform: [{ rotate: '45deg' }] }} />
              </View>
            </View>
            <View style={{ justifyContent: 'center' }}>
              <Text style={{ fontSize: 42, fontWeight: '900', color: '#1E1B4B', letterSpacing: -1, lineHeight: 42 }}>houcee</Text>
              <Text style={{ fontSize: 15, color: Theme.primary, fontWeight: '700', letterSpacing: 0.5, marginTop: -2 }}>one tap away</Text>
            </View>
          </View>

          <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 10 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.textSecondary, marginBottom: 12 }}>Phone Number</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1.5, borderBottomColor: Theme.border, paddingBottom: 12 }}>
              <Text style={{ fontSize: 22, fontWeight: '700', color: Theme.textPrimary, marginRight: 12 }}>+91</Text>
              <TextInput style={{ flex: 1, fontSize: 22, fontWeight: '700', color: Theme.textPrimary }} placeholder="00000 00000" placeholderTextColor="#cbd5e1" keyboardType="phone-pad" value={phone} onChangeText={setPhone} maxLength={10} />
            </View>
            <TouchableOpacity onPress={handleRequestOtp} disabled={loading || phone.length < 10} style={{ marginTop: 32, backgroundColor: Theme.primary, paddingVertical: 18, borderRadius: 16, alignItems: 'center', shadowColor: Theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Login securely</Text>}
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ paddingBottom: 40, alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: Theme.textSecondary, fontWeight: '500', letterSpacing: 0.5 }}>
            A product by <Text style={{ fontWeight: '800', color: Theme.primary }}>Rubous Tech Pvt. Ltd</Text>
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};
