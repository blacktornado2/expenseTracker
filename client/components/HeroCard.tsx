import React from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SHADOW_HERO } from '@/constants/shadows';

type HeroCardProps = {
  label: string;
  subtitle: string;
  amount: number;
  progressPct?: number;
  footerLeft?: string;
  footerRight?: string;
};

export default function HeroCard({ label, subtitle, amount, progressPct, footerLeft, footerRight }: HeroCardProps) {
  const clampedPct = progressPct === undefined ? undefined : Math.max(0, Math.min(100, progressPct));
  const roundedAmount = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(amount));

  return (
    <LinearGradient
      colors={['#13C076', '#0A9E5E']}
      style={[{ borderRadius: 30, padding: 24, overflow: 'hidden' }, SHADOW_HERO]}
    >
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
          fontFamily: 'BricolageGrotesque_800ExtraBold',
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
    </LinearGradient>
  );
}
