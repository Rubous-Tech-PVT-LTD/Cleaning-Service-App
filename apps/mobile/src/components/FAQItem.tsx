import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { Theme } from '../theme';

interface FAQItemProps {
  question: string;
  answer: string;
}

export const FAQItem = ({ question, answer }: FAQItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <TouchableOpacity 
      onPress={() => setIsOpen(!isOpen)}
      activeOpacity={0.7}
      style={{ 
        backgroundColor: 'white', 
        borderRadius: 20, 
        padding: 20, 
        marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
        borderWidth: 1, borderColor: isOpen ? Theme.primary : '#F1F5F9'
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: Theme.textPrimary }}>{question}</Text>
        <ChevronDown size={18} color={isOpen ? Theme.primary : Theme.textSecondary} style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }} />
      </View>
      {isOpen && (
        <Text style={{ marginTop: 12, fontSize: 14, color: Theme.textSecondary, lineHeight: 22 }}>
          {answer}
        </Text>
      )}
    </TouchableOpacity>
  );
};
