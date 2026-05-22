import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation, useRoute } from '@react-navigation/native';
import { io, Socket } from 'socket.io-client';
import { Theme } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { SOCKET_URL } from '../api';

export const TrackingScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { booking } = route.params as { booking: any };

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // Dummy client destination for testing (you can replace with actual booking coordinates)
  const clientDestination = {
    latitude: 37.78825,
    longitude: -122.4324,
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
        (loc) => {
          setLocation(loc);
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

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: clientDestination.latitude,
          longitude: clientDestination.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        followsUserLocation={true}
      >
        <Marker 
          coordinate={clientDestination} 
          title="Client Location" 
          description="Navigate here to complete the job" 
        />
      </MapView>

      <View style={styles.bottomCard}>
        <Text style={styles.title}>Navigating to Client</Text>
        <Text style={styles.subtitle}>Job #{booking.id.slice(-6).toUpperCase()}</Text>
        
        {location ? (
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
