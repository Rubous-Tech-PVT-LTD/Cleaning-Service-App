import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Theme } from '../theme';
import { ShoppingCart } from 'lucide-react-native';

interface CartFooterProps {
  itemCount: number;
  onNavigateToCart: () => void;
  show?: boolean;
}

export const CartFooter: React.FC<CartFooterProps> = ({
  itemCount,
  onNavigateToCart,
  show = true,
}) => {
  const { t } = useTranslation();

  if (!show || itemCount === 0) return null;

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 24,
        paddingVertical: 10,
        paddingBottom: 55,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 25,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: '#F3F4F6',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ShoppingCart 
        color="#000000" 
        size={24} 
        strokeWidth={2} 
      />
        </View>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: Theme.textPrimary }}>
          {itemCount} {itemCount === 1 ? t('cart.service') : t('cart.services')}
        </Text>
      </View>
      <TouchableOpacity
        style={{
          backgroundColor: '#10B981',
          paddingHorizontal: 32,
          paddingVertical: 16,
          borderRadius: 20,
          shadowColor: '#10B981',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
        }}
        onPress={onNavigateToCart}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>{t('cart.go_to_cart')}</Text>
      </TouchableOpacity>
    </View>
  );
};
