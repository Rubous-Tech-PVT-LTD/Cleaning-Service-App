import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Settings, LogOut, Shield, HelpCircle, MapPin, CreditCard, Bell, User, History, Globe, Gift } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { Theme } from '../theme';
import { NotificationService } from '../services/NotificationService';
import { useAuth } from '../contexts/AuthContext';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { LoginRequiredModal } from '../components/LoginRequiredModal';

export const ProfileScreen = ({ navigation }: any) => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, isGuest, logout } = useAuth();
  const { requireAuth, showLoginModal, handleLoginPress, handleCloseModal } = useAuthGuard();
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
            await logout();
            navigation.replace('Login');
          }
        },
      ]
    );
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  // Guest mode UI
  if (isGuest) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Theme.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: Theme.primary + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
            <User size={60} color={Theme.primary} />
          </View>
          <Text style={{ fontSize: 28, fontWeight: '900', color: Theme.textPrimary, marginBottom: 12 }}>Guest Mode</Text>
          <Text style={{ fontSize: 16, color: Theme.textSecondary, textAlign: 'center', marginBottom: 32, lineHeight: 24 }}>
            You're browsing as a guest. Login to access your profile, bookings, and more features.
          </Text>
          <TouchableOpacity
            onPress={handleLogin}
            style={{ backgroundColor: Theme.primary, paddingVertical: 18, paddingHorizontal: 32, borderRadius: 16, width: '100%', alignItems: 'center', shadowColor: Theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Login Now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={{ backgroundColor: 'white', padding: 24, alignItems: 'center', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 5 }}>
          <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: Theme.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
            <User size={50} color="white" />
            <TouchableOpacity onPress={() => requireAuth(() => navigation.navigate('ProfileEdit'))} style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: 'white', padding: 8, borderRadius: 20, elevation: 4 }}>
              <Settings size={16} color={Theme.primary} />
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 24, fontWeight: '900', color: Theme.textPrimary, marginTop: 16 }}>{userName}</Text>
          <TouchableOpacity onPress={() => requireAuth(() => navigation.navigate('ProfileEdit'))}>
            <Text style={{ color: Theme.primary, fontWeight: '700', marginTop: 4 }}>{t('profile.edit_profile')}</Text>
          </TouchableOpacity>
        </View>

        {/* Action List */}
        <View style={{ padding: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: Theme.textPrimary, marginTop: 32, marginBottom: 16 }}>Support & Settings</Text>
          <View style={{ backgroundColor: 'white', borderRadius: 24, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Theme.muted }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: Theme.infoLight, justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                <Bell size={20} color={Theme.info} />
              </View>
              <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: Theme.textPrimary }}>{t('profile.notifications')}</Text>
              <Switch value={notifications} onValueChange={setNotifications} trackColor={{ false: '#CBD5E1', true: Theme.primary }} thumbColor="white" />
            </View>
            <TouchableOpacity 
              onPress={toggleLanguage}
              style={{ flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Theme.muted }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                <Globe size={20} color={Theme.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.textPrimary }}>{t('profile.language')}</Text>
                <Text style={{ fontSize: 12, color: Theme.textSecondary, fontWeight: '600' }}>{i18n.language === 'en' ? 'English' : 'हिंदी'}</Text>
              </View>
              <View style={{ backgroundColor: Theme.muted, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: Theme.primary }}>SWITCH</Text>
              </View>
            </TouchableOpacity>
            <MenuItem icon={<CreditCard size={20} color="#EC4899" />} title="Saved Payments" onPress={() => {}} />
            <MenuItem 
              icon={<Gift size={20} color="#F59E0B" />} 
              title="Refer & Earn" 
              onPress={() => requireAuth(() => navigation.navigate('ReferEarn'))} 
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
            <LogOut size={20} color={Theme.error} />
            <Text style={{ marginLeft: 12, fontSize: 16, fontWeight: '800', color: Theme.error }}>{t('profile.logout')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <LoginRequiredModal
        visible={showLoginModal}
        onClose={handleCloseModal}
        onLogin={handleLoginPress}
      />
    </SafeAreaView>
  );
};

const MenuItem = ({ icon, title, onPress }: any) => (
  <TouchableOpacity 
    onPress={onPress}
    style={{ flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Theme.muted }}
  >
    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: Theme.background, justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
      {icon}
    </View>
    <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: Theme.textPrimary }}>{title}</Text>
    <ChevronRight size={18} color={Theme.textSecondary} />
  </TouchableOpacity>
);
