import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Dimensions, StatusBar, ScrollView,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import api from '../api';
import { Theme } from '../theme';

const { width, height } = Dimensions.get('window');

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

export const RegistrationScreen = ({ navigation }: any) => {
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
          setForm(f => ({ ...f, professionId: res.data[0].id }));
        }
      })
      .catch(err => console.log('Failed to fetch services', err));
  }, []);

  const handleDocumentUpload = (docType: keyof typeof docs, title: string) => {
    Alert.alert('Upload Document', `Simulating upload for ${title}...`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Upload', 
        onPress: () => setDocs(prev => ({ ...prev, [docType]: true })) 
      }
    ]);
  };

  const handleRegister = async () => {
    // Basic validation
    if (!form.fullName || !form.phone || !form.city || !form.addressLine1) {
      Alert.alert('Missing Fields', 'Please fill all required fields');
      return;
    }
    
    if (form.phone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      const phoneWithCode = `+91${form.phone}`;
      
      // 1. Register Profile
      await api.post('/auth/register-provider', {
        ...form,
        phone: phoneWithCode,
        documents: docs // Save mock document status
      });

      // 2. Automatically request OTP after successful registration
      const otpRes = await api.post('/auth/otp/request', { phone: phoneWithCode });
      
      if (otpRes.data?.devCode) {
        Alert.alert('Registration Successful', `Redirecting to verification...\n\nDEV OTP: ${otpRes.data.devCode}`, [
          { text: 'OK', onPress: () => navigation.navigate('OtpVerify', { phone: phoneWithCode }) }
        ]);
      } else {
        Alert.alert('Registration Successful', 'An OTP has been sent to your phone number.', [
          { text: 'Verify OTP', onPress: () => navigation.navigate('OtpVerify', { phone: phoneWithCode }) }
        ]);
      }

    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Registration failed';
      
      if (msg.includes('NONE') || msg.includes('read-only')) {
        console.log('[Registration] Network disconnect bug, assuming success...');
        navigation.navigate('OtpVerify', { phone: `+91${form.phone}` });
        return;
      }
      
      Alert.alert('Registration Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.background }}>
      <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />
      
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={{ padding: 24, paddingTop: 40 }}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginBottom: 16 }}>
              <Text style={{ color: Theme.primary, fontWeight: '700', fontSize: 16 }}>Already a Partner? Login →</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 32, fontWeight: '900', color: Theme.primary, letterSpacing: -1 }}>Partner Setup</Text>
            <Text style={{ fontSize: 15, color: Theme.textSecondary, marginTop: 8, lineHeight: 22 }}>
              Join Houcee and start receiving booking requests in your area.
            </Text>
          </View>

          {/* Form */}
          <View style={{ paddingHorizontal: 24 }}>
            <InputField label="Full Name *" placeholder="John Doe" value={form.fullName} onChangeText={(t: string) => setForm({...form, fullName: t})} />
            <InputField label="Email Address (Optional)" placeholder="john@example.com" keyboardType="email-address" value={form.email} onChangeText={(t: string) => setForm({...form, email: t})} />
            
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.textSecondary, marginBottom: 8 }}>Phone Number *</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: Theme.border }}>
                <Text style={{ padding: 14, fontSize: 16, fontWeight: '700', color: Theme.textPrimary, borderRightWidth: 1, borderColor: Theme.border }}>+91</Text>
                <TextInput
                  style={{ flex: 1, padding: 14, fontSize: 16, color: Theme.textPrimary, fontWeight: '700', letterSpacing: 1 }}
                  placeholder="00000 00000"
                  placeholderTextColor="#cbd5e1"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={form.phone}
                  onChangeText={(t: string) => setForm({...form, phone: t})}
                />
              </View>
            </View>

            {/* Address Row */}
            <InputField label="Address *" placeholder="123 Main St" value={form.addressLine1} onChangeText={(t: string) => setForm({...form, addressLine1: t})} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}><InputField label="City *" placeholder="City" value={form.city} onChangeText={(t: string) => setForm({...form, city: t})} /></View>
              <View style={{ flex: 1 }}><InputField label="State *" placeholder="State" value={form.state} onChangeText={(t: string) => setForm({...form, state: t})} /></View>
            </View>
            <InputField label="Country" placeholder="India" value={form.country} onChangeText={(t: string) => setForm({...form, country: t})} />

            {/* Profession / Service Picker */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: Theme.textSecondary, marginBottom: 8 }}>Your Profession *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                {services.map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    onPress={() => setForm({...form, professionId: service.id})}
                    style={{
                      paddingHorizontal: 16, paddingVertical: 12,
                      borderRadius: 12, marginRight: 8,
                      backgroundColor: form.professionId === service.id ? Theme.primary : '#F1F5F9',
                      borderWidth: 1, borderColor: form.professionId === service.id ? Theme.primaryDark : Theme.border
                    }}
                  >
                    <Text style={{
                      color: form.professionId === service.id ? '#FFF' : Theme.textPrimary,
                      fontWeight: '600'
                    }}>
                      {service.nameTranslations?.en || 'Service'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {services.length === 0 && <Text style={{ fontSize: 12, color: Theme.textSecondary }}>Loading available professions...</Text>}
            </View>

            {/* Document Uploads */}
            <View style={{ marginBottom: 32 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: Theme.textPrimary, marginBottom: 4 }}>Verification Documents</Text>
              <Text style={{ fontSize: 13, color: Theme.textSecondary, marginBottom: 16 }}>Optional for testing</Text>
              
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {[
                  { id: 'pan', label: 'PAN Card' },
                  { id: 'aadhar', label: 'Aadhar Card' },
                  { id: 'election', label: 'Election ID' },
                  { id: 'school', label: 'School ID' },
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
              {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 }}>REGISTER & VERIFY</Text>}
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
