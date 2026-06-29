import React, { useEffect, useRef } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';

type FadeInViewProps = {
  children: React.ReactNode;
  /** Delay before the entrance starts — stagger siblings by increasing this. */
  delay?: number;
  duration?: number;
  /** Initial downward offset (px) the content rises from. */
  offsetY?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Fades + rises its children in on mount. Stagger a list of these with an
 * increasing `delay` for a polished, premium load sequence.
 */
export default function FadeInView({
  children,
  delay = 0,
  duration = 420,
  offsetY = 14,
  style,
}: Readonly<FadeInViewProps>) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(offsetY)).current;

  useEffect(() => {
    // In tests, snap to the final state so no async animation leaks past teardown.
    if (process.env.JEST_WORKER_ID) {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay, useNativeDriver: true, damping: 14, stiffness: 120, mass: 0.7 }),
    ]).start();
  }, [delay, duration, opacity, translateY]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
