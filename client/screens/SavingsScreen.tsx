import React, { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';

import Card from '@/components/Card';
import HeroCard from '@/components/HeroCard';
import TrendBars from '@/components/insights/TrendBars';
import GoalRing from '@/components/savings/GoalRing';
import { useSavingsGoal } from '@/contexts/SavingsGoalContext';
import { selectMonthlyData } from '@/redux/store/selectors';
import { monthFullLabel } from '@/utils/insightsCalcs';
import {
  savingsAmount,
  savingsRate,
  expensesBarWidthPct,
  goalProgressPct,
  amountToGoal,
  isGoalReached,
  savingsTrend,
} from '@/utils/savingsCalcs';

const GREEN = '#0FB46B';
const RED = '#E8322A';

export default function SavingsScreen() {
  const router = useRouter();
  const monthlyData = useSelector(selectMonthlyData);
  const { goal, setGoal } = useSavingsGoal();

  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');

  const current = monthlyData[monthlyData.length - 1];
  const previous = monthlyData.length > 1 ? monthlyData[monthlyData.length - 2] : undefined;

  const saved = savingsAmount(current.income, current.spent);
  const rate = savingsRate(saved, current.income);
  const trend = savingsTrend(saved, previous ? savingsAmount(previous.income, previous.spent) : undefined);
  const expensesPct = expensesBarWidthPct(current.spent, current.income);
  const goalPct = goalProgressPct(saved, goal);
  const toGo = amountToGoal(saved, goal);
  const reached = isGoalReached(saved, goal);

  const savingsBars = monthlyData.map((m) => ({ spent: Math.max(0, savingsAmount(m.income, m.spent)) }));

  const startEditingGoal = () => {
    setGoalInput(goal > 0 ? String(goal) : '');
    setEditingGoal(true);
  };

  const onSetGoal = () => {
    const next = parseFloat(goalInput);
    if (next > 0) {
      setGoal(next);
    }
    setEditingGoal(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-app dark:bg-bg-app-dark">
      <ScrollView contentContainerStyle={{ paddingTop: 54, paddingHorizontal: 18, paddingBottom: 26 }}>
        <View className="flex-row items-center justify-between mb-5">
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: GREEN }} className="font-bold text-base">‹ Home</Text>
          </Pressable>
          <Text className="text-tx-primary dark:text-tx-primary-dark font-extrabold text-base">Savings</Text>
          <View style={{ width: 60 }} />
        </View>

        <HeroCard
          label={monthFullLabel(current.month, current.year)}
          subtitle="Saved this month"
          amount={saved}
        />

        <View className="flex-row mt-3" style={{ gap: 8 }}>
          <View className="bg-close dark:bg-close-dark px-3 py-1.5 rounded-full">
            <Text className="text-tx-secondary dark:text-tx-secondary-dark font-bold text-xs">
              {rate.toFixed(0)}% of income
            </Text>
          </View>
          {trend && previous ? (
            <View className="bg-close dark:bg-close-dark px-3 py-1.5 rounded-full">
              <Text className="text-tx-secondary dark:text-tx-secondary-dark font-bold text-xs">
                {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} ₹
                {trend.diff.toLocaleString('en-IN')} vs {format(new Date(previous.year, previous.month, 1), 'MMM')}
              </Text>
            </View>
          ) : null}
        </View>

        <Card radius={22} className="p-4 mt-5">
          <View className="flex-row justify-between mb-1">
            <Text className="text-tx-tertiary dark:text-tx-tertiary-dark text-xs font-semibold">Income</Text>
            <Text className="text-tx-primary dark:text-tx-primary-dark text-xs font-bold">
              ₹{current.income.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: '#ECEBE6', overflow: 'hidden' }}>
            <View style={{ height: 8, borderRadius: 4, width: '100%', backgroundColor: GREEN }} />
          </View>

          <View className="flex-row justify-between mb-1 mt-4">
            <Text className="text-tx-tertiary dark:text-tx-tertiary-dark text-xs font-semibold">Expenses</Text>
            <Text className="text-tx-primary dark:text-tx-primary-dark text-xs font-bold">
              ₹{current.spent.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: '#ECEBE6', overflow: 'hidden' }}>
            <View style={{ height: 8, borderRadius: 4, width: `${expensesPct}%`, backgroundColor: RED }} />
          </View>

          <View
            className="flex-row justify-between items-center mt-4 pt-4"
            style={{ borderTopWidth: 1, borderTopColor: '#ECEBE6' }}
          >
            <Text className="text-tx-primary dark:text-tx-primary-dark font-bold text-sm">Net saved</Text>
            <Text style={{ color: saved >= 0 ? GREEN : RED }} className="font-extrabold text-sm">
              {saved >= 0 ? '+' : '-'}₹{Math.abs(saved).toLocaleString('en-IN')}
            </Text>
          </View>
        </Card>

        <Card radius={22} className="p-4 mt-5">
          <Text className="text-tx-primary dark:text-tx-primary-dark font-bold mb-3">6-month trend</Text>
          <TrendBars data={savingsBars} selectedIndex={monthlyData.length - 1} onSelect={() => {}} />
        </Card>

        <Card radius={22} className="p-4 mt-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-tx-primary dark:text-tx-primary-dark font-bold">Monthly goal</Text>
            {!editingGoal && (
              <Pressable onPress={startEditingGoal}>
                <Text style={{ color: GREEN }} className="font-bold text-sm">Edit goal</Text>
              </Pressable>
            )}
          </View>

          {editingGoal ? (
            <View className="flex-row items-center" style={{ gap: 10 }}>
              <View
                className="flex-row items-center flex-1 rounded-2xl px-3 py-2.5"
                style={{ borderWidth: 1, borderColor: '#E5E5E0' }}
              >
                <Text style={{ color: '#9AA096', marginRight: 4, fontWeight: '600' }}>₹</Text>
                <TextInput
                  testID="goal-input"
                  value={goalInput}
                  onChangeText={setGoalInput}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#9AA096"
                  style={{ flex: 1, color: '#2B2F2A' }}
                />
              </View>
              <Pressable onPress={onSetGoal} style={{ backgroundColor: GREEN, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 12 }}>
                <Text style={{ color: '#FFFFFF' }} className="font-bold text-sm">Set</Text>
              </Pressable>
            </View>
          ) : (
            <View className="flex-row items-center" style={{ gap: 16 }}>
              <GoalRing percent={goalPct} />
              <View className="flex-1">
                <Text className="text-tx-primary dark:text-tx-primary-dark font-extrabold text-lg">
                  ₹{Math.max(0, saved).toLocaleString('en-IN')}
                </Text>
                <Text className="text-tx-tertiary dark:text-tx-tertiary-dark text-xs font-semibold">
                  of ₹{goal.toLocaleString('en-IN')} goal
                </Text>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: '#ECEBE6', marginTop: 8, overflow: 'hidden' }}>
                  <View style={{ height: 6, borderRadius: 3, width: `${goalPct}%`, backgroundColor: GREEN }} />
                </View>
                <Text className="text-tx-secondary dark:text-tx-secondary-dark text-xs font-bold mt-2">
                  {reached ? 'Goal reached! 🎉' : `₹${toGo.toLocaleString('en-IN')} to go`}
                </Text>
              </View>
            </View>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
