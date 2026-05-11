import React from 'react';
import { Animated } from 'react-native';

interface SkeletonProps {
  style: any;
}

export const Skeleton = ({ style }: SkeletonProps) => {
  const opacity = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, [opacity]);

  return <Animated.View style={[style, { opacity, backgroundColor: '#E2E8F0', overflow: 'hidden' }]} />;
};
