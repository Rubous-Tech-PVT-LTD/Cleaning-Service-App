import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Theme } from '../theme';
import api from '../api';

export const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      setProfile(res.data);
    } catch (e: any) {
      console.log('Error fetching profile', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('provider_token');
          await AsyncStorage.removeItem('provider_id');
          await AsyncStorage.removeItem('provider_phone');
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.background }}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{profile?.phone?.slice(-2) || 'PR'}</Text>
          </View>
          <Text style={styles.phoneText}>{profile?.phone || 'Provider Name'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{profile?.role || 'PROVIDER'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Language Preference</Text>
            <Text style={styles.menuValueText}>{profile?.languagePref === 'hi' ? 'Hindi' : 'English'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ManageServices')}>
            <Text style={styles.menuItemText}>Manage Services</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Bank Details</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  container: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: Theme.white,
    fontSize: 32,
    fontWeight: '900',
  },
  phoneText: {
    fontSize: 24,
    fontWeight: '900',
    color: Theme.textPrimary,
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: Theme.infoLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: Theme.info,
    fontWeight: '800',
    fontSize: 12,
  },
  section: {
    backgroundColor: Theme.white,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.textPrimary,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  menuItemText: {
    fontSize: 16,
    color: Theme.textSecondary,
    fontWeight: '600',
  },
  menuValueText: {
    fontSize: 16,
    color: Theme.primary,
    fontWeight: '700',
  },
  logoutBtn: {
    backgroundColor: Theme.errorLight,
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: Theme.error,
    fontWeight: '900',
    fontSize: 16,
  },
});
