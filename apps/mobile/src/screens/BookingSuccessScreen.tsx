import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withDelay, 
  withSequence,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { Check, Calendar, MapPin, ChevronRight } from 'lucide-react-native';
import { Theme } from '../theme';

const { width } = Dimensions.get('window');

export const BookingSuccessScreen = ({ route, navigation }: any) => {
  const { bookingId, totalPrice, date } = route.params;
  
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const cardY = useSharedValue(50);
  const checkRotate = useSharedValue(-45);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12 });
    opacity.value = withDelay(200, withSpring(1));
    cardY.value = withDelay(400, withSpring(0));
    checkRotate.value = withDelay(300, withSpring(0));
  }, []);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${checkRotate.value}deg` }
    ],
    opacity: opacity.value
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardY.value }],
    opacity: opacity.value
  }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.background }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        
        {/* Animated Checkmark Circle */}
        <Animated.View style={[{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: '#10B981',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 32,
          shadowColor: '#10B981',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 10
        }, checkStyle]}>
          <Check size={50} color="white" strokeWidth={4} />
        </Animated.View>

        <Animated.View style={[{ alignItems: 'center' }, cardStyle]}>
          <Text style={{ fontSize: 28, fontWeight: '900', color: Theme.textPrimary, textAlign: 'center' }}>
            Booking Confirmed!
          </Text>
          <Text style={{ fontSize: 16, color: Theme.textSecondary, textAlign: 'center', marginTop: 12, lineHeight: 24 }}>
            We've received your request and assigned a professional for your service.
          </Text>
        </Animated.View>

        {/* Booking Summary Card */}
        <Animated.View style={[{
          width: '100%',
          backgroundColor: 'white',
          borderRadius: 32,
          padding: 24,
          marginTop: 40,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 15,
          elevation: 5
        }, cardStyle]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
            <Text style={{ color: Theme.textSecondary, fontWeight: '700' }}>Booking ID</Text>
            <Text style={{ color: Theme.textPrimary, fontWeight: '900' }}>#{bookingId?.slice(-6).toUpperCase()}</Text>
          </View>

          <View style={{ height: 1, backgroundColor: '#F1F5F9', marginBottom: 20 }} />

          <View style={{ gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                <Calendar size={18} color="#10B981" />
              </View>
              <View>
                <Text style={{ fontSize: 12, color: Theme.textSecondary, fontWeight: '700' }}>SCHEDULED FOR</Text>
                <Text style={{ fontSize: 14, color: Theme.textPrimary, fontWeight: '800' }}>{new Date(date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                <MapPin size={18} color="#0EA5E9" />
              </View>
              <View>
                <Text style={{ fontSize: 12, color: Theme.textSecondary, fontWeight: '700' }}>SERVICE LOCATION</Text>
                <Text style={{ fontSize: 14, color: Theme.textPrimary, fontWeight: '800' }}>Home • Sector 62, Noida</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: '#F1F5F9', marginVertical: 20 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: Theme.textPrimary }}>Total Paid</Text>
            <Text style={{ fontSize: 24, fontWeight: '900', color: Theme.primary }}>₹{totalPrice}</Text>
          </View>
        </Animated.View>

        <Animated.View style={[{ width: '100%', marginTop: 40 }, cardStyle]}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('MyBookings')}
            style={{ 
              backgroundColor: Theme.primary, 
              flexDirection: 'row', 
              justifyContent: 'center', 
              alignItems: 'center', 
              paddingVertical: 18, 
              borderRadius: 20,
              shadowColor: Theme.primary,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 8
            }}
          >
            <Text style={{ color: 'white', fontWeight: '900', fontSize: 16 }}>VIEW ALL BOOKINGS</Text>
            <ChevronRight size={20} color="white" style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('Home')}
            style={{ marginTop: 20, alignSelf: 'center' }}
          >
            <Text style={{ color: Theme.textSecondary, fontWeight: '800', fontSize: 14 }}>Back to Home</Text>
          </TouchableOpacity>
        </Animated.View>

      </View>
    </SafeAreaView>
  );
};
