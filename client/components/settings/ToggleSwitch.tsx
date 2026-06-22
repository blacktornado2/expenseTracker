import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

type ToggleSwitchProps = {
  value: boolean;
  onValueChange: (v: boolean) => void;
};

const ON_TRACK = '#0FB46B';
const OFF_TRACK_LIGHT = '#C8CECC';
const OFF_TRACK_DARK = '#3A4738';
const KNOB_LIGHT = '#FFFFFF';
const KNOB_DARK = '#E2E9E0';

export default function ToggleSwitch({ value, onValueChange }: ToggleSwitchProps) {
  const { isDark } = useTheme();
  return (
    <Pressable
      testID="toggle-switch"
      onPress={() => onValueChange(!value)}
      style={{
        width: 48,
        height: 28,
        borderRadius: 14,
        backgroundColor: value ? ON_TRACK : isDark ? OFF_TRACK_DARK : OFF_TRACK_LIGHT,
        justifyContent: 'center',
        padding: 4,
      }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: isDark ? KNOB_DARK : KNOB_LIGHT,
          transform: [{ translateX: value ? 20 : 0 }],
        }}
      />
    </Pressable>
  );
}
