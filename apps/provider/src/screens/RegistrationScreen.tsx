import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Dimensions, StatusBar, ScrollView,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';
import { Theme } from '../theme';
import i18n from '../i18n';
import { useTranslation } from 'react-i18next';

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

const InputField = ({ label, placeholder, value, onChangeText, keyboardType = 'default' }: any) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.textSecondary, marginBottom: 8 }}>{label}</Text>
    <View style={{ backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: Theme.border }}>
      <TextInput
        style={{ padding: 14, fontSize: 16, color: Theme.textPrimary, fontWeight: '500' }}
        placeholder={placeholder}
        placeholderTextColor="#cbd5e1"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  </View>
);

const TranslatedInputField = ({ labelKey, placeholderKey, value, onChangeText, keyboardType = 'default', t }: any) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.textSecondary, marginBottom: 8 }}>{t(labelKey)}</Text>
    <View style={{ backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: Theme.border }}>
      <TextInput
        style={{ padding: 14, fontSize: 16, color: Theme.textPrimary, fontWeight: '500' }}
        placeholder={t(placeholderKey)}
        placeholderTextColor="#cbd5e1"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  </View>
);

export const RegistrationScreen = ({ navigation }: any) => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    addressLine1: '',
    country: 'India',
    professionId: '',
    professionIds: [] as string[],
  });

  // Mock document upload state
  const [docs, setDocs] = useState({
    pan: false,
    aadhar: false,
    election: false,
    school: false
  });

  useEffect(() => {
    // Fetch available services/professions
    api.get('/services')
      .then(res => {
        setServices(res.data);
        if (res.data.length > 0) {
          setForm(f => ({ ...f, professionId: res.data[0].id, professionIds: [res.data[0].id] }));
        }
      })
      .catch(err => console.log('Failed to fetch services', err));
  }, []);

  const toggleLanguage = async () => {
    const nextLang = i18n.language === 'en' ? 'hi' : 'en';
    await i18n.changeLanguage(nextLang);
    await AsyncStorage.setItem('user-language', nextLang);
  };

  const handleDocumentUpload = (docType: keyof typeof docs, title: string) => {
    Alert.alert(t('registration.upload_document'), `${t('registration.upload_simulating')} ${title}...`, [
      { text: t('registration.cancel'), style: 'cancel' },
      { 
        text: t('registration.upload'), 
        onPress: () => setDocs(prev => ({ ...prev, [docType]: true })) 
      }
    ]);
  };

  const handleServiceToggle = (serviceId: string, serviceName: string) => {
    const isKitchen = serviceName.toLowerCase().includes('kitchen') || 
                      serviceName.includes('रसोईघर') || 
                      serviceName.includes('रसोई');
    const isBathroom = serviceName.toLowerCase().includes('bathroom') || 
                       serviceName.includes('बाथरूम');
    
    setForm(prev => {
      const isSelected = prev.professionIds.includes(serviceId);
      
      if (isSelected) {
        // Deselect the service
        const newProfessionIds = prev.professionIds.filter(id => id !== serviceId);
        const newProfessionId = newProfessionIds.length > 0 ? newProfessionIds[0] : '';
        return { ...prev, professionIds: newProfessionIds, professionId: newProfessionId };
      } else {
        // Check for conflicts before selecting
        if (isKitchen) {
          // Check if any bathroom service is already selected
          const bathroomServices = services.filter(s => {
            const enName = s.nameTranslations?.en?.toLowerCase() || '';
            const hiName = s.nameTranslations?.hi || '';
            return enName.includes('bathroom') || hiName.includes('बाथरूम');
          });
          const bathroomIds = bathroomServices.map(s => s.id);
          const hasBathroomSelected = prev.professionIds.some(id => bathroomIds.includes(id));
          
          if (hasBathroomSelected) {
            Alert.alert(
              t('provider.kitchen_bathroom_conflict'),
              t('provider.kitchen_conflict'),
              [{ text: t('common.ok') }]
            );
            return prev; // Don't add kitchen service
          }
          const newProfessionIds = [...prev.professionIds, serviceId];
          return { ...prev, professionIds: newProfessionIds, professionId: serviceId };
        } else if (isBathroom) {
          // Check if any kitchen service is already selected
          const kitchenServices = services.filter(s => {
            const enName = s.nameTranslations?.en?.toLowerCase() || '';
            const hiName = s.nameTranslations?.hi || '';
            return enName.includes('kitchen') || hiName.includes('रसोईघर') || hiName.includes('रसोई');
          });
          const kitchenIds = kitchenServices.map(s => s.id);
          const hasKitchenSelected = prev.professionIds.some(id => kitchenIds.includes(id));
          
          if (hasKitchenSelected) {
            Alert.alert(
              t('provider.kitchen_bathroom_conflict'),
              t('provider.bathroom_conflict'),
              [{ text: t('common.ok') }]
            );
            return prev; // Don't add bathroom service
          }
          const newProfessionIds = [...prev.professionIds, serviceId];
          return { ...prev, professionIds: newProfessionIds, professionId: serviceId };
        } else {
          // For other services, just add to selection
          const newProfessionIds = [...prev.professionIds, serviceId];
          return { ...prev, professionIds: newProfessionIds, professionId: serviceId };
        }
      }
    });
  };

  const handleRegister = async () => {
    // Basic validation
    if (!form.fullName || !form.phone || !form.city || !form.addressLine1) {
      Alert.alert(t('registration.missing_fields'), t('registration.fill_required_fields'));
      return;
    }
    
    if (form.phone.length < 10) {
      Alert.alert(t('registration.invalid_phone'), t('registration.valid_phone_number'));
      return;
    }

    setLoading(true);
    try {
      const phoneWithCode = `+91${form.phone}`;
      const payload = {
        ...form,
        phone: phoneWithCode,
        documents: docs, // Save mock document status
        professionIds: form.professionIds.length > 0 ? form.professionIds : [form.professionId]
      };
      
      console.log('[Registration] Sending payload:', payload);
      
      // 1. Register Profile
      await api.post('/auth/register-provider', payload);

      // 2. Automatically request OTP after successful registration
      const otpRes = await api.post('/auth/otp/request', { phone: phoneWithCode });
      
      if (otpRes.data?.devCode) {
        Alert.alert(t('registration.registration_successful'), `${t('registration.redirecting_verification')}\n\n${t('registration.dev_otp')} ${otpRes.data.devCode}`, [
          { text: 'OK', onPress: () => navigation.navigate('OtpVerify', { phone: phoneWithCode }) }
        ]);
      } else {
        Alert.alert(t('registration.registration_successful'), t('registration.otp_sent'), [
          { text: t('registration.verify_otp'), onPress: () => navigation.navigate('OtpVerify', { phone: phoneWithCode }) }
        ]);
      }

    } catch (error: any) {
      console.log('[Registration Error]', error);
      
      // Handle different error response formats
      let msg = t('registration.registration_failed');
      if (error?.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') {
          msg = data;
        } else if (Array.isArray(data)) {
          msg = data.map((e: any) => e.message || e).join(', ');
        } else if (data.message) {
          msg = data.message;
        } else if (data.error) {
          msg = data.error;
        }
      } else if (error?.message) {
        msg = error.message;
      }
      
      if (msg.includes('NONE') || msg.includes('read-only')) {
        console.log('[Registration] Network disconnect bug, assuming success...');
        navigation.navigate('OtpVerify', { phone: `+91${form.phone}` });
        return;
      }
      
      Alert.alert(t('registration.registration_error'), msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.background }}>
      <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />
      
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          
          {/* Language Toggle Button */}
          <View style={{ paddingHorizontal: 24, paddingVertical: 20, alignItems: 'flex-end', zIndex: 20 }}>
            <TouchableOpacity 
              onPress={toggleLanguage} 
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}
            >
              <GlobeIcon size={16} color="white" />
              <Text style={{ marginLeft: 8, fontWeight: 'bold', color: 'white' }}>
                {i18n.language === 'hi' ? 'English' : 'हिंदी'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Header */}
          <View style={{ padding: 24, paddingTop: 8 }}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginBottom: 16 }}>
              <Text style={{ color: Theme.primary, fontWeight: '700', fontSize: 16 }}>{t('registration.already_partner_login')}</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 32, fontWeight: '900', color: Theme.primary, letterSpacing: -1 }}>{t('registration.partner_setup')}</Text>
            <Text style={{ fontSize: 15, color: Theme.textSecondary, marginTop: 8, lineHeight: 22 }}>
              {t('registration.partner_setup_description')}
            </Text>
          </View>

          {/* Form */}
          <View style={{ paddingHorizontal: 24 }}>
            <TranslatedInputField labelKey="registration.full_name" placeholderKey="registration.full_name_placeholder" value={form.fullName} onChangeText={(t: string) => setForm({...form, fullName: t})} t={t} />
            <TranslatedInputField labelKey="registration.email_address_optional" placeholderKey="registration.email_placeholder" keyboardType="email-address" value={form.email} onChangeText={(t: string) => setForm({...form, email: t})} t={t} />
            
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.textSecondary, marginBottom: 8 }}>{t('registration.phone_number')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: Theme.border }}>
                <Text style={{ padding: 14, fontSize: 16, fontWeight: '700', color: Theme.textPrimary, borderRightWidth: 1, borderColor: Theme.border }}>+91</Text>
                <TextInput
                  style={{ flex: 1, padding: 14, fontSize: 16, color: Theme.textPrimary, fontWeight: '700', letterSpacing: 1 }}
                  placeholder={t('registration.phone_placeholder')}
                  placeholderTextColor="#cbd5e1"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={form.phone}
                  onChangeText={(t: string) => setForm({...form, phone: t})}
                />
              </View>
            </View>

            {/* Address Row */}
            <TranslatedInputField labelKey="registration.address" placeholderKey="registration.address_placeholder" value={form.addressLine1} onChangeText={(t: string) => setForm({...form, addressLine1: t})} t={t} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}><TranslatedInputField labelKey="registration.city" placeholderKey="registration.city_placeholder" value={form.city} onChangeText={(t: string) => setForm({...form, city: t})} t={t} /></View>
              <View style={{ flex: 1 }}><TranslatedInputField labelKey="registration.state" placeholderKey="registration.state_placeholder" value={form.state} onChangeText={(t: string) => setForm({...form, state: t})} t={t} /></View>
            </View>
            <TranslatedInputField labelKey="registration.country" placeholderKey="registration.country_placeholder" value={form.country} onChangeText={(t: string) => setForm({...form, country: t})} t={t} />
            
            {/* Profession / Service Picker */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.textSecondary, marginBottom: 8 }}>{t('registration.your_profession')}</Text>
              <Text style={{ fontSize: 11, color: Theme.textSecondary, marginBottom: 12 }}>
                {t('registration.select_services_note')}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
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
                  
                  const isSelected = form.professionIds.includes(service.id);
                  
                  return (
                    <TouchableOpacity
                      key={service.id}
                      onPress={() => handleServiceToggle(service.id, serviceName)}
                      style={{
                        paddingHorizontal: 16, paddingVertical: 12,
                        borderRadius: 12, marginRight: 8,
                        backgroundColor: isSelected ? Theme.primary : '#F1F5F9',
                        borderWidth: 1, borderColor: isSelected ? Theme.primaryDark : Theme.border,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Text style={{
                        color: isSelected ? '#FFF' : Theme.textPrimary,
                        fontWeight: '600'
                      }}>
                        {serviceName}
                      </Text>
                      {isSelected && (
                        <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>✓</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              {services.length === 0 && <Text style={{ fontSize: 12, color: Theme.textSecondary }}>{t('registration.loading_professions')}</Text>}
            </View>

            {/* Document Uploads */}
            <View style={{ marginBottom: 32 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: Theme.textPrimary, marginBottom: 4 }}>{t('provider.verification_documents')}</Text>
              <Text style={{ fontSize: 13, color: Theme.textSecondary, marginBottom: 16 }}>{t('provider.optional_for_testing')}</Text>
              
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {[
                  { id: 'pan', label: t('registration.pan_card') },
                  { id: 'aadhar', label: t('registration.aadhar_card') },
                  { id: 'election', label: t('registration.election_id') },
                  { id: 'school', label: t('registration.school_id') },
                ].map(doc => (
                  <TouchableOpacity 
                    key={doc.id}
                    onPress={() => handleDocumentUpload(doc.id as any, doc.label)}
                    style={{ 
                      width: '48%', backgroundColor: docs[doc.id as keyof typeof docs] ? '#ECFDF5' : '#F8FAFC',
                      padding: 16, borderRadius: 12, borderWidth: 1, 
                      borderColor: docs[doc.id as keyof typeof docs] ? '#10B981' : Theme.border,
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{ fontSize: 20, marginBottom: 8 }}>{docs[doc.id as keyof typeof docs] ? '✅' : '📄'}</Text>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: Theme.textPrimary }}>{doc.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              style={{
                backgroundColor: Theme.primary,
                paddingVertical: 18, borderRadius: 16, alignItems: 'center',
                shadowColor: Theme.primary, shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2, shadowRadius: 8,
              }}
            >
              {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 }}>{t('registration.register_verify')}</Text>}
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
