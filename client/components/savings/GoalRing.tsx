import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type GoalRingProps = {
  percent: number; // 0–100
  size?: number;
  color?: string;
};

const STROKE_WIDTH = 8;
const TRACK_COLOR_LIGHT = '#ECEBE6';
const TRACK_COLOR_DARK = '#202C1E';

export default function GoalRing({ percent, size = 88, color = '#0FB46B' }: GoalRingProps) {
  const { isDark } = useTheme();
  const radius = (size - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const trackColor = isDark ? TRACK_COLOR_DARK : TRACK_COLOR_LIGHT;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: clamped,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [clamped, progress]);

  const animatedFilled = progress.interpolate({
    inputRange: [0, 100],
    outputRange: [0, circumference],
    extrapolate: 'clamp',
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={STROKE_WIDTH} fill="none" />
        {clamped > 0 && (
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={Animated.subtract(circumference, animatedFilled)}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </Svg>
      <Text
        testID="goal-ring-percent"
        style={{ fontSize: 16, fontWeight: '800', color, fontFamily: 'Manrope_800ExtraBold' }}
      >
        {Math.round(clamped)}%
      </Text>
    </View>
  );
}
