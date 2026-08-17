import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation, useRoute } from '@react-navigation/native';
import { io, Socket } from 'socket.io-client';
import { Theme } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { SOCKET_URL } from '../api';

// OSRM routing API - free, no API key required
const fetchRoute = async (startLat: number, startLon: number, endLat: number, endLon: number) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const distance = route.distance / 1000; // Convert meters to km
      const duration = route.duration / 60; // Convert seconds to minutes
      
      // Convert GeoJSON coordinates to MapView format
      const coordinates = route.geometry.coordinates.map((coord: number[]) => ({
        latitude: coord[1],
        longitude: coord[0],
      }));
      
      return { coordinates, distance, duration };
    }
    return null;
  } catch (error) {
    console.error('Error fetching route:', error);
    return null;
  }
};

const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m away`;
  }
  return `${distanceKm.toFixed(1)}km away`;
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
};

export const TrackingScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { booking } = route.params as { booking: any };

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [distance, setDistance] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [loadingRoute, setLoadingRoute] = useState<boolean>(false);
  
  // Get client coordinates from booking address (fallback to default if not available)
  const clientDestination = {
    latitude: booking.address?.latitude || 28.6139, // Default to Delhi if not available
    longitude: booking.address?.longitude || 77.2090,
  };

  useEffect(() => {
    // 1. Initialize Socket
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // 2. Request Permissions and Start Tracking
    let locationSubscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
      }

      const providerId = await AsyncStorage.getItem('provider_id');

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        async (loc) => {
          setLocation(loc);
          
          // Fetch route using OSRM
          setLoadingRoute(true);
          const routeData = await fetchRoute(
            loc.coords.latitude,
            loc.coords.longitude,
            clientDestination.latitude,
            clientDestination.longitude
          );
          
          if (routeData) {
            setRouteCoordinates(routeData.coordinates);
            setDistance(routeData.distance);
            setDuration(routeData.duration);
          }
          setLoadingRoute(false);
          
          // Emit location to backend
          if (newSocket && providerId && booking.clientId) {
            newSocket.emit('update_location', {
              providerId: providerId,
              clientId: booking.clientId,
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
          }
        }
      );
    };

    startTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
      newSocket.disconnect();
    };
  }, []);

  const markArrived = async () => {
    try {
      await api.patch(`/bookings/${booking.id}/status`, { status: 'IN_PROGRESS' });
      Alert.alert('Arrived!', 'You can now start the job from the Jobs tab.');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  // Get map region that fits both points
  const getMapRegion = () => {
    if (!location) {
      return {
        latitude: clientDestination.latitude,
        longitude: clientDestination.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    const lat = (location.coords.latitude + clientDestination.latitude) / 2;
    const lon = (location.coords.longitude + clientDestination.longitude) / 2;
    const latDelta = Math.abs(location.coords.latitude - clientDestination.latitude) * 2 + 0.01;
    const lonDelta = Math.abs(location.coords.longitude - clientDestination.longitude) * 2 + 0.01;

    return {
      latitude: lat,
      longitude: lon,
      latitudeDelta: Math.max(latDelta, 0.02),
      longitudeDelta: Math.max(lonDelta, 0.02),
    };
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={getMapRegion()}
        region={location ? getMapRegion() : undefined}
        showsUserLocation={true}
        followsUserLocation={true}
      >
        <Marker 
          coordinate={clientDestination} 
          title="Client Location" 
          description="Navigate here to complete the job"
          pinColor={Theme.primary}
        />
        
        {/* Draw road route polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={Theme.primary}
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </MapView>

      <View style={styles.bottomCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoBadge}>
            <Text style={styles.infoLabel}>📍 Distance</Text>
            <Text style={styles.infoValue}>{formatDistance(distance)}</Text>
          </View>
          <View style={styles.infoBadge}>
            <Text style={styles.infoLabel}>⏱️ Time</Text>
            <Text style={styles.infoValue}>{formatDuration(duration)}</Text>
          </View>
        </View>
        
        <Text style={styles.title}>Navigating to Client</Text>
        <Text style={styles.subtitle}>Job #{booking.id.slice(-6).toUpperCase()}</Text>
        
        {loadingRoute ? (
          <Text style={styles.status}>🗺️ Calculating route...</Text>
        ) : location ? (
          <Text style={styles.status}>📍 Broadcasting your live location...</Text>
        ) : (
          <Text style={styles.status}>Locating you...</Text>
        )}

        <TouchableOpacity style={styles.completeButton} onPress={markArrived}>
          <Text style={styles.buttonText}>I HAVE ARRIVED</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Theme.white,
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -5 },
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  infoBadge: {
    flex: 1,
    backgroundColor: Theme.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  infoLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoValue: {
    color: Theme.white,
    fontSize: 18,
    fontWeight: '900',
  },
  title: { fontSize: 20, fontWeight: '900', color: Theme.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 14, fontWeight: '600', color: Theme.textSecondary, marginBottom: 16 },
  status: { fontSize: 14, fontWeight: '700', color: Theme.primary, marginBottom: 20 },
  completeButton: {
    backgroundColor: Theme.success,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: { color: Theme.white, fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
});
