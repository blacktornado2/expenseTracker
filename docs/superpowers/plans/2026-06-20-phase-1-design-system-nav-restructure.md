# Phase 1: Design System + Navigation Restructure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the design-system foundation (tokens, fonts, manual dark mode, shared presentational primitives) and the navigation shape (5 tabs + FAB + drill-down routes) that every later redesign phase builds on. No backend changes, no real screen content yet.

**Architecture:** All changes are client-only (`client/`), inside the existing Expo Router + NativeWind v4 + Redux/redux-saga app. Dark mode moves from OS-driven (`useColorScheme` + React Navigation `DarkTheme`/`DefaultTheme`) to a manual `ThemeContext` backed by NativeWind's `colorScheme` API and persisted to AsyncStorage. New presentational primitives (`Card`, `IconTile`, `Avatar`, `TransactionRow`) replace `ExpenseBox`. The tab navigator expands from 3 tabs to 5 with a FAB overlay and a new full-screen Profile drill-down route.

**Tech Stack:** Expo Router, NativeWind v4 (Tailwind), React Navigation bottom-tabs, `lucide-react-native` (new), `expo-linear-gradient` (new), `@expo-google-fonts/plus-jakarta-sans` (new), `@expo-google-fonts/bricolage-grotesque` (new), `@react-native-async-storage/async-storage` (existing), Jest + `jest-expo` (existing, no tests currently exist).

## Global Constraints

- Every color value in screens/components comes from the Tailwind tokens added in Task 2 — no raw hex in `className`. (Plain RN `style` props for things Tailwind can't express in RN, like shadows, may use hex — see Task 2 shadow note.)
- Manual dark mode only: never reintroduce OS-driven `useColorScheme()` from `react-native`/`@/hooks/useColorScheme` into theme decisions.
- Icons: `lucide-react-native`, not `@expo/vector-icons`/`MaterialIcons`, in any new code this phase touches.
- No new business logic / no backend changes this phase.
- Currency formatting in any new code: INR via `Intl.NumberFormat('en-IN')`.
- Use `npx expo install <pkg>` (not plain `npm install`) for any Expo-native module, so the SDK-compatible version is resolved automatically.

---

### Task 1: Install new dependencies

**Files:**
- Modify: `client/package.json`, `client/package-lock.json`

**Interfaces:**
- Produces: `lucide-react-native`, `expo-linear-gradient`, `@expo-google-fonts/plus-jakarta-sans`, `@expo-google-fonts/bricolage-grotesque` available to import in later tasks.

- [ ] **Step 1: Install the Expo-native gradient package via the Expo CLI (resolves the correct SDK 52-compatible version automatically)**

```bash
cd client && npx expo install expo-linear-gradient
```

- [ ] **Step 2: Install the pure-JS packages**

```bash
cd client && npm install lucide-react-native@^1.21.0 @expo-google-fonts/plus-jakarta-sans@^0.4.2 @expo-google-fonts/bricolage-grotesque@^0.4.1
```

- [ ] **Step 3: Verify the app still boots (type-checks) with no import errors**

```bash
cd client && npx tsc --noEmit
```

Expected: no new errors related to missing modules (pre-existing unrelated errors, if any, are out of scope).

- [ ] **Step 4: Commit**

```bash
git add client/package.json client/package-lock.json
git commit -m "chore: add lucide-react-native, expo-linear-gradient, and Google Fonts deps for redesign"
```

---

### Task 2: Tailwind design tokens

**Files:**
- Modify: `client/tailwind.config.js`

**Interfaces:**
- Produces: Tailwind color tokens consumed by every component/screen in this phase and all later phases — `bg-app`/`bg-app-dark`, `bg-card`/`bg-card-dark`, `bg-subtle`/`bg-subtle-dark`, `bg-close`/`bg-close-dark`, `tx-primary`/`tx-primary-dark`, `tx-secondary`/`tx-secondary-dark`, `tx-tertiary`/`tx-tertiary-dark`, `tx-chip`/`tx-chip-dark`, `tx-inactive`/`tx-inactive-dark`, `border-row`/`border-row-dark`, `border-input`/`border-input-dark`, `border-chip`/`border-chip-dark`, brand colors (`brand-green`, `brand-green-start`, `brand-green-end`, `brand-red`, `brand-red-end`, `over-budget-red`, `income-green`), category colors (`cat-groceries`/`cat-groceries-soft`, `cat-dining`/`cat-dining-soft`, `cat-transport`/`cat-transport-soft`, `cat-shopping`/`cat-shopping-soft`, `cat-bills`/`cat-bills-soft`, `cat-entertainment`/`cat-entertainment-soft`, `cat-health`/`cat-health-soft`, `cat-income`/`cat-income-soft`, `cat-education`/`cat-education-soft`, `cat-travel`/`cat-travel-soft`, `cat-fitness`/`cat-fitness-soft`), tab accents (`tab-home`, `tab-activity`, `tab-budgets`, `tab-insights`, `tab-settings`).

**Naming convention:** each surface/text/border token has a light value under its bare name and a dark value under `{name}-dark`, used in components as `className="bg-bg-app dark:bg-bg-app-dark"` (NativeWind v4's manual `dark:` variant, driven by `colorScheme.set()` from the `nativewind` package — confirmed exported alongside `useColorScheme` in `node_modules/nativewind/dist/index.js`). Brand, category, and tab-accent colors are the same hex in both themes per the design handoff, so they get a single token each.

- [ ] **Step 1: Replace `theme.extend.colors` in `client/tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/*.{js,jsx,ts,tsx}", "./screens/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Surfaces
        "bg-app": "#FBFAF7",
        "bg-app-dark": "#111810",
        "bg-card": "#FFFFFF",
        "bg-card-dark": "#192218",
        "bg-subtle": "#ECEBE6",
        "bg-subtle-dark": "#202C1E",
        "bg-close": "#F0EFE8",
        "bg-close-dark": "#1E2A1C",
        // Text
        "tx-primary": "#16201A",
        "tx-primary-dark": "#E2E9E0",
        "tx-secondary": "#8E948C",
        "tx-secondary-dark": "#9EAE9C",
        "tx-tertiary": "#9AA096",
        "tx-tertiary-dark": "#7E8E7C",
        "tx-chip": "#6B7066",
        "tx-chip-dark": "#9AAA98",
        "tx-inactive": "#B4B9B0",
        "tx-inactive-dark": "#607060",
        // Borders
        "border-row": "#F3F2EB",
        "border-row-dark": "#252E23",
        "border-input": "#F0EFE8",
        "border-input-dark": "#263024",
        "border-chip": "#ECEBE6",
        "border-chip-dark": "#263024",
        // Brand
        "brand-green": "#0FB46B",
        "brand-green-start": "#13C076",
        "brand-green-end": "#0A9E5E",
        "brand-red": "#E8322A",
        "brand-red-end": "#C0241D",
        "over-budget-red": "#E25555",
        "income-green": "#16A34A",
        // Category colors + soft backgrounds
        "cat-groceries": "#2FB872",
        "cat-groceries-soft": "#E6F6EE",
        "cat-dining": "#FF6B5E",
        "cat-dining-soft": "#FFEDEA",
        "cat-transport": "#2BB3FF",
        "cat-transport-soft": "#E6F4FF",
        "cat-shopping": "#7C5CFC",
        "cat-shopping-soft": "#EFEAFE",
        "cat-bills": "#F5A623",
        "cat-bills-soft": "#FEF2DE",
        "cat-entertainment": "#FF5CA8",
        "cat-entertainment-soft": "#FFEAF3",
        "cat-health": "#18BFA8",
        "cat-health-soft": "#E3F8F4",
        "cat-income": "#16A34A",
        "cat-income-soft": "#E6F6EC",
        "cat-education": "#3B82F6",
        "cat-education-soft": "#EFF6FF",
        "cat-travel": "#06B6D4",
        "cat-travel-soft": "#ECFEFF",
        "cat-fitness": "#10B981",
        "cat-fitness-soft": "#ECFDF5",
        // Tab accents
        "tab-home": "#0FB46B",
        "tab-activity": "#2BB3FF",
        "tab-budgets": "#7C5CFC",
        "tab-insights": "#F59E0B",
        "tab-settings": "#F5A623",
      },
    },
  },
  plugins: [],
}
```

Note on the custom 12-swatch category palette mentioned in the design handoff (`design_handoff_expense_tracker/README.md`, "(custom palette) ... see HTML"): only 4 of the 12 swatches are named in the README prose. The full set lives in the prototype HTML and is only needed when the custom-category picker is built (Phase 3). Not added here to avoid guessing colors — add it when Phase 3 reads the HTML's exact values.

- [ ] **Step 2: Verify Tailwind picks up the new tokens by checking the generated class list compiles (no build errors) — run the existing Metro/Expo doctor check**

```bash
cd client && npx expo-doctor
```

Expected: no new errors introduced (pre-existing warnings unrelated to this change are fine).

- [ ] **Step 3: Commit**

```bash
git add client/tailwind.config.js
git commit -m "feat: add design-system color tokens for light/dark theme"
```

---

### Task 3: ThemeContext (manual dark mode + AsyncStorage persistence)

**Files:**
- Create: `client/contexts/ThemeContext.tsx`
- Test: `client/contexts/__tests__/ThemeContext.test.ts`

**Interfaces:**
- Consumes: `colorScheme`, `useColorScheme` from `nativewind`; `AsyncStorage` from `@react-native-async-storage/async-storage`.
- Produces: `ThemeProvider` (React component wrapping the app), `useTheme()` hook returning `{ isDark: boolean, toggleDark: () => void }`. Also exports `loadStoredTheme(): Promise<'light' | 'dark'>` and `persistTheme(scheme: 'light' | 'dark'): Promise<void>` as standalone testable functions. Later tasks (4, 9, 11) and later phases (8, 10) import `useTheme` from `@/contexts/ThemeContext`.

- [ ] **Step 1: Write the failing tests for the persistence helpers**

Create `client/contexts/__tests__/ThemeContext.test.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadStoredTheme, persistTheme } from '../ThemeContext';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('loadStoredTheme', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns "dark" when AsyncStorage has "dark" stored', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('dark');
    const result = await loadStoredTheme();
    expect(result).toBe('dark');
  });

  it('returns "light" when AsyncStorage has "light" stored', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('light');
    const result = await loadStoredTheme();
    expect(result).toBe('light');
  });

  it('returns "light" when nothing is stored', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    const result = await loadStoredTheme();
    expect(result).toBe('light');
  });

  it('returns "light" when the AsyncStorage read throws', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('disk error'));
    const result = await loadStoredTheme();
    expect(result).toBe('light');
  });
});

describe('persistTheme', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('writes the scheme to AsyncStorage under the theme_preference key', async () => {
    (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);
    await persistTheme('dark');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('theme_preference', 'dark');
  });

  it('does not throw when the AsyncStorage write fails', async () => {
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('disk full'));
    await expect(persistTheme('dark')).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails (module doesn't exist yet)**

```bash
cd client && npx jest contexts/__tests__/ThemeContext.test.ts --watchAll=false
```

Expected: FAIL with `Cannot find module '../ThemeContext'`.

- [ ] **Step 3: Implement `ThemeContext.tsx`**

Create `client/contexts/ThemeContext.tsx`:

```tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme as nativewindColorScheme, useColorScheme as useNativewindColorScheme } from 'nativewind';

const THEME_STORAGE_KEY = 'theme_preference';

type Scheme = 'light' | 'dark';

type ThemeContextValue = {
  isDark: boolean;
  toggleDark: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export async function loadStoredTheme(): Promise<Scheme> {
  try {
    const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export async function persistTheme(scheme: Scheme): Promise<void> {
  try {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, scheme);
  } catch {
    // Persistence failure should not block in-memory theme switching.
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { colorScheme } = useNativewindColorScheme();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;
    loadStoredTheme().then((scheme) => {
      if (isMounted) {
        nativewindColorScheme.set(scheme);
        setHydrated(true);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  if (!hydrated) {
    return null;
  }

  const toggleDark = () => {
    const next: Scheme = colorScheme === 'dark' ? 'light' : 'dark';
    nativewindColorScheme.set(next);
    persistTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ isDark: colorScheme === 'dark', toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd client && npx jest contexts/__tests__/ThemeContext.test.ts --watchAll=false
```

Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add client/contexts/ThemeContext.tsx client/contexts/__tests__/ThemeContext.test.ts
git commit -m "feat: add manual dark-mode ThemeContext with AsyncStorage persistence"
```

---

### Task 4: Wire ThemeContext + new fonts into the root layout

**Files:**
- Modify: `client/app/_layout.tsx`

**Interfaces:**
- Consumes: `ThemeProvider`, `useTheme` from `@/contexts/ThemeContext` (Task 3).
- Produces: app-wide font availability for `Bricolage Grotesque` (`BricolageGrotesque_600SemiBold`, `BricolageGrotesque_700Bold`, `BricolageGrotesque_800ExtraBold`) and `Plus Jakarta Sans` (`PlusJakartaSans_400Regular`, `PlusJakartaSans_500Medium`, `PlusJakartaSans_600SemiBold`, `PlusJakartaSans_700Bold`, `PlusJakartaSans_800ExtraBold`), referenced by `fontFamily` in later tasks/phases. React Navigation's theme now follows `useTheme().isDark` instead of the OS color scheme.

- [ ] **Step 1: Replace `client/app/_layout.tsx`**

```tsx
import React, { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import store from '@/redux/store/store';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

import "./global.css";

SplashScreen.preventAutoHideAsync();

function NavigationThemeBridge({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();
  return (
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      {children}
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <NavigationThemeBridge>
        <Provider store={store}>
          <Stack screenOptions={{ headerShown: false }} />
        </Provider>
        <StatusBar style="auto" />
      </NavigationThemeBridge>
    </ThemeProvider>
  );
}
```

This drops the `SpaceMono` font load and the `@/hooks/useColorScheme` import entirely (per spec: SpaceMono is unused by anything else; confirmed only referenced here).

- [ ] **Step 2: Type-check**

```bash
cd client && npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Manual smoke check** — start the app, confirm it boots past the splash screen with no red-box errors:

```bash
cd client && npx expo start
```

Press `i` (iOS) or `a` (Android) or `w` (web) and confirm the existing Login screen renders.

- [ ] **Step 4: Commit**

```bash
git add client/app/_layout.tsx
git commit -m "feat: load Plus Jakarta Sans + Bricolage Grotesque, drive nav theme from ThemeContext"
```

---

### Task 5: `Card`, `IconTile`, `Avatar` primitives

**Files:**
- Create: `client/constants/shadows.ts`
- Create: `client/components/Card.tsx`
- Create: `client/components/IconTile.tsx`
- Create: `client/components/Avatar.tsx`
- Test: `client/components/__tests__/Card.test.tsx`

**Interfaces:**
- Consumes: `useTheme` from `@/contexts/ThemeContext` (Task 3).
- Produces: `Card({ children, radius?, className?, style? })`, `IconTile({ children, backgroundColor, size?, radius? })`, `Avatar({ initial, size?, radius? })` — all plain-prop, store-agnostic. Consumed by Task 6 (`TransactionRow`), Task 9 (placeholder tab screens), and every later phase.

React Native shadows can't be expressed as portable Tailwind utilities the way CSS `box-shadow` can, so `Card`'s shadow is a JS style object (not a `className`) that becomes `{}` in dark mode — this is the one deliberate exception to the "tokens via className" rule, scoped to shadows only.

- [ ] **Step 1: Create the shadow constants**

`client/constants/shadows.ts`:

```ts
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
```

- [ ] **Step 2: Write the failing test for `Card`'s dark-mode shadow behavior**

`client/components/__tests__/Card.test.tsx`:

```tsx
import React from 'react';
import { create } from 'react-test-renderer';
import { View } from 'react-native';
import Card from '../Card';

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

import { useTheme } from '@/contexts/ThemeContext';

describe('Card', () => {
  it('applies the shadow style in light mode', () => {
    (useTheme as jest.Mock).mockReturnValue({ isDark: false, toggleDark: jest.fn() });
    const tree = create(<Card><View testID="child" /></Card>).root;
    const root = tree.findByType(View);
    const flatStyle = Array.isArray(root.props.style) ? Object.assign({}, ...root.props.style) : root.props.style;
    expect(flatStyle.shadowOpacity).toBe(0.05);
  });

  it('removes the shadow style in dark mode', () => {
    (useTheme as jest.Mock).mockReturnValue({ isDark: true, toggleDark: jest.fn() });
    const tree = create(<Card><View testID="child" /></Card>).root;
    const root = tree.findByType(View);
    const flatStyle = Array.isArray(root.props.style) ? Object.assign({}, ...root.props.style) : root.props.style;
    expect(flatStyle.shadowOpacity).toBeUndefined();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
cd client && npx jest components/__tests__/Card.test.tsx --watchAll=false
```

Expected: FAIL with `Cannot find module '../Card'`.

- [ ] **Step 4: Implement `Card.tsx`, `IconTile.tsx`, `Avatar.tsx`**

`client/components/Card.tsx`:

```tsx
import React, { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SHADOW_CARD } from '@/constants/shadows';

type CardProps = {
  children: ReactNode;
  radius?: number;
  className?: string;
  style?: ViewStyle;
};

export default function Card({ children, radius = 24, className = '', style }: CardProps) {
  const { isDark } = useTheme();
  const shadowStyle: ViewStyle = isDark ? {} : SHADOW_CARD;

  return (
    <View
      className={`bg-bg-card dark:bg-bg-card-dark ${className}`}
      style={[{ borderRadius: radius }, shadowStyle, style]}
    >
      {children}
    </View>
  );
}
```

`client/components/IconTile.tsx`:

```tsx
import React, { ReactNode } from 'react';
import { View } from 'react-native';

type IconTileProps = {
  children: ReactNode;
  backgroundColor: string;
  size?: number;
  radius?: number;
};

export default function IconTile({ children, backgroundColor, size = 34, radius = 11 }: IconTileProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </View>
  );
}
```

`client/components/Avatar.tsx`:

```tsx
import React from 'react';
import { View, Text } from 'react-native';

type AvatarProps = {
  initial: string;
  size?: number;
  radius?: number;
};

export default function Avatar({ initial, size = 46, radius = 16 }: AvatarProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: '#16201A',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: size * 0.4 }}>
        {initial.toUpperCase()}
      </Text>
    </View>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
cd client && npx jest components/__tests__/Card.test.tsx --watchAll=false
```

Expected: PASS, 2 tests.

- [ ] **Step 6: Commit**

```bash
git add client/constants/shadows.ts client/components/Card.tsx client/components/IconTile.tsx client/components/Avatar.tsx client/components/__tests__/Card.test.tsx
git commit -m "feat: add Card, IconTile, Avatar presentational primitives"
```

---

### Task 6: `TransactionRow` primitive + retire `ExpenseBox`

**Files:**
- Create: `client/components/TransactionRow.tsx`
- Modify: `client/screens/Dashboard.tsx` (migrate its one `ExpenseBox` call site)
- Delete: `client/components/ExpenseBox.tsx`

**Interfaces:**
- Consumes: `Card` (Task 5), `IconTile` (Task 5), `date-fns` `format` (existing dependency, already used in `Dashboard.tsx`/`TransactionHistory.tsx`).
- Produces: `TransactionRow({ name, category, date, amount, type, iconColor, icon? })` where `type: 'income' | 'expense'`. Consumed by Phase 2 (Home), Phase 4 (Activity), Phase 7 (Income list).

`Dashboard.tsx`'s existing `ExpenseBox` usage is three plain stat boxes (Total Income/Expense/Balance), not a transaction-list row — it doesn't fit `TransactionRow`'s shape (which needs category + date). Since Phase 2 replaces this whole screen, migrate these three call sites to inline `Card`-wrapped text as a stopgap, rather than forcing them into `TransactionRow`.

- [ ] **Step 1: Implement `TransactionRow.tsx`**

`client/components/TransactionRow.tsx`:

```tsx
import React, { ReactNode } from 'react';
import { View, Text } from 'react-native';
import { format } from 'date-fns';
import Card from './Card';
import IconTile from './IconTile';

type TransactionRowProps = {
  name: string;
  category: string;
  date: Date;
  amount: number;
  type: 'income' | 'expense';
  iconColor: string;
  icon?: ReactNode;
};

export default function TransactionRow({
  name,
  category,
  date,
  amount,
  type,
  iconColor,
  icon,
}: TransactionRowProps) {
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  const sign = type === 'income' ? '+' : '-';
  const amountColor = type === 'income' ? '#16A34A' : '#E8322A';

  return (
    <Card radius={20} className="flex-row items-center px-4 py-3.5 mb-3" style={{ gap: 14 }}>
      <IconTile backgroundColor={iconColor} size={46} radius={15}>
        {icon}
      </IconTile>
      <View className="flex-1">
        <Text
          className="text-tx-primary dark:text-tx-primary-dark font-extrabold text-[15px]"
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text className="text-tx-tertiary dark:text-tx-tertiary-dark font-semibold text-[12.5px]">
          {category} · {format(date, 'MMM d')}
        </Text>
      </View>
      <Text style={{ color: amountColor }} className="font-extrabold">
        {sign}₹{formattedAmount}
      </Text>
    </Card>
  );
}
```

- [ ] **Step 2: Migrate `Dashboard.tsx`'s `ExpenseBox` call site**

In `client/screens/Dashboard.tsx`, remove the import:

```tsx
import ExpenseBox from '@/components/ExpenseBox';
```

Replace this block:

```tsx
<View className='flex-row gap-2 justify-between mt-6'>
  <ExpenseBox title='Total Income:' amount={5000} className="bg-green-400" />
  <ExpenseBox title='Total Expense:' amount={3000} className="bg-red-300" />
  <ExpenseBox title='Balance:' amount={2000} className="bg-gray-100" />
</View>
```

with:

```tsx
<View className='flex-row gap-2 justify-between mt-6'>
  <View className="flex-1 p-4 rounded-2xl bg-green-400">
    <Text className="text-base font-semibold">Total Income:</Text>
    <Text className="text-slate-700">₹5000</Text>
  </View>
  <View className="flex-1 p-4 rounded-2xl bg-red-300">
    <Text className="text-base font-semibold">Total Expense:</Text>
    <Text className="text-slate-700">₹3000</Text>
  </View>
  <View className="flex-1 p-4 rounded-2xl bg-gray-100">
    <Text className="text-base font-semibold">Balance:</Text>
    <Text className="text-slate-700">₹2000</Text>
  </View>
</View>
```

(This is a stopgap matching the original hardcoded values exactly — Phase 2 replaces this entire screen with the real Home dashboard.)

- [ ] **Step 3: Delete `ExpenseBox.tsx`**

```bash
git rm client/components/ExpenseBox.tsx
```

- [ ] **Step 4: Type-check**

```bash
cd client && npx tsc --noEmit
```

Expected: no errors referencing `ExpenseBox` or `TransactionRow`.

- [ ] **Step 5: Manual check** — navigate to the Dashboard screen in the running app, confirm the three stat boxes still render with the same values/colors as before.

- [ ] **Step 6: Commit**

```bash
git add client/components/TransactionRow.tsx client/screens/Dashboard.tsx
git commit -m "feat: add TransactionRow primitive; retire ExpenseBox"
```

---

### Task 7: 5-tab navigation restructure

**Files:**
- Modify: `client/app/(logged-in)/(tabs)/_layout.tsx`
- Create: `client/app/(logged-in)/(tabs)/budgets.tsx`
- Create: `client/app/(logged-in)/(tabs)/insights.tsx`

**Interfaces:**
- Consumes: `Card` (Task 5), `useTheme` (Task 3).
- Produces: 5 tabs registered (`index` → Home, `transactions` → Activity, `budgets` → Budgets [new], `insights` → Insights [new], `profile` → Settings [retitled, content untouched]). Tab accent colors and inactive color come from the Task 2 tokens (read here as raw hex matching the token values, since React Navigation's `tabBarActiveTintColor` takes a color value, not a className — Tailwind tokens aren't consumable by React Navigation's own props).

- [ ] **Step 1: Create the Budgets placeholder screen**

`client/app/(logged-in)/(tabs)/budgets.tsx`:

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import Card from '@/components/Card';

export default function Budgets() {
  return (
    <View className="flex-1 bg-bg-app dark:bg-bg-app-dark pt-14 px-5 items-center justify-center">
      <Card radius={24} className="p-6">
        <Text className="text-tx-primary dark:text-tx-primary-dark font-bold text-base">
          Coming soon
        </Text>
      </Card>
    </View>
  );
}
```

- [ ] **Step 2: Create the Insights placeholder screen**

`client/app/(logged-in)/(tabs)/insights.tsx`:

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import Card from '@/components/Card';

export default function Insights() {
  return (
    <View className="flex-1 bg-bg-app dark:bg-bg-app-dark pt-14 px-5 items-center justify-center">
      <Card radius={24} className="p-6">
        <Text className="text-tx-primary dark:text-tx-primary-dark font-bold text-base">
          Coming soon
        </Text>
      </Card>
    </View>
  );
}
```

- [ ] **Step 3: Replace the tab layout**

`client/app/(logged-in)/(tabs)/_layout.tsx`:

```tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { Home, AlignJustify, PieChart, BarChart2, Settings } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

const TAB_ACCENTS = {
  home: '#0FB46B',
  activity: '#2BB3FF',
  budgets: '#7C5CFC',
  insights: '#F59E0B',
  settings: '#F5A623',
};

const INACTIVE_LIGHT = '#B4B9B0';
const INACTIVE_DARK = '#607060';

export default function TabLayout() {
  const { isDark } = useTheme();
  const inactiveColor = isDark ? INACTIVE_DARK : INACTIVE_LIGHT;

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarActiveTintColor: TAB_ACCENTS.home,
          tabBarInactiveTintColor: inactiveColor,
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Activity',
          tabBarActiveTintColor: TAB_ACCENTS.activity,
          tabBarInactiveTintColor: inactiveColor,
          tabBarIcon: ({ color, size }) => <AlignJustify color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: 'Budgets',
          tabBarActiveTintColor: TAB_ACCENTS.budgets,
          tabBarInactiveTintColor: inactiveColor,
          tabBarIcon: ({ color, size }) => <PieChart color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarActiveTintColor: TAB_ACCENTS.insights,
          tabBarInactiveTintColor: inactiveColor,
          tabBarIcon: ({ color, size }) => <BarChart2 color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Settings',
          tabBarActiveTintColor: TAB_ACCENTS.settings,
          tabBarInactiveTintColor: inactiveColor,
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
```

Note: the FAB overlay is added in Task 9, on top of this layout, once the placeholder Add route exists (Task 8) — kept as a separate task so this one stays focused on the tab bar itself.

- [ ] **Step 4: Type-check**

```bash
cd client && npx tsc --noEmit
```

- [ ] **Step 5: Manual check** — in the running app, confirm 5 tabs appear (Home, Activity, Budgets, Insights, Settings) with distinct icons; tap Budgets and Insights and confirm each shows a "Coming soon" card; confirm Settings still shows the existing profile content; confirm active-tab icon color matches each tab's accent.

- [ ] **Step 6: Commit**

```bash
git add "client/app/(logged-in)/(tabs)/_layout.tsx" "client/app/(logged-in)/(tabs)/budgets.tsx" "client/app/(logged-in)/(tabs)/insights.tsx"
git commit -m "feat: expand tab bar to 5 tabs (Home, Activity, Budgets, Insights, Settings)"
```

---

### Task 8: Profile drill-down + Add Transaction placeholder routes

**Files:**
- Create: `client/app/(logged-in)/profile.tsx`
- Create: `client/app/(logged-in)/addTransactionNew.tsx`

**Interfaces:**
- Produces: two full-screen routes, siblings of `(tabs)` inside the `(logged-in)` stack (not nested inside the Tabs navigator), so the tab bar does not render on them. `/profile` is reachable for now only via direct router navigation (Task 9 wires the Settings-tab "Account" header and Home's avatar to it in later phases — for this phase, reachability is proven by manual navigation, see Step 3). `/addTransactionNew` is the FAB's target (Task 9).

- [ ] **Step 1: Create the Profile drill-down placeholder**

`client/app/(logged-in)/profile.tsx`:

```tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function ProfileDrilldown() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-bg-app dark:bg-bg-app-dark pt-14 px-5">
      <Pressable onPress={() => router.back()}>
        <Text className="text-brand-green font-bold text-base">‹ Settings</Text>
      </Pressable>
      <Text className="text-tx-primary dark:text-tx-primary-dark font-extrabold text-2xl text-center mt-6">
        Profile
      </Text>
      <Text className="text-tx-secondary dark:text-tx-secondary-dark text-center mt-8">
        Coming soon
      </Text>
    </View>
  );
}
```

- [ ] **Step 2: Create the Add Transaction placeholder**

`client/app/(logged-in)/addTransactionNew.tsx`:

```tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function AddTransactionNew() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-bg-app dark:bg-bg-app-dark pt-14 px-5">
      <Pressable onPress={() => router.back()}>
        <Text className="text-brand-green font-bold text-base">Cancel</Text>
      </Pressable>
      <Text className="text-tx-primary dark:text-tx-primary-dark font-extrabold text-2xl text-center mt-6">
        New expense
      </Text>
      <Text className="text-tx-secondary dark:text-tx-secondary-dark text-center mt-8">
        Coming soon
      </Text>
    </View>
  );
}
```

- [ ] **Step 3: Manual check** — with the dev server running, navigate directly to each new route to prove it's reachable and tab-bar-free (e.g. via Expo Router's deep-link URL bar in the web preview, `npx expo start --web` then visit `/profile` and `/addTransactionNew`, or temporarily add a `router.push('/profile')` call from a button and remove it after checking). Confirm: no tab bar, no FAB, "Cancel"/"‹ Settings" navigates back.

- [ ] **Step 4: Commit**

```bash
git add "client/app/(logged-in)/profile.tsx" "client/app/(logged-in)/addTransactionNew.tsx"
git commit -m "feat: add Profile drill-down and Add Transaction placeholder routes"
```

---

### Task 9: FAB overlay

**Files:**
- Create: `client/components/Fab.tsx`
- Modify: `client/app/(logged-in)/(tabs)/_layout.tsx`

**Interfaces:**
- Consumes: `expo-router`'s `useRouter`/`usePathname`, `lucide-react-native`'s `Plus`, `expo-linear-gradient`'s `LinearGradient` (all Task 1 deps).
- Produces: `Fab` component, rendered as a sibling overlay inside the tab layout (absolutely positioned). Hidden on the Budgets tab. Navigates to `/addTransactionNew` (Task 8).

- [ ] **Step 1: Implement `Fab.tsx`**

`client/components/Fab.tsx`:

```tsx
import React from 'react';
import { Pressable } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function Fab() {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname.includes('/budgets')) {
    return null;
  }

  return (
    <Pressable
      onPress={() => router.push('/addTransactionNew')}
      style={{ position: 'absolute', right: 18, bottom: 24 }}
    >
      <LinearGradient
        colors={['#13C076', '#0A9E5E']}
        style={{
          width: 56,
          height: 56,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#0FB46B',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.5,
          shadowRadius: 28,
          elevation: 6,
        }}
      >
        <Plus color="#FFFFFF" size={28} />
      </LinearGradient>
    </Pressable>
  );
}
```

- [ ] **Step 2: Render it as a sibling overlay in the tab layout**

In `client/app/(logged-in)/(tabs)/_layout.tsx`, add the import:

```tsx
import Fab from '@/components/Fab';
```

and wrap the existing `<Tabs>` return value:

```tsx
return (
  <>
    <Tabs screenOptions={{ headerShown: false }}>
      {/* ...existing Tabs.Screen entries unchanged... */}
    </Tabs>
    <Fab />
  </>
);
```

- [ ] **Step 3: Type-check**

```bash
cd client && npx tsc --noEmit
```

- [ ] **Step 4: Manual check** — confirm the FAB renders bottom-right on Home, Activity, Insights, and Settings tabs; confirm it disappears on the Budgets tab; tap it from Home and confirm it navigates to the `/addTransactionNew` placeholder with "Cancel" working.

- [ ] **Step 5: Commit**

```bash
git add client/components/Fab.tsx "client/app/(logged-in)/(tabs)/_layout.tsx"
git commit -m "feat: add FAB overlay, hidden on Budgets tab"
```

---

### Task 10: Manual dark-mode end-to-end check + temporary debug toggle

**Files:**
- Modify: `client/app/(logged-in)/(tabs)/profile.tsx` (temporary debug control only — removed in Phase 8 once the real Settings dark-mode row exists)

**Interfaces:**
- Consumes: `useTheme` (Task 3).

This is the one explicitly temporary piece of UI in this phase (per the Phase-1 spec's testing note) — a button to flip dark mode so the whole pipeline (tokens → `dark:` classes → persistence) can be verified end-to-end before Phase 8 builds the real toggle row.

- [ ] **Step 1: Add a temporary debug toggle button**

In `client/app/(logged-in)/(tabs)/profile.tsx`, add near the top of the returned JSX (inside the existing `SafeAreaView`/`ScrollView`, above the profile card):

```tsx
import { useTheme } from '@/contexts/ThemeContext';
```

```tsx
const { isDark, toggleDark } = useTheme();
```

```tsx
<TouchableOpacity
  onPress={toggleDark}
  className="bg-bg-card dark:bg-bg-card-dark self-center rounded-xl px-4 py-2 mb-4"
>
  <Text className="text-tx-primary dark:text-tx-primary-dark font-semibold">
    {isDark ? 'Switch to light mode (debug)' : 'Switch to dark mode (debug)'}
  </Text>
</TouchableOpacity>
```

(`TouchableOpacity` is already imported in this file.)

- [ ] **Step 2: Manual end-to-end dark-mode check** — tap the debug toggle and confirm:
  - The Budgets/Insights placeholder cards, the Profile drill-down, and the Add Transaction placeholder all swap to dark tokens (`bg-app-dark`, `tx-primary-dark`, etc.).
  - `Card` shadows disappear in dark mode (Task 5's behavior).
  - Reload the app (`r` in the Expo CLI) and confirm the chosen theme persists.
  - Kill AsyncStorage temporarily (or just trust Task 3's unit tests) to confirm a fresh install defaults to light.

- [ ] **Step 3: Commit**

```bash
git add "client/app/(logged-in)/(tabs)/profile.tsx"
git commit -m "chore: add temporary debug dark-mode toggle for manual verification"
```

---

### Task 11: Full regression pass + final commit

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

```bash
cd client && npx jest --watchAll=false
```

Expected: PASS (Task 3's 6 tests + Task 5's 2 tests = 8 tests, 0 failures).

- [ ] **Step 2: Type-check the whole client**

```bash
cd client && npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Full manual walkthrough** (per the Phase-1 spec's testing section):
  - Launch the app, confirm all 5 tabs render with correct icons/accent colors.
  - Confirm the Settings tab still shows the existing profile content (plus the new debug toggle).
  - Confirm the FAB appears on Home/Activity/Insights/Settings and not on Budgets.
  - Confirm tapping into the Profile drill-down hides the tab bar and back-navigates correctly.
  - Confirm the Add Transaction placeholder route is reachable from the FAB.
  - Toggle dark mode via the debug control and confirm tokens swap and the choice persists across an app reload.

- [ ] **Step 4: Confirm nothing in scope was missed** — diff against the Out-of-Scope list in `docs/superpowers/specs/2026-06-20-phase-1-design-system-nav-restructure.md` to confirm no later-phase work (hero cards, charts, numpad, category chips, sheets, Income list, real Profile fields, Settings row redesign, backend changes) leaked into this phase.
