import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, View } from 'react-native';
import { useSelector } from 'react-redux';

import Card from '@/components/Card';
import HeroCard from '@/components/HeroCard';
import MonthPills from '@/components/insights/MonthPills';
import TrendBars from '@/components/insights/TrendBars';
import CategoryBreakdownList from '@/components/insights/CategoryBreakdownList';
import { selectMonthlyData } from '@/redux/store/selectors';
import { trendDelta, monthFullLabel } from '@/utils/insightsCalcs';

export default function InsightsScreen() {
  const monthlyData = useSelector(selectMonthlyData);
  const [selectedIndex, setSelectedIndex] = useState(monthlyData.length - 1);

  const selected = monthlyData[selectedIndex];
  const hasMonth = monthlyData.length > 0 && !!selected;
  const noExpenses = hasMonth ? selected.cats.length === 0 : true;
  const previous = hasMonth && selectedIndex > 0 ? monthlyData[selectedIndex - 1] : undefined;
  const delta = hasMonth ? trendDelta(selected, previous) : null;
  const saved = hasMonth ? Math.max(0, selected.income - selected.spent) : 0;

  return (
    <SafeAreaView className="flex-1 bg-bg-app dark:bg-bg-app-dark">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 20, paddingHorizontal: 18, paddingBottom: 26 }}
      >
        <Text
          style={{ fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 30 }}
          className="text-tx-primary dark:text-tx-primary-dark mb-4"
        >
          Insights
        </Text>

        <View className="mb-5">
          <MonthPills
            months={monthlyData.map((m) => ({ month: m.month, year: m.year }))}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
          />
        </View>

        {hasMonth ? (
          <HeroCard
            label={monthFullLabel(selected.month, selected.year)}
            subtitle="Total spent"
            amount={selected.spent}
            footerLeft={`Income ₹${selected.income.toLocaleString('en-IN')}`}
            footerRight={`Saved ₹${saved.toLocaleString('en-IN')}`}
          />
        ) : null}

        {delta ? (
          <Text
            className="text-tx-secondary dark:text-tx-secondary-dark text-center mt-3"
            style={{ fontSize: 13, fontWeight: '600' }}
          >
            {delta.direction === 'up' ? '↑' : delta.direction === 'down' ? '↓' : '→'}
            {' '}₹{delta.diff.toLocaleString('en-IN')}{' '}
            {delta.direction === 'up' ? 'more' : delta.direction === 'down' ? 'less' : 'no change'} than{' '}
            {previous ? monthFullLabel(previous.month, previous.year) : ''}
          </Text>
        ) : null}

        <Card radius={22} className="p-4 mt-5 mb-5">
          <Text className="text-tx-primary dark:text-tx-primary-dark font-bold mb-3">Spending trend</Text>
          <TrendBars
            data={monthlyData.map((m) => ({ spent: m.spent }))}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
          />
        </Card>

        <Card radius={22} className="p-4">
          <Text className="text-tx-primary dark:text-tx-primary-dark font-bold mb-3">Where it went</Text>
          {noExpenses ? (
            <Text className="text-tx-secondary dark:text-tx-secondary-dark text-center py-6" style={{ fontSize: 14, fontWeight: '600' }}>
              No expenses recorded
            </Text>
          ) : (
            <CategoryBreakdownList cats={selected.cats} />
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
