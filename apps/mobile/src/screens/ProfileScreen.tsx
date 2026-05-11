import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Settings, LogOut, Shield, HelpCircle, MapPin, CreditCard, Bell, User, History, Globe, Gift } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { Theme } from '../theme';
import { NotificationService } from '../services/NotificationService';

export const ProfileScreen = ({ navigation }: any) => {
  const { t, i18n } = useTranslation();
  const [userName, setUserName] = useState('User Name');
  const [phone, setPhone] = useState('+91 99999 00000');
  const [notifications, setNotifications] = useState(true);

  const toggleLanguage = async () => {
    const nextLang = i18n.language === 'en' ? 'hi' : 'en';
    await i18n.changeLanguage(nextLang);
    await AsyncStorage.setItem('user_language', nextLang);
  };

  useEffect(() => {
    const loadUser = async () => {
      const storedPhone = await AsyncStorage.getItem('user_phone');
      if (storedPhone) setPhone(storedPhone);
      // In a real app, we would fetch user name from the database
    };
    loadUser();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            navigation.replace('Login');
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={{ backgroundColor: 'white', padding: 24, alignItems: 'center', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 5 }}>
          <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: Theme.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
            <User size={50} color="white" />
            <TouchableOpacity onPress={() => navigation.navigate('ProfileEdit')} style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: 'white', padding: 8, borderRadius: 20, elevation: 4 }}>
              <Settings size={16} color={Theme.primary} />
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 24, fontWeight: '900', color: Theme.textPrimary }}>{userName}</Text>
          <Text style={{ fontSize: 14, color: Theme.textSecondary, marginTop: 4, fontWeight: '600' }}>{phone}</Text>
        </View>

        {/* Action List */}
        <View style={{ padding: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: Theme.textPrimary, marginBottom: 16 }}>My Account</Text>
          <View style={{ backgroundColor: 'white', borderRadius: 24, overflow: 'hidden' }}>
            <MenuItem icon={<History size={20} color={Theme.primary} />} title="My Bookings" onPress={() => navigation.navigate('MyBookings')} />
            <MenuItem icon={<MapPin size={20} color="#10B981" />} title="Saved Addresses" onPress={() => navigation.navigate('AddressPicker')} />
            <MenuItem icon={<CreditCard size={20} color="#F59E0B" />} title="Promo Codes" onPress={() => navigation.navigate('PromoCode')} />
          </View>

          <Text style={{ fontSize: 18, fontWeight: '800', color: Theme.textPrimary, marginTop: 32, marginBottom: 16 }}>Support & Settings</Text>
          <View style={{ backgroundColor: 'white', borderRadius: 24, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                <Bell size={20} color="#3B82F6" />
              </View>
              <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: Theme.textPrimary }}>Notifications</Text>
              <Switch value={notifications} onValueChange={setNotifications} trackColor={{ false: '#CBD5E1', true: Theme.primary }} thumbColor="white" />
            </View>
            <TouchableOpacity 
              onPress={toggleLanguage}
              style={{ flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                <Globe size={20} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.textPrimary }}>Language</Text>
                <Text style={{ fontSize: 12, color: Theme.textSecondary, fontWeight: '600' }}>{i18n.language === 'en' ? 'English' : 'हिंदी'}</Text>
              </View>
              <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: Theme.primary }}>SWITCH</Text>
              </View>
            </TouchableOpacity>
            <MenuItem icon={<CreditCard size={20} color="#EC4899" />} title="Saved Payments" onPress={() => {}} />
            <MenuItem 
              icon={<Gift size={20} color="#F59E0B" />} 
              title="Refer & Earn" 
              onPress={() => navigation.navigate('ReferEarn')} 
            />
            <MenuItem 
              icon={<HelpCircle size={20} color="#8B5CF6" />} 
              title="Help Center" 
              onPress={() => navigation.navigate('HelpCenter')} 
            />
            <MenuItem icon={<Shield size={20} color="#10B981" />} title="Terms & Privacy" onPress={() => navigation.navigate('Terms')} />
            <MenuItem 
              icon={<Bell size={20} color={Theme.primary} />} 
              title="Test Notification" 
              onPress={() => NotificationService.sendLocalNotification('Hello! 👋', 'This is a test notification from Cleanyo.')} 
            />
          </View>

          {/* Logout */}
          <TouchableOpacity 
            onPress={handleLogout}
            style={{ marginTop: 40, marginBottom: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#FEE2E2', borderRadius: 24 }}
          >
            <LogOut size={20} color="#EF4444" />
            <Text style={{ marginLeft: 12, fontSize: 16, fontWeight: '800', color: '#EF4444' }}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const MenuItem = ({ icon, title, onPress }: any) => (
  <TouchableOpacity 
    onPress={onPress}
    style={{ flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}
  >
    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
      {icon}
    </View>
    <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: Theme.textPrimary }}>{title}</Text>
    <ChevronRight size={18} color={Theme.textSecondary} />
  </TouchableOpacity>
);
