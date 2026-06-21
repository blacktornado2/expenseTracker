# Phase 3: Add Transaction Flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Phase-1 `addTransactionNew.tsx` placeholder with the real redesigned Add Transaction screen: numpad-driven amount entry, expense/income toggle, validated name/date, a category chip grid with custom-category create/delete, and a wired create-transaction Redux/saga path that lands the user on Activity.

**Architecture:** Pure logic (amount-string editing, custom-category persistence) lives in testable helper modules under `client/utils/`. Presentational pieces (`Numpad`, `CategoryChips`, `CategoryEditor`, `ColorPicker`, `IconPicker`) are store-agnostic components under `client/components/`, following the Phase-1/2 pattern (`Card`, `SegmentedToggle`) of plain props + NativeWind tokens + `react-test-renderer` tests. The screen (`client/screens/AddTransactionNew.tsx`) wires Redux (`useDispatch`/`useSelector`, mirroring `Login.tsx`/`Dashboard.tsx`) and AsyncStorage-backed custom categories together. A new `CREATE_TRANSACTION_*` action/saga/reducer trio is added alongside the existing `GET_TRANSACTIONS_*` trio, following its exact shape.

**Tech Stack:** React Native + Expo Router, NativeWind (Tailwind tokens from `client/tailwind.config.js`), `react-redux` + `redux-saga`, `lucide-react-native` icons, `@react-native-async-storage/async-storage`, Jest (`jest-expo` preset) + `react-test-renderer`.

## Global Constraints

- No raw hex literals in screen-level JSX where a Tailwind token exists; new one-off constants (palette swatches, icon registry) are the exception and belong in `client/constants/`.
- Expense red = `#E8322A` (token `brand-red`), income green = `#0FB46B` (token `brand-green`). Reuse `SegmentedToggle` for the expense/income toggle.
- Currency display uses `Intl.NumberFormat('en-IN')`-style formatting (existing app convention), 2 decimals.
- Server `transactionType` enum is `"credit" | "debit"`; the screen's `entryType` is `"income" | "expense"`. Map `income → credit`, `expense → debit` only at the Redux action-creation edge — never rename the server enum.
- Custom categories are local-first: AsyncStorage only, no server calls, no new Mongo model (that's Phase 9).
- Follow existing test conventions exactly: `react-test-renderer` (`create`, `act`), no `@testing-library/react-native`, no `redux-saga-test-plan` — saga tests step the generator manually with `.next()` / `.throw()`.
- Every new component file gets a co-located `__tests__` file, matching `client/components/__tests__/SegmentedToggle.test.tsx` and `client/components/__tests__/Card.test.tsx`.

---

## Task 1: Amount input helper (`amountInput.ts`)

**Files:**
- Create: `client/utils/amountInput.ts`
- Test: `client/utils/__tests__/amountInput.test.ts`

**Interfaces:**
- Produces: `NumpadKeyValue` (type), `applyNumpadKey(current: string, key: NumpadKeyValue): string`, `parseAmount(value: string): number` — consumed by Task 2 (`Numpad`) and Task 13 (screen).

- [ ] **Step 1: Write the failing test**

```ts
// client/utils/__tests__/amountInput.test.ts
import { applyNumpadKey, parseAmount } from '../amountInput';

describe('applyNumpadKey', () => {
  it('appends a digit to an empty string', () => {
    expect(applyNumpadKey('', '5')).toBe('5');
  });

  it('appends a digit to a non-empty string', () => {
    expect(applyNumpadKey('5', '3')).toBe('53');
  });

  it('replaces a leading zero instead of prefixing it', () => {
    expect(applyNumpadKey('0', '5')).toBe('5');
  });

  it('appends a decimal point once', () => {
    expect(applyNumpadKey('5', '.')).toBe('5.');
  });

  it('ignores a second decimal point', () => {
    expect(applyNumpadKey('5.2', '.')).toBe('5.2');
  });

  it('starts a leading decimal from an empty string as 0.', () => {
    expect(applyNumpadKey('', '.')).toBe('0.');
  });

  it('allows up to two decimal digits', () => {
    expect(applyNumpadKey('5.2', '5')).toBe('5.25');
  });

  it('caps at two decimal digits and ignores further digits', () => {
    expect(applyNumpadKey('5.25', '5')).toBe('5.25');
  });

  it('removes the last character on backspace', () => {
    expect(applyNumpadKey('53', 'backspace')).toBe('5');
  });

  it('backspace on an empty string stays empty', () => {
    expect(applyNumpadKey('', 'backspace')).toBe('');
  });
});

describe('parseAmount', () => {
  it('parses a plain numeric string', () => {
    expect(parseAmount('5.25')).toBe(5.25);
  });

  it('returns 0 for an empty string', () => {
    expect(parseAmount('')).toBe(0);
  });

  it('returns 0 for a trailing-decimal string', () => {
    expect(parseAmount('5.')).toBe(5);
  });

  it('returns 0 for a non-numeric string', () => {
    expect(parseAmount('.')).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx jest utils/__tests__/amountInput.test.ts`
Expected: FAIL — `Cannot find module '../amountInput'`

- [ ] **Step 3: Write minimal implementation**

```ts
// client/utils/amountInput.ts
export type NumpadKeyValue =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | '.'
  | 'backspace';

export function applyNumpadKey(current: string, key: NumpadKeyValue): string {
  if (key === 'backspace') {
    return current.slice(0, -1);
  }

  if (key === '.') {
    if (current.includes('.')) {
      return current;
    }
    return current === '' ? '0.' : `${current}.`;
  }

  if (current.includes('.')) {
    const decimals = current.split('.')[1];
    if (decimals.length >= 2) {
      return current;
    }
  }

  if (current === '0') {
    return key;
  }

  return `${current}${key}`;
}

export function parseAmount(value: string): number {
  if (!value || value === '.') {
    return 0;
  }
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx jest utils/__tests__/amountInput.test.ts`
Expected: PASS (14 tests)

- [ ] **Step 5: Commit**

```bash
git add client/utils/amountInput.ts client/utils/__tests__/amountInput.test.ts
git commit -m "feat: add amountInput helper for numpad amount editing"
```

---

## Task 2: `NumpadKey` + `Numpad` components

**Files:**
- Create: `client/components/numpad/NumpadKey.tsx`
- Create: `client/components/numpad/Numpad.tsx`
- Test: `client/components/numpad/__tests__/Numpad.test.tsx`

**Interfaces:**
- Consumes: `NumpadKeyValue` from Task 1 (`client/utils/amountInput.ts`).
- Produces: `Numpad({ onKey }: { onKey: (key: NumpadKeyValue) => void })` default export, consumed by Task 13 (screen).

- [ ] **Step 1: Write the failing test**

```tsx
// client/components/numpad/__tests__/Numpad.test.tsx
import React from 'react';
import { Pressable } from 'react-native';
import { create, act } from 'react-test-renderer';
import Numpad from '../Numpad';

describe('Numpad', () => {
  it('renders 12 keys (1-9, ., 0, backspace)', () => {
    const tree = create(<Numpad onKey={jest.fn()} />).root;
    expect(tree.findAllByType(Pressable)).toHaveLength(12);
  });

  it('calls onKey with the digit when a digit key is pressed', () => {
    const onKey = jest.fn();
    const tree = create(<Numpad onKey={onKey} />).root;
    const key5 = tree.findByProps({ testID: 'numpad-key-5' });
    act(() => {
      key5.props.onPress();
    });
    expect(onKey).toHaveBeenCalledWith('5');
  });

  it('calls onKey with "backspace" when the backspace key is pressed', () => {
    const onKey = jest.fn();
    const tree = create(<Numpad onKey={onKey} />).root;
    const backspaceKey = tree.findByProps({ testID: 'numpad-key-backspace' });
    act(() => {
      backspaceKey.props.onPress();
    });
    expect(onKey).toHaveBeenCalledWith('backspace');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx jest components/numpad/__tests__/Numpad.test.tsx`
Expected: FAIL — `Cannot find module '../Numpad'`

- [ ] **Step 3: Write minimal implementation**

```tsx
// client/components/numpad/NumpadKey.tsx
import React from 'react';
import { Pressable, Text } from 'react-native';
import { Delete } from 'lucide-react-native';
import type { NumpadKeyValue } from '@/utils/amountInput';

type NumpadKeyProps = {
  label: NumpadKeyValue;
  onPress: () => void;
};

export default function NumpadKey({ label, onPress }: NumpadKeyProps) {
  return (
    <Pressable
      testID={`numpad-key-${label}`}
      onPress={onPress}
      className="bg-white dark:bg-bg-card-dark items-center justify-center"
      style={{
        width: 58,
        height: 58,
        borderRadius: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      {label === 'backspace' ? (
        <Delete color="#2B2F2A" size={22} />
      ) : (
        <Text className="text-tx-primary dark:text-tx-primary-dark font-bold text-xl">{label}</Text>
      )}
    </Pressable>
  );
}
```

```tsx
// client/components/numpad/Numpad.tsx
import React from 'react';
import { View } from 'react-native';
import NumpadKey from './NumpadKey';
import type { NumpadKeyValue } from '@/utils/amountInput';

const KEYS: NumpadKeyValue[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'];

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

type NumpadProps = {
  onKey: (key: NumpadKeyValue) => void;
};

export default function Numpad({ onKey }: NumpadProps) {
  const rows = chunk(KEYS, 3);
  return (
    <View style={{ gap: 12 }}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row justify-between">
          {row.map((key) => (
            <NumpadKey key={key} label={key} onPress={() => onKey(key)} />
          ))}
        </View>
      ))}
    </View>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx jest components/numpad/__tests__/Numpad.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add client/components/numpad
git commit -m "feat: add Numpad and NumpadKey components"
```

---

## Task 3: Category palette constants

**Files:**
- Create: `client/constants/categoryPalette.ts`
- Test: `client/constants/__tests__/categoryPalette.test.ts`

**Interfaces:**
- Produces: `BUILT_IN_CATEGORIES: { key: string; label: string }[]`, `COLOR_SWATCHES: string[]` (12 entries), `ICON_OPTIONS: { key: string; Icon: LucideIcon }[]` (30 entries), `getIconByKey(key: string): LucideIcon`, `withAlpha(hex: string, alpha?: string): string`. Consumed by Task 4 (`customCategories.ts`), Task 5–8 (category components), Task 13 (screen).

- [ ] **Step 1: Write the failing test**

```ts
// client/constants/__tests__/categoryPalette.test.ts
import { BUILT_IN_CATEGORIES, COLOR_SWATCHES, ICON_OPTIONS, getIconByKey, withAlpha } from '../categoryPalette';
import { Tag } from 'lucide-react-native';

describe('categoryPalette', () => {
  it('has exactly 12 color swatches', () => {
    expect(COLOR_SWATCHES).toHaveLength(12);
  });

  it('has exactly 30 icon options', () => {
    expect(ICON_OPTIONS).toHaveLength(30);
  });

  it('has 11 built-in categories matching categoryMeta keys', () => {
    expect(BUILT_IN_CATEGORIES).toHaveLength(11);
    expect(BUILT_IN_CATEGORIES.map((c) => c.key)).toContain('groceries');
  });

  it('getIconByKey resolves a known icon key', () => {
    const match = ICON_OPTIONS[0];
    expect(getIconByKey(match.key)).toBe(match.Icon);
  });

  it('getIconByKey falls back to Tag for an unknown key', () => {
    expect(getIconByKey('not-a-real-icon')).toBe(Tag);
  });

  it('withAlpha appends a default alpha suffix', () => {
    expect(withAlpha('#2FB872')).toBe('#2FB8721A');
  });

  it('withAlpha accepts a custom alpha suffix', () => {
    expect(withAlpha('#2FB872', 'FF')).toBe('#2FB872FF');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx jest constants/__tests__/categoryPalette.test.ts`
Expected: FAIL — `Cannot find module '../categoryPalette'`

- [ ] **Step 3: Write minimal implementation**

```ts
// client/constants/categoryPalette.ts
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
  Home,
  Coffee,
  Gift,
  Briefcase,
  Book,
  Bus,
  TrainFront,
  Fuel,
  Phone,
  Wifi,
  Tv,
  Music,
  Gamepad2,
  PawPrint,
  Baby,
  Wrench,
  Scissors,
  Umbrella,
  type LucideIcon,
} from 'lucide-react-native';

export type BuiltInCategory = { key: string; label: string };

export const BUILT_IN_CATEGORIES: BuiltInCategory[] = [
  { key: 'groceries', label: 'Groceries' },
  { key: 'dining', label: 'Dining' },
  { key: 'transport', label: 'Transport' },
  { key: 'shopping', label: 'Shopping' },
  { key: 'bills', label: 'Bills' },
  { key: 'entertainment', label: 'Entertainment' },
  { key: 'health', label: 'Health' },
  { key: 'income', label: 'Income' },
  { key: 'education', label: 'Education' },
  { key: 'travel', label: 'Travel' },
  { key: 'fitness', label: 'Fitness' },
];

export const COLOR_SWATCHES: string[] = [
  '#2FB872', '#FF6B5E', '#2BB3FF', '#7C5CFC',
  '#F5A623', '#FF5CA8', '#18BFA8', '#16A34A',
  '#3B82F6', '#06B6D4', '#8B5CF6', '#8A8F86',
];

export const ICON_OPTIONS: { key: string; Icon: LucideIcon }[] = [
  { key: 'shopping-cart', Icon: ShoppingCart },
  { key: 'utensils', Icon: Utensils },
  { key: 'car', Icon: Car },
  { key: 'shopping-bag', Icon: ShoppingBag },
  { key: 'receipt', Icon: Receipt },
  { key: 'film', Icon: Film },
  { key: 'heart-pulse', Icon: HeartPulse },
  { key: 'graduation-cap', Icon: GraduationCap },
  { key: 'plane', Icon: Plane },
  { key: 'dumbbell', Icon: Dumbbell },
  { key: 'arrow-up-right', Icon: ArrowUpRight },
  { key: 'tag', Icon: Tag },
  { key: 'home', Icon: Home },
  { key: 'coffee', Icon: Coffee },
  { key: 'gift', Icon: Gift },
  { key: 'briefcase', Icon: Briefcase },
  { key: 'book', Icon: Book },
  { key: 'bus', Icon: Bus },
  { key: 'train-front', Icon: TrainFront },
  { key: 'fuel', Icon: Fuel },
  { key: 'phone', Icon: Phone },
  { key: 'wifi', Icon: Wifi },
  { key: 'tv', Icon: Tv },
  { key: 'music', Icon: Music },
  { key: 'gamepad-2', Icon: Gamepad2 },
  { key: 'paw-print', Icon: PawPrint },
  { key: 'baby', Icon: Baby },
  { key: 'wrench', Icon: Wrench },
  { key: 'scissors', Icon: Scissors },
  { key: 'umbrella', Icon: Umbrella },
];

export function getIconByKey(key: string): LucideIcon {
  return ICON_OPTIONS.find((option) => option.key === key)?.Icon ?? Tag;
}

export function withAlpha(hex: string, alpha: string = '1A'): string {
  return `${hex}${alpha}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx jest constants/__tests__/categoryPalette.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add client/constants/categoryPalette.ts client/constants/__tests__/categoryPalette.test.ts
git commit -m "feat: add category palette constants (12 swatches, 30 icons, built-ins)"
```

---

## Task 4: Custom-category persistence helper

**Files:**
- Create: `client/utils/customCategories.ts`
- Test: `client/utils/__tests__/customCategories.test.ts`

**Interfaces:**
- Produces: `CustomCategory` type (`{ key, label, color, icon }`), `loadCustomCategories(): Promise<CustomCategory[]>`, `saveCustomCategories(categories: CustomCategory[]): Promise<void>`, `addCustomCategory(categories, newCategory): CustomCategory[]`, `removeCustomCategory(categories, key): CustomCategory[]`, `slugifyCategoryName(name: string): string`. Consumed by Task 13 (screen).

- [ ] **Step 1: Write the failing test**

```ts
// client/utils/__tests__/customCategories.test.ts
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loadCustomCategories,
  saveCustomCategories,
  addCustomCategory,
  removeCustomCategory,
  slugifyCategoryName,
  type CustomCategory,
} from '../customCategories';

describe('loadCustomCategories', () => {
  it('parses stored JSON into an array', async () => {
    const stored: CustomCategory[] = [{ key: 'pets', label: 'Pets', color: '#8A8F86', icon: 'paw-print' }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(stored));
    expect(await loadCustomCategories()).toEqual(stored);
  });

  it('returns an empty array when nothing is stored', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    expect(await loadCustomCategories()).toEqual([]);
  });

  it('returns an empty array if AsyncStorage rejects', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    expect(await loadCustomCategories()).toEqual([]);
  });
});

describe('saveCustomCategories', () => {
  it('stringifies and stores the category list', async () => {
    const categories: CustomCategory[] = [{ key: 'pets', label: 'Pets', color: '#8A8F86', icon: 'paw-print' }];
    await saveCustomCategories(categories);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('CUSTOM_CATEGORIES', JSON.stringify(categories));
  });
});

describe('addCustomCategory', () => {
  it('appends a new category', () => {
    const result = addCustomCategory([], { key: 'pets', label: 'Pets', color: '#8A8F86', icon: 'paw-print' });
    expect(result).toEqual([{ key: 'pets', label: 'Pets', color: '#8A8F86', icon: 'paw-print' }]);
  });

  it('replaces an existing category with the same key', () => {
    const existing: CustomCategory[] = [{ key: 'pets', label: 'Pets', color: '#000000', icon: 'tag' }];
    const updated: CustomCategory = { key: 'pets', label: 'Pets', color: '#8A8F86', icon: 'paw-print' };
    expect(addCustomCategory(existing, updated)).toEqual([updated]);
  });
});

describe('removeCustomCategory', () => {
  it('removes the category matching the given key', () => {
    const existing: CustomCategory[] = [
      { key: 'pets', label: 'Pets', color: '#8A8F86', icon: 'paw-print' },
      { key: 'gym', label: 'Gym', color: '#10B981', icon: 'dumbbell' },
    ];
    expect(removeCustomCategory(existing, 'pets')).toEqual([existing[1]]);
  });
});

describe('slugifyCategoryName', () => {
  it('lowercases and hyphenates a name', () => {
    expect(slugifyCategoryName('Pet Supplies')).toBe('pet-supplies');
  });

  it('strips leading/trailing punctuation', () => {
    expect(slugifyCategoryName('  Gym! ')).toBe('gym');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx jest utils/__tests__/customCategories.test.ts`
Expected: FAIL — `Cannot find module '../customCategories'`

- [ ] **Step 3: Write minimal implementation**

```ts
// client/utils/customCategories.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'CUSTOM_CATEGORIES';

export type CustomCategory = {
  key: string;
  label: string;
  color: string;
  icon: string;
};

export async function loadCustomCategories(): Promise<CustomCategory[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export async function saveCustomCategories(categories: CustomCategory[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  } catch {
    // silent: matches ThemeContext persistence convention
  }
}

export function addCustomCategory(
  categories: CustomCategory[],
  newCategory: CustomCategory
): CustomCategory[] {
  const withoutExisting = categories.filter((cat) => cat.key !== newCategory.key);
  return [...withoutExisting, newCategory];
}

export function removeCustomCategory(categories: CustomCategory[], key: string): CustomCategory[] {
  return categories.filter((cat) => cat.key !== key);
}

export function slugifyCategoryName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx jest utils/__tests__/customCategories.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add client/utils/customCategories.ts client/utils/__tests__/customCategories.test.ts
git commit -m "feat: add AsyncStorage-backed custom category persistence"
```

---

## Task 5: `ColorPicker` component

**Files:**
- Create: `client/components/categories/ColorPicker.tsx`
- Test: `client/components/categories/__tests__/ColorPicker.test.tsx`

**Interfaces:**
- Produces: `ColorPicker({ colors, selected, onSelect }: { colors: string[]; selected: string; onSelect: (color: string) => void })`. Consumed by Task 7 (`CategoryEditor`).

- [ ] **Step 1: Write the failing test**

```tsx
// client/components/categories/__tests__/ColorPicker.test.tsx
import React from 'react';
import { Pressable } from 'react-native';
import { create, act } from 'react-test-renderer';
import ColorPicker from '../ColorPicker';

describe('ColorPicker', () => {
  const colors = ['#111111', '#222222', '#333333'];

  it('renders one swatch per color', () => {
    const tree = create(<ColorPicker colors={colors} selected={colors[0]} onSelect={jest.fn()} />).root;
    expect(tree.findAllByType(Pressable)).toHaveLength(3);
  });

  it('calls onSelect with the tapped color', () => {
    const onSelect = jest.fn();
    const tree = create(<ColorPicker colors={colors} selected={colors[0]} onSelect={onSelect} />).root;
    const swatch = tree.findByProps({ testID: 'color-swatch-#222222' });
    act(() => {
      swatch.props.onPress();
    });
    expect(onSelect).toHaveBeenCalledWith('#222222');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx jest components/categories/__tests__/ColorPicker.test.tsx`
Expected: FAIL — `Cannot find module '../ColorPicker'`

- [ ] **Step 3: Write minimal implementation**

```tsx
// client/components/categories/ColorPicker.tsx
import React from 'react';
import { Pressable, View } from 'react-native';
import { Check } from 'lucide-react-native';

type ColorPickerProps = {
  colors: string[];
  selected: string;
  onSelect: (color: string) => void;
};

export default function ColorPicker({ colors, selected, onSelect }: ColorPickerProps) {
  return (
    <View className="flex-row flex-wrap" style={{ gap: 10 }}>
      {colors.map((color) => (
        <Pressable
          key={color}
          testID={`color-swatch-${color}`}
          onPress={() => onSelect(color)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: color,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {selected === color ? <Check color="#FFFFFF" size={18} /> : null}
        </Pressable>
      ))}
    </View>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx jest components/categories/__tests__/ColorPicker.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add client/components/categories/ColorPicker.tsx client/components/categories/__tests__/ColorPicker.test.tsx
git commit -m "feat: add ColorPicker component"
```

---

## Task 6: `IconPicker` component

**Files:**
- Create: `client/components/categories/IconPicker.tsx`
- Test: `client/components/categories/__tests__/IconPicker.test.tsx`

**Interfaces:**
- Consumes: `ICON_OPTIONS` shape `{ key: string; Icon: LucideIcon }[]` from Task 3.
- Produces: `IconPicker({ icons, selected, onSelect }: { icons: { key: string; Icon: LucideIcon }[]; selected: string; onSelect: (key: string) => void })`. Consumed by Task 7 (`CategoryEditor`).

- [ ] **Step 1: Write the failing test**

```tsx
// client/components/categories/__tests__/IconPicker.test.tsx
import React from 'react';
import { Pressable } from 'react-native';
import { create, act } from 'react-test-renderer';
import { Tag, Car } from 'lucide-react-native';
import IconPicker from '../IconPicker';

describe('IconPicker', () => {
  const icons = [
    { key: 'tag', Icon: Tag },
    { key: 'car', Icon: Car },
  ];

  it('renders one pressable per icon', () => {
    const tree = create(<IconPicker icons={icons} selected="tag" onSelect={jest.fn()} />).root;
    expect(tree.findAllByType(Pressable)).toHaveLength(2);
  });

  it('calls onSelect with the tapped icon key', () => {
    const onSelect = jest.fn();
    const tree = create(<IconPicker icons={icons} selected="tag" onSelect={onSelect} />).root;
    const carOption = tree.findByProps({ testID: 'icon-option-car' });
    act(() => {
      carOption.props.onPress();
    });
    expect(onSelect).toHaveBeenCalledWith('car');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx jest components/categories/__tests__/IconPicker.test.tsx`
Expected: FAIL — `Cannot find module '../IconPicker'`

- [ ] **Step 3: Write minimal implementation**

```tsx
// client/components/categories/IconPicker.tsx
import React from 'react';
import { Pressable, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

type IconOption = { key: string; Icon: LucideIcon };

type IconPickerProps = {
  icons: IconOption[];
  selected: string;
  onSelect: (key: string) => void;
};

export default function IconPicker({ icons, selected, onSelect }: IconPickerProps) {
  return (
    <View className="flex-row flex-wrap" style={{ gap: 10 }}>
      {icons.map(({ key, Icon }) => {
        const active = key === selected;
        return (
          <Pressable
            key={key}
            testID={`icon-option-${key}`}
            onPress={() => onSelect(key)}
            className={`w-10 h-10 rounded-xl items-center justify-center ${
              active ? 'bg-brand-green' : 'bg-bg-close dark:bg-bg-close-dark'
            }`}
          >
            <Icon color={active ? '#FFFFFF' : '#2B2F2A'} size={20} />
          </Pressable>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx jest components/categories/__tests__/IconPicker.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add client/components/categories/IconPicker.tsx client/components/categories/__tests__/IconPicker.test.tsx
git commit -m "feat: add IconPicker component"
```

---

## Task 7: `CategoryEditor` component

**Files:**
- Create: `client/components/categories/CategoryEditor.tsx`
- Test: `client/components/categories/__tests__/CategoryEditor.test.tsx`

**Interfaces:**
- Consumes: `ColorPicker` (Task 5), `IconPicker` (Task 6), `COLOR_SWATCHES`/`ICON_OPTIONS` (Task 3).
- Produces: `NewCategoryDraft` type (`{ name: string; color: string; icon: string }`), `CategoryEditor({ onConfirm, onCancel }: { onConfirm: (draft: NewCategoryDraft) => void; onCancel: () => void })`. Consumed by Task 13 (screen).

- [ ] **Step 1: Write the failing test**

```tsx
// client/components/categories/__tests__/CategoryEditor.test.tsx
import React from 'react';
import { Pressable, TextInput } from 'react-native';
import { create, act } from 'react-test-renderer';
import CategoryEditor from '../CategoryEditor';
import { COLOR_SWATCHES, ICON_OPTIONS } from '@/constants/categoryPalette';

describe('CategoryEditor', () => {
  it('does not call onConfirm when the name is empty', () => {
    const onConfirm = jest.fn();
    const tree = create(<CategoryEditor onConfirm={onConfirm} onCancel={jest.fn()} />).root;
    const confirmButton = tree.findByProps({ testID: 'category-editor-confirm' });
    act(() => {
      confirmButton.props.onPress();
    });
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('calls onConfirm with the typed name and default color/icon', () => {
    const onConfirm = jest.fn();
    const tree = create(<CategoryEditor onConfirm={onConfirm} onCancel={jest.fn()} />).root;
    const input = tree.findByType(TextInput);
    act(() => {
      input.props.onChangeText('Pet Supplies');
    });
    const confirmButton = tree.findByProps({ testID: 'category-editor-confirm' });
    act(() => {
      confirmButton.props.onPress();
    });
    expect(onConfirm).toHaveBeenCalledWith({
      name: 'Pet Supplies',
      color: COLOR_SWATCHES[0],
      icon: ICON_OPTIONS[0].key,
    });
  });

  it('calls onCancel when Cancel is pressed', () => {
    const onCancel = jest.fn();
    const tree = create(<CategoryEditor onConfirm={jest.fn()} onCancel={onCancel} />).root;
    const cancelButton = tree.findByProps({ testID: 'category-editor-cancel' });
    act(() => {
      cancelButton.props.onPress();
    });
    expect(onCancel).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx jest components/categories/__tests__/CategoryEditor.test.tsx`
Expected: FAIL — `Cannot find module '../CategoryEditor'`

- [ ] **Step 3: Write minimal implementation**

```tsx
// client/components/categories/CategoryEditor.tsx
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import ColorPicker from './ColorPicker';
import IconPicker from './IconPicker';
import { COLOR_SWATCHES, ICON_OPTIONS } from '@/constants/categoryPalette';

export type NewCategoryDraft = {
  name: string;
  color: string;
  icon: string;
};

type CategoryEditorProps = {
  onConfirm: (draft: NewCategoryDraft) => void;
  onCancel: () => void;
};

export default function CategoryEditor({ onConfirm, onCancel }: CategoryEditorProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_SWATCHES[0]);
  const [icon, setIcon] = useState(ICON_OPTIONS[0].key);

  const canConfirm = name.trim().length > 0;

  return (
    <View className="bg-bg-card dark:bg-bg-card-dark rounded-2xl p-4" style={{ gap: 12 }}>
      <TextInput
        testID="category-name-input"
        value={name}
        onChangeText={setName}
        placeholder="Category name"
        placeholderTextColor="#9AA096"
        className="border border-border-input dark:border-border-input-dark rounded-xl px-3 py-2 text-tx-primary dark:text-tx-primary-dark"
      />
      <ColorPicker colors={COLOR_SWATCHES} selected={color} onSelect={setColor} />
      <IconPicker icons={ICON_OPTIONS} selected={icon} onSelect={setIcon} />
      <View className="flex-row justify-end" style={{ gap: 16 }}>
        <Pressable testID="category-editor-cancel" onPress={onCancel}>
          <Text className="text-tx-secondary dark:text-tx-secondary-dark font-bold">Cancel</Text>
        </Pressable>
        <Pressable
          testID="category-editor-confirm"
          onPress={() => canConfirm && onConfirm({ name: name.trim(), color, icon })}
        >
          <Text
            className={
              canConfirm
                ? 'text-brand-green font-bold'
                : 'text-tx-tertiary dark:text-tx-tertiary-dark font-bold'
            }
          >
            Add
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx jest components/categories/__tests__/CategoryEditor.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add client/components/categories/CategoryEditor.tsx client/components/categories/__tests__/CategoryEditor.test.tsx
git commit -m "feat: add CategoryEditor component"
```

---

## Task 8: `CategoryChips` component

**Files:**
- Create: `client/components/categories/CategoryChips.tsx`
- Test: `client/components/categories/__tests__/CategoryChips.test.tsx`

**Interfaces:**
- Consumes: `withAlpha` from Task 3.
- Produces: `CategoryOption` type (`{ key: string; label: string; color: string; Icon: LucideIcon; custom?: boolean }`), `CategoryChips({ categories, selected, onSelect, editMode, onDelete, onAdd })`. Consumed by Task 13 (screen).

- [ ] **Step 1: Write the failing test**

```tsx
// client/components/categories/__tests__/CategoryChips.test.tsx
import React from 'react';
import { Text } from 'react-native';
import { create, act } from 'react-test-renderer';
import { ShoppingCart, PawPrint } from 'lucide-react-native';
import CategoryChips, { type CategoryOption } from '../CategoryChips';

const categories: CategoryOption[] = [
  { key: 'groceries', label: 'Groceries', color: '#2FB872', Icon: ShoppingCart },
  { key: 'pets', label: 'Pets', color: '#8A8F86', Icon: PawPrint, custom: true },
];

describe('CategoryChips', () => {
  it('renders a chip per category with its label', () => {
    const tree = create(
      <CategoryChips categories={categories} selected="groceries" onSelect={jest.fn()} editMode={false} onDelete={jest.fn()} onAdd={jest.fn()} />
    ).root;
    const labels = tree.findAllByType(Text).map((node) => node.props.children);
    expect(labels).toEqual(expect.arrayContaining(['Groceries', 'Pets']));
  });

  it('calls onSelect when a chip is tapped outside edit mode', () => {
    const onSelect = jest.fn();
    const tree = create(
      <CategoryChips categories={categories} selected="groceries" onSelect={onSelect} editMode={false} onDelete={jest.fn()} onAdd={jest.fn()} />
    ).root;
    act(() => {
      tree.findByProps({ testID: 'category-chip-pets' }).props.onPress();
    });
    expect(onSelect).toHaveBeenCalledWith('pets');
  });

  it('does not call onSelect when tapped in edit mode', () => {
    const onSelect = jest.fn();
    const tree = create(
      <CategoryChips categories={categories} selected="groceries" onSelect={onSelect} editMode onDelete={jest.fn()} onAdd={jest.fn()} />
    ).root;
    act(() => {
      tree.findByProps({ testID: 'category-chip-pets' }).props.onPress();
    });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('shows a delete badge only for custom categories in edit mode, and calls onDelete', () => {
    const onDelete = jest.fn();
    const tree = create(
      <CategoryChips categories={categories} selected="groceries" onSelect={jest.fn()} editMode onDelete={onDelete} onAdd={jest.fn()} />
    ).root;
    expect(() => tree.findByProps({ testID: 'category-chip-delete-groceries' })).toThrow();
    act(() => {
      tree.findByProps({ testID: 'category-chip-delete-pets' }).props.onPress();
    });
    expect(onDelete).toHaveBeenCalledWith('pets');
  });

  it('renders an Add chip in edit mode that calls onAdd', () => {
    const onAdd = jest.fn();
    const tree = create(
      <CategoryChips categories={categories} selected="groceries" onSelect={jest.fn()} editMode onDelete={jest.fn()} onAdd={onAdd} />
    ).root;
    act(() => {
      tree.findByProps({ testID: 'category-chip-add' }).props.onPress();
    });
    expect(onAdd).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx jest components/categories/__tests__/CategoryChips.test.tsx`
Expected: FAIL — `Cannot find module '../CategoryChips'`

- [ ] **Step 3: Write minimal implementation**

```tsx
// client/components/categories/CategoryChips.tsx
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Plus, X, type LucideIcon } from 'lucide-react-native';
import { withAlpha } from '@/constants/categoryPalette';

export type CategoryOption = {
  key: string;
  label: string;
  color: string;
  Icon: LucideIcon;
  custom?: boolean;
};

type CategoryChipsProps = {
  categories: CategoryOption[];
  selected: string;
  onSelect: (key: string) => void;
  editMode: boolean;
  onDelete: (key: string) => void;
  onAdd: () => void;
};

export default function CategoryChips({
  categories,
  selected,
  onSelect,
  editMode,
  onDelete,
  onAdd,
}: CategoryChipsProps) {
  return (
    <View className="flex-row flex-wrap" style={{ gap: 10 }}>
      {categories.map((category) => {
        const active = category.key === selected;
        return (
          <View key={category.key} style={{ position: 'relative' }}>
            <Pressable
              testID={`category-chip-${category.key}`}
              onPress={() => !editMode && onSelect(category.key)}
              className="flex-row items-center rounded-full px-3 py-2"
              style={{
                backgroundColor: active ? withAlpha(category.color) : 'transparent',
                borderWidth: 1,
                borderColor: active ? category.color : '#E5E5E0',
              }}
            >
              <category.Icon color={category.color} size={16} />
              <Text style={{ color: active ? category.color : '#2B2F2A', marginLeft: 6, fontWeight: '700' }}>
                {category.label}
              </Text>
            </Pressable>
            {editMode && category.custom ? (
              <Pressable
                testID={`category-chip-delete-${category.key}`}
                onPress={() => onDelete(category.key)}
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: '#E8322A',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X color="#FFFFFF" size={12} />
              </Pressable>
            ) : null}
          </View>
        );
      })}
      {editMode ? (
        <Pressable
          testID="category-chip-add"
          onPress={onAdd}
          className="flex-row items-center rounded-full px-3 py-2"
          style={{ borderWidth: 1, borderColor: '#9AA096', borderStyle: 'dashed' }}
        >
          <Plus color="#9AA096" size={16} />
          <Text style={{ color: '#9AA096', marginLeft: 6, fontWeight: '700' }}>Add</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx jest components/categories/__tests__/CategoryChips.test.tsx`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add client/components/categories/CategoryChips.tsx client/components/categories/__tests__/CategoryChips.test.tsx
git commit -m "feat: add CategoryChips component"
```

---

## Task 9: `CREATE_TRANSACTION_*` action types + action creators

**Files:**
- Modify: `client/redux/actions/action.types.ts`
- Modify: `client/redux/actions/transaction.actions.ts`
- Test: `client/redux/actions/__tests__/transaction.actions.test.ts`

**Interfaces:**
- Produces: `CREATE_TRANSACTION_REQUEST/SUCCESS/FAILURE` constants; `CreateTransactionPayload` type (`{ transactionType: 'credit'|'debit'; amount: number; category: string; date: string; description?: string }`); `createTransaction(payload)`, `createTransactionSuccess(data)`, `createTransactionFailure(error)`. Consumed by Task 10 (service — type only), Task 11 (saga), Task 12 (reducer), Task 13 (screen).

- [ ] **Step 1: Write the failing test**

```ts
// client/redux/actions/__tests__/transaction.actions.test.ts
import { createTransaction, createTransactionSuccess, createTransactionFailure } from '../transaction.actions';
import { CREATE_TRANSACTION_REQUEST, CREATE_TRANSACTION_SUCCESS, CREATE_TRANSACTION_FAILURE } from '../action.types';

describe('transaction action creators', () => {
  it('createTransaction wraps the payload in a CREATE_TRANSACTION_REQUEST action', () => {
    const payload = { transactionType: 'debit' as const, amount: 100, category: 'groceries', date: '2026-06-21' };
    expect(createTransaction(payload)).toEqual({ type: CREATE_TRANSACTION_REQUEST, payload });
  });

  it('createTransactionSuccess wraps data in a CREATE_TRANSACTION_SUCCESS action', () => {
    const data = { id: '1' };
    expect(createTransactionSuccess(data)).toEqual({ type: CREATE_TRANSACTION_SUCCESS, payload: data });
  });

  it('createTransactionFailure wraps the error in a CREATE_TRANSACTION_FAILURE action', () => {
    const error = new Error('failed');
    expect(createTransactionFailure(error)).toEqual({ type: CREATE_TRANSACTION_FAILURE, payload: error });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx jest redux/actions/__tests__/transaction.actions.test.ts`
Expected: FAIL — `createTransaction is not a function` (or `CREATE_TRANSACTION_REQUEST` is undefined)

- [ ] **Step 3: Write minimal implementation**

```ts
// client/redux/actions/action.types.ts (append at end of file)
export const CREATE_TRANSACTION_REQUEST = "CREATE_TRANSACTION_REQUEST";
export const CREATE_TRANSACTION_SUCCESS = "CREATE_TRANSACTION_SUCCESS";
export const CREATE_TRANSACTION_FAILURE = "CREATE_TRANSACTION_FAILURE";
```

```ts
// client/redux/actions/transaction.actions.ts (full file)
import {
  GET_TRANSACTIONS_REQUEST,
  GET_TRANSACTIONS_SUCCESS,
  CREATE_TRANSACTION_REQUEST,
  CREATE_TRANSACTION_SUCCESS,
  CREATE_TRANSACTION_FAILURE,
} from "./action.types";

export const getAllTransactions = () => ({ type: GET_TRANSACTIONS_REQUEST });
export const getAllTransactionsSuccess = (data: any) => ({
  type: GET_TRANSACTIONS_SUCCESS,
  payload: data,
});

export type CreateTransactionPayload = {
  transactionType: 'credit' | 'debit';
  amount: number;
  category: string;
  date: string;
  description?: string;
};

export const createTransaction = (payload: CreateTransactionPayload) => ({
  type: CREATE_TRANSACTION_REQUEST,
  payload,
});

export const createTransactionSuccess = (data: any) => ({
  type: CREATE_TRANSACTION_SUCCESS,
  payload: data,
});

export const createTransactionFailure = (error: any) => ({
  type: CREATE_TRANSACTION_FAILURE,
  payload: error,
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx jest redux/actions/__tests__/transaction.actions.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add client/redux/actions/action.types.ts client/redux/actions/transaction.actions.ts client/redux/actions/__tests__/transaction.actions.test.ts
git commit -m "feat: add CREATE_TRANSACTION action types and creators"
```

---

## Task 10: `createTransactionService`

**Files:**
- Modify: `client/redux/services/transaction.service.ts`

**Interfaces:**
- Consumes: `CreateTransactionPayload` type from Task 9.
- Produces: `createTransactionService(token: string, payload: CreateTransactionPayload): Promise<{ status: number; data: any }>`. Consumed by Task 11 (saga). Throws on failure (does **not** swallow errors like `getAllTransactionsService` does) so the saga's `catch` block can dispatch `createTransactionFailure`.

No existing test file covers `transaction.service.ts` or any other `*.service.ts` in this codebase (confirmed: no service-layer tests exist for `user.service.ts` either) — this task follows that existing convention and ships without a dedicated unit test. Saga-level behavior (including the error path) is covered in Task 11.

- [ ] **Step 1: Add the service function**

```ts
// client/redux/services/transaction.service.ts (full file)
import axios from 'axios';

import Constants from 'expo-constants';

import type { CreateTransactionPayload } from '../actions/transaction.actions';

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL ?? '';

export const getAllTransactionsService = async (token: string) => {
    try {
        const {status, data} = await axios.get(`${API_BASE_URL}/transaction/user`, {
            headers: {
                'authorization': `Bearer ${token}`,
            },
        });
        return {status, data};
    } catch (err) {
        console.log('error fetching transactions', err);
    }
}

export const createTransactionService = async (token: string, payload: CreateTransactionPayload) => {
    const { status, data } = await axios.post(`${API_BASE_URL}/transaction`, payload, {
        headers: {
            'authorization': `Bearer ${token}`,
        },
    });
    return { status, data };
}
```

- [ ] **Step 2: Typecheck**

Run: `cd client && npx tsc --noEmit`
Expected: no new errors introduced by this file.

- [ ] **Step 3: Commit**

```bash
git add client/redux/services/transaction.service.ts
git commit -m "feat: add createTransactionService (POST /transaction)"
```

---

## Task 11: `createTransactionSaga`

**Files:**
- Modify: `client/redux/sagas/transaction.sagas.ts`
- Test: `client/redux/sagas/__tests__/transaction.sagas.test.ts`

**Interfaces:**
- Consumes: `createTransactionService` (Task 10), `createTransactionSuccess`/`createTransactionFailure` (Task 9), `userSelector` (existing, `client/redux/store/selectors.ts`).
- Produces: exported `createTransactionSaga(action)` generator (named export, alongside the existing `watchTransactionsRequests`) for direct testing; registers `CREATE_TRANSACTION_REQUEST` on the existing watcher.

- [ ] **Step 1: Write the failing test**

```ts
// client/redux/sagas/__tests__/transaction.sagas.test.ts
import { call, put, select } from 'redux-saga/effects';
import { createTransactionSaga } from '../transaction.sagas';
import { userSelector } from '../../store/selectors';
import { createTransactionService } from '../../services/transaction.service';
import { createTransactionSuccess, createTransactionFailure } from '../../actions/transaction.actions';

describe('createTransactionSaga', () => {
  const action = {
    type: 'CREATE_TRANSACTION_REQUEST',
    payload: { transactionType: 'debit' as const, amount: 100, category: 'groceries', date: '2026-06-21' },
  };

  it('selects the token, calls the service, and puts success on the happy path', () => {
    const gen = createTransactionSaga(action as any);
    expect(gen.next().value).toEqual(select(userSelector));
    expect(gen.next({ token: 'abc' }).value).toEqual(call(createTransactionService, 'abc', action.payload));
    const data = { id: '1' };
    expect(gen.next({ data }).value).toEqual(put(createTransactionSuccess(data)));
    expect(gen.next().done).toBe(true);
  });

  it('puts a failure action when the service call throws', () => {
    const gen = createTransactionSaga(action as any);
    gen.next();
    gen.next({ token: 'abc' });
    const error = new Error('network error');
    expect(gen.throw(error).value).toEqual(put(createTransactionFailure(error)));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx jest redux/sagas/__tests__/transaction.sagas.test.ts`
Expected: FAIL — `createTransactionSaga is not a function` (not exported yet)

- [ ] **Step 3: Write minimal implementation**

```ts
// client/redux/sagas/transaction.sagas.ts (full file)
import { call, put, takeLatest, select } from "redux-saga/effects";
import { getAllTransactionsService, createTransactionService } from '../services/transaction.service'
import { userSelector } from "../store/selectors";
import { GET_TRANSACTIONS_REQUEST, CREATE_TRANSACTION_REQUEST } from "../actions/action.types";
import { getAllTransactionsSuccess, createTransactionSuccess, createTransactionFailure } from '../actions/transaction.actions'

function* getAllTransactionsSaga() {
    try {
        const {token} = yield select(userSelector);
        const {data} = yield getAllTransactionsService(token)
        yield put(getAllTransactionsSuccess(data));
    } catch (err) {
        console.log('get all transactions saga failed', err);
    }
}

export function* createTransactionSaga(action: any) {
    try {
        const { token } = yield select(userSelector);
        const { data } = yield call(createTransactionService, token, action.payload);
        yield put(createTransactionSuccess(data));
    } catch (err) {
        yield put(createTransactionFailure(err));
    }
}

export function* watchTransactionsRequests() {
    yield takeLatest(GET_TRANSACTIONS_REQUEST, getAllTransactionsSaga);
    yield takeLatest(CREATE_TRANSACTION_REQUEST, createTransactionSaga);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx jest redux/sagas/__tests__/transaction.sagas.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add client/redux/sagas/transaction.sagas.ts client/redux/sagas/__tests__/transaction.sagas.test.ts
git commit -m "feat: add createTransactionSaga and wire CREATE_TRANSACTION_REQUEST"
```

---

## Task 12: Reducer handling for create-transaction

**Files:**
- Modify: `client/redux/reducers/transaction.reducer.ts`
- Test: `client/redux/reducers/__tests__/transaction.reducer.test.ts`

**Interfaces:**
- Consumes: `CREATE_TRANSACTION_SUCCESS`/`CREATE_TRANSACTION_FAILURE` (Task 9).
- Produces: reducer state shape `{ transactions: any[]; createError: any }`. Consumed by Task 13 (screen, to read `createError` and surface an inline error).

- [ ] **Step 1: Write the failing test**

```ts
// client/redux/reducers/__tests__/transaction.reducer.test.ts
import transactionReducer from '../transaction.reducer';
import { GET_TRANSACTIONS_SUCCESS, CREATE_TRANSACTION_SUCCESS, CREATE_TRANSACTION_FAILURE } from '../../actions/action.types';

describe('transactionReducer', () => {
  it('replaces transactions on GET_TRANSACTIONS_SUCCESS', () => {
    const state = { transactions: [], createError: null };
    const next = transactionReducer(state, { type: GET_TRANSACTIONS_SUCCESS, payload: [{ id: 'a' }] });
    expect(next.transactions).toEqual([{ id: 'a' }]);
  });

  it('prepends the new transaction and clears createError on CREATE_TRANSACTION_SUCCESS', () => {
    const state = { transactions: [{ id: 'old' }], createError: new Error('previous failure') };
    const next = transactionReducer(state, { type: CREATE_TRANSACTION_SUCCESS, payload: { id: 'new' } });
    expect(next.transactions).toEqual([{ id: 'new' }, { id: 'old' }]);
    expect(next.createError).toBeNull();
  });

  it('stores the error on CREATE_TRANSACTION_FAILURE without touching transactions', () => {
    const state = { transactions: [{ id: 'old' }], createError: null };
    const error = new Error('failed');
    const next = transactionReducer(state, { type: CREATE_TRANSACTION_FAILURE, payload: error });
    expect(next.transactions).toEqual([{ id: 'old' }]);
    expect(next.createError).toBe(error);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx jest redux/reducers/__tests__/transaction.reducer.test.ts`
Expected: FAIL — `next.createError` is `undefined`, not `null`/the error

- [ ] **Step 3: Write minimal implementation**

```ts
// client/redux/reducers/transaction.reducer.ts (full file)
import { GET_TRANSACTIONS_SUCCESS, CREATE_TRANSACTION_SUCCESS, CREATE_TRANSACTION_FAILURE } from '../actions/action.types'

const initialState = {
    transactions: [],
    createError: null,
};

const transactionReducer = (state = initialState, action: any) => {
    switch(action.type) {
        case GET_TRANSACTIONS_SUCCESS:
            return {...state, transactions: action.payload}
        case CREATE_TRANSACTION_SUCCESS:
            return {...state, transactions: [action.payload, ...state.transactions], createError: null}
        case CREATE_TRANSACTION_FAILURE:
            return {...state, createError: action.payload}
        default:
            return state;
    }
};

export default transactionReducer;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx jest redux/reducers/__tests__/transaction.reducer.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add client/redux/reducers/transaction.reducer.ts client/redux/reducers/__tests__/transaction.reducer.test.ts
git commit -m "feat: handle CREATE_TRANSACTION_SUCCESS/FAILURE in transaction reducer"
```

---

## Task 13: `AddTransactionNew` screen

**Files:**
- Create: `client/screens/AddTransactionNew.tsx`
- Modify: `client/app/(logged-in)/addTransactionNew.tsx`
- Test: `client/screens/__tests__/AddTransactionNew.test.tsx`

**Interfaces:**
- Consumes: `Numpad` (Task 2), `applyNumpadKey`/`parseAmount` (Task 1), `CategoryChips`/`CategoryOption` (Task 8), `CategoryEditor`/`NewCategoryDraft` (Task 7), `BUILT_IN_CATEGORIES`/`getIconByKey`/`withAlpha` (Task 3), `loadCustomCategories`/`saveCustomCategories`/`addCustomCategory`/`removeCustomCategory`/`slugifyCategoryName` (Task 4), `getCategoryMeta` (existing `client/constants/categoryMeta.ts`), `createTransaction` (Task 9), `transactionSelector`/`userSelector` (existing `client/redux/store/selectors.ts`), `SegmentedToggle` (existing `client/components/SegmentedToggle.tsx`).
- Produces: default export `AddTransactionNew` screen component, rendered by the route file.

This is the composition screen — render-only behaviors (validation reds, numpad wiring, category selection) are covered by an automated test; full submit-to-Activity navigation is covered by the manual test pass in Task 14.

- [ ] **Step 1: Write the failing test**

```tsx
// client/screens/__tests__/AddTransactionNew.test.tsx
import React from 'react';
import { Text, TextInput } from 'react-native';
import { create, act } from 'react-test-renderer';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: any) => selector({ transaction: { transactions: [], createError: null }, user: { token: 'tok' } }),
}));

const mockBack = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, replace: mockReplace }),
}));

import AddTransactionNew from '../AddTransactionNew';
import { createTransaction } from '@/redux/actions/transaction.actions';

describe('AddTransactionNew', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
  });

  it('shows an amount validation error when submitting at zero', async () => {
    let tree: any;
    await act(async () => {
      tree = create(<AddTransactionNew />);
    });
    const root = tree.root;
    const submitButton = root.findByProps({ testID: 'submit-transaction' });
    act(() => {
      submitButton.props.onPress();
    });
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(root.findByProps({ testID: 'amount-display' }).props.style).toMatchObject({ color: '#E8322A' });
  });

  it('shows a name validation error when submitting without a name', async () => {
    let tree: any;
    await act(async () => {
      tree = create(<AddTransactionNew />);
    });
    const root = tree.root;
    act(() => {
      root.findByProps({ testID: 'numpad-key-5' }).props.onPress();
    });
    const submitButton = root.findByProps({ testID: 'submit-transaction' });
    act(() => {
      submitButton.props.onPress();
    });
    expect(mockDispatch).not.toHaveBeenCalled();
    const nameInput = root.findByProps({ testID: 'transaction-name-input' });
    expect(nameInput.props.style).toMatchObject({ borderColor: '#E8322A' });
  });

  it('dispatches createTransaction with mapped expense -> debit on valid submit', async () => {
    let tree: any;
    await act(async () => {
      tree = create(<AddTransactionNew />);
    });
    const root = tree.root;
    act(() => {
      root.findByProps({ testID: 'numpad-key-5' }).props.onPress();
    });
    const nameInput = root.findByProps({ testID: 'transaction-name-input' });
    act(() => {
      nameInput.props.onChangeText('Coffee');
    });
    const submitButton = root.findByProps({ testID: 'submit-transaction' });
    act(() => {
      submitButton.props.onPress();
    });
    expect(mockDispatch).toHaveBeenCalledWith(
      createTransaction(
        expect.objectContaining({ transactionType: 'debit', amount: 5, description: 'Coffee' })
      )
    );
  });

  it('switches to income and maps to credit on submit', async () => {
    let tree: any;
    await act(async () => {
      tree = create(<AddTransactionNew />);
    });
    const root = tree.root;
    const incomeLabel = root.findAllByType(Text).find((node) => node.props.children === 'Income')!;
    const incomePressable = root.findAllByType(require('react-native').Pressable).find((node) =>
      node.findAllByType(Text).includes(incomeLabel)
    )!;
    act(() => {
      incomePressable.props.onPress();
    });
    act(() => {
      root.findByProps({ testID: 'numpad-key-5' }).props.onPress();
    });
    act(() => {
      root.findByProps({ testID: 'transaction-name-input' }).props.onChangeText('Salary');
    });
    act(() => {
      root.findByProps({ testID: 'submit-transaction' }).props.onPress();
    });
    expect(mockDispatch).toHaveBeenCalledWith(
      createTransaction(expect.objectContaining({ transactionType: 'credit', amount: 5 }))
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx jest screens/__tests__/AddTransactionNew.test.tsx`
Expected: FAIL — `Cannot find module '../AddTransactionNew'`

- [ ] **Step 3: Write minimal implementation**

```tsx
// client/screens/AddTransactionNew.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { CalendarDays, Pencil } from 'lucide-react-native';
import { format } from 'date-fns';

import SegmentedToggle from '@/components/SegmentedToggle';
import Numpad from '@/components/numpad/Numpad';
import CategoryChips, { type CategoryOption } from '@/components/categories/CategoryChips';
import CategoryEditor, { type NewCategoryDraft } from '@/components/categories/CategoryEditor';
import { applyNumpadKey, parseAmount, type NumpadKeyValue } from '@/utils/amountInput';
import { BUILT_IN_CATEGORIES, getIconByKey, withAlpha } from '@/constants/categoryPalette';
import { getCategoryMeta } from '@/constants/categoryMeta';
import {
  loadCustomCategories,
  saveCustomCategories,
  addCustomCategory,
  removeCustomCategory,
  slugifyCategoryName,
  type CustomCategory,
} from '@/utils/customCategories';
import { createTransaction } from '@/redux/actions/transaction.actions';
import { userSelector } from '@/redux/store/selectors';

type EntryType = 'expense' | 'income';

const ENTRY_OPTIONS = [
  { value: 'expense' as const, label: 'Expense' },
  { value: 'income' as const, label: 'Income' },
];

export default function AddTransactionNew() {
  const router = useRouter();
  const dispatch = useDispatch();
  useSelector(userSelector);

  const [entryType, setEntryType] = useState<EntryType>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [name, setName] = useState('');
  const [date] = useState(() => new Date());
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(BUILT_IN_CATEGORIES[0].key);
  const [editMode, setEditMode] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [amountError, setAmountError] = useState(false);
  const [nameError, setNameError] = useState(false);

  useEffect(() => {
    loadCustomCategories().then(setCustomCategories);
  }, []);

  const categoryOptions: CategoryOption[] = useMemo(() => {
    const builtIns = BUILT_IN_CATEGORIES.map(({ key, label }) => {
      const meta = getCategoryMeta(key);
      return { key, label, color: meta.color, Icon: meta.Icon };
    });
    const custom = customCategories.map((cat) => ({
      key: cat.key,
      label: cat.label,
      color: cat.color,
      Icon: getIconByKey(cat.icon),
      custom: true,
    }));
    return [...builtIns, ...custom];
  }, [customCategories]);

  const onNumpadKey = (key: NumpadKeyValue) => {
    setAmountStr((current) => applyNumpadKey(current, key));
    setAmountError(false);
  };

  const onAddCategory = async (draft: NewCategoryDraft) => {
    const key = slugifyCategoryName(draft.name);
    const newCategory: CustomCategory = { key, label: draft.name, color: draft.color, icon: draft.icon };
    const updated = addCustomCategory(customCategories, newCategory);
    setCustomCategories(updated);
    await saveCustomCategories(updated);
    setSelectedCategory(key);
    setShowEditor(false);
  };

  const onDeleteCategory = async (key: string) => {
    const updated = removeCustomCategory(customCategories, key);
    setCustomCategories(updated);
    await saveCustomCategories(updated);
    if (selectedCategory === key) {
      setSelectedCategory(BUILT_IN_CATEGORIES[0].key);
    }
  };

  const onSubmit = () => {
    const amount = parseAmount(amountStr);
    const hasAmountError = amount <= 0;
    const hasNameError = name.trim().length === 0;
    setAmountError(hasAmountError);
    setNameError(hasNameError);
    if (hasAmountError || hasNameError) {
      return;
    }
    dispatch(
      createTransaction({
        transactionType: entryType === 'income' ? 'credit' : 'debit',
        amount,
        category: selectedCategory,
        date: date.toISOString(),
        description: name.trim(),
      })
    );
    router.replace('/(logged-in)/(tabs)/transactions');
  };

  const amountColor = amountError ? '#E8322A' : entryType === 'income' ? '#0FB46B' : '#2B2F2A';

  return (
    <ScrollView className="flex-1 bg-bg-app dark:bg-bg-app-dark" contentContainerStyle={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 40 }}>
      <View className="flex-row items-center justify-between">
        <Pressable onPress={() => router.back()}>
          <Text className="text-brand-green font-bold text-base">Cancel</Text>
        </Pressable>
        <Text className="text-tx-primary dark:text-tx-primary-dark font-extrabold text-lg">
          {entryType === 'income' ? 'New income' : 'New expense'}
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <View className="items-center mt-4">
        <SegmentedToggle options={ENTRY_OPTIONS} value={entryType} onChange={setEntryType} />
      </View>

      <View className="items-center mt-8">
        <Text className="text-tx-secondary dark:text-tx-secondary-dark text-sm">Amount</Text>
        <Text testID="amount-display" style={{ color: amountColor, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 58 }}>
          {`₹${amountStr || '0'}`}
        </Text>
      </View>

      <View
        className="flex-row items-center mt-6 rounded-2xl px-3 py-3"
        style={{
          borderWidth: 1,
          borderColor: nameError ? '#E8322A' : '#E5E5E0',
          backgroundColor: nameError ? '#FFF5F5' : undefined,
        }}
      >
        <Pencil color="#9AA096" size={18} />
        <TextInput
          testID="transaction-name-input"
          value={name}
          onChangeText={(value) => {
            setName(value);
            setNameError(false);
          }}
          placeholder="Name"
          placeholderTextColor="#9AA096"
          style={{ marginLeft: 8, flex: 1, color: '#2B2F2A', borderColor: nameError ? '#E8322A' : 'transparent', borderWidth: 1 }}
        />
      </View>

      <View className="flex-row items-center mt-4 rounded-2xl px-3 py-3" style={{ borderWidth: 1, borderColor: '#E5E5E0' }}>
        <CalendarDays color="#9AA096" size={18} />
        <Text style={{ marginLeft: 8, color: '#2B2F2A' }}>{format(date, 'MMMM dd, yyyy')}</Text>
      </View>

      <View className="mt-6">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-tx-primary dark:text-tx-primary-dark font-bold">Category</Text>
          <Pressable onPress={() => setEditMode((value) => !value)}>
            <Text className="text-brand-green font-bold">{editMode ? 'Done' : 'Edit'}</Text>
          </Pressable>
        </View>
        <CategoryChips
          categories={categoryOptions}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
          editMode={editMode}
          onDelete={onDeleteCategory}
          onAdd={() => setShowEditor(true)}
        />
        {showEditor ? (
          <View className="mt-3">
            <CategoryEditor onConfirm={onAddCategory} onCancel={() => setShowEditor(false)} />
          </View>
        ) : null}
      </View>

      <View className="mt-6">
        <Numpad onKey={onNumpadKey} />
      </View>

      <Pressable
        testID="submit-transaction"
        onPress={onSubmit}
        className="mt-6 rounded-2xl items-center justify-center"
        style={{ height: 56, backgroundColor: entryType === 'income' ? '#0FB46B' : '#E8322A' }}
      >
        <Text className="text-white font-extrabold text-base">
          {entryType === 'income' ? 'Add income' : 'Add expense'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
```

```tsx
// client/app/(logged-in)/addTransactionNew.tsx (full file)
import React from 'react';

import AddTransactionNewScreen from '@/screens/AddTransactionNew';

export default function AddTransactionNew() {
  return <AddTransactionNewScreen />;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx jest screens/__tests__/AddTransactionNew.test.tsx`
Expected: PASS (4 tests). The Activity tab route is `client/app/(logged-in)/(tabs)/transactions.tsx`, so `onSubmit` navigates to `/(logged-in)/(tabs)/transactions` (already reflected above — confirmed against the current route tree, no placeholder path).

- [ ] **Step 5: Commit**

```bash
git add client/screens/AddTransactionNew.tsx "client/app/(logged-in)/addTransactionNew.tsx" client/screens/__tests__/AddTransactionNew.test.tsx
git commit -m "feat: build redesigned Add Transaction screen with numpad and category chips"
```

---

## Task 14: Full test suite + manual verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full client test suite**

Run: `cd client && npx jest`
Expected: all suites pass, including every test added in Tasks 1–13.

- [ ] **Step 2: Typecheck the whole client**

Run: `cd client && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual smoke test on a simulator/device** (per phase-3 spec's Testing section)

Run: `cd client && npx expo start`, then in the running app:
- Tap the FAB → confirm the new Add screen opens (not "Coming soon").
- Enter an amount via the numpad, type a name, submit as an expense → confirm validation reds appear if amount is 0 or name is empty, then clear once corrected.
- Submit a valid expense → confirm it navigates to Activity and the new transaction appears at the top of the list.
- Repeat for an income entry → confirm `transactionType: credit` was sent (check server logs or the Activity row's sign/color).
- Tap "Edit" in the Category section → confirm a dashed "Add" chip and red ✕ delete badges appear only on custom (not built-in) chips.
- Create a custom category (name + color + icon) → confirm it appears as a selectable chip immediately.
- Reload the app (or kill/reopen Expo) → confirm the custom category persisted (AsyncStorage round-trip).
- Delete the custom category in edit mode → confirm it disappears from the chip grid and from a subsequent app reload.

- [ ] **Step 4: Commit** (only if the manual pass surfaced a code fix)

```bash
git add -A
git commit -m "fix: address issue found in Add Transaction manual verification"
```

---

## Out of scope (per phase-3 spec)

- Editing existing transactions (Phase 4).
- Server-side category metadata or a Mongo model for custom categories (stays client-side; revisited in Phase 9).
- Retiring the legacy `client/app/(logged-in)/addTransaction.tsx` form — optional cleanup, not required for this phase.
