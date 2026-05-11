import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, MapPin, Search, Navigation, Home, Briefcase, Plus } from 'lucide-react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Theme } from '../theme';
import { GOOGLE_MAPS_APIKEY } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';



export const AddressPickerScreen = ({ navigation }: any) => {
  const [region, setRegion] = useState<any>(null);
  const [address, setAddress] = useState('Fetching address...');
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState('Home');
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access to pick your address.');
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const initialRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      setRegion(initialRegion);
      reverseGeocode(initialRegion.latitude, initialRegion.longitude);
      setLoading(false);
    })();
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      let result = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (result.length > 0) {
        const item = result[0];
        const formattedAddress = `${item.name || ''} ${item.street || ''}, ${item.district || ''}, ${item.city || ''}`;
        setAddress(formattedAddress.trim().replace(/^ ,/, ''));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleConfirm = async () => {
    try {
      const addressData = {
        address,
        latitude: region.latitude,
        longitude: region.longitude,
        label
      };
      await AsyncStorage.setItem('user_address', JSON.stringify(addressData));
      navigation.navigate('Home', { refreshAddress: true });
    } catch (error) {
      Alert.alert('Error', 'Could not save address.');
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <ActivityIndicator size="large" color={Theme.primary} />
        <Text style={{ marginTop: 12, color: Theme.textSecondary }}>Opening Map...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      {/* Header with Search */}
      <View style={styles.searchContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={Theme.textPrimary} />
        </TouchableOpacity>
        <GooglePlacesAutocomplete
          placeholder="Search for area, street name..."
          onPress={(data, details = null) => {
            if (details) {
              const newRegion = {
                latitude: details.geometry.location.lat,
                longitude: details.geometry.location.lng,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              };
              setRegion(newRegion);
              mapRef.current?.animateToRegion(newRegion, 1000);
              setAddress(data.description);
            }
          }}
          query={{ key: GOOGLE_MAPS_APIKEY, language: 'en' }}
          fetchDetails={true}
          styles={{
            container: { flex: 1, marginLeft: 10 },
            textInput: styles.searchInput,
            listView: styles.searchListView,
          }}
          enablePoweredByContainer={false}
        />
      </View>

      {/* Map View Section */}
      <View style={{ flex: 1, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' }}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          initialRegion={region}
          onRegionChangeComplete={(newRegion) => {
            setRegion(newRegion);
            reverseGeocode(newRegion.latitude, newRegion.longitude);
          }}
        />
        
        {/* Placeholder if Map fails to load tiles */}
        {!GOOGLE_MAPS_APIKEY || GOOGLE_MAPS_APIKEY === 'YOUR_REAL_API_KEY_HERE' ? (
          <View style={{ position: 'absolute', backgroundColor: 'rgba(255,255,255,0.8)', padding: 20, borderRadius: 20, margin: 20, alignItems: 'center' }}>
            <MapPin size={40} color={Theme.textSecondary} />
            <Text style={{ marginTop: 10, textAlign: 'center', color: Theme.textPrimary, fontWeight: '700' }}>
              Map is in Development Mode
            </Text>
            <Text style={{ textAlign: 'center', color: Theme.textSecondary, fontSize: 12, marginTop: 4 }}>
              Enter API Key in constants/index.ts to see the real map.
            </Text>
          </View>
        ) : null}

        {/* Fixed Center Marker */}
        <View style={styles.markerFixed}>
          <View style={styles.markerContainer}>
            <View style={styles.markerDot} />
            <MapPin size={40} color={Theme.primary} fill="white" />
          </View>
        </View>

        {/* Current Location Button */}
        <TouchableOpacity 
          onPress={async () => {
            let location = await Location.getCurrentPositionAsync({});
            const newRegion = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            };
            mapRef.current?.animateToRegion(newRegion, 500);
          }}
          style={styles.locationButton}
        >
          <Navigation size={20} color={Theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Bottom Selection Area */}
      <View style={styles.bottomContainer}>
        <View style={styles.addressRow}>
          <View style={styles.pinCircle}>
            <MapPin size={20} color="white" />
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.addressTitle}>Selected Location</Text>
            <Text style={styles.addressText} numberOfLines={2}>{address}</Text>
          </View>
        </View>

        <Text style={styles.labelHeader}>Save as</Text>
        <View style={styles.labelRow}>
          <LabelButton icon={<Home size={18} />} title="Home" active={label === 'Home'} onPress={() => setLabel('Home')} />
          <LabelButton icon={<Briefcase size={18} />} title="Work" active={label === 'Work'} onPress={() => setLabel('Work')} />
          <LabelButton icon={<Plus size={18} />} title="Other" active={label === 'Other'} onPress={() => setLabel('Other')} />
        </View>

        <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
          <Text style={styles.confirmButtonText}>Confirm Location</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const LabelButton = ({ icon, title, active, onPress }: any) => (
  <TouchableOpacity 
    onPress={onPress}
    style={[styles.labelBtn, active && styles.labelBtnActive]}
  >
    {React.cloneElement(icon, { color: active ? 'white' : Theme.textSecondary })}
    <Text style={[styles.labelBtnText, active && styles.labelBtnTextActive]}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 100,
    backgroundColor: 'white',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    height: 44,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: Theme.textPrimary,
  },
  searchListView: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 5,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  markerFixed: {
    left: '50%',
    marginLeft: -20,
    marginTop: -40,
    position: 'absolute',
    top: '50%',
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.3)',
    position: 'absolute',
    bottom: -2,
  },
  locationButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  bottomContainer: {
    padding: 24,
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  pinCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.textPrimary,
    lineHeight: 22,
  },
  labelHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: Theme.textPrimary,
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  labelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    width: '31%',
    justifyContent: 'center',
  },
  labelBtnActive: {
    backgroundColor: Theme.primary,
    borderColor: Theme.primary,
  },
  labelBtnText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '700',
    color: Theme.textSecondary,
  },
  labelBtnTextActive: {
    color: 'white',
  },
  confirmButton: {
    backgroundColor: Theme.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: Theme.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
  },
});
