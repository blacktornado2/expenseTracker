import React from 'react';
import { Text, View } from 'react-native';
import { categoryBreakdown } from '@/utils/insightsCalcs';
import { getCategoryMeta } from '@/constants/categoryMeta';
import { useTheme } from '@/contexts/ThemeContext';

type CategoryBreakdownListProps = {
  cats: Record<string, number>;
};

export default function CategoryBreakdownList({ cats }: CategoryBreakdownListProps) {
  const { isDark } = useTheme();
  const rows = categoryBreakdown(cats);

  if (rows.length === 0) {
    return (
      <Text
        className="text-tx-tertiary dark:text-tx-tertiary-dark text-center"
        style={{ paddingVertical: 16 }}
      >
        No expenses recorded
      </Text>
    );
  }

  return (
    <View style={{ gap: 14 }}>
      {rows.map((row) => {
        const meta = getCategoryMeta(row.label);
        const label = row.label.charAt(0).toUpperCase() + row.label.slice(1);
        return (
          <View key={row.label} className="flex-row items-center" style={{ gap: 12 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: meta.softBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <meta.Icon size={18} color={meta.color} />
            </View>
            <View style={{ flex: 1 }}>
              <View className="flex-row justify-between">
                <Text className="text-tx-primary dark:text-tx-primary-dark font-bold" style={{ fontSize: 14 }}>
                  {label}
                </Text>
                <Text className="text-tx-primary dark:text-tx-primary-dark font-bold" style={{ fontSize: 14 }}>
                  ₹{row.value.toLocaleString('en-IN')}
                </Text>
              </View>
              <View
                style={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: isDark ? '#202C1E' : '#ECEBE6',
                  marginTop: 6,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    height: 6,
                    borderRadius: 3,
                    width: `${row.pct}%`,
                    backgroundColor: meta.color,
                    opacity: 0.75,
                  }}
                />
              </View>
              <Text className="text-tx-tertiary dark:text-tx-tertiary-dark" style={{ fontSize: 11, marginTop: 4 }}>
                {row.pct.toFixed(0)}% of total
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
