import React from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SHADOW_HERO } from '@/constants/shadows';
import { GRADIENT_BRAND, GRADIENT_DIAGONAL, ACCENT_GOLD } from '@/constants/gradients';
import { useCountUp } from '@/hooks/useCountUp';
import SheenOverlay from './SheenOverlay';

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

      <SheenOverlay travel={460} />
    </LinearGradient>
  );
}
