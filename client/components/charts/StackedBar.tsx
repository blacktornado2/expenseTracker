import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

export type ChartSegment = {
  label: string;
  value: number;
  color: string;
};

type StackedBarProps = {
  data: ChartSegment[];
  height?: number;
};

export default function StackedBar({ data, height = 14 }: StackedBarProps) {
  const total = data.reduce((sum, segment) => sum + segment.value, 0);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, [data, opacity]);

  if (total <= 0) {
    return (
      <View
        className="bg-bg-subtle dark:bg-bg-subtle-dark"
        style={{ height, borderRadius: height / 2 }}
      />
    );
  }

  return (
    <Animated.View className="flex-row overflow-hidden" style={{ height, borderRadius: height / 2, opacity }}>
      {data
        .filter((segment) => segment.value > 0)
        .map((segment) => (
          <View key={segment.label} style={{ flex: segment.value / total, backgroundColor: segment.color }} />
        ))}
    </Animated.View>
  );
}
