import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  Alert, StatusBar, ScrollView, StyleSheet
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../api';
import { Theme } from '../theme';
import i18n from '../i18n';
import { useTranslation } from 'react-i18next';

export const ManageServicesScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [professionId, setProfessionId] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [servicesRes, profileRes] = await Promise.all([
        api.get('/services'),
        api.get('/auth/profile')
      ]);
      setServices(servicesRes.data);
      if (profileRes.data?.profile?.professionId) {
        setProfessionId(profileRes.data.profile.professionId);
      }
    } catch (err) {
      console.log('Failed to fetch data', err);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!professionId) {
      Alert.alert('Error', 'Please select a profession');
      return;
    }
    
    setSaving(true);
    try {
      await api.patch('/users/profile', { professionId });
      Alert.alert('Success', 'Service preferences updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.log('Update Error', error);
      Alert.alert('Error', 'Failed to update services');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color={Theme.textPrimary}/>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('provider.manage_services_title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>{t('provider.your_profession')}</Text>
        <Text style={styles.sectionSubtitle}>
          {t('provider.select_profession')}
        </Text>

        <View style={styles.servicesContainer}>
          {services.map((service) => {
            // Handle service name with language support
            let serviceName = 'Service';
            const isHindi = i18n.language === 'hi';
            
            // Try sync API format first (snake_case)
            if (isHindi && service.name_hi) {
              serviceName = service.name_hi;
            } else if (service.name_en) {
              serviceName = service.name_en;
            }
            // Try regular API format (camelCase with JSON object)
            else if (typeof service.nameTranslations === 'object' && service.nameTranslations.hi && isHindi) {
              serviceName = service.nameTranslations.hi;
            } else if (typeof service.nameTranslations === 'object' && service.nameTranslations.en) {
              serviceName = service.nameTranslations.en;
            }
            // Try if nameTranslations is a stringified JSON
            else if (typeof service.nameTranslations === 'string') {
              try {
                const parsed = JSON.parse(service.nameTranslations);
                if (isHindi && parsed.hi) {
                  serviceName = parsed.hi;
                } else {
                  serviceName = parsed.en || service.nameTranslations;
                }
              } catch {
                serviceName = service.nameTranslations;
              }
            }
            // Fallback to name field
            else if (service.name) {
              serviceName = service.name;
            }
            
            return (
              <TouchableOpacity
                key={service.id}
                onPress={() => setProfessionId(service.id)}
                style={[
                  styles.serviceCard,
                  professionId === service.id && styles.serviceCardSelected
                ]}
              >
                <Text style={[
                  styles.serviceText,
                  professionId === service.id && styles.serviceTextSelected
                ]}>
                  {serviceName}
                </Text>
              </TouchableOpacity>
            );
          })}
          {services.length === 0 && (
            <Text style={styles.emptyText}>{t('provider.no_services_available')}</Text>
          )}
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={styles.saveBtn}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveBtnText}>{t('provider.save_changes')}</Text>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
    backgroundColor: Theme.white,
  },
  backBtn: {
    marginRight: 16,
  },
  backText: {
    fontSize: 16,
    color: Theme.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Theme.textPrimary,
  },
  container: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.textPrimary,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Theme.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  servicesContainer: {
    gap: 12,
    marginBottom: 32,
  },
  serviceCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Theme.border,
  },
  serviceCardSelected: {
    backgroundColor: Theme.primary,
    borderColor: Theme.primaryDark,
  },
  serviceText: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.textPrimary,
  },
  serviceTextSelected: {
    color: '#FFF',
  },
  emptyText: {
    fontSize: 14,
    color: Theme.textSecondary,
    textAlign: 'center',
    marginTop: 20,
  },
  saveBtn: {
    backgroundColor: Theme.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: Theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  saveBtnText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
