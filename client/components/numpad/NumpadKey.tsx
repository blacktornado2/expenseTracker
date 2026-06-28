import React from 'react';
import { Text } from 'react-native';
import { Delete } from 'lucide-react-native';
import PressableScale from '@/components/PressableScale';
import { useTheme } from '@/contexts/ThemeContext';
import { SHADOW_KEY, SHADOW_KEY_DARK } from '@/constants/shadows';
import type { NumpadKeyValue } from '@/utils/amountInput';

type NumpadKeyProps = {
  label: NumpadKeyValue;
  onPress: () => void;
};

export default function NumpadKey({ label, onPress }: Readonly<NumpadKeyProps>) {
  const { isDark } = useTheme();
  return (
    <PressableScale
      testID={`numpad-key-${label}`}
      onPress={onPress}
      containerStyle={{ flex: 1 }}
      className="bg-white dark:bg-bg-card-dark items-center justify-center"
      style={[{ width: '100%', height: 58, borderRadius: 18 }, isDark ? SHADOW_KEY_DARK : SHADOW_KEY]}
    >
      {label === 'backspace' ? (
        <Delete color={isDark ? '#E2E9E0' : '#2B2F2A'} size={22} />
      ) : (
        <Text className="text-tx-primary dark:text-tx-primary-dark font-bold text-xl">{label}</Text>
      )}
    </PressableScale>
  );
}
