import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Share, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Copy, Share2, Gift, Users, Award } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme } from '../theme';

export const ReferEarnScreen = ({ navigation }: any) => {
  const [referralCode, setReferralCode] = useState('LOADING...');

  useEffect(() => {
    const loadCode = async () => {
      const code = await AsyncStorage.getItem('user_referral_code');
      if (code) setReferralCode(code.toUpperCase().slice(0, 8));
      else setReferralCode('CLEAN' + Math.floor(1000 + Math.random() * 9000));
    };
    loadCode();
  }, []);

  const onShare = async () => {
    try {
      await Share.share({
        message: `Join Cleanyo and get ₹100 off on your first home service! Use my code: ${referralCode} \nDownload now: https://cleanyo.app/download`,
      });
    } catch (error: any) {
      console.error(error.message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ padding: 24, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={28} color={Theme.textPrimary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '900', color: Theme.textPrimary, marginLeft: 16 }}>Refer & Earn</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ padding: 24, alignItems: 'center' }}>
          <View style={{ width: 200, height: 200, backgroundColor: '#F4EDFF', borderRadius: 100, justifyContent: 'center', alignItems: 'center', marginBottom: 32 }}>
             <Gift size={100} color={Theme.primary} strokeWidth={1.5} />
          </View>

          <Text style={{ fontSize: 28, fontWeight: '900', color: Theme.textPrimary, textAlign: 'center' }}>
            Invite Friends & Get ₹100
          </Text>
          <Text style={{ fontSize: 16, color: Theme.textSecondary, textAlign: 'center', marginTop: 12, lineHeight: 24 }}>
            Share your code with friends. When they complete their first service, you both get ₹100 in your wallet.
          </Text>

          {/* Referral Code Box */}
          <View style={{ width: '100%', backgroundColor: '#F8FAFC', borderRadius: 28, padding: 32, marginTop: 40, borderStyle: 'dashed', borderWidth: 2, borderColor: Theme.primary, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: Theme.textSecondary, fontWeight: '800', letterSpacing: 2, marginBottom: 12 }}>YOUR REFERRAL CODE</Text>
            <Text style={{ fontSize: 36, fontWeight: '900', color: Theme.primary, letterSpacing: 4 }}>{referralCode}</Text>
            
            <TouchableOpacity 
              style={{ marginTop: 24, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14, elevation: 2 }}
              onPress={() => {}} // Add copy to clipboard logic here
            >
              <Copy size={16} color={Theme.primary} />
              <Text style={{ marginLeft: 8, fontWeight: '800', color: Theme.primary }}>COPY CODE</Text>
            </TouchableOpacity>
          </View>

          {/* How it works */}
          <View style={{ width: '100%', marginTop: 48 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: Theme.textPrimary, marginBottom: 24 }}>How it works</Text>
            
            <View style={{ gap: 24 }}>
              <StepItem 
                icon={<Share2 size={20} color="#3B82F6" />}
                title="Share your link"
                desc="Send your referral link or code to your friends and family."
              />
              <StepItem 
                icon={<Users size={20} color="#10B981" />}
                title="They sign up"
                desc="Your friends download the app and use your code during signup."
              />
              <StepItem 
                icon={<Award size={20} color="#F59E0B" />}
                title="Get rewarded"
                desc="You both get ₹100 once they complete their first booking."
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={{ padding: 24, paddingBottom: 40, backgroundColor: 'white' }}>
        <TouchableOpacity 
          onPress={onShare}
          style={{ 
            backgroundColor: Theme.primary, 
            flexDirection: 'row', 
            justifyContent: 'center', 
            alignItems: 'center', 
            paddingVertical: 18, 
            borderRadius: 20,
            shadowColor: Theme.primary,
            shadowOpacity: 0.3,
            elevation: 8
          }}
        >
          <Share2 size={20} color="white" style={{ marginRight: 12 }} />
          <Text style={{ color: 'white', fontWeight: '900', fontSize: 16 }}>SHARE WITH FRIENDS</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const StepItem = ({ icon, title, desc }: any) => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
      {icon}
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 16, fontWeight: '800', color: Theme.textPrimary }}>{title}</Text>
      <Text style={{ fontSize: 14, color: Theme.textSecondary, marginTop: 2 }}>{desc}</Text>
    </View>
  </View>
);
