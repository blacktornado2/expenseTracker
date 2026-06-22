import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import type { ChartSegment } from './StackedBar';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type DonutProps = {
  data: ChartSegment[];
  size?: number;
  strokeWidth?: number;
};

export default function Donut({ data, size = 140, strokeWidth = 22 }: DonutProps) {
  const { isDark } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, segment) => sum + segment.value, 0);
  let cumulativeBefore = 0;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, [data, opacity]);

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={isDark ? '#202C1E' : '#ECEBE6'}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {total > 0 &&
        data
          .filter((segment) => segment.value > 0)
          .map((segment) => {
            const length = (segment.value / total) * circumference;
            const offset = circumference - cumulativeBefore;
            cumulativeBefore += length;
            return (
              <AnimatedCircle
                key={segment.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={offset}
                strokeLinecap="butt"
                fill="none"
                opacity={opacity}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            );
          })}
    </Svg>
  );
}
