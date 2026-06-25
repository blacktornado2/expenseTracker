import React from 'react';
import { Text, View } from 'react-native';
import Donut from './charts/Donut';
import StackedBar from './charts/StackedBar';

const SAMPLE_DATA = [
  { label: 'Groceries', value: 420, color: '#2FB872' },
  { label: 'Dining', value: 260, color: '#FF6B5E' },
  { label: 'Transport', value: 180, color: '#2BB3FF' },
  { label: 'Shopping', value: 140, color: '#7C5CFC' },
  { label: 'Bills', value: 110, color: '#F5A623' },
  { label: 'Entertainment', value: 90, color: '#FF5CA8' },
  { label: 'Health', value: 70, color: '#18BFA8' },
];

const MONTHLY_TREND = [
  { label: 'Jan', spent: 920 },
  { label: 'Feb', spent: 1080 },
  { label: 'Mar', spent: 860 },
  { label: 'Apr', spent: 1240 },
  { label: 'May', spent: 990 },
  { label: 'Jun', spent: 1190 },
];

const MAX_BAR_HEIGHT = 56;

type AuthPreviewChartProps = {
  chartType?: 'pie' | 'bar';
};

export default function AuthPreviewChart({ chartType = 'pie' }: AuthPreviewChartProps) {
  const total = SAMPLE_DATA.reduce((sum, segment) => sum + segment.value, 0);
  const maxSpent = Math.max(1, ...MONTHLY_TREND.map((m) => m.spent));

  return (
    <View className="w-full mt-6 px-5 py-4 rounded-3xl bg-bg-close dark:bg-bg-close-dark">
      <Text className="text-tx-tertiary dark:text-tx-tertiary-dark text-[11px] font-bold tracking-wide mb-4">
        TAKE BACK CONTROL OF YOUR EXPENSES
      </Text>
      {chartType === 'pie' ? (
        <View className="flex-row items-center">
          <Donut data={SAMPLE_DATA} size={120} strokeWidth={16} />
          <View className="flex-1 ml-4" style={{ gap: 5 }}>
            {SAMPLE_DATA.map((segment) => (
              <View key={segment.label} className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1" style={{ gap: 6 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: segment.color }} />
                  <Text
                    className="text-tx-secondary dark:text-tx-secondary-dark text-[11px] font-semibold flex-1"
                    numberOfLines={1}
                  >
                    {segment.label}
                  </Text>
                </View>
                <Text className="text-tx-primary dark:text-tx-primary-dark text-[11px] font-bold">
                  {((segment.value / total) * 100).toFixed(0)}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View>
          <StackedBar data={SAMPLE_DATA} height={14} />
          <View className="flex-row flex-wrap mt-4" style={{ gap: 10 }}>
            {SAMPLE_DATA.map((segment) => (
              <View key={segment.label} className="flex-row items-center" style={{ gap: 6, width: '47%' }}>
                <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: segment.color }} />
                <Text
                  className="text-tx-secondary dark:text-tx-secondary-dark text-[11px] font-semibold flex-1"
                  numberOfLines={1}
                >
                  {segment.label}
                </Text>
                <Text className="text-tx-primary dark:text-tx-primary-dark text-[11px] font-bold">
                  {((segment.value / total) * 100).toFixed(0)}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className="h-px bg-border-row dark:bg-border-row-dark my-4" />

      <Text className="text-tx-tertiary dark:text-tx-tertiary-dark text-[11px] font-bold tracking-wide mb-3">
        LAST 6 MONTHS
      </Text>
      <View className="flex-row items-end justify-between" style={{ height: MAX_BAR_HEIGHT }}>
        {MONTHLY_TREND.map((month, index) => {
          const active = index === MONTHLY_TREND.length - 1;
          const height = Math.max(4, (month.spent / maxSpent) * MAX_BAR_HEIGHT);
          return (
            <View key={month.label} className="flex-1 items-center">
              <View
                style={{
                  width: 22,
                  height,
                  borderRadius: 6,
                  backgroundColor: active ? '#0FB46B' : 'rgba(15, 180, 107, 0.4)',
                }}
              />
            </View>
          );
        })}
      </View>
      <View className="flex-row justify-between mt-2">
        {MONTHLY_TREND.map((month) => (
          <Text
            key={month.label}
            className="flex-1 text-center text-tx-tertiary dark:text-tx-tertiary-dark text-[10px] font-semibold"
          >
            {month.label}
          </Text>
        ))}
      </View>
    </View>
  );
}
