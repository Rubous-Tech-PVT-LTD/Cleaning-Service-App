import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { I18nextProvider } from 'react-i18next';
import { enableScreens } from 'react-native-screens';
import i18n from './src/i18n';
import { ProviderNavigation } from './src/navigation';
import { StatusBar } from 'react-native';

import { BookingProvider } from './src/context/BookingContext';

// Required for @react-navigation/native-stack
enableScreens();

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <BookingProvider>
        <NavigationContainer>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
          <ProviderNavigation />
        </NavigationContainer>
      </BookingProvider>
    </I18nextProvider>
  );
}
