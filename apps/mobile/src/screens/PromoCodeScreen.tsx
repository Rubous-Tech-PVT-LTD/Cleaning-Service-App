import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  Alert, Animated, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Tag, Gift, Check, Wallet } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme } from '../theme';

const MOCK_COUPONS = [
  { code: 'CLEAN200', discount: 200, type: 'flat', desc: '₹200 off on first cleaning service', minOrder: 999 },
  { code: 'WELCOME10', discount: 10, type: 'percent', desc: '10% off on any service', minOrder: 500 },
  { code: 'REFER500', discount: 500, type: 'flat', desc: '₹500 referral reward', minOrder: 0 },
];

export const PromoCodeScreen = ({ navigation }: any) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [walletBalance] = useState(0);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const applyCode = async (promoCode?: string) => {
    const codeToApply = (promoCode || code).toUpperCase().trim();
    if (!codeToApply) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const found = MOCK_COUPONS.find(c => c.code === codeToApply);
    if (found) {
      setAppliedCoupon(found);
      await AsyncStorage.setItem('applied_coupon', JSON.stringify(found));
    } else {
      shake();
      Alert.alert('Invalid Code', 'This promo code is invalid or expired.');
    }
    setLoading(false);
  };

  const removeCoupon = async () => {
    setAppliedCoupon(null);
    setCode('');
    await AsyncStorage.removeItem('applied_coupon');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* Header */}
      <LinearGradient colors={[Theme.primary, '#7C3AED']} style={{ paddingBottom: 28 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
            <ChevronLeft size={22} color="white" />
          </TouchableOpacity>
          <Text style={{ flex: 1, fontSize: 22, fontWeight: '900', color: 'white', marginLeft: 16 }}>Promo Codes</Text>
        </View>

        {/* Wallet Balance */}
        <View style={{ marginHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
            <Wallet size={24} color="white" />
          </View>
          <View>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' }}>Wallet Balance</Text>
            <Text style={{ color: 'white', fontSize: 28, fontWeight: '900' }}>₹{walletBalance}</Text>
          </View>
          {walletBalance > 0 && (
            <TouchableOpacity style={{ marginLeft: 'auto', backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}>
              <Text style={{ color: Theme.primary, fontWeight: '800', fontSize: 13 }}>Use Now</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 24 }} style={{ marginTop: -8 }}>
        {/* Code Input */}
        <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 24, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: Theme.textPrimary, marginBottom: 14 }}>Enter Promo Code</Text>
          <Animated.View style={{ flexDirection: 'row', gap: 12, transform: [{ translateX: shakeAnim }] }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 2, borderColor: '#E2E8F0', paddingHorizontal: 14 }}>
              <Tag size={18} color={Theme.primary} />
              <TextInput
                value={code}
                onChangeText={t => setCode(t.toUpperCase())}
                placeholder="e.g. CLEAN200"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                style={{ flex: 1, paddingVertical: 14, marginLeft: 10, fontSize: 16, fontWeight: '800', color: Theme.textPrimary, letterSpacing: 1 }}
              />
            </View>
            <TouchableOpacity onPress={() => applyCode()} disabled={loading || !code} style={{ backgroundColor: Theme.primary, paddingHorizontal: 20, borderRadius: 14, justifyContent: 'center' }}>
              {loading ? <ActivityIndicator color="white" size="small" /> : (
                <Text style={{ color: 'white', fontWeight: '900', fontSize: 14 }}>Apply</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Applied Coupon */}
        {appliedCoupon && (
          <View style={{ backgroundColor: '#F0FDF4', borderRadius: 20, padding: 18, marginBottom: 24, borderWidth: 2, borderColor: '#10B981' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                <Check size={20} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#065F46' }}>{appliedCoupon.code} Applied!</Text>
                <Text style={{ fontSize: 13, color: '#047857', fontWeight: '600', marginTop: 2 }}>{appliedCoupon.desc}</Text>
              </View>
              <TouchableOpacity onPress={removeCoupon} style={{ backgroundColor: '#FEE2E2', padding: 8, borderRadius: 10 }}>
                <Text style={{ color: '#EF4444', fontWeight: '800', fontSize: 12 }}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Available Coupons */}
        <Text style={{ fontSize: 17, fontWeight: '800', color: Theme.textPrimary, marginBottom: 16 }}>Available Offers</Text>
        <View style={{ gap: 14 }}>
          {MOCK_COUPONS.map((coupon) => (
            <View key={coupon.code} style={{ backgroundColor: 'white', borderRadius: 20, padding: 18, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, borderLeftWidth: 4, borderLeftColor: Theme.primary }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Gift size={18} color={Theme.primary} />
                <Text style={{ marginLeft: 8, fontSize: 15, fontWeight: '900', color: Theme.primary, letterSpacing: 0.5 }}>{coupon.code}</Text>
                <TouchableOpacity
                  onPress={() => applyCode(coupon.code)}
                  style={{ marginLeft: 'auto', borderWidth: 2, borderColor: Theme.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 }}
                >
                  <Text style={{ color: Theme.primary, fontWeight: '800', fontSize: 12 }}>Apply</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 13, color: Theme.textSecondary, fontWeight: '600' }}>{coupon.desc}</Text>
              {coupon.minOrder > 0 && (
                <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600', marginTop: 4 }}>Min order: ₹{coupon.minOrder}</Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
