import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, LayoutAnimation, Platform, UIManager, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronDown, ChevronUp, MessageCircle, Phone, Mail, ExternalLink } from 'lucide-react-native';
import { Theme } from '../theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <TouchableOpacity 
      onPress={toggle}
      activeOpacity={0.7}
      style={{ backgroundColor: 'white', padding: 20, borderRadius: 20, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: Theme.textPrimary }}>{question}</Text>
        {expanded ? <ChevronUp size={20} color={Theme.textSecondary} /> : <ChevronDown size={20} color={Theme.textSecondary} />}
      </View>
      {expanded && (
        <Text style={{ marginTop: 12, fontSize: 14, color: Theme.textSecondary, lineHeight: 22 }}>
          {answer}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export const HelpCenterScreen = ({ navigation }: any) => {
  const { t } = useTranslation();

  const faqs = [
    {
      question: t('help_center.faq1_q'),
      answer: t('help_center.faq1_a')
    },
    {
      question: t('help_center.faq2_q'),
      answer: t('help_center.faq2_a')
    },
    {
      question: t('help_center.faq3_q'),
      answer: t('help_center.faq3_a')
    },
    {
      question: t('help_center.faq4_q'),
      answer: t('help_center.faq4_a')
    },
    {
      question: t('help_center.faq5_q'),
      answer: t('help_center.faq5_a')
    }
  ];

  const handleContact = (type: string) => {
    switch(type) {
      case 'whatsapp': Linking.openURL('whatsapp://send?phone=+919999999999&text=Hello Cleanyo Support!'); break;
      case 'call': Linking.openURL('tel:+919999999999'); break;
      case 'email': Linking.openURL('mailto:support@cleanyo.app'); break;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View style={{ padding: 24, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white' }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={28} color={Theme.textPrimary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '900', color: Theme.textPrimary, marginLeft: 16 }}>{t('help_center.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
        {/* Support Options */}
        <Text style={{ fontSize: 20, fontWeight: '900', color: Theme.textPrimary, marginBottom: 20 }}>{t('help_center.contact_us')}</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 32 }}>
          <ContactCard
            icon={<MessageCircle size={24} color="#10B981" />}
            label={t('help_center.whatsapp')}
            onPress={() => handleContact('whatsapp')}
          />
          <ContactCard
            icon={<Phone size={24} color="#3B82F6" />}
            label={t('help_center.call_us')}
            onPress={() => handleContact('call')}
          />
        </View>

        {/* FAQ Section */}
        <Text style={{ fontSize: 20, fontWeight: '900', color: Theme.textPrimary, marginBottom: 20 }}>{t('help_center.common_questions')}</Text>
        {faqs.map((faq, index) => (
          <FAQItem key={index} {...faq} />
        ))}

        {/* Extra Help */}
        <View style={{ marginTop: 20, padding: 24, backgroundColor: Theme.primary, borderRadius: 24, alignItems: 'center' }}>
          <Mail size={32} color="white" style={{ marginBottom: 12 }} />
          <Text style={{ fontSize: 18, fontWeight: '800', color: 'white', textAlign: 'center' }}>{t('help_center.still_need_help')}</Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 4, marginBottom: 20 }}>
            {t('help_center.still_need_help_desc')}
          </Text>
          <TouchableOpacity
            onPress={() => handleContact('email')}
            style={{ backgroundColor: 'white', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 }}
          >
            <Text style={{ color: Theme.primary, fontWeight: '800' }}>{t('help_center.email_support')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const ContactCard = ({ icon, label, onPress }: any) => (
  <TouchableOpacity 
    onPress={onPress}
    style={{ flex: 1, backgroundColor: 'white', padding: 20, borderRadius: 20, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}
  >
    {icon}
    <Text style={{ marginTop: 12, fontWeight: '700', color: Theme.textPrimary }}>{label}</Text>
  </TouchableOpacity>
);
