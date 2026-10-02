import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronDown, ChevronUp, Shield, FileText, Building2 } from 'lucide-react-native';
import { LayoutAnimation } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../theme/index';

const PROVIDER_TERMS_SECTIONS = [
  {
    title: '1. Acceptance of Provider Terms',
    content: 'By downloading, installing, or using the Houcee Provider application, you agree to be bound by these Provider Terms of Service. If you do not agree to these terms, please do not use our platform as a service provider.',
  },
  {
    title: '2. Provider Services Description',
    content: 'Houcee is a marketplace platform that connects service providers with clients for home services including cleaning, plumbing, electrical work, painting, and other household services. As a provider, you agree to offer professional services through our platform.',
  },
  {
    title: '3. Independent Contractor Status',
    content: 'You are an independent contractor, not an employee of Houcee. You are responsible for your own taxes, insurance, and compliance with local laws. Houcee does not control your work methods or schedule beyond service availability requirements.',
  },
  {
    title: '4. Provider Account Responsibilities',
    content: 'Providers must provide accurate and up-to-date information including business details, service areas, and qualifications. You are responsible for maintaining the security of your account and login credentials. Any fraudulent, unlawful, or inappropriate use of the platform is prohibited.',
  },
  {
    title: '5. Service Delivery Standards',
    content: 'Providers must deliver services in a professional manner, adhere to agreed-upon service descriptions, and maintain appropriate professional conduct. You agree to arrive on time for scheduled services and communicate any delays promptly.',
  },
  {
    title: '6. Payment & Commission Structure',
    content: 'Houcee charges a commission fee on each completed service booking. Payment will be processed through the platform and transferred to your registered bank account. You agree to the commission structure as outlined in your provider agreement.',
  },
  {
    title: '7. Cancellation Policy',
    content: 'Providers may cancel bookings subject to the applicable cancellation policy. Late cancellations or no-shows may result in penalties, rating deductions, or account suspension. Emergency cancellations must be communicated immediately.',
  },
  {
    title: '8. Background Checks & Verification',
    content: 'All providers must undergo background verification and provide necessary documentation. You agree to maintain valid qualifications and licenses as required for your services. Failure to maintain credentials may result in account suspension.',
  },
  {
    title: '9. Provider Conduct Guidelines',
    content: 'Providers must maintain professional conduct with clients, respect client property, and adhere to safety standards. Any harassment, discrimination, or misconduct will result in immediate account termination.',
  },
  {
    title: '10. Limitation of Liability',
    content: 'Houcee shall not be liable for any indirect, incidental, special, or consequential damages resulting from your use of our platform or services provided through it. We are not responsible for disputes between providers and clients.',
  },
  {
    title: '11. Termination Policy',
    content: 'Houcee reserves the right to suspend or terminate provider accounts for violation of terms, poor service quality, or other reasons. Providers may also terminate their account with appropriate notice.',
  },
  {
    title: '12. Changes to Terms',
    content: 'We reserve the right to modify these provider terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.',
  },
];

const PROVIDER_PRIVACY_SECTIONS = [
  {
    title: 'Provider Information Collection',
    content: 'We collect your phone number for authentication, business information, service qualifications, bank details for payments, location data for service matching, and device information for app functionality.',
  },
  {
    title: 'How Provider Data is Used',
    content: 'Your data is used to verify your credentials, process payments, match you with appropriate service requests, send booking notifications, and ensure platform security and compliance.',
  },
  {
    title: 'Payment & Banking Information Security',
    content: 'Your banking information is encrypted and processed through PCI-DSS compliant payment gateways. We never store complete bank account numbers on our servers. Financial data is used solely for payment processing.',
  },
  {
    title: 'Background Check Information',
    content: 'We collect and verify personal identification, professional qualifications, and conduct background checks as required by law and platform policies. This information is kept confidential and used only for verification purposes.',
  },
  {
    title: 'Data Sharing with Clients',
    content: 'We share your business name, profile photo, service ratings, and contact information with clients who have booked your services. We do not share your personal financial information with clients.',
  },
  {
    title: 'Data Security',
    content: 'We implement industry-standard encryption and security measures to protect your personal and business information. Your data is protected against unauthorized access, alteration, or disclosure.',
  },
  {
    title: 'Provider Rights to Data',
    content: 'You have the right to access, correct, or delete your personal data. You can request a copy of your data or update your business information at any time through the app settings.',
  },
  {
    title: 'Contact Us',
    content: 'For any privacy concerns or data requests, contact our Data Protection Officer at privacy@houcee.in or call us at 1800-XXX-XXXX.',
  },
];

const PROVIDER_AGREEMENT_SECTIONS = [
  {
    title: 'Independent Contractor Agreement',
    content: 'This agreement confirms your status as an independent contractor. You are responsible for your own business operations, taxes, insurance, and compliance with applicable laws and regulations.',
  },
  {
    title: 'Service Level Agreement',
    content: 'You agree to maintain service quality standards, respond to booking requests within specified timeframes, and provide services as described in your service listings.',
  },
  {
    title: 'Insurance Requirements',
    content: 'Providers must maintain appropriate insurance coverage for their services, including liability insurance where required by local law. Proof of insurance may be requested.',
  },
  {
    title: 'Compliance Obligations',
    content: 'You agree to comply with all applicable laws, regulations, and industry standards for your services. This includes tax obligations, business licenses, and professional certifications.',
  },
  {
    title: 'Non-Compete Clause',
    content: 'During your active period on the platform and for 12 months after, you agree not to solicit clients away from the Houcee platform for services that could have been booked through our marketplace.',
  },
  {
    title: 'Platform Fees & Payment Terms',
    content: 'Platform commission fees are deducted from each booking before payment. Payments are processed within 7 business days of service completion. You agree to the fee structure as outlined in your provider dashboard.',
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

export const ProviderTermsScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'agreement'>('terms');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <LinearGradient colors={[Theme.primary, '#D4A520']} style={{ paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.white20, justifyContent: 'center', alignItems: 'center' }}>
            <ChevronLeft size={22} color="white" />
          </TouchableOpacity>
          <Text style={{ flex: 1, fontSize: 22, fontWeight: '900', color: 'white', marginLeft: 16 }}>Legal</Text>
        </View>

        <View style={{ marginHorizontal: 20, flexDirection: 'row', backgroundColor: Theme.white15, borderRadius: 16, padding: 4 }}>
          <TouchableOpacity
            onPress={() => setActiveTab('terms')}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: activeTab === 'terms' ? 'white' : 'transparent', gap: 8 }}
          >
            <FileText size={16} color={activeTab === 'terms' ? Theme.primary : Theme.white80} />
            <Text style={{ fontSize: 14, fontWeight: '800', color: activeTab === 'terms' ? Theme.primary : Theme.white80 }}>Terms</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('privacy')}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: activeTab === 'privacy' ? 'white' : 'transparent', gap: 8 }}
          >
            <Shield size={16} color={activeTab === 'privacy' ? Theme.primary : Theme.white80} />
            <Text style={{ fontSize: 14, fontWeight: '800', color: activeTab === 'privacy' ? Theme.primary : Theme.white80 }}>Privacy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('agreement')}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: activeTab === 'agreement' ? 'white' : 'transparent', gap: 8 }}
          >
            <Building2 size={16} color={activeTab === 'agreement' ? Theme.primary : Theme.white80} />
            <Text style={{ fontSize: 14, fontWeight: '800', color: activeTab === 'agreement' ? Theme.primary : Theme.white80 }}>Agreement</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 20 }} style={{ marginTop: -8 }}>
        <View style={{ backgroundColor: '#FEF3C7', borderRadius: 16, padding: 16, marginBottom: 20, flexDirection: 'row' }}>
          <Text style={{ fontSize: 18, marginRight: 10 }}>
            {activeTab === 'terms' ? '📋' : activeTab === 'privacy' ? '🔒' : '📝'}
          </Text>
          <Text style={{ flex: 1, fontSize: 13, color: '#92400E', fontWeight: '600', lineHeight: 20 }}>
            {activeTab === 'terms'
              ? 'Last updated: May 2026. Please read these provider terms carefully before using Houcee platform.'
              : activeTab === 'privacy'
              ? 'We respect your privacy. This policy explains how we collect, use, and protect your provider data.'
              : 'Provider agreement outlining your rights, responsibilities, and obligations as a Houcee service provider.'}
          </Text>
        </View>

        {(activeTab === 'terms' ? PROVIDER_TERMS_SECTIONS : activeTab === 'privacy' ? PROVIDER_PRIVACY_SECTIONS : PROVIDER_AGREEMENT_SECTIONS).map((section) => (
          <AccordionItem key={section.title} title={section.title} content={section.content} />
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};