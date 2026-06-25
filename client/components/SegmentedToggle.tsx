import React from 'react';
import { Pressable, Text, View } from 'react-native';

type Option<T extends string> = {
  value: T;
  label: string;
  activeColor?: string;
};

type SegmentedToggleProps<T extends string> = {
  options: readonly [Option<T>, Option<T>];
  value: T;
  onChange: (value: T) => void;
};

export default function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
}: SegmentedToggleProps<T>) {
  return (
    <View className="flex-row bg-bg-close dark:bg-bg-close-dark rounded-full p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable key={option.value} onPress={() => onChange(option.value)}>
            <View
              className={`px-3 py-1.5 rounded-full ${active && !option.activeColor ? 'bg-brand-green' : ''}`}
              style={active && option.activeColor ? { backgroundColor: option.activeColor } : undefined}
            >
              <Text
                className={
                  active
                    ? 'text-white font-bold text-xs'
                    : 'text-tx-secondary dark:text-tx-secondary-dark font-bold text-xs'
                }
              >
                {option.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
