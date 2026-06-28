import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SHADOW_HERO } from '@/constants/shadows';
import { GRADIENT_BRAND, GRADIENT_DIAGONAL, ACCENT_GOLD } from '@/constants/gradients';
import { useCountUp } from '@/hooks/useCountUp';

type HeroCardProps = {
  label: string;
  subtitle: string;
  amount: number;
  progressPct?: number;
  footerLeft?: string;
  footerRight?: string;
};

export default function HeroCard({ label, subtitle, amount, progressPct, footerLeft, footerRight }: Readonly<HeroCardProps>) {
  const clampedPct = progressPct === undefined ? undefined : Math.max(0, Math.min(100, progressPct));
  const displayAmount = useCountUp(amount);
  const roundedAmount = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(displayAmount));

  // Slow, looping light sweep across the card — a premium "graded" sheen.
  const sheen = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (process.env.JEST_WORKER_ID) return; // no looping animation in tests
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(900),
        Animated.timing(sheen, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(sheen, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(3400),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [sheen]);
  const sheenX = sheen.interpolate({ inputRange: [0, 1], outputRange: [-220, 460] });

  return (
    <LinearGradient
      colors={GRADIENT_BRAND}
      start={GRADIENT_DIAGONAL.start}
      end={GRADIENT_DIAGONAL.end}
      style={[{ borderRadius: 30, padding: 24, overflow: 'hidden' }, SHADOW_HERO]}
    >
      {/* Gold hairline highlight along the top edge for a premium finish */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 24,
          right: 24,
          height: 1.5,
          backgroundColor: ACCENT_GOLD,
          opacity: 0.5,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: 'rgba(255,255,255,0.08)',
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: -40,
          right: 20,
          width: 90,
          height: 90,
          borderRadius: 45,
          backgroundColor: 'rgba(255,255,255,0.08)',
        }}
      />

      <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13, letterSpacing: 1 }}>
        {label.toUpperCase()}
      </Text>
      <Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '600', fontSize: 14, marginTop: 4 }}>
        {subtitle}
      </Text>
      <Text
        style={{
          color: '#FFFFFF',
          fontFamily: 'Outfit_700Bold',
          fontSize: 44,
          marginTop: 8,
        }}
      >
        {`₹${roundedAmount}`}
      </Text>

      {clampedPct !== undefined && (
        <View
          style={{
            height: 8,
            borderRadius: 4,
            backgroundColor: 'rgba(255,255,255,0.28)',
            marginTop: 18,
            overflow: 'hidden',
          }}
        >
          <View
            testID="hero-progress-fill"
            style={{ height: 8, borderRadius: 4, backgroundColor: '#FFFFFF', width: `${clampedPct}%` }}
          />
        </View>
      )}

      {(footerLeft || footerRight) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>{footerLeft}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '600', fontSize: 13 }}>{footerRight}</Text>
        </View>
      )}

      {/* Animated sheen sweep (sits above content, taps pass through) */}
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
    </LinearGradient>
  );
}
