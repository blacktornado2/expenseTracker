import React, { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import Card from '@/components/Card';
import BudgetRing from '@/components/budgets/BudgetRing';
import SegmentedProgressBar from '@/components/budgets/SegmentedProgressBar';
import BudgetSheet from '@/components/sheets/BudgetSheet';
import { useBudgets, type Budget } from '@/contexts/BudgetsContext';
import { selectSpendByCategory } from '@/redux/store/selectors';
import { getCategoryMeta } from '@/constants/categoryMeta';
import { ringPercent, isOverBudget, totalConsumedStats } from '@/utils/budgetCalcs';

export default function BudgetsScreen() {
  const { budgets } = useBudgets();
  const spendByCategory = useSelector(selectSpendByCategory);
  const [sheetMode, setSheetMode] = useState<'add' | 'edit' | null>(null);
  const [editBudget, setEditBudget] = useState<Budget | undefined>(undefined);

  const spendMap = useMemo(
    () => new Map(spendByCategory.map((s) => [s.label.trim().toLowerCase(), s.value])),
    [spendByCategory]
  );

  const stats = useMemo(
    () =>
      totalConsumedStats(budgets, spendByCategory, (cat) => getCategoryMeta(cat).color),
    [budgets, spendByCategory]
  );

  const openEdit = (budget: Budget) => {
    setEditBudget(budget);
    setSheetMode('edit');
  };

  const handleClose = () => {
    setSheetMode(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-app dark:bg-bg-app-dark">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 20,
          paddingHorizontal: 18,
          paddingBottom: 26,
        }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-5">
          <Text
            style={{ fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 30 }}
            className="text-tx-primary dark:text-tx-primary-dark"
          >
            Budgets
          </Text>
          <Pressable
            onPress={() => { setEditBudget(undefined); setSheetMode('add'); }}
            style={{ borderRadius: 13, overflow: 'hidden' }}
          >
            <LinearGradient
              colors={['#13C076', '#0A9E5E']}
              style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }}
            >
              <Plus color="#FFFFFF" size={20} />
            </LinearGradient>
          </Pressable>
        </View>

        {budgets.length === 0 ? (
          /* Empty state */
          <View className="items-center" style={{ marginTop: 80, gap: 8 }}>
            <Text
              className="text-tx-primary dark:text-tx-primary-dark font-bold"
              style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16 }}
            >
              No budgets yet
            </Text>
            <Text
              className="text-tx-tertiary dark:text-tx-tertiary-dark text-center"
              style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14 }}
            >
              Tap + to set a monthly spend limit for a category
            </Text>
          </View>
        ) : (
          <>
            {/* Total consumed card */}
            <Card radius={22} className="p-4 mb-5">
              <Text
                className="text-tx-tertiary dark:text-tx-tertiary-dark font-semibold mb-1"
                style={{ fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12 }}
              >
                Total consumed
              </Text>
              <Text
                className="text-tx-primary dark:text-tx-primary-dark font-extrabold mb-3"
                style={{ fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 18 }}
              >
                ₹{stats.totalSpent.toLocaleString('en-IN')} / ₹{stats.totalLimit.toLocaleString('en-IN')}
              </Text>
              <SegmentedProgressBar segments={stats.segments} />
            </Card>

            {/* Budget grid — 2 columns with 13px gap */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 13 }}>
              {budgets.map((budget) => {
                const spent = spendMap.get(budget.cat) ?? 0;
                const pct = ringPercent(spent, budget.limit);
                const over = isOverBudget(spent, budget.limit);
                const meta = getCategoryMeta(budget.cat);
                const label =
                  budget.cat.charAt(0).toUpperCase() + budget.cat.slice(1);

                return (
                  <Pressable
                    key={budget.cat}
                    onPress={() => openEdit(budget)}
                    style={{ width: '47%' }}
                  >
                    <Card radius={20} className="p-4 items-center" style={{ gap: 8 }}>
                      <BudgetRing percent={pct} color={meta.color} over={over} />
                      <Text
                        className="text-tx-primary dark:text-tx-primary-dark font-bold"
                        style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 }}
                      >
                        {label}
                      </Text>
                      <Text
                        className="text-tx-tertiary dark:text-tx-tertiary-dark font-semibold"
                        style={{ fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12 }}
                      >
                        ₹{spent.toLocaleString('en-IN')} / ₹{budget.limit.toLocaleString('en-IN')}
                      </Text>
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      <BudgetSheet mode={sheetMode} editBudget={editBudget} onClose={handleClose} />
    </SafeAreaView>
  );
}
