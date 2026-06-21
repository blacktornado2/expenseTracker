import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type GoalRingProps = {
  percent: number; // 0–100
  size?: number;
  color?: string;
};

const STROKE_WIDTH = 8;
const TRACK_COLOR = '#ECEBE6';

export default function GoalRing({ percent, size = 88, color = '#0FB46B' }: GoalRingProps) {
  const radius = (size - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const filled = (clamped / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={TRACK_COLOR} strokeWidth={STROKE_WIDTH} fill="none" />
        {clamped > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={`${filled} ${circumference - filled}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </Svg>
      <Text
        testID="goal-ring-percent"
        style={{ fontSize: 16, fontWeight: '800', color, fontFamily: 'PlusJakartaSans_800ExtraBold' }}
      >
        {Math.round(clamped)}%
      </Text>
    </View>
  );
}
