import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Navigation, ChevronRight, Home, Briefcase, MapPin, Plus, Phone } from 'lucide-react-native';
import * as Location from 'expo-location';
import withObservables from '@nozbe/with-observables';
import { database } from '../db';
import { LocationSearchInput } from '../components/LocationSearchInput';
import {
  buildActiveLocationFromCoords,
  buildActiveLocationFromManual,
  setActiveLocation,
} from '../services/locationService';
import { Theme } from '../theme';

const SearchLocationScreenBase = ({ navigation, addresses }: any) => {
  const [loading, setLoading] = useState(false);

  const goHomeWithLocation = async (location: Awaited<ReturnType<typeof buildActiveLocationFromManual>>) => {
    await setActiveLocation(location);
    navigation.navigate('Home');
  };

  const handleUseCurrentLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow location access.');
        return;
      }

      let location = await Location.getLastKnownPositionAsync({});
      if (!location) {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      }
      const activeLocation = await buildActiveLocationFromCoords(
        location.coords,
        'Current Location',
      );
      await goHomeWithLocation(activeLocation);
    } catch (error) {
      console.error('Location Error:', error);
      Alert.alert('Error', 'Failed to get your location.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSelect = async (selection: {
    address: string;
    city: string;
    state?: string;
    lat: number;
    lng: number;
  }) => {
    try {
      setLoading(true);
      const activeLocation = await buildActiveLocationFromManual({
        label: 'Selected Location',
        ...selection,
      });
      await goHomeWithLocation(activeLocation);
    } catch {
      Alert.alert('Error', 'Could not validate this location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSavedAddress = async (address: any) => {
    try {
      setLoading(true);
      const activeLocation = await buildActiveLocationFromManual({
        label: address.label,
        address:
          address.addressLine1 +
          (address.addressLine2 ? ', ' + address.addressLine2 : ''),
        city: address.city,
        state: address.state,
        lat: 0,
        lng: 0,
        savedAddressId: address.id,
      });
      await goHomeWithLocation(activeLocation);
    } catch {
      Alert.alert('Error', 'Could not validate this address.');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case 'home':
        return <Home size={20} color="#94A3B8" />;
      case 'work':
        return <Briefcase size={20} color="#94A3B8" />;
      default:
        return <MapPin size={20} color="#94A3B8" />;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'bottom']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: -8 }}>
          <ChevronLeft size={24} color={Theme.textPrimary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: Theme.textPrimary, marginLeft: 8 }}>
          Search your location
        </Text>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: 16 }}>
          <LocationSearchInput
            placeholder="Search locality, sector, area"
            onSelect={handleManualSelect}
          />
        </View>

        <View style={{ marginTop: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.textSecondary, marginBottom: 12 }}>
            QUICK ACTIONS
          </Text>
          
          <TouchableOpacity
            onPress={() => navigation.navigate('AddressPicker')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F8FAFC',
              padding: 16,
              borderRadius: 12,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#E2E8F0',
            }}
          >
            <Plus size={20} color={Theme.primary} />
            <Text style={{ flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '600', color: Theme.textPrimary }}>
              Add address
            </Text>
            <ChevronRight size={20} color={Theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleUseCurrentLocation}
            disabled={loading}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F8FAFC',
              padding: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#E2E8F0',
            }}
          >
            <Navigation size={20} color={Theme.primary} />
            <Text style={{ flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '600', color: Theme.textPrimary }}>
              Use current location
            </Text>
            {loading ? (
              <ActivityIndicator size="small" color={Theme.primary} />
            ) : (
              <ChevronRight size={20} color={Theme.textSecondary} />
            )}
          </TouchableOpacity>
        </View>

        {addresses && addresses.length > 0 && (
          <View style={{ marginTop: 24, paddingBottom: 24 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.textSecondary, marginBottom: 12 }}>
              SAVED ADDRESSES
            </Text>
            {addresses.map((item: any) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleSelectSavedAddress(item)}
                style={{ backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, marginBottom: 12 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ marginTop: 2 }}>{getIcon(item.label)}</View>
                  <Text style={{ fontSize: 15, fontWeight: 'bold', color: Theme.textPrimary, marginLeft: 12 }}>
                    {item.label}
                  </Text>
                  {item.isDefault && (
                    <View style={{ backgroundColor: '#10B981', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginLeft: 8 }}>
                      <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#FFFFFF' }}>Currently selected</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 13, color: Theme.textSecondary, marginTop: 2, lineHeight: 18 }}>
                  {item.addressLine1}
                  {item.addressLine2 ? `, ${item.addressLine2}` : ''}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  <Phone size={14} color={Theme.textSecondary} />
                  <Text style={{ fontSize: 12, color: Theme.textSecondary, marginLeft: 4 }}>
                    Mobile: {item.mobile || 'N/A'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('AddressPicker', { addressId: item.id })}
                  style={{ marginTop: 12 }}
                >
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: Theme.primary }}>EDIT</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export const SearchLocationScreen = withObservables([], () => ({
  addresses: database.collections.get('addresses').query().observe(),
}))(SearchLocationScreenBase);
