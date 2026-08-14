import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import api from '../api';

export const ACTIVE_LOCATION_KEY = 'active_location';
const LEGACY_USER_ADDRESS_KEY = 'user_address';
const SUPPORTED_CITIES_CACHE_KEY = 'supported_cities_cache';

export interface SupportedCity {
  id: string;
  name: string;
  slug: string;
  aliases: string[];
  latitude: number;
  longitude: number;
  radiusKm: number;
}

export interface ActiveLocation {
  label: string;
  address: string;
  city: string;
  state?: string;
  lat: number;
  lng: number;
  isSupported: boolean;
  supportedCityId?: string;
  supportedCityName?: string;
  savedAddressId?: string;
}

export interface LocationCheckResult {
  isSupported: boolean;
  matchedCity: SupportedCity | null;
}

export function formatGeocodedAddress(
  geocode: Location.LocationGeocodedAddress,
): string {
  const parts = [
    geocode.name,
    geocode.street,
    geocode.district,
    geocode.city,
    geocode.region,
  ].filter(Boolean);
  return parts.join(', ') || geocode.name || 'Current Location';
}

export function extractCityFromGeocode(
  geocode: Location.LocationGeocodedAddress,
): string {
  return geocode.city || geocode.subregion || geocode.district || '';
}

export async function fetchSupportedCities(): Promise<SupportedCity[]> {
  try {
    const response = await api.get('/cities');
    const cities = response.data as SupportedCity[];
    await AsyncStorage.setItem(
      SUPPORTED_CITIES_CACHE_KEY,
      JSON.stringify(cities),
    );
    return cities;
  } catch (error) {
    const cached = await AsyncStorage.getItem(SUPPORTED_CITIES_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
    throw error;
  }
}

export async function checkLocationServiceability(input: {
  city?: string;
  lat?: number;
  lng?: number;
}): Promise<LocationCheckResult> {
  const response = await api.post('/cities/check', input);
  return response.data as LocationCheckResult;
}

export async function getActiveLocation(): Promise<ActiveLocation | null> {
  const raw = await AsyncStorage.getItem(ACTIVE_LOCATION_KEY);
  if (raw) {
    return JSON.parse(raw);
  }

  const legacy = await AsyncStorage.getItem(LEGACY_USER_ADDRESS_KEY);
  if (!legacy) return null;

  const legacyData = JSON.parse(legacy);
  const migrated: ActiveLocation = {
    label: legacyData.label || 'Current Location',
    address: legacyData.address || '',
    city: legacyData.city || '',
    lat: legacyData.lat ?? 0,
    lng: legacyData.lng ?? 0,
    isSupported: legacyData.isSupported ?? true,
    savedAddressId: legacyData.savedAddressId,
    supportedCityId: legacyData.supportedCityId,
    supportedCityName: legacyData.supportedCityName,
  };

  await AsyncStorage.setItem(ACTIVE_LOCATION_KEY, JSON.stringify(migrated));
  await AsyncStorage.removeItem(LEGACY_USER_ADDRESS_KEY);
  return migrated;
}

export async function setActiveLocation(location: ActiveLocation): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_LOCATION_KEY, JSON.stringify(location));
  await AsyncStorage.removeItem(LEGACY_USER_ADDRESS_KEY);
}

export async function buildActiveLocationFromCoords(
  coords: { latitude: number; longitude: number },
  label = 'Current Location',
): Promise<ActiveLocation> {
  const [geocode] = await Location.reverseGeocodeAsync({
    latitude: coords.latitude,
    longitude: coords.longitude,
  });

  const city = geocode ? extractCityFromGeocode(geocode) : '';
  const address = geocode
    ? formatGeocodedAddress(geocode)
    : 'Current Location';

  const check = await checkLocationServiceability({
    city,
    lat: coords.latitude,
    lng: coords.longitude,
  });

  return {
    label,
    address,
    city: check.matchedCity?.name || city,
    state: geocode?.region || undefined,
    lat: coords.latitude,
    lng: coords.longitude,
    isSupported: check.isSupported,
    supportedCityId: check.matchedCity?.id,
    supportedCityName: check.matchedCity?.name,
  };
}

export async function buildActiveLocationFromManual(input: {
  label?: string;
  address: string;
  city: string;
  state?: string;
  lat: number;
  lng: number;
  savedAddressId?: string;
}): Promise<ActiveLocation> {
  const check = await checkLocationServiceability({
    city: input.city,
    lat: input.lat,
    lng: input.lng,
  });

  return {
    label: input.label || 'Selected Location',
    address: input.address,
    city: check.matchedCity?.name || input.city,
    state: input.state,
    lat: input.lat,
    lng: input.lng,
    isSupported: check.isSupported,
    supportedCityId: check.matchedCity?.id,
    supportedCityName: check.matchedCity?.name,
    savedAddressId: input.savedAddressId,
  };
}
