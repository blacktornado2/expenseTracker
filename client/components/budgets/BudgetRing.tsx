import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type BudgetRingProps = {
  percent: number; // 0–100
  color: string;
  over: boolean;
  size?: number;
};

const STROKE_WIDTH = 8;
const OVER_COLOR = '#E25555';

export default function BudgetRing({ percent, color, over, size = 66 }: BudgetRingProps) {
  const { isDark } = useTheme();
  const radius = (size - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const barColor = over ? OVER_COLOR : color;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: percent,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [percent, progress]);

  const animatedFilled = progress.interpolate({
    inputRange: [0, 100],
    outputRange: [0, circumference],
    extrapolate: 'clamp',
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg
        width={size}
        height={size}
        style={{ position: 'absolute' }}
      >
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDark ? '#202C1E' : '#ECEBE6'}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        {/* Arc fill — only render when percent > 0 */}
        {percent > 0 && (
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={barColor}
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
        style={{
          fontSize: 13,
          fontWeight: '800',
          color: barColor,
          fontFamily: 'PlusJakartaSans_800ExtraBold',
        }}
      >
        {Math.round(percent)}%
      </Text>
    </View>
  );
}
