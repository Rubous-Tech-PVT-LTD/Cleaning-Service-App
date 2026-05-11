import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Camera, User, Phone, Check } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../theme';
import api from '../api';

export const ProfileEditScreen = ({ navigation }: any) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const storedName = await AsyncStorage.getItem('user_name');
      const storedPhone = await AsyncStorage.getItem('user_phone');
      const storedAvatar = await AsyncStorage.getItem('user_avatar');
      if (storedName) setFullName(storedName);
      if (storedPhone) setPhone(storedPhone);
      if (storedAvatar) setAvatarUrl(storedAvatar);
    };
    loadUser();
  }, []);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    setLoading(true);
    try {
      await api.put('/users/profile', { fullName });
      await AsyncStorage.setItem('user_name', fullName);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        navigation.goBack();
      }, 1200);
    } catch (e) {
      // Even if API fails, save locally
      await AsyncStorage.setItem('user_name', fullName);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'white', elevation: 2 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}>
            <ChevronLeft size={22} color={Theme.textPrimary} />
          </TouchableOpacity>
          <Text style={{ flex: 1, fontSize: 20, fontWeight: '900', color: Theme.textPrimary, marginLeft: 16 }}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading} style={{ backgroundColor: saved ? '#10B981' : Theme.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14 }}>
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : saved ? (
              <Check size={18} color="white" />
            ) : (
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 14 }}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 24 }}>
          {/* Avatar */}
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
            <Text style={{ marginTop: 12, fontSize: 13, color: Theme.textSecondary, fontWeight: '600' }}>Tap camera to change photo</Text>
          </View>

          {/* Fields */}
          <View style={{ gap: 20 }}>
            <View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: Theme.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Full Name</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 16, borderWidth: 2, borderColor: '#E2E8F0', paddingHorizontal: 16 }}>
                <User size={18} color={Theme.textSecondary} />
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor={Theme.textSecondary}
                  style={{ flex: 1, paddingVertical: 16, marginLeft: 12, fontSize: 16, fontWeight: '600', color: Theme.textPrimary }}
                />
              </View>
            </View>

            <View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: Theme.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Phone Number</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 2, borderColor: '#E2E8F0', paddingHorizontal: 16 }}>
                <Phone size={18} color={Theme.textSecondary} />
                <TextInput
                  value={phone}
                  editable={false}
                  style={{ flex: 1, paddingVertical: 16, marginLeft: 12, fontSize: 16, fontWeight: '600', color: Theme.textSecondary }}
                />
                <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: Theme.textSecondary }}>LOCKED</Text>
                </View>
              </View>
              <Text style={{ marginTop: 6, fontSize: 12, color: Theme.textSecondary }}>Phone number cannot be changed</Text>
            </View>
          </View>

          {/* Info box */}
          <View style={{ marginTop: 32, backgroundColor: '#EFF6FF', borderRadius: 16, padding: 16, flexDirection: 'row' }}>
            <Text style={{ fontSize: 20, marginRight: 12 }}>💡</Text>
            <Text style={{ flex: 1, fontSize: 13, color: '#1E40AF', fontWeight: '600', lineHeight: 20 }}>
              Your profile information helps providers deliver a better experience. Your phone number is used for OTP login and cannot be modified.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
