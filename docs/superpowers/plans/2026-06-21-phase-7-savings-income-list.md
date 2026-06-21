# Phase 7: Savings + Income List Drill-downs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two full-screen drill-downs reachable from Home's "Saved" and "Income" stat cards: a Savings screen (hero stat, income-vs-expenses bar, 6-month trend, an editable AsyncStorage-persisted savings goal with an SVG progress ring) and an Income list screen (summary + filtered income transactions that open the existing Edit Transaction sheet).

**Architecture:** Pure functions in `savingsCalcs.ts` compute savings amount, savings rate, goal progress, "amount to go", goal-reached state, and month-over-month trend — all TDD'd with no React involved. A new `SavingsGoalContext` (mirroring Phase 5's `BudgetsContext`) persists the goal number to AsyncStorage. `SavingsScreen` reuses Phase 6's `selectMonthlyData` selector (6 months: 5 seeded + 1 live) and Phase 6's `TrendBars` component (non-interactive here) to avoid duplicating month-data plumbing. `IncomeListScreen` filters the existing Redux transaction list to `credit` entries and reuses `TransactionRow` + the Phase 4 `EditTransactionSheet`. Both screens are stack-sibling routes under `client/app/(logged-in)/` (outside the `(tabs)` group), which automatically renders them without the tab bar or FAB — no layout config needed.

**Tech Stack:** React Native + NativeWind 4, Redux (`useSelector`), `date-fns`, `react-native-svg` (already a dependency, used by `BudgetRing`), `@react-native-async-storage/async-storage`, expo-router

## Global Constraints

- Keep existing NativeWind className patterns: `text-tx-primary dark:text-tx-primary-dark`, `bg-bg-app dark:bg-bg-app-dark`, `bg-close dark:bg-close-dark`, `text-tx-secondary dark:text-tx-secondary-dark`, `text-tx-tertiary dark:text-tx-tertiary-dark`
- Never install new packages
- Run tests from the `client/` directory: `cd client && npx jest --testPathPattern="<file>" --no-coverage`
- Screen padding convention: `paddingTop: 54, paddingHorizontal: 18, paddingBottom: 26`
- Selected accent green: `#0FB46B`; hero gradient greens: `#13C076` → `#0A9E5E`; error red: `#E8322A`
- `Card` props: `{ children, radius? (default 24), className?, style? }` (`client/components/Card.tsx`)
- `HeroCard` props: `{ label, subtitle, amount, progressPct?, footerLeft?, footerRight? }` (`client/components/HeroCard.tsx`) — do not modify; compose around it (don't use footerLeft/footerRight for the savings pills — render them separately below the card)
- `TransactionRow` props: `{ name, category, date: Date, amount, type: 'income'|'expense', iconColor, icon? }` (`client/components/TransactionRow.tsx`)
- `TrendBars` props (Phase 6, `client/components/insights/TrendBars.tsx`): `{ data: { spent: number }[], selectedIndex, onSelect, maxBarHeight? }` — bar height is proportional to `d.spent`; reusing it for savings bars means mapping `{ spent: saved }` into that field
- `getCategoryMeta(category: string)` returns `{ color, softBg, Icon: LucideIcon }` (`client/constants/categoryMeta.ts`), never throws
- `selectMonthlyData(state) => MonthlyDatum[]` (Phase 6, `client/redux/store/selectors.ts`) returns exactly 6 entries `{ month, year, spent, income, cats }`, oldest → newest, index 5 is the live current month
- `transactionSelector(state) => Transaction` exposes `.transactions: RawStoreTxn[]` (cast via `as any` — established pattern in this file)
- `RawStoreTxn` type: `{ _id: string; transactionType: 'credit'|'debit'; amount: number; date: string; category: string; description?: string }` (`client/utils/transactionMappings.ts`)
- `EditTransactionSheet` props: `{ txn: RawStoreTxn | null; onClose: () => void }` (`client/components/sheets/EditTransactionSheet.tsx`) — opened via local `useState<RawStoreTxn|null>`, not navigation
- AsyncStorage persistence pattern (mirror exactly, from `client/contexts/BudgetsContext.tsx`): plain string key, `try { JSON.parse/stringify } catch { return default }`, loaded once in a `useEffect`, exposed via a `useXxx()` hook that throws outside its provider
- Stack-sibling full-screen routes live as files directly under `client/app/(logged-in)/` (sibling to `(tabs)/`), e.g. `client/app/(logged-in)/addTransaction.tsx` — no tab bar/FAB config needed, it's automatic
- Provider mounting point: `client/app/_layout.tsx:64-66` wraps `<Stack>` in `<BudgetsProvider>` — add the new provider the same way

---

## File Map

**Create:**
- `client/utils/savingsCalcs.ts` — pure functions: `savingsAmount`, `savingsRate`, `expensesBarWidthPct`, `goalProgressPct`, `amountToGoal`, `isGoalReached`, `savingsTrend`
- `client/utils/__tests__/savingsCalcs.test.ts`
- `client/contexts/SavingsGoalContext.tsx` — `SavingsGoalProvider` + `useSavingsGoal()` hook, AsyncStorage-backed
- `client/components/savings/GoalRing.tsx` — SVG progress ring (88×88, r=36, stroke 8)
- `client/screens/SavingsScreen.tsx`
- `client/screens/IncomeListScreen.tsx`
- `client/app/(logged-in)/savings.tsx`
- `client/app/(logged-in)/income-list.tsx`

**Modify:**
- `client/app/_layout.tsx` — mount `SavingsGoalProvider`
- `client/screens/Dashboard.tsx` — wrap "Saved"/"Income" stat cards in `TouchableOpacity` navigating to the new routes

---

## Task 1: Pure savings calc utils (TDD)

**Files:**
- Create: `client/utils/savingsCalcs.ts`
- Create: `client/utils/__tests__/savingsCalcs.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `export function savingsAmount(income: number, spent: number): number`; `export function savingsRate(saved: number, income: number): number` (0–100, 0 when `income <= 0`); `export function expensesBarWidthPct(spent: number, income: number): number` (clamped 0–100, 0 when `income <= 0`); `export function goalProgressPct(saved: number, goal: number): number` (clamped 0–100, 0 when `goal <= 0`); `export function amountToGoal(saved: number, goal: number): number` (`max(0, goal - saved)`); `export function isGoalReached(saved: number, goal: number): boolean` (`goal > 0 && saved >= goal`); `export type SavingsTrend = { diff: number; direction: 'up' | 'down' | 'same' }`; `export function savingsTrend(current: number, previous?: number): SavingsTrend | null`

- [ ] **Step 1: Write the failing tests**

Create `client/utils/__tests__/savingsCalcs.test.ts`:

```ts
import {
  savingsAmount,
  savingsRate,
  expensesBarWidthPct,
  goalProgressPct,
  amountToGoal,
  isGoalReached,
  savingsTrend,
} from '../savingsCalcs';

describe('savingsAmount', () => {
  it('returns income minus spent', () => {
    expect(savingsAmount(5000, 3000)).toBe(2000);
  });

  it('can be negative when spent exceeds income', () => {
    expect(savingsAmount(1000, 1500)).toBe(-500);
  });
});

describe('savingsRate', () => {
  it('returns saved as a percent of income', () => {
    expect(savingsRate(2000, 8000)).toBe(25);
  });

  it('returns 0 when income is 0', () => {
    expect(savingsRate(0, 0)).toBe(0);
  });

  it('returns 0 when income is negative', () => {
    expect(savingsRate(100, -50)).toBe(0);
  });
});

describe('expensesBarWidthPct', () => {
  it('returns spent as a percent of income', () => {
    expect(expensesBarWidthPct(3000, 8000)).toBe(37.5);
  });

  it('clamps to 100 when spent exceeds income', () => {
    expect(expensesBarWidthPct(9000, 8000)).toBe(100);
  });

  it('returns 0 when income is 0', () => {
    expect(expensesBarWidthPct(500, 0)).toBe(0);
  });
});

describe('goalProgressPct', () => {
  it('returns saved as a percent of goal', () => {
    expect(goalProgressPct(2500, 10000)).toBe(25);
  });

  it('clamps to 100 when saved exceeds goal', () => {
    expect(goalProgressPct(12000, 10000)).toBe(100);
  });

  it('returns 0 when goal is 0', () => {
    expect(goalProgressPct(2500, 0)).toBe(0);
  });

  it('returns 0 when saved is negative', () => {
    expect(goalProgressPct(-500, 10000)).toBe(0);
  });
});

describe('amountToGoal', () => {
  it('returns the remaining amount needed to hit the goal', () => {
    expect(amountToGoal(6000, 10000)).toBe(4000);
  });

  it('returns 0 when saved meets or exceeds the goal', () => {
    expect(amountToGoal(10000, 10000)).toBe(0);
    expect(amountToGoal(12000, 10000)).toBe(0);
  });
});

describe('isGoalReached', () => {
  it('returns true when saved meets the goal', () => {
    expect(isGoalReached(10000, 10000)).toBe(true);
  });

  it('returns true when saved exceeds the goal', () => {
    expect(isGoalReached(12000, 10000)).toBe(true);
  });

  it('returns false when saved is below the goal', () => {
    expect(isGoalReached(8000, 10000)).toBe(false);
  });

  it('returns false when goal is 0 or unset', () => {
    expect(isGoalReached(8000, 0)).toBe(false);
  });
});

describe('savingsTrend', () => {
  it('returns null when there is no previous value', () => {
    expect(savingsTrend(1000, undefined)).toBeNull();
  });

  it('returns direction "up" with the absolute diff when saved increased', () => {
    expect(savingsTrend(1500, 1000)).toEqual({ diff: 500, direction: 'up' });
  });

  it('returns direction "down" with the absolute diff when saved decreased', () => {
    expect(savingsTrend(800, 1000)).toEqual({ diff: 200, direction: 'down' });
  });

  it('returns direction "same" with diff 0 when saved is unchanged', () => {
    expect(savingsTrend(1000, 1000)).toEqual({ diff: 0, direction: 'same' });
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

```bash
cd client && npx jest --testPathPattern="savingsCalcs.test" --no-coverage
```

Expected: FAIL — cannot find module `../savingsCalcs`

- [ ] **Step 3: Implement savingsCalcs**

Create `client/utils/savingsCalcs.ts`:

```ts
export function savingsAmount(income: number, spent: number): number {
  return income - spent;
}

export function savingsRate(saved: number, income: number): number {
  if (income <= 0) return 0;
  return (saved / income) * 100;
}

export function expensesBarWidthPct(spent: number, income: number): number {
  if (income <= 0) return 0;
  return Math.max(0, Math.min(100, (spent / income) * 100));
}

export function goalProgressPct(saved: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.max(0, Math.min(100, (saved / goal) * 100));
}

export function amountToGoal(saved: number, goal: number): number {
  return Math.max(0, goal - saved);
}

export function isGoalReached(saved: number, goal: number): boolean {
  return goal > 0 && saved >= goal;
}

export type SavingsTrend = {
  diff: number;
  direction: 'up' | 'down' | 'same';
};

export function savingsTrend(current: number, previous?: number): SavingsTrend | null {
  if (previous === undefined) return null;
  const diff = current - previous;
  if (diff === 0) return { diff: 0, direction: 'same' };
  return { diff: Math.abs(diff), direction: diff > 0 ? 'up' : 'down' };
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

```bash
cd client && npx jest --testPathPattern="savingsCalcs.test" --no-coverage
```

Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add client/utils/savingsCalcs.ts client/utils/__tests__/savingsCalcs.test.ts
git commit -m "feat: add pure savings calc utils (savings amount, rate, goal progress, trend)"
```

---

## Task 2: SavingsGoalContext — AsyncStorage-persisted goal

**Files:**
- Create: `client/contexts/SavingsGoalContext.tsx`
- Modify: `client/app/_layout.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: `export type SavingsGoalContextValue = { goal: number; setGoal: (goal: number) => Promise<void> }`; `export function SavingsGoalProvider({ children }: { children: ReactNode })`; `export function useSavingsGoal(): SavingsGoalContextValue` (throws if used outside provider)

- [ ] **Step 1: Create the context**

Create `client/contexts/SavingsGoalContext.tsx`:

```tsx
import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'SAVINGS_GOAL';

export type SavingsGoalContextValue = {
  goal: number;
  setGoal: (goal: number) => Promise<void>;
};

const SavingsGoalContext = createContext<SavingsGoalContextValue | undefined>(undefined);

async function loadGoal(): Promise<number> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = stored ? Number(stored) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

async function saveGoal(goal: number): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, String(goal));
  } catch {
    // silent — matches BudgetsContext convention
  }
}

export function SavingsGoalProvider({ children }: { children: ReactNode }) {
  const [goal, setGoalState] = useState<number>(0);

  useEffect(() => {
    loadGoal().then(setGoalState);
  }, []);

  const setGoal = async (next: number) => {
    setGoalState(next);
    await saveGoal(next);
  };

  return (
    <SavingsGoalContext.Provider value={{ goal, setGoal }}>
      {children}
    </SavingsGoalContext.Provider>
  );
}

export function useSavingsGoal(): SavingsGoalContextValue {
  const ctx = useContext(SavingsGoalContext);
  if (!ctx) throw new Error('useSavingsGoal must be used within SavingsGoalProvider');
  return ctx;
}
```

- [ ] **Step 2: Mount the provider in the root layout**

In `client/app/_layout.tsx`, add the import alongside the existing `BudgetsProvider` import (line 23):

```tsx
import { BudgetsProvider } from '@/contexts/BudgetsContext';
import { SavingsGoalProvider } from '@/contexts/SavingsGoalContext';
```

Wrap `<Stack>` with the new provider nested inside `<BudgetsProvider>` (replace lines 64-66):

```tsx
          <BudgetsProvider>
            <SavingsGoalProvider>
              <Stack screenOptions={{ headerShown: false }} />
            </SavingsGoalProvider>
          </BudgetsProvider>
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd client && npx tsc --noEmit 2>&1 | grep -i "SavingsGoalContext\|_layout"
```

Expected: no output (no errors)

- [ ] **Step 4: Commit**

```bash
git add client/contexts/SavingsGoalContext.tsx client/app/_layout.tsx
git commit -m "feat: add AsyncStorage-persisted SavingsGoalContext"
```

---

## Task 3: GoalRing component

**Files:**
- Create: `client/components/savings/GoalRing.tsx`

**Interfaces:**
- Consumes: nothing (pure presentational, mirrors `client/components/budgets/BudgetRing.tsx`'s SVG approach)
- Produces: `GoalRing` component with props `{ percent: number; size?: number; color?: string }` (defaults `size=88`, `color='#0FB46B'`), renders an 88×88 ring with stroke width 8 and the rounded percent in the center

- [ ] **Step 1: Create GoalRing**

Create `client/components/savings/GoalRing.tsx`:

```tsx
import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type GoalRingProps = {
  percent: number; // 0–100
  size?: number;
  color?: string;
};

const STROKE_WIDTH = 8;
const TRACK_COLOR = '#ECEBE6';

export default function GoalRing({ percent, size = 88, color = '#0FB46B' }: GoalRingProps) {
  const radius = (size - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const filled = (clamped / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={TRACK_COLOR} strokeWidth={STROKE_WIDTH} fill="none" />
        {clamped > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={`${filled} ${circumference - filled}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </Svg>
      <Text
        testID="goal-ring-percent"
        style={{ fontSize: 16, fontWeight: '800', color, fontFamily: 'PlusJakartaSans_800ExtraBold' }}
      >
        {Math.round(clamped)}%
      </Text>
    </View>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && npx tsc --noEmit 2>&1 | grep -i "GoalRing"
```

Expected: no output (no errors)

- [ ] **Step 3: Commit**

```bash
git add client/components/savings/GoalRing.tsx
git commit -m "feat: add GoalRing SVG progress ring for savings goal"
```

---

## Task 4: SavingsScreen + route + Home wiring

**Files:**
- Create: `client/screens/SavingsScreen.tsx`
- Create: `client/app/(logged-in)/savings.tsx`
- Modify: `client/screens/Dashboard.tsx`

**Interfaces:**
- Consumes: `selectMonthlyData` (`client/redux/store/selectors.ts`); `TrendBars` (`client/components/insights/TrendBars.tsx`); `useSavingsGoal` (Task 2); `GoalRing` (Task 3); `savingsAmount`, `savingsRate`, `expensesBarWidthPct`, `goalProgressPct`, `amountToGoal`, `isGoalReached`, `savingsTrend` (Task 1); `HeroCard`, `Card` (existing)
- Produces: `SavingsScreen` default export; route `/savings`; Dashboard's "Saved" card now navigates to `/savings`

- [ ] **Step 1: Create SavingsScreen**

Create `client/screens/SavingsScreen.tsx`:

```tsx
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
```

- [ ] **Step 2: Create the route**

Create `client/app/(logged-in)/savings.tsx`:

```tsx
import React from 'react';
import SavingsScreen from '@/screens/SavingsScreen';

export default function Savings() {
  return <SavingsScreen />;
}
```

- [ ] **Step 3: Wire the Home "Saved" stat card to navigate**

In `client/screens/Dashboard.tsx`, wrap the "Saved" `Card` (lines 134-144) in a `TouchableOpacity`, mirroring the existing avatar/See-all taps:

```tsx
          <TouchableOpacity className="flex-1" onPress={() => router.push('/savings')}>
            <Card radius={22} className="p-4">
              <IconTile backgroundColor="#EFEAFE">
                <PiggyBank size={18} color="#7C5CFC" />
              </IconTile>
              <Text className="text-tx-tertiary dark:text-tx-tertiary-dark text-xs font-semibold mt-3">
                Saved
              </Text>
              <Text className="text-tx-primary dark:text-tx-primary-dark text-lg font-extrabold">
                ₹{saved.toLocaleString('en-IN')}
              </Text>
            </Card>
          </TouchableOpacity>
```

(Replaces the bare `<Card radius={22} className="flex-1 p-4">...</Card>` for "Saved" — note `flex-1` moves to the `TouchableOpacity` and `Card` drops it.)

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd client && npx tsc --noEmit 2>&1 | grep -i "SavingsScreen\|savings.tsx\|Dashboard"
```

Expected: no output (no errors)

- [ ] **Step 5: Run the full test suite**

```bash
cd client && npx jest --no-coverage
```

Expected: all PASS

- [ ] **Step 6: Commit**

```bash
git add client/screens/SavingsScreen.tsx "client/app/(logged-in)/savings.tsx" client/screens/Dashboard.tsx
git commit -m "feat: build Savings screen with goal ring and wire Home's Saved card"
```

---

## Task 5: IncomeListScreen + route + Home wiring

**Files:**
- Create: `client/screens/IncomeListScreen.tsx`
- Create: `client/app/(logged-in)/income-list.tsx`
- Modify: `client/screens/Dashboard.tsx`

**Interfaces:**
- Consumes: `transactionSelector` (`client/redux/store/selectors.ts`); `getCategoryMeta` (`client/constants/categoryMeta.ts`); `TransactionRow`, `Card`, `EditTransactionSheet` (existing); `RawStoreTxn` (`client/utils/transactionMappings.ts`)
- Produces: `IncomeListScreen` default export; route `/income-list`; Dashboard's "Income" card now navigates to `/income-list`

- [ ] **Step 1: Create IncomeListScreen**

Create `client/screens/IncomeListScreen.tsx`:

```tsx
import React, { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';

import Card from '@/components/Card';
import TransactionRow from '@/components/TransactionRow';
import EditTransactionSheet from '@/components/sheets/EditTransactionSheet';
import { getCategoryMeta } from '@/constants/categoryMeta';
import { transactionSelector } from '@/redux/store/selectors';
import type { RawStoreTxn } from '@/utils/transactionMappings';

const GREEN = '#0FB46B';

export default function IncomeListScreen() {
  const router = useRouter();
  const { transactions } = useSelector(transactionSelector) as any;
  const [selectedTxn, setSelectedTxn] = useState<RawStoreTxn | null>(null);

  const incomeTxns: RawStoreTxn[] = (Array.isArray(transactions) ? transactions : [])
    .filter((txn: RawStoreTxn) => txn.transactionType === 'credit')
    .sort((a: RawStoreTxn, b: RawStoreTxn) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalIncome = incomeTxns.reduce((sum, txn) => sum + txn.amount, 0);

  return (
    <SafeAreaView className="flex-1 bg-bg-app dark:bg-bg-app-dark">
      <ScrollView contentContainerStyle={{ paddingTop: 54, paddingHorizontal: 18, paddingBottom: 26 }}>
        <View className="flex-row items-center justify-between mb-5">
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: GREEN }} className="font-bold text-base">← Home</Text>
          </Pressable>
          <Text className="text-tx-primary dark:text-tx-primary-dark font-extrabold text-base">Income</Text>
          <View style={{ width: 60 }} />
        </View>

        <Card radius={22} className="p-4 mb-5" style={{ backgroundColor: '#0FB46B' }}>
          <Text style={{ color: 'rgba(255,255,255,0.85)' }} className="text-xs font-semibold">
            Total income
          </Text>
          <Text style={{ color: '#FFFFFF' }} className="font-extrabold text-2xl mt-1">
            ₹{totalIncome.toLocaleString('en-IN')}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.85)' }} className="text-xs font-semibold mt-1">
            {incomeTxns.length} transaction{incomeTxns.length === 1 ? '' : 's'}
          </Text>
        </Card>

        {incomeTxns.length === 0 ? (
          <Text className="text-tx-tertiary dark:text-tx-tertiary-dark text-sm text-center mt-4">
            No income recorded yet
          </Text>
        ) : (
          incomeTxns.map((txn) => {
            const meta = getCategoryMeta(txn.category);
            return (
              <TouchableOpacity key={txn._id} onPress={() => setSelectedTxn(txn)}>
                <TransactionRow
                  name={txn.description || txn.category}
                  category={txn.category}
                  date={new Date(txn.date)}
                  amount={txn.amount}
                  type="income"
                  iconColor={meta.color}
                  icon={<meta.Icon size={20} color="#FFFFFF" />}
                />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
      <EditTransactionSheet txn={selectedTxn} onClose={() => setSelectedTxn(null)} />
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Create the route**

Create `client/app/(logged-in)/income-list.tsx`:

```tsx
import React from 'react';
import IncomeListScreen from '@/screens/IncomeListScreen';

export default function IncomeList() {
  return <IncomeListScreen />;
}
```

- [ ] **Step 3: Wire the Home "Income" stat card to navigate**

In `client/screens/Dashboard.tsx`, wrap the "Income" `Card` (lines 122-133) in a `TouchableOpacity`:

```tsx
          <TouchableOpacity className="flex-1" onPress={() => router.push('/income-list')}>
            <Card radius={22} className="p-4">
              <IconTile backgroundColor="#E6F6EC">
                <ArrowUpRight size={18} color="#16A34A" />
              </IconTile>
              <Text className="text-tx-tertiary dark:text-tx-tertiary-dark text-xs font-semibold mt-3">
                Income
              </Text>
              <Text className="text-tx-primary dark:text-tx-primary-dark text-lg font-extrabold">
                ₹{monthIncome.toLocaleString('en-IN')}
              </Text>
            </Card>
          </TouchableOpacity>
```

(Same `flex-1` move as the Saved card: it goes on the `TouchableOpacity`, dropped from `Card`'s className.)

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd client && npx tsc --noEmit 2>&1 | grep -i "IncomeListScreen\|income-list.tsx\|Dashboard"
```

Expected: no output (no errors)

- [ ] **Step 5: Run the full test suite**

```bash
cd client && npx jest --no-coverage
```

Expected: all PASS

- [ ] **Step 6: Commit**

```bash
git add client/screens/IncomeListScreen.tsx "client/app/(logged-in)/income-list.tsx" client/screens/Dashboard.tsx
git commit -m "feat: build Income list screen and wire Home's Income card"
```

---

## Manual Testing Checklist

After all tasks are complete, verify manually in the simulator:

- [ ] From Home, tapping the "Saved" stat card opens the Savings screen with no tab bar and no FAB visible
- [ ] From Home, tapping the "Income" stat card opens the Income list screen with no tab bar and no FAB visible
- [ ] Savings screen: hero amount matches `income − spent` for the current month; "X% of income" pill is correct; trend pill shows "↑/↓ ₹X vs <prevMonth>" and is absent if there's no previous month
- [ ] Savings screen: Income bar is full-width green; Expenses bar width matches `spent/income`; "Net saved" shows the correct sign and color
- [ ] Savings screen: 6-month trend bars are proportional, current month bar is green, others neutral
- [ ] Savings screen: tap "Edit goal" → enter a number → "Set" persists it; reload the app (or navigate away and back) and confirm the goal is still set
- [ ] Savings screen: entering 0 or a blank value and tapping "Set" does not change the goal (no-op)
- [ ] Savings screen: when saved ≥ goal, "Goal reached! 🎉" appears instead of "₹X to go"
- [ ] Savings screen: with zero income, the expenses bar and "% of income" pill show 0% rather than crashing or showing `NaN`/`Infinity`
- [ ] Income list screen: total income and transaction count match the sum/count of all `credit` transactions
- [ ] Income list screen: list is sorted newest-first and contains only income (credit) transactions
- [ ] Income list screen: tapping a row opens the Edit Transaction sheet pre-filled with that transaction's data; saving or deleting closes the sheet and updates the list
- [ ] Income list screen: empty state ("No income recorded yet") shows when there are no income transactions
- [ ] Dark mode: both screens' text, cards, and bars render correctly with the dark variants

## Out of scope

Server persistence of the savings goal / savings history (Phase 9). Profile-driven income figure (Phase 8 refines the income source). Replacing seeded prior-month data with full real history for the 6-month trend (shared with Phase 6's `selectMonthlyData`, addressed when Phase 9 lands).
