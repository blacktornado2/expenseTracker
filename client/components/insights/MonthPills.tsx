import React from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { monthPillLabel } from '@/utils/insightsCalcs';

type MonthPillsProps = {
  months: { month: number; year: number }[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

export default function MonthPills({ months, selectedIndex, onSelect }: MonthPillsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}
    >
      {months.map((m, index) => {
        const active = index === selectedIndex;
        return (
          <Pressable
            key={`${m.year}-${m.month}`}
            testID={`month-pill-${index}`}
            onPress={() => onSelect(index)}
            className={active ? '' : 'bg-close dark:bg-close-dark'}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: active ? '#0FB46B' : undefined,
            }}
          >
            <Text
              className={active ? '' : 'text-tx-secondary dark:text-tx-secondary-dark'}
              style={{ fontWeight: '700', fontSize: 13, color: active ? '#FFFFFF' : undefined }}
            >
              {monthPillLabel(m.month, m.year)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
