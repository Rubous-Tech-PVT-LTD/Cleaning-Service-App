import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, MapPin, Search, Navigation, Home, Briefcase, Plus } from 'lucide-react-native';
import MapView, { Marker, PROVIDER_GOOGLE, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Theme } from '../theme';
import { GOOGLE_MAPS_APIKEY } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';



import { useTranslation } from 'react-i18next';
import { database } from '../db';

export const AddressPickerScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const [region, setRegion] = useState<any>(null);
  const [addressObj, setAddressObj] = useState<any>(null);
  const [addressString, setAddressString] = useState('Fetching address...');
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState('Home');
  const mapRef = useRef<MapView>(null);

  // Default fallback region (New Delhi, India)
  const DEFAULT_REGION = {
    latitude: 28.6139,
    longitude: 77.2090,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  useEffect(() => {
    let cancelled = false;

    const fetchLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Allow location access to pick your address. Showing default location.');
          if (!cancelled) {
            setRegion(DEFAULT_REGION);
            setAddressString('New Delhi, India (Default)');
            setLoading(false);
          }
          return;
        }

        // Step 1: Try to get last known position instantly (no network needed)
        let location = await Location.getLastKnownPositionAsync({});

        // Step 2: If no cached location, request a fresh one with a timeout
        if (!location) {
          const locationPromise = Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const timeoutPromise = new Promise<null>((resolve) =>
            setTimeout(() => resolve(null), 10000)
          );
          location = await Promise.race([locationPromise, timeoutPromise]) as any;
        }

        if (cancelled) return;

        if (location) {
          const initialRegion = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          };
          setRegion(initialRegion);
          reverseGeocode(initialRegion.latitude, initialRegion.longitude);
        } else {
          // Timeout hit — use default region
          setRegion(DEFAULT_REGION);
          setAddressString('Location timed out. Drag the pin to your address.');
        }
      } catch (error) {
        console.error('[AddressPicker] Location error:', error);
        if (!cancelled) {
          setRegion(DEFAULT_REGION);
          setAddressString('Could not get location. Drag the pin to set address.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchLocation();
    return () => { cancelled = true; };
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      let result = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (result.length > 0) {
        const item = result[0];
        setAddressObj(item);
        const formattedAddress = `${item.name || ''} ${item.street || ''}, ${item.district || ''}, ${item.city || ''}`;
        setAddressString(formattedAddress.trim().replace(/^ ,/, ''));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const [isDefault, setIsDefault] = useState(false);

  const handleConfirm = async () => {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      if (!userId) {
        Alert.alert('Error', 'User not found. Please login again.');
        return;
      }

      await database.write(async () => {
        if (isDefault) {
          const allAddresses = await database.get('addresses').query().fetch();
          const updates = allAddresses.map((addr: any) => 
            addr.prepareUpdate((record: any) => { record.isDefault = false; })
          );
          await database.batch(...updates);
        }

        await database.get('addresses').create((newAddress: any) => {
          newAddress.userId = userId;
          newAddress.label = label;
          newAddress.addressLine1 = addressObj?.name || addressObj?.street || 'Unknown Address';
          newAddress.addressLine2 = `${addressObj?.district || ''} ${addressObj?.subregion || ''}`.trim();
          newAddress.city = addressObj?.city || addressObj?.subregion || 'Unknown City';
          newAddress.state = addressObj?.region || '';
          newAddress.pincode = addressObj?.postalCode || '';
          newAddress.isDefault = isDefault;
        });
      });

      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not save address.');
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.surface }}>
        <ActivityIndicator size="large" color={Theme.primary} />
        <Text style={{ marginTop: 12, color: Theme.textSecondary }}>{t('common.processing')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.surface }}>
      {/* Header with Search */}
      <View style={styles.searchContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={Theme.textPrimary} />
        </TouchableOpacity>
        <GooglePlacesAutocomplete
          placeholder={t('search.placeholder')}
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
              setAddressString(data.description);
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
          provider={GOOGLE_MAPS_APIKEY === 'YOUR_REAL_API_KEY_HERE' ? undefined : PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          initialRegion={region}
          onRegionChangeComplete={(newRegion) => {
            setRegion(newRegion);
            reverseGeocode(newRegion.latitude, newRegion.longitude);
          }}
        >
          {GOOGLE_MAPS_APIKEY === 'YOUR_REAL_API_KEY_HERE' && (
            <UrlTile 
              urlTemplate="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
              maximumZ={19}
              flipY={false}
              zIndex={-1}
            />
          )}
        </MapView>
        
        {/* OSM Mode Badge - subtle indicator only */}
        {GOOGLE_MAPS_APIKEY === 'YOUR_REAL_API_KEY_HERE' && (
          <View style={{ position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
            <Text style={{ color: 'white', fontSize: 10, fontWeight: '700' }}>🗺️ OSM Mode</Text>
          </View>
        )}

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
            <Text style={styles.addressTitle}>{t('address.picker_title')}</Text>
            <Text style={styles.addressText} numberOfLines={2}>{addressString}</Text>
          </View>
        </View>

        <Text style={styles.labelHeader}>{t('address.save_as')}</Text>
        <View style={styles.labelRow}>
          <LabelButton icon={<Home size={18} />} title={t('address.home')} active={label === 'Home'} onPress={() => setLabel('Home')} />
          <LabelButton icon={<Briefcase size={18} />} title={t('address.work')} active={label === 'Work'} onPress={() => setLabel('Work')} />
          <LabelButton icon={<Plus size={18} />} title={t('address.other')} active={label === 'Other'} onPress={() => setLabel('Other')} />
        </View>

        <TouchableOpacity 
          onPress={() => setIsDefault(!isDefault)}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}
        >
          <View style={{ 
            width: 24, 
            height: 24, 
            borderRadius: 6, 
            borderWidth: 2, 
            borderColor: isDefault ? Theme.primary : '#E2E8F0', 
            backgroundColor: isDefault ? Theme.primary : 'transparent',
            justifyContent: 'center', 
            alignItems: 'center',
            marginRight: 12
          }}>
            {isDefault && <Plus size={16} color="white" style={{ transform: [{ rotate: '45deg' }] }} />}
          </View>
          <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.textPrimary }}>{t('address.set_default')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
          <Text style={styles.confirmButtonText}>{t('address.confirm_location')}</Text>
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
    backgroundColor: Theme.surface,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    height: 44,
    backgroundColor: Theme.muted,
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
    borderColor: Theme.muted,
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
