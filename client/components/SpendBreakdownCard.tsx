import React, { useState } from 'react';
import { Text, View } from 'react-native';
import Card from './Card';
import SegmentedToggle from './SegmentedToggle';
import StackedBar, { type ChartSegment } from './charts/StackedBar';
import Donut from './charts/Donut';

type SpendBreakdownCardProps = {
  data: ChartSegment[];
};

type ChartMode = 'bar' | 'pie';

export default function SpendBreakdownCard({ data }: SpendBreakdownCardProps) {
  const [mode, setMode] = useState<ChartMode>('bar');
  const hasData = data.some((segment) => segment.value > 0);

  return (
    <Card radius={26} className="p-5 mt-4">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-tx-primary dark:text-tx-primary-dark font-extrabold text-base">
          Where it goes
        </Text>
        <SegmentedToggle
          options={[
            { value: 'bar', label: 'Bar' },
            { value: 'pie', label: 'Pie' },
          ]}
          value={mode}
          onChange={setMode}
        />
      </View>

      {!hasData ? (
        <Text className="text-tx-tertiary dark:text-tx-tertiary-dark text-sm">No spending yet</Text>
      ) : mode === 'bar' ? (
        <StackedBar data={data} />
      ) : (
        <View className="items-center">
          <Donut data={data} />
        </View>
      )}

      {hasData && (
        <View className="flex-row flex-wrap mt-4" style={{ gap: 12 }}>
          {data.map((segment) => (
            <View key={segment.label} className="flex-row items-center" style={{ gap: 6 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: segment.color }} />
              <Text className="text-tx-secondary dark:text-tx-secondary-dark text-xs font-semibold">
                {segment.label}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}
