import React from 'react';
import { Pressable, View } from 'react-native';

type TrendBarsProps = {
  data: { spent: number }[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  maxBarHeight?: number;
};

export default function TrendBars({ data, selectedIndex, onSelect, maxBarHeight = 74 }: TrendBarsProps) {
  const maxSpent = Math.max(1, ...data.map((d) => d.spent));

  return (
    <View className="flex-row items-end justify-between" style={{ height: maxBarHeight }}>
      {data.map((d, index) => {
        const active = index === selectedIndex;
        const height = Math.max(4, (d.spent / maxSpent) * maxBarHeight);
        return (
          <Pressable
            key={index}
            testID={`trend-bar-${index}`}
            onPress={() => onSelect(index)}
            style={{ flex: 1, alignItems: 'center' }}
          >
            <View
              className={active ? '' : 'bg-close dark:bg-close-dark'}
              style={{
                width: 18,
                height,
                borderRadius: 6,
                backgroundColor: active ? '#0FB46B' : undefined,
              }}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
