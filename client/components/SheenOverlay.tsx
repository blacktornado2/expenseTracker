import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const SCREEN_WIDTH = Dimensions.get('window').width;

type SheenOverlayProps = {
  /** Horizontal distance the sheen travels; defaults to a full-screen-width sweep. */
  travel?: number;
};

/** Slow, looping light sweep — a premium "graded" sheen for gradient surfaces. */
export default function SheenOverlay({ travel = SCREEN_WIDTH + 200 }: Readonly<SheenOverlayProps>) {
  const sheen = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (process.env.JEST_WORKER_ID) return; // no looping animation in tests
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(900),
        Animated.timing(sheen, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(sheen, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(2500),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [sheen]);

  const sheenX = sheen.interpolate({ inputRange: [0, 1], outputRange: [-travel / 2, travel] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: -30,
        bottom: -30,
        width: 90,
        transform: [{ translateX: sheenX }, { rotate: '18deg' }],
      }}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.22)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: 1 }}
      />
    </Animated.View>
  );
}
