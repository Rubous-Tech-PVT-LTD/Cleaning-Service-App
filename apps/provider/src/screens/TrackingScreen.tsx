import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
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
  const mapRef = useRef<MapView>(null);

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [distance, setDistance] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [loadingRoute, setLoadingRoute] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sosLoading, setSosLoading] = useState<boolean>(false);

  // Validate booking address coordinates (memoized to prevent infinite loops)
  const validation = useMemo(() => {
    console.log('=== BOOKING ADDRESS VALIDATION ===');
    console.log('Booking ID:', booking.id);
    console.log('Booking address:', JSON.stringify(booking.address, null, 2));

    if (!booking.address) {
      console.error('Booking address is null or undefined');
      setError('Booking address is missing');
      return { valid: false };
    }

    const { latitude, longitude } = booking.address;

    if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
      console.error('Booking address coordinates are missing');
      setError('Service address coordinates are missing');
      return { valid: false };
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      console.error('Invalid coordinate types');
      setError('Invalid coordinate types');
      return { valid: false };
    }

    if (isNaN(latitude) || isNaN(longitude)) {
      console.error('Coordinates are NaN');
      setError('Invalid coordinates (NaN)');
      return { valid: false };
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90) {
      console.error('Invalid latitude range');
      setError('Invalid latitude (must be between -90 and 90)');
      return { valid: false };
    }

    if (longitude < -180 || longitude > 180) {
      console.error('Invalid longitude range');
      setError('Invalid longitude (must be between -180 and 180)');
      return { valid: false };
    }

    console.log('✅ Valid coordinates:', { latitude, longitude });
    console.log('=============================');

    return { valid: true, coordinates: { latitude, longitude } };
  }, [booking.address]);

  // Get client destination from booking address (memoized to prevent infinite recalculation)
  const clientDestination = useMemo(() => {
    if (!validation.valid || !validation.coordinates) {
      return null;
    }
    return validation.coordinates;
  }, [validation]);

  useEffect(() => {
    // Show error if coordinates are invalid
    if (!clientDestination) {
      Alert.alert(
        'Navigation Error',
        error || 'Service address coordinates are missing or invalid. Cannot start navigation.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }

    // Initialize Socket
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // Request Permissions and Start Tracking
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
  }, [booking.id, clientDestination]); // Re-run only if booking or destination changes

  // Recalculate route when provider location changes
  useEffect(() => {
    if (location && clientDestination) {
      const recalculateRoute = async () => {
        console.log('Recalculating route to booking destination:', clientDestination);
        setLoadingRoute(true);
        const routeData = await fetchRoute(
          location.coords.latitude,
          location.coords.longitude,
          clientDestination.latitude,
          clientDestination.longitude
        );

        if (routeData) {
          setRouteCoordinates(routeData.coordinates);
          setDistance(routeData.distance);
          setDuration(routeData.duration);
        }
        setLoadingRoute(false);
      };

      recalculateRoute();
    }
  }, [location?.coords.latitude, location?.coords.longitude, clientDestination]);

  const markArrived = async () => {
    try {
      await api.patch(`/bookings/${booking.id}/status`, { status: 'IN_PROGRESS' });
      Alert.alert('Arrived!', 'You can now start the job from the Jobs tab.');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleTriggerSos = async () => {
    if (sosLoading) return;

    Alert.alert(
      'Emergency SOS',
      'Are you sure you want to trigger an emergency SOS?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Trigger SOS',
          style: 'destructive',
          onPress: async () => {
            try {
              setSosLoading(true);

              let lat: number;
              let lng: number;

              if (location) {
                lat = location.coords.latitude;
                lng = location.coords.longitude;
              } else {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                  Alert.alert('Permission Denied', 'Location permission is required to share your emergency location.');
                  return;
                }
                const freshLoc = await Location.getCurrentPositionAsync({
                  accuracy: Location.Accuracy.High,
                });
                lat = freshLoc.coords.latitude;
                lng = freshLoc.coords.longitude;
              }

              const payload = {
                bookingId: booking.id,
                latitude: lat,
                longitude: lng,
              };

              await api.post('/sos', payload);

              Alert.alert(
                'SOS Sent',
                'Your emergency alert has been sent. Help is on the way.'
              );
            } catch (err: any) {
              const msg = err?.response?.data?.message || err.message || 'Failed to send SOS. Please try again.';
              Alert.alert('SOS Failed', msg);
            } finally {
              setSosLoading(false);
            }
          },
        },
      ]
    );
  };

  // Get map region that fits both points
  const getMapRegion = () => {
    if (!clientDestination) {
      return {
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

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
      {!clientDestination ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Navigation Error</Text>
          <Text style={styles.errorMessage}>
            {error || 'Service address coordinates are missing or invalid.'}
          </Text>
          <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={getMapRegion()}
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

            <Text style={styles.debugInfo}>
              📍 Destination: {booking.address?.city || 'Unknown City'} ({clientDestination.latitude.toFixed(4)}, {clientDestination.longitude.toFixed(4)})
            </Text>

            {loadingRoute ? (
              <Text style={styles.status}>🗺️ Calculating route...</Text>
            ) : location ? (
              <Text style={styles.status}>📍 Broadcasting your live location...</Text>
            ) : (
              <Text style={styles.status}>Locating you...</Text>
            )}

            <TouchableOpacity
              onPress={handleTriggerSos}
              disabled={sosLoading}
              style={[styles.sosButton, sosLoading && { opacity: 0.6 }]}
            >
              {sosLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={styles.sosEmoji}>🚨</Text>
                  <Text style={styles.sosButtonText}>EMERGENCY SOS</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.completeButton} onPress={markArrived}>
              <Text style={styles.buttonText}>I HAVE ARRIVED</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Theme.background,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Theme.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: Theme.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  errorButton: {
    backgroundColor: Theme.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  errorButtonText: {
    color: Theme.white,
    fontWeight: '900',
    fontSize: 16,
  },
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
  subtitle: { fontSize: 14, fontWeight: '600', color: Theme.textSecondary, marginBottom: 8 },
  debugInfo: { fontSize: 12, fontWeight: '600', color: Theme.textSecondary, marginBottom: 12, fontStyle: 'italic' },
  status: { fontSize: 14, fontWeight: '700', color: Theme.primary, marginBottom: 20 },
  completeButton: {
    backgroundColor: Theme.success,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: { color: Theme.white, fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
  sosButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#DC2626',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FCA5A5',
  },
  sosEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  sosButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
});
