import React from 'react';
import { Text, View } from 'react-native';

type Option<T extends string> = {
  value: T;
  label: string;
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
          <View key={option.value} onPress={() => onChange(option.value)} className={`px-3 py-1.5 rounded-full ${active ? 'bg-brand-green' : ''}`}>
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
        );
      })}
    </View>
  );
}
