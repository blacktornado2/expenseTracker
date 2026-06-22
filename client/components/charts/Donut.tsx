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
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, { toValue: 1, duration: 250, useNativeDriver: false }).start();
  }, [data, progress]);

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
            // Sweep the arc in: start fully rotated back by its own length
            // (i.e. not yet drawn) and animate forward to its final offset.
            // strokeDasharray (the segment's drawn length) is static/exact —
            // only the rotation/offset animates, so at rest the geometry is
            // identical to the un-animated values.
            const animatedOffset = progress.interpolate({
              inputRange: [0, 1],
              outputRange: [offset + length, offset],
              extrapolate: 'clamp',
            });
            return (
              <AnimatedCircle
                key={segment.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={animatedOffset}
                strokeLinecap="butt"
                fill="none"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            );
          })}
    </Svg>
  );
}
