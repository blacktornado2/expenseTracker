import React from 'react';
import { View } from 'react-native';
import NumpadKey from './NumpadKey';
import type { NumpadKeyValue } from '@/utils/amountInput';

const KEYS: NumpadKeyValue[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'];

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

type NumpadProps = {
  onKey: (key: NumpadKeyValue) => void;
};

export default function Numpad({ onKey }: NumpadProps) {
  const rows = chunk(KEYS, 3);
  return (
    <View style={{ gap: 12 }}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row justify-between">
          {row.map((key) => (
            <NumpadKey key={key} label={key} onPress={() => onKey(key)} />
          ))}
        </View>
      ))}
    </View>
  );
}
