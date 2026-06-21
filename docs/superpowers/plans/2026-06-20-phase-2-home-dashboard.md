# Phase 2: Home Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy Home tab dashboard with the redesigned screen: greeting header + avatar, gradient balance hero card, Income/Saved stat cards, a bar/pie "Where it goes" spend breakdown card, and a Recent transactions list — all driven by real transaction data in Redux, using Phase 1's tokens/fonts/primitives.

**Architecture:** New presentational, store-agnostic components (`HeroCard`, `SpendBreakdownCard`, `StackedBar`, `Donut`, `SegmentedToggle`) live in `client/components/`. A new `client/constants/categoryMeta.ts` maps arbitrary category strings to a color/icon (deterministic fallback for unknown categories, since the real category taxonomy isn't locked until Phase 3). Derived data (month spend/income/category breakdown) is computed in new pure selectors added to `client/redux/store/selectors.ts`, unit-tested with fixture data. `client/screens/Dashboard.tsx` is rewritten to wire it all together; `client/app/(logged-in)/(tabs)/index.tsx` needs a one-line cleanup since `Dashboard` now owns its own safe-area/scroll/padding.

**Tech Stack:** React Native + Expo Router, NativeWind (Tailwind) v4 with `dark:` variants, redux + redux-saga, `react-native-svg` (donut), `expo-linear-gradient` (hero), `lucide-react-native` (icons), `date-fns`, Jest + `react-test-renderer` (`jest-expo` preset).

## Global Constraints

- Tokens, not literals: every color/spacing/radius in screens comes from the Tailwind tokens in `client/tailwind.config.js` via `className` + `dark:` variants. Raw hex is only acceptable where NativeWind classNames cannot reach (SVG `stroke`/`fill` props, `LinearGradient` `colors`, decorative absolute-positioned circles) — mirror the existing pattern in `client/components/Fab.tsx` and `client/components/Avatar.tsx`.
- Fonts: Bricolage Grotesque for the big hero amount; Plus Jakarta Sans (default) elsewhere. There is no Tailwind `fontFamily` config yet, so apply Bricolage via inline `style={{ fontFamily: 'BricolageGrotesque_800ExtraBold' }}` (the font is already loaded in `client/app/_layout.tsx`).
- Manual dark mode via `useTheme()` from `client/contexts/ThemeContext.tsx` (`isDark`), already used by `Card.tsx`. Don't add OS-driven dark mode.
- Icons: `lucide-react-native` only. No emoji.
- Currency: `Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })` for list amounts (see `TransactionRow.tsx`); the hero's big number is rounded (no decimals) per design.
- `credit ↔ income`, `debit ↔ expense` mapping happens once, at the selector layer (`client/redux/store/selectors.ts`) — never re-derive this mapping inside components.
- Derived data (spend, income, category breakdown, savings) is computed, never stored in Redux state or AsyncStorage.
- New presentational primitives (`HeroCard`, `SpendBreakdownCard`, `StackedBar`, `Donut`, `SegmentedToggle`) take plain props — no `useSelector`/`useDispatch` inside them. Only `Dashboard.tsx` touches Redux.
- No backend changes in this phase (roadmap: Phase 2 touches backend = No).

---

## File Structure

| File | Responsibility |
|---|---|
| `client/constants/categoryMeta.ts` | `getCategoryMeta(category)` — maps a raw category string to `{ color, softBg, Icon }`, with a stable hashed fallback for unknown strings (legacy seed data uses categories like `"rent"`, `"fuel"` that don't match the design vocabulary yet). |
| `client/constants/shadows.ts` | Modify: add `SHADOW_HERO` (the green-tinted hero shadow), reused by Insights/Savings in later phases. |
| `client/redux/store/selectors.ts` | Modify: add pure, independently-testable functions (`monthSpentFromTransactions`, etc.) plus thin store-level wrappers (`selectMonthSpent`, etc.) that compose them with `transactionSelector`. |
| `client/components/SegmentedToggle.tsx` | Generic 2-option segmented control (also reused by Phase 3's expense/income toggle). |
| `client/components/HeroCard.tsx` | Reusable gradient hero card (title label, subtitle, big amount, optional progress bar, optional footer row). Reused by Insights/Savings later. |
| `client/components/charts/StackedBar.tsx` | Pure presentational horizontal stacked bar, takes `{ label, value, color }[]`. |
| `client/components/charts/Donut.tsx` | Pure presentational SVG donut, takes `{ label, value, color }[]`. |
| `client/components/SpendBreakdownCard.tsx` | "Where it goes" card: bar/pie toggle + legend, composes `StackedBar`/`Donut`/`SegmentedToggle`. |
| `client/screens/Dashboard.tsx` | Rewritten: header, `HeroCard`, stat cards, `SpendBreakdownCard`, Recent list. Wires Redux selectors in. |
| `client/app/(logged-in)/(tabs)/index.tsx` | Modify: drop the legacy wrapper `View` styling now that `Dashboard` owns its own background/padding. |

Tests live next to each unit, following the existing `client/components/__tests__/Card.test.tsx` convention.

---

## Task 1: Category metadata helper

**Files:**
- Create: `client/constants/categoryMeta.ts`
- Test: `client/constants/__tests__/categoryMeta.test.ts`

**Interfaces:**
- Produces: `getCategoryMeta(category: string): { color: string; softBg: string; Icon: LucideIcon }` — used by Task 3 (`SpendBreakdownCard` legend colors) and Task 7 (`Dashboard`'s Recent list icon tiles).

- [ ] **Step 1: Write the failing tests**

```typescript
// client/constants/__tests__/categoryMeta.test.ts
import { getCategoryMeta, CATEGORY_META } from '../categoryMeta';

describe('getCategoryMeta', () => {
  it('returns the known meta for a design-vocabulary category, case-insensitively', () => {
    expect(getCategoryMeta('Groceries')).toBe(CATEGORY_META.groceries);
    expect(getCategoryMeta('groceries')).toBe(CATEGORY_META.groceries);
  });

  it('trims whitespace before matching', () => {
    expect(getCategoryMeta('  Bills  ')).toBe(CATEGORY_META.bills);
  });

  it('returns a stable fallback for an unknown category', () => {
    const first = getCategoryMeta('fuel');
    const second = getCategoryMeta('fuel');
    expect(first).toEqual(second);
    expect(first.color).toBeDefined();
    expect(first.softBg).toBeDefined();
    expect(first.Icon).toBeDefined();
  });

  it('returns different fallbacks for different unknown categories when possible', () => {
    const fuel = getCategoryMeta('fuel');
    const loan = getCategoryMeta('loan');
    // Not guaranteed distinct for every pair, but these two specific strings
    // hash to different buckets in the 4-color fallback palette.
    expect(fuel).not.toBe(loan);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd client && npx jest constants/__tests__/categoryMeta.test.ts`
Expected: FAIL with "Cannot find module '../categoryMeta'"

- [ ] **Step 3: Write the implementation**

```typescript
// client/constants/categoryMeta.ts
import {
  ShoppingCart,
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  Film,
  HeartPulse,
  GraduationCap,
  Plane,
  Dumbbell,
  ArrowUpRight,
  Tag,
  type LucideIcon,
} from 'lucide-react-native';

export type CategoryMeta = {
  color: string;
  softBg: string;
  Icon: LucideIcon;
};

export const CATEGORY_META: Record<string, CategoryMeta> = {
  groceries: { color: '#2FB872', softBg: '#E6F6EE', Icon: ShoppingCart },
  dining: { color: '#FF6B5E', softBg: '#FFEDEA', Icon: Utensils },
  transport: { color: '#2BB3FF', softBg: '#E6F4FF', Icon: Car },
  shopping: { color: '#7C5CFC', softBg: '#EFEAFE', Icon: ShoppingBag },
  bills: { color: '#F5A623', softBg: '#FEF2DE', Icon: Receipt },
  entertainment: { color: '#FF5CA8', softBg: '#FFEAF3', Icon: Film },
  health: { color: '#18BFA8', softBg: '#E3F8F4', Icon: HeartPulse },
  income: { color: '#16A34A', softBg: '#E6F6EC', Icon: ArrowUpRight },
  education: { color: '#3B82F6', softBg: '#EFF6FF', Icon: GraduationCap },
  travel: { color: '#06B6D4', softBg: '#ECFEFF', Icon: Plane },
  fitness: { color: '#10B981', softBg: '#ECFDF5', Icon: Dumbbell },
};

const FALLBACK_PALETTE: CategoryMeta[] = [
  { color: '#9AA096', softBg: '#ECEBE6', Icon: Tag },
  { color: '#7C5CFC', softBg: '#EFEAFE', Icon: Tag },
  { color: '#F5A623', softBg: '#FEF2DE', Icon: Tag },
  { color: '#2BB3FF', softBg: '#E6F4FF', Icon: Tag },
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getCategoryMeta(category: string): CategoryMeta {
  const key = category.trim().toLowerCase();
  const known = CATEGORY_META[key];
  if (known) {
    return known;
  }
  const index = hashString(key) % FALLBACK_PALETTE.length;
  return FALLBACK_PALETTE[index];
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd client && npx jest constants/__tests__/categoryMeta.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
cd /Users/ankit/Desktop/Practice/Coding/expenseTracker
git add client/constants/categoryMeta.ts client/constants/__tests__/categoryMeta.test.ts
git commit -m "feat: add category metadata helper for Home dashboard charts"
```

---

## Task 2: Hero shadow token

**Files:**
- Modify: `client/constants/shadows.ts`

**Interfaces:**
- Produces: `SHADOW_HERO: ViewStyle` — used by Task 5 (`HeroCard.tsx`).

- [ ] **Step 1: Add the new export**

Read the current file first, then add `SHADOW_HERO` alongside the existing exports:

```typescript
// client/constants/shadows.ts
import { ViewStyle } from 'react-native';

export const SHADOW_CARD: ViewStyle = {
  shadowColor: '#16201A',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.05,
  shadowRadius: 22,
  elevation: 4,
};

export const SHADOW_TX: ViewStyle = {
  shadowColor: '#16201A',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.04,
  shadowRadius: 18,
  elevation: 3,
};

export const SHADOW_HERO: ViewStyle = {
  shadowColor: '#0FB46B',
  shadowOffset: { width: 0, height: 18 },
  shadowOpacity: 0.32,
  shadowRadius: 38,
  elevation: 10,
};
```

This is a pure additive change (no test needed — it's a literal constant matching the design spec's `0 18px 38px rgba(15,180,107,.32)`, verified visually in Task 5/9's manual QA).

- [ ] **Step 2: Commit**

```bash
cd /Users/ankit/Desktop/Practice/Coding/expenseTracker
git add client/constants/shadows.ts
git commit -m "feat: add hero card shadow token"
```

---

## Task 3: Derived transaction selectors

**Files:**
- Modify: `client/redux/store/selectors.ts`
- Test: `client/redux/store/__tests__/selectors.test.ts`

**Interfaces:**
- Consumes: `transactionSelector(state) => { transactions: RawTransaction[] }` (already exists in this file). Raw transactions from the API have shape `{ _id, transactionType: 'credit' | 'debit', amount: number, date: string, category: string, description?: string }` (server model: `server/models/transaction.model.js`).
- Produces (used by Task 7, `Dashboard.tsx`):
  - `monthSpentFromTransactions(transactions: RawTransaction[], referenceDate?: Date): number`
  - `monthIncomeFromTransactions(transactions: RawTransaction[], referenceDate?: Date): number`
  - `spendByCategoryFromTransactions(transactions: RawTransaction[], referenceDate?: Date): { label: string; value: number }[]`
  - `selectMonthSpent(state: StoreRootState): number`
  - `selectMonthIncome(state: StoreRootState): number`
  - `selectSpendByCategory(state: StoreRootState): { label: string; value: number }[]`

- [ ] **Step 1: Write the failing tests**

```typescript
// client/redux/store/__tests__/selectors.test.ts
import {
  monthSpentFromTransactions,
  monthIncomeFromTransactions,
  spendByCategoryFromTransactions,
} from '../selectors';

const REFERENCE_DATE = new Date('2026-06-15T00:00:00.000Z');

const fixtureTransactions = [
  { transactionType: 'debit', amount: 200, category: 'Groceries', date: '2026-06-01T00:00:00.000Z' },
  { transactionType: 'debit', amount: 300, category: 'Groceries', date: '2026-06-10T00:00:00.000Z' },
  { transactionType: 'debit', amount: 150, category: 'Transport', date: '2026-06-12T00:00:00.000Z' },
  { transactionType: 'credit', amount: 5000, category: 'Salary', date: '2026-06-01T00:00:00.000Z' },
  // Different month — must be excluded from every selector below.
  { transactionType: 'debit', amount: 999, category: 'Groceries', date: '2026-05-20T00:00:00.000Z' },
];

describe('monthSpentFromTransactions', () => {
  it('sums debit amounts within the reference month only', () => {
    expect(monthSpentFromTransactions(fixtureTransactions as any, REFERENCE_DATE)).toBe(650);
  });

  it('returns 0 for an empty list', () => {
    expect(monthSpentFromTransactions([], REFERENCE_DATE)).toBe(0);
  });
});

describe('monthIncomeFromTransactions', () => {
  it('sums credit amounts within the reference month only', () => {
    expect(monthIncomeFromTransactions(fixtureTransactions as any, REFERENCE_DATE)).toBe(5000);
  });

  it('returns 0 for an empty list', () => {
    expect(monthIncomeFromTransactions([], REFERENCE_DATE)).toBe(0);
  });
});

describe('spendByCategoryFromTransactions', () => {
  it('groups debit amounts by category within the reference month', () => {
    const result = spendByCategoryFromTransactions(fixtureTransactions as any, REFERENCE_DATE);
    expect(result).toEqual(
      expect.arrayContaining([
        { label: 'Groceries', value: 500 },
        { label: 'Transport', value: 150 },
      ])
    );
    expect(result).toHaveLength(2);
  });

  it('returns an empty array when there is no spend in the month', () => {
    expect(spendByCategoryFromTransactions([], REFERENCE_DATE)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd client && npx jest redux/store/__tests__/selectors.test.ts`
Expected: FAIL with "monthSpentFromTransactions is not a function" (or similar export errors)

- [ ] **Step 3: Write the implementation**

Read the current `client/redux/store/selectors.ts` first (it currently only has `userSelector`/`transactionSelector`), then append:

```typescript
// client/redux/store/selectors.ts — append below the existing exports
type RawTransaction = {
  transactionType: 'credit' | 'debit';
  amount: number;
  date: string | Date;
  category: string;
  description?: string;
};

function isSameMonth(date: string | Date, reference: Date): boolean {
  const d = new Date(date);
  return d.getUTCFullYear() === reference.getUTCFullYear() && d.getUTCMonth() === reference.getUTCMonth();
}

export function monthSpentFromTransactions(
  transactions: RawTransaction[],
  referenceDate: Date = new Date()
): number {
  return transactions
    .filter((txn) => txn.transactionType === 'debit' && isSameMonth(txn.date, referenceDate))
    .reduce((sum, txn) => sum + txn.amount, 0);
}

export function monthIncomeFromTransactions(
  transactions: RawTransaction[],
  referenceDate: Date = new Date()
): number {
  return transactions
    .filter((txn) => txn.transactionType === 'credit' && isSameMonth(txn.date, referenceDate))
    .reduce((sum, txn) => sum + txn.amount, 0);
}

export function spendByCategoryFromTransactions(
  transactions: RawTransaction[],
  referenceDate: Date = new Date()
): { label: string; value: number }[] {
  const totals = new Map<string, number>();
  transactions
    .filter((txn) => txn.transactionType === 'debit' && isSameMonth(txn.date, referenceDate))
    .forEach((txn) => {
      totals.set(txn.category, (totals.get(txn.category) ?? 0) + txn.amount);
    });
  return Array.from(totals.entries()).map(([label, value]) => ({ label, value }));
}

export const selectMonthSpent = (state: StoreRootState): number =>
  monthSpentFromTransactions((transactionSelector(state).transactions ?? []) as RawTransaction[]);

export const selectMonthIncome = (state: StoreRootState): number =>
  monthIncomeFromTransactions((transactionSelector(state).transactions ?? []) as RawTransaction[]);

export const selectSpendByCategory = (state: StoreRootState): { label: string; value: number }[] =>
  spendByCategoryFromTransactions((transactionSelector(state).transactions ?? []) as RawTransaction[]);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd client && npx jest redux/store/__tests__/selectors.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
cd /Users/ankit/Desktop/Practice/Coding/expenseTracker
git add client/redux/store/selectors.ts client/redux/store/__tests__/selectors.test.ts
git commit -m "feat: add derived month-spend/income/category selectors"
```

---

## Task 4: SegmentedToggle component

**Files:**
- Create: `client/components/SegmentedToggle.tsx`
- Test: `client/components/__tests__/SegmentedToggle.test.tsx`

**Interfaces:**
- Produces: `SegmentedToggle<T extends string>({ options: [Option<T>, Option<T>], value: T, onChange: (value: T) => void })` where `Option<T> = { value: T; label: string }`. Used by Task 6 (`SpendBreakdownCard`).

- [ ] **Step 1: Write the failing test**

```typescript
// client/components/__tests__/SegmentedToggle.test.tsx
import React from 'react';
import { Text } from 'react-native';
import { create, act } from 'react-test-renderer';
import SegmentedToggle from '../SegmentedToggle';

describe('SegmentedToggle', () => {
  const options = [
    { value: 'bar', label: 'Bar' },
    { value: 'pie', label: 'Pie' },
  ] as const;

  it('renders both option labels', () => {
    const tree = create(<SegmentedToggle options={options} value="bar" onChange={jest.fn()} />).root;
    const texts = tree.findAllByType(Text).map((node) => node.props.children);
    expect(texts).toEqual(expect.arrayContaining(['Bar', 'Pie']));
  });

  it('calls onChange with the tapped option value', () => {
    const onChange = jest.fn();
    const tree = create(<SegmentedToggle options={options} value="bar" onChange={onChange} />).root;
    const pieText = tree.findAllByType(Text).find((node) => node.props.children === 'Pie')!;
    act(() => {
      pieText.parent!.props.onPress();
    });
    expect(onChange).toHaveBeenCalledWith('pie');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx jest components/__tests__/SegmentedToggle.test.tsx`
Expected: FAIL with "Cannot find module '../SegmentedToggle'"

- [ ] **Step 3: Write the implementation**

```tsx
// client/components/SegmentedToggle.tsx
import React from 'react';
import { Pressable, Text, View } from 'react-native';

type Option<T extends string> = {
  value: T;
  label: string;
};

type SegmentedToggleProps<T extends string> = {
  options: readonly [Option<T>, Option<T>];
  value: T;
  onChange: (value: T) => void;
};

export default function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
}: SegmentedToggleProps<T>) {
  return (
    <View className="flex-row bg-bg-close dark:bg-bg-close-dark rounded-full p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable key={option.value} onPress={() => onChange(option.value)}>
            <View className={`px-3 py-1.5 rounded-full ${active ? 'bg-brand-green' : ''}`}>
              <Text
                className={
                  active
                    ? 'text-white font-bold text-xs'
                    : 'text-tx-secondary dark:text-tx-secondary-dark font-bold text-xs'
                }
              >
                {option.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx jest components/__tests__/SegmentedToggle.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
cd /Users/ankit/Desktop/Practice/Coding/expenseTracker
git add client/components/SegmentedToggle.tsx client/components/__tests__/SegmentedToggle.test.tsx
git commit -m "feat: add reusable SegmentedToggle component"
```

---

## Task 5: Chart primitives (StackedBar + Donut)

**Files:**
- Create: `client/components/charts/StackedBar.tsx`
- Create: `client/components/charts/Donut.tsx`
- Test: `client/components/charts/__tests__/StackedBar.test.tsx`
- Test: `client/components/charts/__tests__/Donut.test.tsx`

**Interfaces:**
- Produces: `StackedBar({ data: { label: string; value: number; color: string }[]; height?: number })` and `Donut({ data: { label: string; value: number; color: string }[]; size?: number; strokeWidth?: number })`. Both used by Task 6 (`SpendBreakdownCard`).

- [ ] **Step 1: Write the failing tests**

```tsx
// client/components/charts/__tests__/StackedBar.test.tsx
import React from 'react';
import { View } from 'react-native';
import { create } from 'react-test-renderer';
import StackedBar from '../StackedBar';

describe('StackedBar', () => {
  it('sizes each segment proportionally to its value', () => {
    const data = [
      { label: 'A', value: 30, color: '#111111' },
      { label: 'B', value: 70, color: '#222222' },
    ];
    const tree = create(<StackedBar data={data} />).root;
    const segments = tree.findAllByType(View).filter((node) => node.props.style?.backgroundColor);
    expect(segments).toHaveLength(2);
    expect(segments[0].props.style.flex).toBeCloseTo(0.3);
    expect(segments[1].props.style.flex).toBeCloseTo(0.7);
  });

  it('renders an empty track when total value is 0', () => {
    const tree = create(<StackedBar data={[{ label: 'A', value: 0, color: '#111111' }]} />).root;
    const segments = tree.findAllByType(View).filter((node) => node.props.style?.backgroundColor);
    expect(segments).toHaveLength(0);
  });
});
```

```tsx
// client/components/charts/__tests__/Donut.test.tsx
import React from 'react';
import { Circle } from 'react-native-svg';
import { create } from 'react-test-renderer';
import Donut from '../Donut';

describe('Donut', () => {
  it('renders one stroke circle per non-background segment, plus the track', () => {
    const data = [
      { label: 'A', value: 1, color: '#111111' },
      { label: 'B', value: 1, color: '#222222' },
    ];
    const tree = create(<Donut data={data} />).root;
    const circles = tree.findAllByType(Circle);
    // 1 background track + 1 per data segment
    expect(circles).toHaveLength(3);
  });

  it('renders only the background track when total value is 0', () => {
    const tree = create(<Donut data={[{ label: 'A', value: 0, color: '#111111' }]} />).root;
    const circles = tree.findAllByType(Circle);
    expect(circles).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd client && npx jest components/charts/__tests__`
Expected: FAIL with "Cannot find module '../StackedBar'" / "Cannot find module '../Donut'"

- [ ] **Step 3: Write the implementations**

```tsx
// client/components/charts/StackedBar.tsx
import React from 'react';
import { View } from 'react-native';

export type ChartSegment = {
  label: string;
  value: number;
  color: string;
};

type StackedBarProps = {
  data: ChartSegment[];
  height?: number;
};

export default function StackedBar({ data, height = 14 }: StackedBarProps) {
  const total = data.reduce((sum, segment) => sum + segment.value, 0);

  if (total <= 0) {
    return (
      <View
        className="bg-bg-subtle dark:bg-bg-subtle-dark"
        style={{ height, borderRadius: height / 2 }}
      />
    );
  }

  return (
    <View className="flex-row overflow-hidden" style={{ height, borderRadius: height / 2 }}>
      {data
        .filter((segment) => segment.value > 0)
        .map((segment) => (
          <View key={segment.label} style={{ flex: segment.value / total, backgroundColor: segment.color }} />
        ))}
    </View>
  );
}
```

```tsx
// client/components/charts/Donut.tsx
import React from 'react';
import Svg, { Circle } from 'react-native-svg';
import type { ChartSegment } from './StackedBar';

type DonutProps = {
  data: ChartSegment[];
  size?: number;
  strokeWidth?: number;
};

export default function Donut({ data, size = 140, strokeWidth = 22 }: DonutProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, segment) => sum + segment.value, 0);
  let cumulativeBefore = 0;

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#ECEBE6"
        strokeWidth={strokeWidth}
        fill="none"
      />
      {total > 0 &&
        data
          .filter((segment) => segment.value > 0)
          .map((segment) => {
            const length = (segment.value / total) * circumference;
            const offset = circumference - cumulativeBefore;
            cumulativeBefore += length;
            return (
              <Circle
                key={segment.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={offset}
                strokeLinecap="butt"
                fill="none"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            );
          })}
    </Svg>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd client && npx jest components/charts/__tests__`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
cd /Users/ankit/Desktop/Practice/Coding/expenseTracker
git add client/components/charts/StackedBar.tsx client/components/charts/Donut.tsx client/components/charts/__tests__
git commit -m "feat: add StackedBar and Donut chart primitives"
```

---

## Task 6: SpendBreakdownCard

**Files:**
- Create: `client/components/SpendBreakdownCard.tsx`
- Test: `client/components/__tests__/SpendBreakdownCard.test.tsx`

**Interfaces:**
- Consumes: `Card` (`client/components/Card.tsx`), `SegmentedToggle` (Task 4), `StackedBar`/`Donut`/`ChartSegment` (Task 5).
- Produces: `SpendBreakdownCard({ data: ChartSegment[] })`. Used by Task 7 (`Dashboard.tsx`), fed with `selectSpendByCategory` results mapped to colors via `getCategoryMeta` (Task 1).

- [ ] **Step 1: Write the failing tests**

```tsx
// client/components/__tests__/SpendBreakdownCard.test.tsx
import React from 'react';
import { Text } from 'react-native';
import { create, act } from 'react-test-renderer';
import { Circle } from 'react-native-svg';
import SpendBreakdownCard from '../SpendBreakdownCard';

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(() => ({ isDark: false, toggleDark: jest.fn() })),
}));

describe('SpendBreakdownCard', () => {
  const data = [
    { label: 'Groceries', value: 500, color: '#2FB872' },
    { label: 'Transport', value: 150, color: '#2BB3FF' },
  ];

  it('renders the legend with every category label', () => {
    const tree = create(<SpendBreakdownCard data={data} />).root;
    const texts = tree.findAllByType(Text).map((node) => node.props.children);
    expect(texts).toEqual(expect.arrayContaining(['Groceries', 'Transport']));
  });

  it('defaults to bar mode and switches to pie mode on toggle', () => {
    const tree = create(<SpendBreakdownCard data={data} />).root;
    expect(tree.findAllByType(Circle)).toHaveLength(0);

    const pieLabel = tree.findAllByType(Text).find((node) => node.props.children === 'Pie')!;
    act(() => {
      pieLabel.parent!.parent!.props.onPress();
    });

    expect(tree.findAllByType(Circle).length).toBeGreaterThan(0);
  });

  it('shows an empty state when there is no spend', () => {
    const tree = create(<SpendBreakdownCard data={[]} />).root;
    const texts = tree.findAllByType(Text).map((node) => node.props.children);
    expect(texts).toContain('No spending yet');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd client && npx jest components/__tests__/SpendBreakdownCard.test.tsx`
Expected: FAIL with "Cannot find module '../SpendBreakdownCard'"

- [ ] **Step 3: Write the implementation**

```tsx
// client/components/SpendBreakdownCard.tsx
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd client && npx jest components/__tests__/SpendBreakdownCard.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
cd /Users/ankit/Desktop/Practice/Coding/expenseTracker
git add client/components/SpendBreakdownCard.tsx client/components/__tests__/SpendBreakdownCard.test.tsx
git commit -m "feat: add SpendBreakdownCard with bar/pie toggle"
```

---

## Task 7: HeroCard

**Files:**
- Create: `client/components/HeroCard.tsx`
- Test: `client/components/__tests__/HeroCard.test.tsx`

**Interfaces:**
- Consumes: `SHADOW_HERO` (Task 2).
- Produces: `HeroCard({ label: string; subtitle: string; amount: number; progressPct?: number; footerLeft?: string; footerRight?: string })`. Used by Task 9 (`Dashboard.tsx`); generic enough for Insights/Savings reuse later (per spec).

- [ ] **Step 1: Write the failing test**

```tsx
// client/components/__tests__/HeroCard.test.tsx
import React from 'react';
import { Text, View } from 'react-native';
import { create } from 'react-test-renderer';
import HeroCard from '../HeroCard';

describe('HeroCard', () => {
  it('renders the label, subtitle, and rounded amount', () => {
    const tree = create(
      <HeroCard label="Ankit" subtitle="Spent this month" amount={1234.6} progressPct={40} />
    ).root;
    const texts = tree.findAllByType(Text).map((node) => node.props.children);
    expect(texts).toEqual(
      expect.arrayContaining([
        'ANKIT',
        'Spent this month',
        expect.stringContaining('1,235'),
      ])
    );
  });

  it('clamps the progress bar fill width to 100%', () => {
    const tree = create(<HeroCard label="Ankit" subtitle="Spent" amount={100} progressPct={150} />).root;
    const fill = tree.findAllByType(View).find((node) => node.props.testID === 'hero-progress-fill')!;
    expect(fill.props.style.width).toBe('100%');
  });

  it('renders footer text when provided', () => {
    const tree = create(
      <HeroCard
        label="Ankit"
        subtitle="Spent"
        amount={100}
        progressPct={10}
        footerLeft="₹900 left"
        footerRight="of ₹1,000"
      />
    ).root;
    const texts = tree.findAllByType(Text).map((node) => node.props.children);
    expect(texts).toEqual(expect.arrayContaining(['₹900 left', 'of ₹1,000']));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx jest components/__tests__/HeroCard.test.tsx`
Expected: FAIL with "Cannot find module '../HeroCard'"

- [ ] **Step 3: Write the implementation**

```tsx
// client/components/HeroCard.tsx
import React from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SHADOW_HERO } from '@/constants/shadows';

type HeroCardProps = {
  label: string;
  subtitle: string;
  amount: number;
  progressPct?: number;
  footerLeft?: string;
  footerRight?: string;
};

export default function HeroCard({ label, subtitle, amount, progressPct, footerLeft, footerRight }: HeroCardProps) {
  const clampedPct = progressPct === undefined ? undefined : Math.max(0, Math.min(100, progressPct));
  const roundedAmount = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(amount));

  return (
    <LinearGradient
      colors={['#13C076', '#0A9E5E']}
      style={[{ borderRadius: 30, padding: 24, overflow: 'hidden' }, SHADOW_HERO]}
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: 'rgba(255,255,255,0.08)',
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: -40,
          right: 20,
          width: 90,
          height: 90,
          borderRadius: 45,
          backgroundColor: 'rgba(255,255,255,0.08)',
        }}
      />

      <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13, letterSpacing: 1 }}>
        {label.toUpperCase()}
      </Text>
      <Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '600', fontSize: 14, marginTop: 4 }}>
        {subtitle}
      </Text>
      <Text
        style={{
          color: '#FFFFFF',
          fontFamily: 'BricolageGrotesque_800ExtraBold',
          fontSize: 44,
          marginTop: 8,
        }}
      >
        ₹{roundedAmount}
      </Text>

      {clampedPct !== undefined && (
        <View
          style={{
            height: 8,
            borderRadius: 4,
            backgroundColor: 'rgba(255,255,255,0.28)',
            marginTop: 18,
            overflow: 'hidden',
          }}
        >
          <View
            testID="hero-progress-fill"
            style={{ height: 8, borderRadius: 4, backgroundColor: '#FFFFFF', width: `${clampedPct}%` }}
          />
        </View>
      )}

      {(footerLeft || footerRight) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>{footerLeft}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '600', fontSize: 13 }}>{footerRight}</Text>
        </View>
      )}
    </LinearGradient>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx jest components/__tests__/HeroCard.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
cd /Users/ankit/Desktop/Practice/Coding/expenseTracker
git add client/components/HeroCard.tsx client/components/__tests__/HeroCard.test.tsx
git commit -m "feat: add reusable gradient HeroCard component"
```

---

## Task 8: Rewrite the Dashboard screen

**Files:**
- Modify: `client/screens/Dashboard.tsx` (full rewrite of the component body; keep the file)
- Modify: `client/app/(logged-in)/(tabs)/index.tsx`

**Interfaces:**
- Consumes everything from Tasks 1–7: `getCategoryMeta` (Task 1), `selectMonthSpent`/`selectMonthIncome`/`selectSpendByCategory` (Task 3), `SpendBreakdownCard` (Task 6), `HeroCard` (Task 7), plus existing Phase 1 primitives `Card`, `IconTile`, `Avatar`, `TransactionRow` and `transactionSelector`/`userSelector` (`client/redux/store/selectors.ts`), `useTheme` (`client/contexts/ThemeContext.tsx`).
- No new exports — this is the leaf screen for Phase 2's Home tab.

This task has no isolated unit test: per the existing convention in this codebase (only pure presentational/logic units have `__tests__`, not full Redux+router screens — see `Card.test.tsx`, `ThemeContext.test.ts`), this screen is verified by the **manual QA in Task 9**. The selectors and chart/card components it composes are already covered by Tasks 1–7's tests.

- [ ] **Step 1: Read the current files**

Read `client/screens/Dashboard.tsx` and `client/app/(logged-in)/(tabs)/index.tsx` in full before editing (both were inspected during planning; re-read to get exact current line content for the edit tool).

- [ ] **Step 2: Rewrite `client/screens/Dashboard.tsx`**

```tsx
// client/screens/Dashboard.tsx
import React, { useCallback } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { Moon, Sun, Sunset, ArrowUpRight, PiggyBank } from 'lucide-react-native';

import Card from '@/components/Card';
import IconTile from '@/components/IconTile';
import Avatar from '@/components/Avatar';
import TransactionRow from '@/components/TransactionRow';
import HeroCard from '@/components/HeroCard';
import SpendBreakdownCard from '@/components/SpendBreakdownCard';
import { getCategoryMeta } from '@/constants/categoryMeta';
import { getAllTransactions } from '@/redux/actions/transaction.actions';
import {
  transactionSelector,
  userSelector,
  selectMonthSpent,
  selectMonthIncome,
  selectSpendByCategory,
} from '@/redux/store/selectors';

const DEFAULT_MONTHLY_BUDGET = 50000;

type Greeting = {
  text: string;
  Icon: typeof Sun;
  color: string;
  pillBg: string;
};

function getGreeting(hour: number): Greeting {
  if (hour >= 5 && hour < 12) {
    return { text: 'Good morning', Icon: Sun, color: '#F59E0B', pillBg: '#FFFBEB' };
  }
  if (hour >= 12 && hour < 17) {
    return { text: 'Good afternoon', Icon: Sun, color: '#F97316', pillBg: '#FFF7ED' };
  }
  if (hour >= 17 && hour < 21) {
    return { text: 'Good evening', Icon: Sunset, color: '#E8703A', pillBg: '#FFF1E6' };
  }
  return { text: 'Good night', Icon: Moon, color: '#7C5CFC', pillBg: '#EFEAFE' };
}

export default function Dashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { transactions } = useSelector(transactionSelector);
  const { user } = useSelector(userSelector);
  const monthSpent = useSelector(selectMonthSpent);
  const monthIncome = useSelector(selectMonthIncome);
  const spendByCategory = useSelector(selectSpendByCategory);

  useFocusEffect(
    useCallback(() => {
      dispatch(getAllTransactions());
    }, [dispatch])
  );

  const now = new Date();
  const greeting = getGreeting(now.getHours());
  const monthLabel = format(now, 'MMMM');
  const saved = monthIncome - monthSpent;
  const budgetLeft = Math.max(0, DEFAULT_MONTHLY_BUDGET - monthSpent);
  const spentPct = DEFAULT_MONTHLY_BUDGET > 0 ? (monthSpent / DEFAULT_MONTHLY_BUDGET) * 100 : 0;

  const chartData = spendByCategory.map((entry) => ({
    label: entry.label,
    value: entry.value,
    color: getCategoryMeta(entry.label).color,
  }));

  const recentTransactions = Array.isArray(transactions)
    ? [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)
    : [];

  return (
    <SafeAreaView className="flex-1 bg-bg-app dark:bg-bg-app-dark">
      <ScrollView contentContainerStyle={{ paddingTop: 54, paddingHorizontal: 18, paddingBottom: 26 }}>
        <View className="flex-row items-center justify-between mb-5">
          <View className="flex-row items-center" style={{ gap: 10 }}>
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 9,
                backgroundColor: greeting.pillBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <greeting.Icon size={15} color={greeting.color} />
            </View>
            <View>
              <Text className="text-tx-tertiary dark:text-tx-tertiary-dark text-xs font-semibold">
                {greeting.text}
              </Text>
              <Text className="text-tx-primary dark:text-tx-primary-dark text-base font-extrabold">
                {monthLabel} overview
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push('/profile')}>
            <Avatar initial={user?.firstName?.[0] ?? 'A'} />
          </TouchableOpacity>
        </View>

        <HeroCard
          label={user?.firstName ?? 'You'}
          subtitle="Spent this month"
          amount={monthSpent}
          progressPct={spentPct}
          footerLeft={`₹${budgetLeft.toLocaleString('en-IN')} left`}
          footerRight={`of ₹${DEFAULT_MONTHLY_BUDGET.toLocaleString('en-IN')}`}
        />

        <View className="flex-row mt-4" style={{ gap: 12 }}>
          <Card radius={22} className="flex-1 p-4">
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
          <Card radius={22} className="flex-1 p-4">
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
        </View>

        <SpendBreakdownCard data={chartData} />

        <View className="flex-row items-center justify-between mt-6 mb-3">
          <Text className="text-tx-primary dark:text-tx-primary-dark text-base font-extrabold">Recent</Text>
          <TouchableOpacity onPress={() => router.push('/transactions')}>
            <Text style={{ color: '#0FB46B' }} className="font-bold text-sm">
              See all
            </Text>
          </TouchableOpacity>
        </View>

        {recentTransactions.length === 0 ? (
          <Text className="text-tx-tertiary dark:text-tx-tertiary-dark text-sm text-center mt-4">
            No transactions yet
          </Text>
        ) : (
          recentTransactions.map((txn: any) => {
            const meta = getCategoryMeta(txn.category);
            const type = txn.transactionType === 'credit' ? 'income' : 'expense';
            return (
              <TouchableOpacity
                key={txn._id ?? txn.id}
                onPress={() =>
                  router.push({ pathname: '/transactionDetail', params: { txn: JSON.stringify(txn) } })
                }
              >
                <TransactionRow
                  name={txn.description || txn.category}
                  category={txn.category}
                  date={new Date(txn.date)}
                  amount={txn.amount}
                  type={type}
                  iconColor={meta.color}
                  icon={<meta.Icon size={20} color="#FFFFFF" />}
                />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 3: Update `client/app/(logged-in)/(tabs)/index.tsx`**

```tsx
// client/app/(logged-in)/(tabs)/index.tsx
import React from 'react';

import Dashboard from '@/screens/Dashboard';

export default function HomeScreen() {
  return <Dashboard />;
}
```

(`Dashboard` now owns its own `SafeAreaView` background/padding, so the wrapping `View` with `pt-10 bg-gray-50` is removed.)

- [ ] **Step 4: Typecheck**

Run: `cd client && npx tsc --noEmit`
Expected: no new errors introduced by `Dashboard.tsx` or `index.tsx` (pre-existing unrelated errors, if any, are out of scope).

- [ ] **Step 5: Run the full test suite**

Run: `cd client && npx jest`
Expected: PASS — all Task 1–7 tests plus pre-existing tests (`Card.test.tsx`, `ThemeContext.test.ts`) still green.

- [ ] **Step 6: Commit**

```bash
cd /Users/ankit/Desktop/Practice/Coding/expenseTracker
git add client/screens/Dashboard.tsx "client/app/(logged-in)/(tabs)/index.tsx"
git commit -m "feat: rebuild Home dashboard with hero card, stat cards, and spend breakdown"
```

---

## Task 9: Manual QA pass

No files change in this task — it's verification only, matching the spec's "Testing" section.

- [ ] **Step 1: Start the app**

Run: `cd client && npx expo start` (or the project's existing run script), open on a simulator/device, log in.

- [ ] **Step 2: Seed data and verify the hero/stat cards**

Create a few transactions via the existing Add Transaction flow (or seed directly via the API) — at least one income (`credit`) and several expenses (`debit`) across at least two categories, all dated in the current month. Confirm:
- Hero card shows `₹{monthSpent}` rounded, with a progress bar reflecting `spent / 50000`, and "₹X left / of ₹50,000" footer.
- Income stat card shows the sum of this month's credits.
- Saved stat card shows `income − spent` (can be negative if spend exceeds income — confirm it doesn't crash, just shows a negative number).

- [ ] **Step 3: Verify the chart card**

Confirm "Where it goes" defaults to bar mode showing proportional segments colored per `getCategoryMeta`, the legend lists every category with a matching dot color, and tapping "Pie" swaps to the SVG donut with the same proportions. With zero transactions (fresh account), confirm it shows "No spending yet" without crashing.

- [ ] **Step 4: Verify Recent + navigation**

Confirm "Recent" lists the 5 most recent transactions (newest first), tapping a row navigates to the transaction detail screen without crashing, "See all" navigates to the Activity tab, and tapping the avatar navigates to the Profile drill-down route.

- [ ] **Step 5: Verify the greeting and dark mode**

Confirm the greeting pill/text/colors match the device's current hour bucket (morning/afternoon/evening/night) and the month label matches the current month. Toggle dark mode (via the temporary debug toggle from `c50fb2b`) and confirm all `dark:` variants render correctly — note any visual rough edges as expected (Phase 10 does the dedicated dark-mode polish pass; this is just a no-crash/no-unreadable-text check).

- [ ] **Step 6: Report results**

Summarize pass/fail for each of Steps 2–5 to the user before considering Phase 2 complete. Do not claim success without having actually run the app and observed each behavior.

---

## Self-Review Notes

- **Spec coverage:** header/greeting (Task 8), hero card (Tasks 2, 7, 8), stat cards (Task 8), chart card with bar/pie toggle + legend (Tasks 4–6, 8), Recent list (Task 8), derived selectors (Task 3), category metadata (Task 1), empty-state handling (Tasks 6, 8), manual + unit testing (spec's Testing section → Tasks 1, 3, 4, 5, 6, 7 unit tests + Task 9 manual QA). All covered.
- **Out of scope respected:** no Income-list/Savings real routes, no real budget figure from profile (uses `DEFAULT_MONTHLY_BUDGET` placeholder per spec), no dark-mode fine-tuning beyond using existing `dark:` tokens.
- **Type consistency check:** `ChartSegment` type defined once in `StackedBar.tsx`, imported by `Donut.tsx` and `SpendBreakdownCard.tsx` — no duplicate/divergent shape. Selector names (`selectMonthSpent`, `selectMonthIncome`, `selectSpendByCategory`) match between Task 3's production code and Task 8's `Dashboard.tsx` imports. `getCategoryMeta` signature consistent between Task 1 and its Task 8 call sites (`meta.color`, `meta.Icon`).
