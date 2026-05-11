import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronDown, ChevronUp, Shield, FileText } from 'lucide-react-native';
import { LayoutAnimation } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../theme';

const TERMS_SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    content: 'By downloading, installing, or using the Houcee application, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.',
  },
  {
    title: '2. Services Description',
    content: 'Houcee is a marketplace platform that connects clients with local service providers for home services including cleaning, plumbing, electrical work, painting, and other household services.',
  },
  {
    title: '3. User Accounts',
    content: 'You must provide accurate and complete information when creating your account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.',
  },
  {
    title: '4. Booking & Payments',
    content: 'All bookings are subject to provider availability. Payments are processed securely through our payment gateway. Refunds are subject to our cancellation policy.',
  },
  {
    title: '5. Cancellation Policy',
    content: 'Free cancellation is available up to 2 hours before the scheduled service. Cancellations within 2 hours may incur a 50% charge. Same-day cancellations are non-refundable.',
  },
  {
    title: '6. Provider Responsibility',
    content: 'Service providers on our platform are independent contractors, not employees of Houcee. We conduct background checks but cannot guarantee the quality of every service.',
  },
  {
    title: '7. Limitation of Liability',
    content: 'Houcee shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use of our platform or services provided through it.',
  },
  {
    title: '8. Changes to Terms',
    content: 'We reserve the right to modify these terms at any time. Continued use of the app after changes constitutes acceptance of the new terms.',
  },
];

const PRIVACY_SECTIONS = [
  {
    title: 'Information We Collect',
    content: 'We collect your phone number for authentication, name and profile information you provide, location data for service matching, booking and transaction history, and device information for app functionality.',
  },
  {
    title: 'How We Use Your Data',
    content: 'Your data is used to provide and improve our services, match you with appropriate service providers, send booking confirmations and updates, process payments, and comply with legal obligations.',
  },
  {
    title: 'Data Sharing',
    content: 'We share your contact information with service providers for booked services. We do not sell your personal data to third parties. We may share data with payment processors and legal authorities when required.',
  },
  {
    title: 'Data Security',
    content: 'We implement industry-standard encryption and security measures to protect your personal information. Your payment data is processed through PCI-DSS compliant payment gateways.',
  },
  {
    title: 'Your Rights',
    content: 'You have the right to access, correct, or delete your personal data. You can request a copy of your data or opt out of marketing communications at any time through the app settings.',
  },
  {
    title: 'Contact Us',
    content: 'For any privacy concerns or data requests, contact our Data Protection Officer at privacy@houcee.in or call us at 1800-XXX-XXXX.',
  },
];

const AccordionItem = ({ title, content }: { title: string; content: string }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 10, backgroundColor: 'white', elevation: 1 }}>
      <TouchableOpacity
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setExpanded(!expanded);
        }}
        style={{ flexDirection: 'row', alignItems: 'center', padding: 18 }}
      >
        <Text style={{ flex: 1, fontSize: 14, fontWeight: '800', color: Theme.textPrimary }}>{title}</Text>
        {expanded ? <ChevronUp size={18} color={Theme.primary} /> : <ChevronDown size={18} color={Theme.textSecondary} />}
      </TouchableOpacity>
      {expanded && (
        <View style={{ paddingHorizontal: 18, paddingBottom: 18 }}>
          <View style={{ height: 1, backgroundColor: '#F1F5F9', marginBottom: 14 }} />
          <Text style={{ fontSize: 14, color: Theme.textSecondary, lineHeight: 22, fontWeight: '500' }}>{content}</Text>
        </View>
      )}
    </View>
  );
};

export const TermsScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* Header */}
      <LinearGradient colors={[Theme.primary, '#7C3AED']} style={{ paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
            <ChevronLeft size={22} color="white" />
          </TouchableOpacity>
          <Text style={{ flex: 1, fontSize: 22, fontWeight: '900', color: 'white', marginLeft: 16 }}>Legal</Text>
        </View>

        {/* Tab toggle */}
        <View style={{ marginHorizontal: 20, flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 4 }}>
          <TouchableOpacity
            onPress={() => setActiveTab('terms')}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: activeTab === 'terms' ? 'white' : 'transparent', gap: 8 }}
          >
            <FileText size={16} color={activeTab === 'terms' ? Theme.primary : 'rgba(255,255,255,0.8)'} />
            <Text style={{ fontSize: 14, fontWeight: '800', color: activeTab === 'terms' ? Theme.primary : 'rgba(255,255,255,0.8)' }}>Terms</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('privacy')}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: activeTab === 'privacy' ? 'white' : 'transparent', gap: 8 }}
          >
            <Shield size={16} color={activeTab === 'privacy' ? Theme.primary : 'rgba(255,255,255,0.8)'} />
            <Text style={{ fontSize: 14, fontWeight: '800', color: activeTab === 'privacy' ? Theme.primary : 'rgba(255,255,255,0.8)' }}>Privacy</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 20 }} style={{ marginTop: -8 }}>
        <View style={{ backgroundColor: '#EFF6FF', borderRadius: 16, padding: 16, marginBottom: 20, flexDirection: 'row' }}>
          <Text style={{ fontSize: 18, marginRight: 10 }}>{activeTab === 'terms' ? '📋' : '🔒'}</Text>
          <Text style={{ flex: 1, fontSize: 13, color: '#1E40AF', fontWeight: '600', lineHeight: 20 }}>
            {activeTab === 'terms'
              ? 'Last updated: May 2026. Please read these terms carefully before using Houcee.'
              : 'We respect your privacy. This policy explains how we collect, use, and protect your data.'}
          </Text>
        </View>

        {(activeTab === 'terms' ? TERMS_SECTIONS : PRIVACY_SECTIONS).map((section) => (
          <AccordionItem key={section.title} title={section.title} content={section.content} />
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};
