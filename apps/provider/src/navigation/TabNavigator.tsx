import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { DashboardScreen } from '../screens/DashboardScreen';
import { JobsScreen } from '../screens/JobsScreen';
import { ReviewsScreen } from '../screens/ReviewsScreen';
import { WalletScreen } from '../screens/WalletScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { Theme } from '../theme';

const Tab = createBottomTabNavigator();

const TabBarLabel = ({ routeName }: { routeName: string }) => {
  const { t } = useTranslation();
  
  let label: string;
  if (routeName === 'Home') label = t('provider.nav_home');
  else if (routeName === 'Jobs') label = t('provider.nav_jobs');
  else if (routeName === 'Reviews') label = t('provider.nav_reviews');
  else if (routeName === 'Wallet') label = t('provider.nav_wallet');
  else if (routeName === 'Profile') label = t('provider.nav_profile');
  else label = routeName;
  
  return <Text style={{ fontWeight: '700', fontSize: 12 }}>{label}</Text>;
};

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      id="ProviderTabs"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Jobs') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Reviews') {
            iconName = focused ? 'star' : 'star-outline';
          } else if (route.name === 'Wallet') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Theme.primary,
        tabBarInactiveTintColor: Theme.textSecondary,
        tabBarStyle: {
          backgroundColor: Theme.white,
          borderTopWidth: 1,
          borderTopColor: Theme.border,
          paddingTop: 5,
          elevation: 10,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 10,
          height: 100,
         
paddingBottom: 60,
        },
        tabBarLabel: () => <TabBarLabel routeName={route.name} />,
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Jobs" component={JobsScreen} />
      <Tab.Screen name="Reviews" component={ReviewsScreen} />
      <Tab.Screen name="Wallet" component={WalletScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};
