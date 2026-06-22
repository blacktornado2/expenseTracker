import React, { useEffect, useRef } from 'react';
import { Animated, Pressable } from 'react-native';

type TrendBarsProps = {
  data: { spent: number }[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  maxBarHeight?: number;
};

function TrendBar({
  height,
  active,
  testID,
  onPress,
}: {
  height: number;
  active: boolean;
  testID: string;
  onPress: () => void;
}) {
  const animatedHeight = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: height,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [height, animatedHeight]);

  return (
    <Pressable testID={testID} onPress={onPress} style={{ flex: 1, alignItems: 'center' }}>
      <Animated.View
        className={active ? '' : 'bg-close dark:bg-close-dark'}
        style={{
          width: 18,
          height: animatedHeight,
          borderRadius: 6,
          backgroundColor: active ? '#0FB46B' : undefined,
        }}
      />
    </Pressable>
  );
}

export default function TrendBars({ data, selectedIndex, onSelect, maxBarHeight = 74 }: TrendBarsProps) {
  const maxSpent = Math.max(1, ...data.map((d) => d.spent));

  return (
    <Animated.View className="flex-row items-end justify-between" style={{ height: maxBarHeight }}>
      {data.map((d, index) => {
        const active = index === selectedIndex;
        const height = Math.max(4, (d.spent / maxSpent) * maxBarHeight);
        return (
          <TrendBar
            key={index}
            height={height}
            active={active}
            testID={`trend-bar-${index}`}
            onPress={() => onSelect(index)}
          />
        );
      })}
    </Animated.View>
  );
}
