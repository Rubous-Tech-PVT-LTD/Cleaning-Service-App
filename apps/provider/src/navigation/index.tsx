import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginScreen } from '../screens/LoginScreen';
import { OtpVerifyScreen } from '../screens/OtpVerifyScreen';
import { RegistrationScreen } from '../screens/RegistrationScreen';
import { LocationPromptScreen } from '../screens/LocationPromptScreen';
import { SearchLocationScreen } from '../screens/SearchLocationScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { TabNavigator } from './TabNavigator';
import { TrackingScreen } from '../screens/TrackingScreen';
import { ManageServicesScreen } from '../screens/ManageServicesScreen';
import { Theme } from '../theme';

const Stack = createNativeStackNavigator();

export const ProviderNavigation = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [hasLocation, setHasLocation] = useState<boolean>(false);

  useEffect(() => {
    const checkAuthAndLocation = async () => {
      const token = await AsyncStorage.getItem('provider_token');
      const latitude = await AsyncStorage.getItem('provider_latitude');
      const longitude = await AsyncStorage.getItem('provider_longitude');
      
      setIsLoggedIn(!!token);
      setHasLocation(!!latitude && !!longitude);
    };
    
    checkAuthAndLocation();
  }, []);

  if (isLoggedIn === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.background }}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  const getInitialRoute = () => {
    if (!isLoggedIn) return 'Registration';
    if (!hasLocation) return 'LocationPrompt';
    return 'Dashboard';
  };

  return (
    <Stack.Navigator
      id="ProviderRoot"
      initialRouteName={getInitialRoute()}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Registration" component={RegistrationScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
      <Stack.Screen name="LocationPrompt" component={LocationPromptScreen} />
      <Stack.Screen name="SearchLocation" component={SearchLocationScreen} />
      <Stack.Screen name="Dashboard" component={TabNavigator} />
      <Stack.Screen name="Tracking" component={TrackingScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="ManageServices" component={ManageServicesScreen} />
    </Stack.Navigator>
  );
};
