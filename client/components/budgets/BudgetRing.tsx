import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type BudgetRingProps = {
  percent: number; // 0–100
  color: string;
  over: boolean;
  size?: number;
};

const STROKE_WIDTH = 8;
const OVER_COLOR = '#E25555';

export default function BudgetRing({ percent, color, over, size = 66 }: BudgetRingProps) {
  const radius = (size - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (percent / 100) * circumference;
  const barColor = over ? OVER_COLOR : color;

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
          stroke="#ECEBE6"
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        {/* Arc fill — only render when percent > 0 */}
        {percent > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={barColor}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={`${filled} ${circumference - filled}`}
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
