import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronDown, ChevronUp, HelpCircle, MessageCircle, Phone, Mail } from 'lucide-react-native';
import { LayoutAnimation } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Theme } from '../theme/index';

const HELP_CATEGORIES = [
  {
    id: 'getting_started',
    titleKey: 'help_center.categories.getting_started',
    icon: '🚀',
    faqs: [
      {
        question: 'How do I create my provider account?',
        answer: 'Download the Houcee Provider app, enter your phone number, complete the registration form with your details, upload required documents, and verify your identity through OTP. Once approved, you can start receiving booking requests.'
      },
      {
        question: 'What documents do I need for verification?',
        answer: 'You need to provide a valid government ID (PAN Card, Aadhar Card, Election ID, or School ID), proof of address, and any professional certifications relevant to your services. All documents are securely verified.'
      },
      {
        question: 'How long does account approval take?',
        answer: 'Account verification typically takes 24-48 hours. You will receive a notification once your account is approved and ready to accept bookings.'
      },
      {
        question: 'What services can I offer?',
        answer: 'You can select from various home services including cleaning, plumbing, electrical work, painting, and more. Choose the services that match your skills and qualifications in your profile settings.'
      }
    ]
  },
  {
    id: 'payments',
    titleKey: 'help_center.categories.payments',
    icon: '💰',
    faqs: [
      {
        question: 'How does the commission structure work?',
        answer: 'Houcee charges a commission fee on each completed booking, which is automatically deducted before payment. The exact commission rate is displayed in your provider agreement and dashboard.'
      },
      {
        question: 'When do I receive my payments?',
        answer: 'Payments are processed within 7 business days after service completion. The amount is transferred directly to your registered bank account.'
      },
      {
        question: 'How do I add or update my bank details?',
        answer: 'Go to Profile > Bank Details to add or update your bank account information. Make sure to provide accurate details to avoid payment delays.'
      },
      {
        question: 'What if I don\'t receive my payment?',
        answer: 'If you haven\'t received your payment after 7 business days, check your bank details first. If details are correct, contact support through the Help Center with your booking details.'
      }
    ]
  },
  {
    id: 'jobs',
    titleKey: 'help_center.categories.jobs',
    icon: '📋',
    faqs: [
      {
        question: 'How do I accept booking requests?',
        answer: 'When you receive a new booking request, you\'ll see it in the "New Requests" section on your Home tab. Review the details and tap "Accept Job" to confirm. You have a limited time to respond.'
      },
      {
        question: 'Can I reject a booking request?',
        answer: 'Yes, you can decline booking requests if you\'re unavailable or the job doesn\'t match your services. However, frequent rejections may affect your rating and request visibility.'
      },
      {
        question: 'What is the cancellation policy for providers?',
        answer: 'Providers can cancel bookings but may face penalties depending on timing. Cancellations made well in advance may have minimal impact, while last-minute cancellations can result in rating deductions or account restrictions.'
      },
      {
        question: 'How do I handle disputes with clients?',
        answer: 'If you have a dispute with a client, document the issue and contact support immediately. We review disputes on a case-by-case basis and work to find fair resolutions for both parties.'
      }
    ]
  },
  {
    id: 'account',
    titleKey: 'help_center.categories.account',
    icon: '⚙️',
    faqs: [
      {
        question: 'How do I update my service offerings?',
        answer: 'Go to Profile > Manage Services to add, remove, or update the services you offer. Changes take effect immediately for new booking requests.'
      },
      {
        question: 'Can I change my service area?',
        answer: 'Yes, you can update your service location in your profile settings. However, this may affect the types of requests you receive based on the new area\'s demand.'
      },
      {
        question: 'How do I improve my rating?',
        answer: 'Provide excellent service, arrive on time, communicate clearly with clients, and maintain professionalism. High ratings lead to more booking requests and better visibility.'
      },
      {
        question: 'How do I delete my provider account?',
        answer: 'To delete your account, contact support through the Help Center. Note that account deletion is permanent and you\'ll lose all earnings, ratings, and account history.'
      }
    ]
  },
  {
    id: 'technical',
    titleKey: 'help_center.categories.technical',
    icon: '🔧',
    faqs: [
      {
        question: 'Why isn\'t the app detecting my location?',
        answer: 'Ensure location permissions are enabled in your device settings. Restart the app and check if GPS is working. If issues persist, try reinstalling the app or contact support.'
      },
      {
        question: 'I\'m not receiving booking notifications.',
        answer: 'Check that notifications are enabled for the Houcee Provider app in your device settings. Also ensure you have a stable internet connection and your online status is set to "Online".'
      },
      {
        question: 'The app is crashing or freezing.',
        answer: 'Try clearing the app cache, restarting your device, or updating to the latest app version. If the problem continues, report it through the Help Center with your device details.'
      },
      {
        question: 'How do I report a technical bug?',
        answer: 'Use the "Contact Support" option in the Help Center to report bugs. Include screenshots, error messages, and steps to reproduce the issue for faster resolution.'
      }
    ]
  },
  {
    id: 'legal',
    titleKey: 'help_center.categories.legal',
    icon: '⚖️',
    faqs: [
      {
        question: 'What are my tax obligations?',
        answer: 'As an independent contractor, you are responsible for your own tax filings and payments. Houcee provides earning statements but does not handle tax deductions. Consult a tax professional for guidance.'
      },
      {
        question: 'What insurance do I need?',
        answer: 'Providers should maintain appropriate liability insurance for their services. Specific requirements may vary by service type and location. Check your local regulations and provider agreement for details.'
      },
      {
        question: 'Am I considered an employee or contractor?',
        answer: 'You are an independent contractor, not an employee of Houcee. This means you control your schedule, work methods, and are responsible for your own business operations and compliance.'
      },
      {
        question: 'What happens if I don\'t follow compliance requirements?',
        answer: 'Failure to comply with legal requirements, service standards, or platform policies may result in account suspension or termination. We take compliance seriously to ensure quality and safety.'
      }
    ]
  }
];

const CategoryCard = ({ category, onPress, expanded, t }: { category: any, onPress: () => void, expanded: boolean, t: any }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: 'white',
        borderRadius: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        overflow: 'hidden'
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
        <Text style={{ fontSize: 24, marginRight: 12 }}>{category.icon}</Text>
        <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: Theme.textPrimary }}>{t(category.titleKey)}</Text>
        {expanded ? <ChevronUp size={20} color={Theme.primary} /> : <ChevronDown size={20} color={Theme.textSecondary} />}
      </View>
      
      {expanded && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <View style={{ height: 1, backgroundColor: Theme.border, marginBottom: 12 }} />
          {category.faqs.map((faq: any, index: number) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
};

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <View style={{ marginBottom: 8 }}>
      <TouchableOpacity
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setExpanded(!expanded);
        }}
        style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8 }}
      >
        <HelpCircle size={16} color={Theme.primary} style={{ marginRight: 8, marginTop: 2 }} />
        <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: Theme.textPrimary, lineHeight: 20 }}>{question}</Text>
      </TouchableOpacity>
      {expanded && (
        <View style={{ marginLeft: 24, marginTop: 4 }}>
          <Text style={{ fontSize: 13, color: Theme.textSecondary, lineHeight: 20 }}>{answer}</Text>
        </View>
      )}
    </View>
  );
};

export const HelpCenterScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [contactMethod, setContactMethod] = useState<'chat' | 'phone' | 'email' | null>(null);

  const toggleCategory = (categoryId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <LinearGradient colors={[Theme.primary, '#D4A520']} style={{ paddingBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.white20, justifyContent: 'center', alignItems: 'center' }}>
            <ChevronLeft size={22} color="white" />
          </TouchableOpacity>
          <Text style={{ flex: 1, fontSize: 22, fontWeight: '900', color: 'white', marginLeft: 16 }}>{t('help_center.title')}</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 20 }} style={{ marginTop: -8 }}>
        <View style={{ backgroundColor: '#FEF3C7', borderRadius: 16, padding: 16, marginBottom: 20, flexDirection: 'row' }}>
          <Text style={{ fontSize: 24, marginRight: 12 }}>💡</Text>
          <Text style={{ flex: 1, fontSize: 13, color: '#92400E', fontWeight: '600', lineHeight: 20 }}>
            {t('help_center.intro_text')}
          </Text>
        </View>

        <Text style={{ fontSize: 18, fontWeight: '800', color: Theme.textPrimary, marginBottom: 16 }}>{t('help_center.faq_title')}</Text>

        {HELP_CATEGORIES.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            expanded={expandedCategory === category.id}
            onPress={() => toggleCategory(category.id)}
            t={t}
          />
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={{ backgroundColor: 'white', borderTopWidth: 1, borderTopColor: Theme.border, padding: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: '800', color: Theme.textPrimary, marginBottom: 12 }}>{t('help_center.still_need_help')}</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
         
          <TouchableOpacity
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.accent, paddingVertical: 12, borderRadius: 12 }}
            onPress={() => setContactMethod('phone')}
          >
            <Phone size={20} color={Theme.primaryDark} />
            <Text style={{ marginLeft: 8, fontWeight: '700', color: Theme.primaryDark }}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.accent, paddingVertical: 12, borderRadius: 12 }}
            onPress={() => setContactMethod('email')}
          >
            <Mail size={20} color={Theme.primaryDark} />
            <Text style={{ marginLeft: 8, fontWeight: '700', color: Theme.primaryDark }}>Email</Text>
          </TouchableOpacity>
        </View>
        {contactMethod && (
          <View style={{ marginTop: 12, backgroundColor: '#FEF3C7', padding: 12, borderRadius: 8 }}>
            <Text style={{ fontSize: 14, color: '#92400E', fontWeight: '600' }}>
       
              {contactMethod === 'phone' && t('help_center.phone_support')}
              {contactMethod === 'email' && t('help_center.email_support')}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};