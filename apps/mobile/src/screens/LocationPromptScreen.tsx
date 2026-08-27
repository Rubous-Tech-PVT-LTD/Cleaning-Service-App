import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Navigation, Building2 } from 'lucide-react-native';
import * as Location from 'expo-location';
import {
  buildActiveLocationFromCoords,
  setActiveLocation,
} from '../services/locationService';
import { useTranslation } from 'react-i18next';

export const LocationPromptScreen = ({ navigation }: any) => {
  const { width } = Dimensions.get('window');
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleUseCurrentLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('address.permission_denied', 'Permission Denied'), t('address.permission_msg', 'Please allow location access to use this feature.'));
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const activeLocation = await buildActiveLocationFromCoords(
        location.coords,
        t('address.current_location_label', 'Current Location'),
      );
      await setActiveLocation(activeLocation);
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(t('common.error', 'Error'), t('address.location_error', 'Failed to get your location. Please try again or enter manually.'));
    } finally {
      setLoading(false);
    }
  };

  const handleEnterManually = () => {
    navigation.navigate('SearchLocation');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={['top', 'bottom']}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'space-between' }}>
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 28, fontFamily: 'Poppins_700Bold', color: '#111', marginBottom: 12 }}>
            {t('address.whats_your_location', "What's your location?")}
          </Text>
          <Text style={{ fontSize: 15, fontFamily: 'Poppins_400Regular', color: '#888', lineHeight: 22 }}>
            {t('address.location_reason', 'We need your location to show you our serviceable hubs.')}
          </Text>
        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: width * 0.75, height: width * 0.75, backgroundColor: '#ECFDF5', borderRadius: width * 0.375, justifyContent: 'center', alignItems: 'center' }}>
            <Building2 size={80} color="#10B981" opacity={0.6} />
            <MapPin size={48} color="#10B981" style={{ position: 'absolute', bottom: '25%', right: '25%' }} />
          </View>
        </View>

        <View style={{ paddingBottom: 10 }}>
          <TouchableOpacity
            onPress={handleUseCurrentLocation}
            disabled={loading}
            activeOpacity={0.8}
            style={{ backgroundColor: '#10B981', borderRadius: 12, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 12, shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Navigation size={20} color="white" />
                <Text style={{ color: 'white', fontSize: 16, fontFamily: 'Poppins_600SemiBold', marginLeft: 8 }}>
                  {t('address.use_current_location', 'Use current location')}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleEnterManually}
            activeOpacity={0.8}
            style={{ paddingVertical: 16, justifyContent: 'center', alignItems: 'center' }}
          >
            <Text style={{ color: '#10B981', fontSize: 16, fontFamily: 'Poppins_600SemiBold' }}>
              {t('address.enter_manually', 'Enter location manually')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};
