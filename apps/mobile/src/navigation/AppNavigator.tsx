import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen } from '../screens/LoginScreen';
import { OtpVerifyScreen } from '../screens/OtpVerifyScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ServiceListScreen } from '../screens/ServiceListScreen';
import { ServiceDetailScreen } from '../screens/ServiceDetailScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ProfileEditScreen } from '../screens/ProfileEditScreen';
import { BookingScreen } from '../screens/BookingScreen';
import { MyBookingsScreen } from '../screens/MyBookingsScreen';
import { BookingSuccessScreen } from '../screens/BookingSuccessScreen';
import { AddressListScreen } from '../screens/AddressListScreen';
import { ReferEarnScreen } from '../screens/ReferEarnScreen';
import { HelpCenterScreen } from '../screens/HelpCenterScreen';
import { ReviewScreen } from '../screens/ReviewScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { CancellationScreen } from '../screens/CancellationScreen';
import { PromoCodeScreen } from '../screens/PromoCodeScreen';
import { TermsScreen } from '../screens/TermsScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import withObservables from '@nozbe/with-observables';
import { database } from '../db';

const Stack = createStackNavigator();

const EnhancedHomeScreen = withObservables([], () => ({
  categories: database.collections.get('categories').query().observe(),
}))(HomeScreen);

export const AppNavigator = ({ initialRouteName = 'Login' }: { initialRouteName?: string }) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRouteName}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
      <Stack.Screen name="Home" component={EnhancedHomeScreen} />
      <Stack.Screen name="ServiceList" component={ServiceListScreen} />
      <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Booking" component={BookingScreen} />
      <Stack.Screen name="BookingSuccess" component={BookingSuccessScreen} options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="AddressPicker" component={AddressListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
      <Stack.Screen name="Cancellation" component={CancellationScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Review" component={ReviewScreen} />
      <Stack.Screen name="ReferEarn" component={ReferEarnScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PromoCode" component={PromoCodeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="HelpCenter" component={HelpCenterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Terms" component={TermsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
};
