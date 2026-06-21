import React from 'react';
import { Pressable, Text } from 'react-native';
import { Delete } from 'lucide-react-native';
import type { NumpadKeyValue } from '@/utils/amountInput';

type NumpadKeyProps = {
  label: NumpadKeyValue;
  onPress: () => void;
};

export default function NumpadKey({ label, onPress }: NumpadKeyProps) {
  return (
    <Pressable
      testID={`numpad-key-${label}`}
      onPress={onPress}
      className="bg-white dark:bg-bg-card-dark items-center justify-center"
      style={{
        width: 58,
        height: 58,
        borderRadius: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      {label === 'backspace' ? (
        <Delete color="#2B2F2A" size={22} />
      ) : (
        <Text className="text-tx-primary dark:text-tx-primary-dark font-bold text-xl">{label}</Text>
      )}
    </Pressable>
  );
}
