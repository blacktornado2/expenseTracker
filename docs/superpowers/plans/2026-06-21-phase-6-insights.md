# Phase 6: Insights Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Insights tab placeholder with a month-over-month spending analysis screen: pick a month (via pills or by tapping a trend bar), see total spent/income/saved with a trend line, a 6-bar spending-trend chart, and a sorted category breakdown.

**Architecture:** Pure functions (`insightsSeed.ts`, `insightsCalcs.ts`) compute the 6-month dataset, trend delta, and category breakdown — all TDD'd in isolation, no React involved. A new `selectMonthlyData` selector wires the live current month (reusing existing `monthSpentFromTransactions`/`monthIncomeFromTransactions`/`spendByCategoryFromTransactions`) together with 5 seeded prior months. Three new presentational components (`MonthPills`, `TrendBars`, `CategoryBreakdownList`) render the dataset; `InsightsScreen` owns the single `selectedIndex` state that keeps pills and bars in sync, and reuses `HeroCard` and `Card`.

**Tech Stack:** React Native + NativeWind 4, Redux (`useSelector`), `date-fns` (already a dependency), `expo-linear-gradient` (via `HeroCard`), lucide-react-native, jest-expo

## Global Constraints

- Keep existing NativeWind className patterns: `text-tx-primary dark:text-tx-primary-dark`, `bg-bg-app dark:bg-bg-app-dark`, `bg-close dark:bg-close-dark`, `text-tx-secondary dark:text-tx-secondary-dark`, `text-tx-tertiary dark:text-tx-tertiary-dark`
- Never install new packages — `date-fns` and `lucide-react-native` already exist
- Run tests from the `client/` directory: `cd client && npx jest --testPathPattern="<file>" --no-coverage`
- Screen padding convention: `paddingTop: 54, paddingHorizontal: 18, paddingBottom: 26` (see `BudgetsScreen.tsx:45`, `ActivityScreen.tsx:44`)
- Bricolage 30/800 heading: `style={{ fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 30 }}` with `className="text-tx-primary dark:text-tx-primary-dark"`
- Selected accent green: `#0FB46B`
- Raw Redux transaction shape: `{ _id: string, transactionType: 'credit'|'debit', amount: number, date: string, category: string, description?: string }`
- `Card` props: `{ children, radius?: number (default 24), className?: string, style?: ViewStyle }` (`client/components/Card.tsx`)
- `HeroCard` props: `{ label: string, subtitle: string, amount: number, progressPct?: number, footerLeft?: string, footerRight?: string }` (`client/components/HeroCard.tsx`) — do not modify; compose around it
- `getCategoryMeta(category: string)` returns `{ color: string, softBg: string, Icon: LucideIcon }` (`client/constants/categoryMeta.ts`), with a stable hash-based fallback for unknown categories
- Existing selectors in `client/redux/store/selectors.ts`: `monthSpentFromTransactions`, `monthIncomeFromTransactions`, `spendByCategoryFromTransactions` (each `(transactions, referenceDate = new Date()) => ...`, filtering via UTC year/month match), and `RawTransaction` type `{ transactionType: 'credit'|'debit', amount: number, date: string|Date, category: string, description?: string }`

---

## File Map

**Create:**
- `client/utils/insightsSeed.ts` — `MonthlyDatum` type + `getSeedMonths(referenceDate)` returning 5 hardcoded prior months
- `client/utils/__tests__/insightsSeed.test.ts`
- `client/utils/insightsCalcs.ts` — pure `trendDelta`, `categoryBreakdown`, `monthPillLabel`, `monthFullLabel`
- `client/utils/__tests__/insightsCalcs.test.ts`
- `client/components/insights/MonthPills.tsx`
- `client/components/insights/TrendBars.tsx`
- `client/components/insights/CategoryBreakdownList.tsx`
- `client/screens/InsightsScreen.tsx`

**Modify:**
- `client/redux/store/selectors.ts` — add `buildMonthlyData` + `selectMonthlyData`
- `client/redux/store/__tests__/selectors.test.ts` — add `selectMonthlyData`/`buildMonthlyData` tests
- `client/app/(logged-in)/(tabs)/insights.tsx` — swap placeholder for `InsightsScreen`

---

## Task 1: Seed data — 5 prior months (TDD)

**Files:**
- Create: `client/utils/insightsSeed.ts`
- Create: `client/utils/__tests__/insightsSeed.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `export type MonthlyDatum = { month: number; year: number; spent: number; income: number; cats: Record<string, number> }`; `export function getSeedMonths(referenceDate?: Date): MonthlyDatum[]` — returns 5 entries for the 5 calendar months immediately before `referenceDate`'s month, sorted oldest → newest

- [ ] **Step 1: Write the failing test**

Create `client/utils/__tests__/insightsSeed.test.ts`:

```ts
import { getSeedMonths } from '../insightsSeed';

describe('getSeedMonths', () => {
  const REFERENCE_DATE = new Date('2026-06-15T00:00:00.000Z');

  it('returns exactly 5 months', () => {
    expect(getSeedMonths(REFERENCE_DATE)).toHaveLength(5);
  });

  it('returns the 5 months immediately before the reference month, oldest first', () => {
    const result = getSeedMonths(REFERENCE_DATE);
    expect(result.map((m) => `${m.year}-${m.month}`)).toEqual([
      '2026-0', // Jan 2026
      '2026-1', // Feb 2026
      '2026-2', // Mar 2026
      '2026-3', // Apr 2026
      '2026-4', // May 2026
    ]);
  });

  it('each month has positive spent, income, and a non-empty cats map', () => {
    const result = getSeedMonths(REFERENCE_DATE);
    result.forEach((m) => {
      expect(m.spent).toBeGreaterThan(0);
      expect(m.income).toBeGreaterThan(0);
      expect(Object.keys(m.cats).length).toBeGreaterThan(0);
    });
  });

  it('rolls over the year boundary correctly', () => {
    const result = getSeedMonths(new Date('2026-02-10T00:00:00.000Z'));
    expect(result.map((m) => `${m.year}-${m.month}`)).toEqual([
      '2025-9',  // Oct 2025
      '2025-10', // Nov 2025
      '2025-11', // Dec 2025
      '2026-0',  // Jan 2026
      '2026-1',  // (unreachable — only 5 entries total, this is the 5th: Jan 2026 is index 3, so index 4 doesn't exist before Feb)
    ]);
  });

  it('defaults to the current date when no referenceDate is passed', () => {
    expect(() => getSeedMonths()).not.toThrow();
    expect(getSeedMonths()).toHaveLength(5);
  });
});
```

- [ ] **Step 2: Fix the year-boundary test before running it**

The 4th test above has a deliberately wrong 5th entry (there are only 4 months between Oct 2025 and Jan 2026 inclusive before Feb 2026). Replace that test with the correct 5 months before February 2026 (Sep 2025 through Jan 2026):

```ts
  it('rolls over the year boundary correctly', () => {
    const result = getSeedMonths(new Date('2026-02-10T00:00:00.000Z'));
    expect(result.map((m) => `${m.year}-${m.month}`)).toEqual([
      '2025-8',  // Sep 2025
      '2025-9',  // Oct 2025
      '2025-10', // Nov 2025
      '2025-11', // Dec 2025
      '2026-0',  // Jan 2026
    ]);
  });
```

- [ ] **Step 3: Run the test to confirm it fails**

```bash
cd client && npx jest --testPathPattern="insightsSeed.test" --no-coverage
```

Expected: FAIL — cannot find module `../insightsSeed`

- [ ] **Step 4: Implement getSeedMonths**

Create `client/utils/insightsSeed.ts`:

```ts
import { subMonths } from 'date-fns';

export type MonthlyDatum = {
  month: number;
  year: number;
  spent: number;
  income: number;
  cats: Record<string, number>;
};

type SeedTemplate = {
  offsetMonths: number;
  spent: number;
  income: number;
  cats: Record<string, number>;
};

const SEED_TEMPLATES: SeedTemplate[] = [
  { offsetMonths: 5, spent: 18200, income: 42000, cats: { groceries: 6200, dining: 3400, transport: 2600, shopping: 4000, bills: 2000 } },
  { offsetMonths: 4, spent: 21500, income: 42000, cats: { groceries: 7000, dining: 4200, transport: 2300, shopping: 5500, bills: 2500 } },
  { offsetMonths: 3, spent: 19800, income: 42000, cats: { groceries: 6500, dining: 3100, transport: 2900, shopping: 4800, bills: 2500 } },
  { offsetMonths: 2, spent: 23400, income: 45000, cats: { groceries: 7200, dining: 5000, transport: 3100, shopping: 5600, bills: 2500 } },
  { offsetMonths: 1, spent: 17600, income: 42000, cats: { groceries: 5800, dining: 2900, transport: 2400, shopping: 4000, bills: 2500 } },
];

export function getSeedMonths(referenceDate: Date = new Date()): MonthlyDatum[] {
  return SEED_TEMPLATES.map((template) => {
    const d = subMonths(referenceDate, template.offsetMonths);
    return {
      month: d.getUTCMonth(),
      year: d.getUTCFullYear(),
      spent: template.spent,
      income: template.income,
      cats: template.cats,
    };
  }).sort((a, b) => (a.year - b.year) || (a.month - b.month));
}
```

- [ ] **Step 5: Run the test to confirm it passes**

```bash
cd client && npx jest --testPathPattern="insightsSeed.test" --no-coverage
```

Expected: all PASS

- [ ] **Step 6: Commit**

```bash
git add client/utils/insightsSeed.ts client/utils/__tests__/insightsSeed.test.ts
git commit -m "feat: add Insights seed data for prior months"
```

---

## Task 2: Pure calc utils — trend delta, category breakdown, month labels (TDD)

**Files:**
- Create: `client/utils/insightsCalcs.ts`
- Create: `client/utils/__tests__/insightsCalcs.test.ts`

**Interfaces:**
- Consumes: `MonthlyDatum` type (Task 1)
- Produces: `export type TrendDelta = { diff: number; direction: 'up' | 'down' | 'same' }`; `export function trendDelta(selected: MonthlyDatum, previous?: MonthlyDatum): TrendDelta | null`; `export type CategoryBreakdownRow = { label: string; value: number; pct: number }`; `export function categoryBreakdown(cats: Record<string, number>): CategoryBreakdownRow[]` (sorted highest → lowest, `pct` is 0–100, `0` total returns `[]`); `export function monthPillLabel(month: number, year: number): string` (e.g. `"Mar '26"`); `export function monthFullLabel(month: number, year: number): string` (e.g. `"March 2026"`)

- [ ] **Step 1: Write the failing tests**

Create `client/utils/__tests__/insightsCalcs.test.ts`:

```ts
import { trendDelta, categoryBreakdown, monthPillLabel, monthFullLabel } from '../insightsCalcs';
import type { MonthlyDatum } from '../insightsSeed';

const month = (overrides: Partial<MonthlyDatum>): MonthlyDatum => ({
  month: 5,
  year: 2026,
  spent: 0,
  income: 0,
  cats: {},
  ...overrides,
});

describe('trendDelta', () => {
  it('returns null when there is no previous month', () => {
    expect(trendDelta(month({ spent: 1000 }), undefined)).toBeNull();
  });

  it('returns direction "up" with the absolute diff when spend increased', () => {
    expect(trendDelta(month({ spent: 1500 }), month({ spent: 1000 }))).toEqual({ diff: 500, direction: 'up' });
  });

  it('returns direction "down" with the absolute diff when spend decreased', () => {
    expect(trendDelta(month({ spent: 800 }), month({ spent: 1000 }))).toEqual({ diff: 200, direction: 'down' });
  });

  it('returns direction "same" with diff 0 when spend is unchanged', () => {
    expect(trendDelta(month({ spent: 1000 }), month({ spent: 1000 }))).toEqual({ diff: 0, direction: 'same' });
  });
});

describe('categoryBreakdown', () => {
  it('sorts categories highest to lowest by value', () => {
    const result = categoryBreakdown({ groceries: 200, dining: 500, transport: 100 });
    expect(result.map((r) => r.label)).toEqual(['dining', 'groceries', 'transport']);
  });

  it('computes percentage of total for each row', () => {
    const result = categoryBreakdown({ groceries: 300, dining: 100 });
    expect(result).toEqual([
      { label: 'groceries', value: 300, pct: 75 },
      { label: 'dining', value: 100, pct: 25 },
    ]);
  });

  it('returns an empty array for an empty cats map', () => {
    expect(categoryBreakdown({})).toEqual([]);
  });

  it('returns 0 pct for every row when total is 0', () => {
    expect(categoryBreakdown({ groceries: 0 })).toEqual([{ label: 'groceries', value: 0, pct: 0 }]);
  });
});

describe('monthPillLabel', () => {
  it('formats as abbreviated month + 2-digit year', () => {
    expect(monthPillLabel(2, 2026)).toBe("Mar '26");
  });

  it('formats December correctly', () => {
    expect(monthPillLabel(11, 2025)).toBe("Dec '25");
  });
});

describe('monthFullLabel', () => {
  it('formats as full month name + 4-digit year', () => {
    expect(monthFullLabel(2, 2026)).toBe('March 2026');
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

```bash
cd client && npx jest --testPathPattern="insightsCalcs.test" --no-coverage
```

Expected: FAIL — cannot find module `../insightsCalcs`

- [ ] **Step 3: Implement insightsCalcs**

Create `client/utils/insightsCalcs.ts`:

```ts
import { format } from 'date-fns';
import type { MonthlyDatum } from './insightsSeed';

export type TrendDelta = {
  diff: number;
  direction: 'up' | 'down' | 'same';
};

export function trendDelta(selected: MonthlyDatum, previous?: MonthlyDatum): TrendDelta | null {
  if (!previous) return null;
  const diff = selected.spent - previous.spent;
  if (diff === 0) return { diff: 0, direction: 'same' };
  return { diff: Math.abs(diff), direction: diff > 0 ? 'up' : 'down' };
}

export type CategoryBreakdownRow = {
  label: string;
  value: number;
  pct: number;
};

export function categoryBreakdown(cats: Record<string, number>): CategoryBreakdownRow[] {
  const total = Object.values(cats).reduce((sum, v) => sum + v, 0);
  return Object.entries(cats)
    .map(([label, value]) => ({ label, value, pct: total > 0 ? (value / total) * 100 : 0 }))
    .sort((a, b) => b.value - a.value);
}

export function monthPillLabel(month: number, year: number): string {
  return format(new Date(year, month, 1), "MMM ''yy");
}

export function monthFullLabel(month: number, year: number): string {
  return format(new Date(year, month, 1), 'MMMM yyyy');
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

```bash
cd client && npx jest --testPathPattern="insightsCalcs.test" --no-coverage
```

Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add client/utils/insightsCalcs.ts client/utils/__tests__/insightsCalcs.test.ts
git commit -m "feat: add Insights pure calc utils (trend delta, category breakdown, month labels)"
```

---

## Task 3: selectMonthlyData selector (TDD)

**Files:**
- Modify: `client/redux/store/selectors.ts`
- Modify: `client/redux/store/__tests__/selectors.test.ts`

**Interfaces:**
- Consumes: `getSeedMonths`, `MonthlyDatum` (Task 1); existing `monthSpentFromTransactions`, `monthIncomeFromTransactions`, `spendByCategoryFromTransactions`, `RawTransaction`, `StoreRootState`, `transactionSelector` (already in this file)
- Produces: `export function buildMonthlyData(transactions: RawTransaction[], referenceDate?: Date): MonthlyDatum[]` — 5 seed months + 1 live current month, oldest → newest (6 entries total); `export const selectMonthlyData: (state: StoreRootState) => MonthlyDatum[]`

- [ ] **Step 1: Write the failing test**

Append to `client/redux/store/__tests__/selectors.test.ts` (add this import alongside the existing one at the top, and the new `describe` block at the bottom):

```ts
import {
  monthSpentFromTransactions,
  monthIncomeFromTransactions,
  spendByCategoryFromTransactions,
  buildMonthlyData,
} from '../selectors';
```

```ts
describe('buildMonthlyData', () => {
  it('returns 6 months: 5 seeded + 1 live current month, oldest to newest', () => {
    const result = buildMonthlyData(fixtureTransactions as any, REFERENCE_DATE);
    expect(result).toHaveLength(6);
    expect(result[5]).toEqual({ month: 5, year: 2026, spent: 650, income: 5000, cats: { Groceries: 500, Transport: 150 } });
  });

  it('the live current month reflects an empty transactions array as 0s', () => {
    const result = buildMonthlyData([], REFERENCE_DATE);
    expect(result[5]).toEqual({ month: 5, year: 2026, spent: 0, income: 0, cats: {} });
  });

  it('seed months come before the current month in chronological order', () => {
    const result = buildMonthlyData(fixtureTransactions as any, REFERENCE_DATE);
    for (let i = 1; i < result.length; i++) {
      const prev = result[i - 1];
      const curr = result[i];
      expect(curr.year > prev.year || (curr.year === prev.year && curr.month > prev.month)).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
cd client && npx jest --testPathPattern="selectors.test" --no-coverage
```

Expected: FAIL — `buildMonthlyData` is not exported

- [ ] **Step 3: Implement buildMonthlyData and selectMonthlyData**

In `client/redux/store/selectors.ts`, add the import at the top:

```ts
import { getSeedMonths, type MonthlyDatum } from '@/utils/insightsSeed';
```

Append at the end of the file:

```ts
export function buildMonthlyData(transactions: RawTransaction[], referenceDate: Date = new Date()): MonthlyDatum[] {
  const seed = getSeedMonths(referenceDate);
  const catsArr = spendByCategoryFromTransactions(transactions, referenceDate);
  const cats: Record<string, number> = {};
  catsArr.forEach((c) => { cats[c.label] = c.value; });

  const current: MonthlyDatum = {
    month: referenceDate.getUTCMonth(),
    year: referenceDate.getUTCFullYear(),
    spent: monthSpentFromTransactions(transactions, referenceDate),
    income: monthIncomeFromTransactions(transactions, referenceDate),
    cats,
  };

  return [...seed, current];
}

export const selectMonthlyData = (state: StoreRootState): MonthlyDatum[] =>
  buildMonthlyData(((transactionSelector(state) as any).transactions ?? []) as RawTransaction[]);
```

- [ ] **Step 4: Run the test to confirm it passes**

```bash
cd client && npx jest --testPathPattern="selectors.test" --no-coverage
```

Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add client/redux/store/selectors.ts client/redux/store/__tests__/selectors.test.ts
git commit -m "feat: add selectMonthlyData selector combining seed + live current month"
```

---

## Task 4: MonthPills component

**Files:**
- Create: `client/components/insights/MonthPills.tsx`

**Interfaces:**
- Consumes: `monthPillLabel` (Task 2)
- Produces: `MonthPills` component with props `{ months: { month: number; year: number }[]; selectedIndex: number; onSelect: (index: number) => void }`. Horizontal scroll of pills; active pill filled green `#0FB46B` with white text, inactive uses `bg-close`/`tx-secondary`.

- [ ] **Step 1: Create MonthPills**

Create `client/components/insights/MonthPills.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && npx tsc --noEmit 2>&1 | grep -i "MonthPills"
```

Expected: no output (no errors)

- [ ] **Step 3: Commit**

```bash
git add client/components/insights/MonthPills.tsx
git commit -m "feat: add MonthPills component for Insights month selection"
```

---

## Task 5: TrendBars component

**Files:**
- Create: `client/components/insights/TrendBars.tsx`

**Interfaces:**
- Consumes: nothing from prior tasks beyond types
- Produces: `TrendBars` component with props `{ data: { spent: number }[]; selectedIndex: number; onSelect: (index: number) => void; maxBarHeight?: number }` (default `maxBarHeight = 74`). Renders one bar per entry; bar height proportional to `spent` relative to the max in `data`; selected bar green `#0FB46B`, others `bg-close`; tapping a bar calls `onSelect(index)`.

- [ ] **Step 1: Create TrendBars**

Create `client/components/insights/TrendBars.tsx`:

```tsx
import React from 'react';
import { Pressable, View } from 'react-native';

type TrendBarsProps = {
  data: { spent: number }[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  maxBarHeight?: number;
};

export default function TrendBars({ data, selectedIndex, onSelect, maxBarHeight = 74 }: TrendBarsProps) {
  const maxSpent = Math.max(1, ...data.map((d) => d.spent));

  return (
    <View className="flex-row items-end justify-between" style={{ height: maxBarHeight }}>
      {data.map((d, index) => {
        const active = index === selectedIndex;
        const height = Math.max(4, (d.spent / maxSpent) * maxBarHeight);
        return (
          <Pressable
            key={index}
            testID={`trend-bar-${index}`}
            onPress={() => onSelect(index)}
            style={{ flex: 1, alignItems: 'center' }}
          >
            <View
              className={active ? '' : 'bg-close dark:bg-close-dark'}
              style={{
                width: 18,
                height,
                borderRadius: 6,
                backgroundColor: active ? '#0FB46B' : undefined,
              }}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && npx tsc --noEmit 2>&1 | grep -i "TrendBars"
```

Expected: no output (no errors)

- [ ] **Step 3: Commit**

```bash
git add client/components/insights/TrendBars.tsx
git commit -m "feat: add TrendBars tappable 6-bar spending chart"
```

---

## Task 6: CategoryBreakdownList component

**Files:**
- Create: `client/components/insights/CategoryBreakdownList.tsx`

**Interfaces:**
- Consumes: `categoryBreakdown` (Task 2); `getCategoryMeta` (existing, `client/constants/categoryMeta.ts`)
- Produces: `CategoryBreakdownList` component with props `{ cats: Record<string, number> }`. Renders sorted rows (icon tile, name + amount, progress bar, "X% of total"); renders "No expenses recorded" when `cats` totals to 0 entries.

- [ ] **Step 1: Create CategoryBreakdownList**

Create `client/components/insights/CategoryBreakdownList.tsx`:

```tsx
import React from 'react';
import { Text, View } from 'react-native';
import { categoryBreakdown } from '@/utils/insightsCalcs';
import { getCategoryMeta } from '@/constants/categoryMeta';

type CategoryBreakdownListProps = {
  cats: Record<string, number>;
};

export default function CategoryBreakdownList({ cats }: CategoryBreakdownListProps) {
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
                  backgroundColor: '#ECEBE6',
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && npx tsc --noEmit 2>&1 | grep -i "CategoryBreakdownList"
```

Expected: no output (no errors)

- [ ] **Step 3: Commit**

```bash
git add client/components/insights/CategoryBreakdownList.tsx
git commit -m "feat: add CategoryBreakdownList sorted category rows with progress bars"
```

---

## Task 7: InsightsScreen — wire it all together

**Files:**
- Create: `client/screens/InsightsScreen.tsx`
- Modify: `client/app/(logged-in)/(tabs)/insights.tsx`

**Interfaces:**
- Consumes: `selectMonthlyData` (Task 3); `trendDelta`, `monthFullLabel` (Task 2); `MonthPills` (Task 4); `TrendBars` (Task 5); `CategoryBreakdownList` (Task 6); `HeroCard`, `Card` (existing)
- Produces: `InsightsScreen` default export — full screen with title, month pills, summary HeroCard + trend line, spending-trend card, category breakdown card. Pills and trend bars share one `selectedIndex` state.

- [ ] **Step 1: Create InsightsScreen**

Create `client/screens/InsightsScreen.tsx`:

```tsx
import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
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
  const previous = selectedIndex > 0 ? monthlyData[selectedIndex - 1] : undefined;
  const delta = trendDelta(selected, previous);
  const saved = Math.max(0, selected.income - selected.spent);

  return (
    <ScrollView
      className="flex-1 bg-bg-app dark:bg-bg-app-dark"
      contentContainerStyle={{ paddingTop: 54, paddingHorizontal: 18, paddingBottom: 26 }}
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

      <HeroCard
        label={monthFullLabel(selected.month, selected.year)}
        subtitle="Total spent"
        amount={selected.spent}
        footerLeft={`Income ₹${selected.income.toLocaleString('en-IN')}`}
        footerRight={`Saved ₹${saved.toLocaleString('en-IN')}`}
      />

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
        <CategoryBreakdownList cats={selected.cats} />
      </Card>
    </ScrollView>
  );
}
```

- [ ] **Step 2: Replace the placeholder tab entry point**

Replace the full content of `client/app/(logged-in)/(tabs)/insights.tsx`:

```tsx
import React from 'react';
import InsightsScreen from '@/screens/InsightsScreen';

export default function Insights() {
  return <InsightsScreen />;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd client && npx tsc --noEmit 2>&1 | grep -i "InsightsScreen\|insights.tsx"
```

Expected: no output (no errors)

- [ ] **Step 4: Run the full test suite**

```bash
cd client && npx jest --no-coverage
```

Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add client/screens/InsightsScreen.tsx "client/app/(logged-in)/(tabs)/insights.tsx"
git commit -m "feat: build Insights screen with month picker, trend, and category breakdown"
```

---

## Manual Testing Checklist

After all tasks are complete, verify manually in the simulator:

- [ ] Insights tab opens to the current month selected by default (last pill, last bar highlighted)
- [ ] Month pills scroll horizontally and show "Mon 'YY" labels for all 6 months
- [ ] Tapping a month pill updates the summary card, trend line, trend bars, and category breakdown together
- [ ] Tapping a trend bar updates the month pills and summary card together (stays in sync both directions)
- [ ] Summary card shows correct total spent, income, and saved for the selected month
- [ ] Trend line shows "↑ ₹X more than [prevMonth]" when spend increased vs. the previous month
- [ ] Trend line shows "↓ ₹X less than [prevMonth]" when spend decreased
- [ ] No trend line appears when the oldest seeded month is selected (no previous month exists)
- [ ] Spending-trend chart's 6 bars are proportional to each month's spend; selected bar is green, others are neutral
- [ ] "Where it went" card lists categories sorted highest → lowest with correct percentages summing close to 100%
- [ ] Selecting the current month with zero real transactions shows the "No expenses recorded" empty state
- [ ] Dark mode: pills, bars, and breakdown rows all use the dark variants correctly
- [ ] Adding a new transaction (via Add Transaction) and revisiting Insights reflects it in the live current month

## Out of scope

Tap-a-category drill-down to its month-by-month trend (deferred per spec). Replacing seeded prior-month data with full real history (Phase 9 backend persistence will make this natural once enough real transactions exist — at that point `getSeedMonths` can be deleted and `buildMonthlyData` can source all 6 months from real transactions).
