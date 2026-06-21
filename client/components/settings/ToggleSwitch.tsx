import React from 'react';
import { Pressable, View } from 'react-native';

type ToggleSwitchProps = {
  value: boolean;
  onValueChange: (v: boolean) => void;
};

const ON_TRACK = '#0FB46B';
const OFF_TRACK = '#C8CECC';

export default function ToggleSwitch({ value, onValueChange }: ToggleSwitchProps) {
  return (
    <Pressable
      testID="toggle-switch"
      onPress={() => onValueChange(!value)}
      style={{
        width: 48,
        height: 28,
        borderRadius: 14,
        backgroundColor: value ? ON_TRACK : OFF_TRACK,
        justifyContent: 'center',
        padding: 4,
      }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: '#FFFFFF',
          transform: [{ translateX: value ? 20 : 0 }],
        }}
      />
    </Pressable>
  );
}
