import React from 'react';
import { Text, View } from 'react-native';
import type { BudgetSegment } from '@/utils/budgetCalcs';

type SegmentedProgressBarProps = {
  segments: BudgetSegment[];
};

export default function SegmentedProgressBar({ segments }: SegmentedProgressBarProps) {
  return (
    <View>
      {/* Bar */}
      <View
        style={{
          height: 10,
          borderRadius: 5,
          overflow: 'hidden',
          flexDirection: 'row',
          backgroundColor: '#ECEBE6',
          marginBottom: 12,
        }}
      >
        {segments.map((seg) => (
          <View
            key={seg.label}
            style={{ flex: seg.limit, backgroundColor: seg.color }}
          />
        ))}
      </View>

      {/* Legend */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {segments.map((seg) => (
          <View
            key={seg.label}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: seg.color,
              }}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: '600',
                color: '#9AA096',
                fontFamily: 'PlusJakartaSans_600SemiBold',
              }}
            >
              {seg.label.charAt(0).toUpperCase() + seg.label.slice(1)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
