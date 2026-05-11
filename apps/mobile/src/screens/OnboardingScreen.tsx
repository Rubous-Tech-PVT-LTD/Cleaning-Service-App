import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Animated, FlatList, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme } from '../theme';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    emoji: '🏠',
    title: 'Home Services\nAt Your Door',
    subtitle: 'Book trusted professionals for cleaning, plumbing, electrical work & more — in just a few taps.',
    gradient: ['#5B21B6', '#7C3AED'] as [string, string],
  },
  {
    id: '2',
    emoji: '✅',
    title: 'Verified & Trusted\nProfessionals',
    subtitle: 'Every service provider is background-checked and skill-verified. Your safety is our priority.',
    gradient: ['#0F766E', '#059669'] as [string, string],
  },
  {
    id: '3',
    emoji: '💫',
    title: 'Track & Pay\nWith Ease',
    subtitle: 'Real-time booking updates, secure payments, and a 30-day service warranty on every job.',
    gradient: ['#B45309', '#D97706'] as [string, string],
  },
];

export const OnboardingScreen = ({ navigation }: any) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = async () => {
    await AsyncStorage.setItem('onboarding_done', 'true');
    navigation.replace('Login');
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('onboarding_done', 'true');
    navigation.replace('Login');
  };

  const renderSlide = ({ item }: { item: typeof SLIDES[0] }) => (
    <LinearGradient colors={item.gradient} style={{ width, height, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
      {/* Big emoji */}
      <View style={{ width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 48 }}>
        <Text style={{ fontSize: 80 }}>{item.emoji}</Text>
      </View>

      <Text style={{ fontSize: 36, fontWeight: '900', color: 'white', textAlign: 'center', lineHeight: 44, marginBottom: 20 }}>
        {item.title}
      </Text>
      <Text style={{ fontSize: 17, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 26, fontWeight: '500' }}>
        {item.subtitle}
      </Text>
    </LinearGradient>
  );

  const slide = SLIDES[currentIndex];

  return (
    <View style={{ flex: 1 }}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onMomentumScrollEnd={e => {
          setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
      />

      {/* Bottom controls */}
      <LinearGradient
        colors={[slide.gradient[0] + '00', slide.gradient[1]]}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 32, paddingBottom: 56, paddingTop: 32 }}
        pointerEvents="none"
      />
      <View style={{ position: 'absolute', bottom: 56, left: 32, right: 32 }}>
        {/* Dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 40, gap: 8 }}>
          {SLIDES.map((_, i) => (
            <Animated.View
              key={i}
              style={{
                width: i === currentIndex ? 28 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === currentIndex ? 'white' : 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </View>

        {/* Buttons */}
        <TouchableOpacity
          onPress={handleNext}
          style={{ backgroundColor: 'white', borderRadius: 20, paddingVertical: 18, alignItems: 'center', marginBottom: 16 }}
        >
          <Text style={{ fontSize: 18, fontWeight: '900', color: slide.gradient[1] }}>
            {currentIndex === SLIDES.length - 1 ? 'Get Started 🚀' : 'Next →'}
          </Text>
        </TouchableOpacity>

        {currentIndex < SLIDES.length - 1 && (
          <TouchableOpacity onPress={handleSkip} style={{ alignItems: 'center', paddingVertical: 10 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.75)' }}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
