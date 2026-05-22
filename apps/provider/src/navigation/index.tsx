import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginScreen } from '../screens/LoginScreen';
import { OtpVerifyScreen } from '../screens/OtpVerifyScreen';
import { RegistrationScreen } from '../screens/RegistrationScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { TabNavigator } from './TabNavigator';
import { TrackingScreen } from '../screens/TrackingScreen';
import { Theme } from '../theme';

const Stack = createNativeStackNavigator();

export const ProviderNavigation = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('provider_token').then((token) => {
      setIsLoggedIn(!!token);
    });
  }, []);

  if (isLoggedIn === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.background }}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      id="ProviderRoot"
      initialRouteName={isLoggedIn ? 'Dashboard' : 'Registration'}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Registration" component={RegistrationScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
      <Stack.Screen name="Dashboard" component={TabNavigator} />
      <Stack.Screen name="Tracking" component={TrackingScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
};
