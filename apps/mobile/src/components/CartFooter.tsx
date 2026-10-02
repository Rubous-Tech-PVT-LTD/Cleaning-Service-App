import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();

  if (!show || itemCount === 0) return null;

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 65 + insets.bottom,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Theme.background,
        paddingHorizontal: 24,
        paddingVertical: 10,
        paddingBottom: 10,
        borderWidth: 1,
        borderColor: Theme.border,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 25,
        zIndex: 1000,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: Theme.muted,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ShoppingCart 
        color={Theme.textPrimary} 
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
          backgroundColor: Theme.primary,
          paddingHorizontal: 32,
          paddingVertical: 12,
          borderRadius: 20,
          shadowColor: Theme.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
        }}
        onPress={onNavigateToCart}
      >
        <Text style={{ color: '#000000', fontSize: 16, fontWeight: 'bold' }}>{t('cart.go_to_cart')}</Text>
      </TouchableOpacity>
    </View>
  );
};
