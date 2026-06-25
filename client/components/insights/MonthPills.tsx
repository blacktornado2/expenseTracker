import React from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { monthPillLabel } from '@/utils/insightsCalcs';

type MonthPillsProps = {
  months: { month: number; year: number }[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

export default function MonthPills({ months, selectedIndex, onSelect }: MonthPillsProps) {
  // `months` is chronological (oldest first); display latest month on the left.
  const reversed = months.map((m, index) => ({ ...m, index })).reverse();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}
    >
      {reversed.map(({ month, year, index }) => {
        const active = index === selectedIndex;
        return (
          <Pressable
            key={`${year}-${month}`}
            testID={`month-pill-${index}`}
            onPress={() => onSelect(index)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: active ? '#0FB46B' : 'rgba(15, 180, 107, 0.12)',
            }}
          >
            <Text
              className={active ? '' : 'text-tx-secondary dark:text-tx-secondary-dark'}
              style={{ fontWeight: '700', fontSize: 13, color: active ? '#FFFFFF' : undefined }}
            >
              {monthPillLabel(month, year)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
