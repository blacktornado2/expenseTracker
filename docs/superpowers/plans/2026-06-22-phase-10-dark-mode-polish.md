# Phase 10: Dark Mode Polish + Final QA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make dark mode pixel-correct on every screen, finish the missing empty/error/transition states, and pass a full light/dark walkthrough against the handoff prototype — with no regressions to the Phase 2–9 test suites.

**Architecture:** This is a polish-and-verify phase, not a feature phase. It has two kinds of tasks: (1) **targeted fixes** for concrete dark-mode defects found during discovery — each ships real code plus a render/unit test using the existing `react-test-renderer` + mocked-`useTheme` pattern (see `components/__tests__/Card.test.tsx`); and (2) **verification tasks** whose deliverable is a ticked screen × state checklist plus a green regression run, with any defect found fixed by following the established token/shadow patterns. Dark mode is class-driven via NativeWind `dark:` variants plus `isDark`-aware inline styles for shadows (NativeWind cannot express the "shadow → none in dark" rule in a className).

**Tech Stack:** React Native / Expo Router, NativeWind (Tailwind tokens in `tailwind.config.js`), `ThemeContext` (`isDark` / `toggleDark()`, AsyncStorage-persisted), Jest + jest-expo + react-test-renderer (client), Jest + supertest (server).

## Global Constraints

- **No hard-coded light hex for theme-dependent colors.** Surfaces/text/borders MUST use tokens (`bg-app`/`bg-card`/`bg-subtle`/`bg-close`, `tx-*`, `border-*`) with `dark:` variants, never a raw light hex. Verbatim from spec §Surfaces/text/borders.
- **Intentional-hex allowlist (these MAY stay as raw hex, identical in both modes):** brand colors (`brand-green*`, `brand-red*`, `income-green`/`#16A34A`, `over-budget-red`), gradient stops, category colors + their `-soft` backgrounds (`cat-*`), white text on gradient surfaces (`#FFFFFF`), and tab accent colors. Verbatim from spec §Gradients and §Charts/rings.
- **Shadow rule (spec §Shadows / dark token table):** `--shadow-card` and `--shadow-tx` become `none` in dark; `--shadow-tab` and `--shadow-key` **deepen** in dark. `Card` already drops its shadow in dark via `isDark` — keep that pattern; do not regress it.
- **No new features.** Out of scope: Insights category drill-down, multi-currency, performance work beyond removing obvious jank. Verbatim from spec §Out of scope.
- **No screen behavior changes** beyond the visual/empty/error/transition corrections this phase introduces. Don't refactor unrelated logic.
- **Test pattern for theme-dependent components:** `jest.mock('@/contexts/ThemeContext', () => ({ useTheme: jest.fn() }))`, then `(useTheme as jest.Mock).mockReturnValue({ isDark, toggleDark: jest.fn() })`, render with `react-test-renderer`'s `create(...).root`, flatten the style array and assert. Copy from `components/__tests__/Card.test.tsx`.
- **Regression bar:** `cd client && npx jest --watchAll=false` and `cd server && npm test` MUST both stay green after every task.

## File Structure

**Client (modified):**
- `client/constants/shadows.ts` — add `SHADOW_KEY`, `SHADOW_KEY_DARK`, `SHADOW_TAB`, `SHADOW_TAB_DARK` (Task 1).
- `client/components/numpad/NumpadKey.tsx` — `isDark`-aware key shadow + theme-aware backspace icon (Tasks 1, 2).
- `client/app/(logged-in)/(tabs)/_layout.tsx` — dark tab-bar background + deepened dark shadow via a testable `getTabBarStyle(isDark)` helper (Task 1).
- `client/screens/Dashboard.tsx` — theme-aware greeting pill background (Task 2).
- `client/screens/InsightsScreen.tsx` — "No expenses recorded" empty state + undefined-month guard (Task 3).
- Any straggler files surfaced by the Task 2 grep gate.

**Client (new test files):**
- `client/components/numpad/__tests__/NumpadKey.test.tsx` (Task 1).
- `client/app/(logged-in)/(tabs)/__tests__/getTabBarStyle.test.ts` (Task 1).
- `client/screens/__tests__/InsightsScreen.empty.test.tsx` (Task 3).

**Docs (new):**
- `client` QA checklist captured in `docs/superpowers/decisions/2026-06-22-phase-10-qa-walkthrough.md` (Task 7).

---

## Task 1: Dark-mode shadow correctness (numpad key + tab bar)

`Card`/`TransactionRow` already drop their shadow in dark (`TransactionRow` wraps `Card`). The two stragglers are: the **numpad key**, which keeps a static light shadow in both modes (`components/numpad/NumpadKey.tsx`), and the **tab bar**, which has no `tabBarStyle` at all — so it renders the default white background in dark mode and never deepens its shadow. Both must follow the "tab/key deepen in dark" rule.

**Files:**
- Modify: `client/constants/shadows.ts`
- Modify: `client/components/numpad/NumpadKey.tsx`
- Modify: `client/app/(logged-in)/(tabs)/_layout.tsx`
- Test: `client/components/numpad/__tests__/NumpadKey.test.tsx`
- Test: `client/app/(logged-in)/(tabs)/__tests__/getTabBarStyle.test.ts`

**Interfaces:**
- Produces: `SHADOW_KEY`, `SHADOW_KEY_DARK`, `SHADOW_TAB`, `SHADOW_TAB_DARK` (all `ViewStyle`) from `constants/shadows.ts`.
- Produces: `getTabBarStyle(isDark: boolean): ViewStyle` exported from `app/(logged-in)/(tabs)/_layout.tsx`.

- [ ] **Step 1: Add the deepened dark shadow constants**

Append to `client/constants/shadows.ts`:
```ts
// Numpad key — subtle in light, deepened in dark (spec dark token table).
export const SHADOW_KEY: ViewStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 4,
  elevation: 1,
};

export const SHADOW_KEY_DARK: ViewStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.45,
  shadowRadius: 7,
  elevation: 3,
};

// Tab bar — light in light mode, deepened in dark.
export const SHADOW_TAB: ViewStyle = {
  shadowColor: '#16201A',
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.05,
  shadowRadius: 12,
  elevation: 8,
};

export const SHADOW_TAB_DARK: ViewStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.5,
  shadowRadius: 16,
  elevation: 16,
};
```

- [ ] **Step 2: Write the failing NumpadKey shadow test**

Create `client/components/numpad/__tests__/NumpadKey.test.tsx`:
```tsx
import React from 'react';
import { create } from 'react-test-renderer';
import { Pressable } from 'react-native';

jest.mock('@/contexts/ThemeContext', () => ({ useTheme: jest.fn() }));
import { useTheme } from '@/contexts/ThemeContext';
import NumpadKey from '../NumpadKey';

const flat = (style: any) => (Array.isArray(style) ? Object.assign({}, ...style) : style);

describe('NumpadKey', () => {
  it('uses the subtle key shadow in light mode', () => {
    (useTheme as jest.Mock).mockReturnValue({ isDark: false, toggleDark: jest.fn() });
    const root = create(<NumpadKey label="1" onPress={jest.fn()} />).root;
    const style = flat(root.findByType(Pressable).props.style);
    expect(style.shadowOpacity).toBe(0.06);
  });

  it('deepens the key shadow in dark mode', () => {
    (useTheme as jest.Mock).mockReturnValue({ isDark: true, toggleDark: jest.fn() });
    const root = create(<NumpadKey label="1" onPress={jest.fn()} />).root;
    const style = flat(root.findByType(Pressable).props.style);
    expect(style.shadowOpacity).toBe(0.45);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd client && npx jest NumpadKey --watchAll=false`
Expected: FAIL — both cases get `0.06` because the current shadow is static (dark case expects `0.45`).

- [ ] **Step 4: Make the numpad key shadow theme-aware**

Edit `client/components/numpad/NumpadKey.tsx` — import the constants and `useTheme`, then select the shadow by mode. Replace the inline shadow block with the constant:
```tsx
import React from 'react';
import { Pressable, Text } from 'react-native';
import { Delete } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SHADOW_KEY, SHADOW_KEY_DARK } from '@/constants/shadows';
```
```tsx
export default function NumpadKey({ label, onPress }: NumpadKeyProps) {
  const { isDark } = useTheme();
  return (
    <Pressable
      testID={`numpad-key-${label}`}
      onPress={onPress}
      className="bg-white dark:bg-bg-card-dark items-center justify-center"
      style={[{ width: 58, height: 58, borderRadius: 18 }, isDark ? SHADOW_KEY_DARK : SHADOW_KEY]}
    >
```
(Leave the children — backspace icon color is fixed in Task 2. Keep the existing `NumpadKeyProps` type and the `<Text>`/`<Delete>` children as-is for now.)

- [ ] **Step 5: Run the NumpadKey test to verify it passes**

Run: `cd client && npx jest NumpadKey --watchAll=false`
Expected: PASS — both cases green.

- [ ] **Step 6: Write the failing tab-bar style test**

Create `client/app/(logged-in)/(tabs)/__tests__/getTabBarStyle.test.ts`:
```ts
import { getTabBarStyle } from '../_layout';

describe('getTabBarStyle', () => {
  it('uses the white card surface + light shadow in light mode', () => {
    const style = getTabBarStyle(false);
    expect(style.backgroundColor).toBe('#FFFFFF');
    expect(style.shadowOpacity).toBe(0.05);
  });

  it('uses the dark card surface + deepened shadow in dark mode', () => {
    const style = getTabBarStyle(true);
    expect(style.backgroundColor).toBe('#192218');
    expect(style.shadowOpacity).toBe(0.5);
  });
});
```

- [ ] **Step 7: Run the test to verify it fails**

Run: `cd client && npx jest getTabBarStyle --watchAll=false`
Expected: FAIL — `getTabBarStyle is not a function` / not exported.

- [ ] **Step 8: Add `getTabBarStyle` and wire it into the tab bar**

Edit `client/app/(logged-in)/(tabs)/_layout.tsx` — import the tab shadows, export the helper, and pass it via `screenOptions`:
```tsx
import { ViewStyle } from 'react-native';
import { SHADOW_TAB, SHADOW_TAB_DARK } from '@/constants/shadows';
```
```tsx
// '#FFFFFF' = bg-card, '#192218' = bg-card-dark (tailwind.config.js).
export function getTabBarStyle(isDark: boolean): ViewStyle {
  return {
    backgroundColor: isDark ? '#192218' : '#FFFFFF',
    borderTopColor: isDark ? '#252E23' : '#F3F2EB', // border-row(-dark)
    ...(isDark ? SHADOW_TAB_DARK : SHADOW_TAB),
  };
}
```
Then add `tabBarStyle: getTabBarStyle(isDark)` to the `<Tabs screenOptions={{ ... }}>` object (alongside `headerShown: false`):
```tsx
      <Tabs screenOptions={{ headerShown: false, tabBarStyle: getTabBarStyle(isDark) }}>
```

- [ ] **Step 9: Run the tab-bar test to verify it passes**

Run: `cd client && npx jest getTabBarStyle --watchAll=false`
Expected: PASS — both cases green.

- [ ] **Step 10: Run the full client suite (no regressions)**

Run: `cd client && npx jest --watchAll=false`
Expected: PASS — all suites green.

- [ ] **Step 11: Commit**

```bash
git add client/constants/shadows.ts client/components/numpad/NumpadKey.tsx "client/app/(logged-in)/(tabs)/_layout.tsx" client/components/numpad/__tests__/NumpadKey.test.tsx "client/app/(logged-in)/(tabs)/__tests__/getTabBarStyle.test.ts"
git commit -m "fix(client): deepen numpad key + tab bar shadows and surface in dark mode"
```

---

## Task 2: Raw-hex straggler sweep (theme-dependent colors → tokens)

A grep of `app/`, `components/`, `screens/` finds ~147 raw hex literals. Most are allowlisted (brand, gradient stops, `cat-*`, white-on-gradient, tab accents — see Global Constraints). The **stragglers** are theme-dependent colors hard-coded as light values that never adapt in dark. Two are confirmed from discovery: the Dashboard greeting **pill background** (`#FFFBEB`/`#FFF7ED`/`#FFF1E6`/`#EFEAFE` — soft light fills) and the numpad **backspace icon** (`#2B2F2A`, a near-black that disappears on the dark key surface). This task fixes those two and sweeps the rest against the allowlist.

**Files:**
- Modify: `client/screens/Dashboard.tsx`
- Modify: `client/components/numpad/NumpadKey.tsx`
- (Sweep-only) any file the grep gate flags that holds a non-allowlisted, theme-dependent hex.

**Interfaces:**
- Consumes: `useTheme` (already imported in `NumpadKey.tsx` from Task 1).
- Produces: no new exports — visual corrections only.

- [ ] **Step 1: Make the greeting pill background theme-aware**

In `client/screens/Dashboard.tsx`, the greeting pill currently sets `backgroundColor: greeting.pillBg` inline (a light-only fill). Keep the accent icon color (`greeting.color`) but move the pill surface to tokens with a dark variant. Replace the pill `View` (the one wrapping `<greeting.Icon ... />`) with:
```tsx
            <View
              className="bg-bg-subtle dark:bg-bg-subtle-dark"
              style={{
                width: 26,
                height: 26,
                borderRadius: 9,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <greeting.Icon size={15} color={greeting.color} />
            </View>
```
Then delete the now-unused `pillBg` field: remove `pillBg: string;` from the `Greeting` type and drop the `pillBg: '...'` entry from each of the four `return { ... }` branches in `getGreeting`.

- [ ] **Step 2: Make the backspace icon theme-aware**

In `client/components/numpad/NumpadKey.tsx`, the backspace icon uses `color="#2B2F2A"` (invisible on the dark key). Drive it from `isDark` so it matches the key label's `tx-primary` token (`#16201A` light / `#E2E9E0` dark):
```tsx
      {label === 'backspace' ? (
        <Delete color={isDark ? '#E2E9E0' : '#2B2F2A'} size={22} />
      ) : (
        <Text className="text-tx-primary dark:text-tx-primary-dark font-bold text-xl">{label}</Text>
      )}
```

- [ ] **Step 3: Type-check the edits**

Run: `cd client && npx tsc --noEmit`
Expected: PASS — no `pillBg` references remain, no type errors.

- [ ] **Step 4: Run the relevant suites**

Run: `cd client && npx jest Dashboard NumpadKey --watchAll=false`
Expected: PASS (or "no tests found" for Dashboard if none exist — NumpadKey must pass).

- [ ] **Step 5: Sweep remaining files against the allowlist**

Run the grep gate and review each hit:
```bash
cd client && grep -rnE "#[0-9A-Fa-f]{6}" app components screens --include="*.tsx" | grep -v "__tests__"
```
For each hit, classify it:
- **Allowlisted** (brand `#0FB46B`/`#13C076`/`#0A9E5E`/`#E8322A`/`#C0241D`, `income-green` `#16A34A`, `over-budget-red`, any `cat-*` value or `-soft` background, gradient stops, white-on-gradient `#FFFFFF`, tab accents `#2BB3FF`/`#7C5CFC`/`#F59E0B`/`#F5A623`) → leave it.
- **Straggler** (a surface/text/border/icon color that is light-only and sits on a themeable surface) → convert to the matching token with a `dark:` variant (className) or an `isDark`-selected value (inline style), mirroring Steps 1–2.

Tick this step only when every remaining hit is either allowlisted or converted. Note any converted file in the commit body.

- [ ] **Step 6: Run the full client suite (no regressions)**

Run: `cd client && npx jest --watchAll=false`
Expected: PASS — all suites green.

- [ ] **Step 7: Commit**

```bash
git add client/screens/Dashboard.tsx client/components/numpad/NumpadKey.tsx
# add any other files converted in Step 5
git commit -m "fix(client): convert theme-dependent hex stragglers to dark-aware tokens"
```

---

## Task 3: Insights empty state ("No expenses recorded") + undefined-month guard

`InsightsScreen` indexes `monthlyData[selectedIndex]` with no guard. For a month with no expenses (`selected.cats` empty) there is **no** "No expenses recorded" state (spec §Empty & error states requires one), and if `monthlyData` is ever empty, `selected` is `undefined` and the screen crashes on `selected.income`. This task adds the empty state and the guard.

**Files:**
- Modify: `client/screens/InsightsScreen.tsx`
- Test: `client/screens/__tests__/InsightsScreen.empty.test.tsx`

**Interfaces:**
- Consumes: `selectMonthlyData` (already used). `monthlyData` entries have shape `{ month, year, spent, income, cats }` where `cats` is an array.
- Produces: no new exports.

- [ ] **Step 1: Write the failing empty-state test**

Create `client/screens/__tests__/InsightsScreen.empty.test.tsx`:
```tsx
import React from 'react';
import { create, act } from 'react-test-renderer';

const mockMonthly = [{ month: 5, year: 2026, spent: 0, income: 0, cats: [] }];
jest.mock('react-redux', () => ({ useSelector: (fn: any) => fn() }));
jest.mock('@/redux/store/selectors', () => ({ selectMonthlyData: () => mockMonthly }));

import InsightsScreen from '../InsightsScreen';

const text = (root: any) =>
  root.findAllByType('Text' as any).map((n: any) => JSON.stringify(n.props.children)).join(' ');

describe('InsightsScreen empty state', () => {
  it('shows "No expenses recorded" when the selected month has no categories', () => {
    let root: any;
    act(() => { root = create(<InsightsScreen />).root; });
    expect(JSON.stringify(root.findAll(() => true).map((n: any) => n.props?.children)))
      .toContain('No expenses recorded');
  });
});
```
(Note: the assertion walks the rendered tree for the literal string, which is robust to the surrounding markup.)

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd client && npx jest InsightsScreen.empty --watchAll=false`
Expected: FAIL — string "No expenses recorded" is not in the tree.

- [ ] **Step 3: Add the guard and empty state**

Edit `client/screens/InsightsScreen.tsx`. After `const selected = monthlyData[selectedIndex];`, derive empty/guard flags:
```tsx
  const hasMonth = monthlyData.length > 0 && !!selected;
  const noExpenses = hasMonth ? selected.cats.length === 0 : true;
```
Guard the derived values that read `selected` so an undefined month can't crash:
```tsx
  const previous = hasMonth && selectedIndex > 0 ? monthlyData[selectedIndex - 1] : undefined;
  const delta = hasMonth ? trendDelta(selected, previous) : null;
  const saved = hasMonth ? Math.max(0, selected.income - selected.spent) : 0;
```
Then, inside the "Where it went" card, replace `<CategoryBreakdownList cats={selected.cats} />` with a conditional that shows the empty copy when there are no expenses:
```tsx
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd client && npx jest InsightsScreen.empty --watchAll=false`
Expected: PASS.

- [ ] **Step 5: Type-check + full client suite**

Run: `cd client && npx tsc --noEmit && npx jest --watchAll=false`
Expected: PASS — no type errors, all suites green.

- [ ] **Step 6: Commit**

```bash
git add client/screens/InsightsScreen.tsx client/screens/__tests__/InsightsScreen.empty.test.tsx
git commit -m "feat(client): Insights 'No expenses recorded' empty state + undefined-month guard"
```

---

## Task 4: Empty-state audit (Home, Activity, Budgets, Income, Savings)

Discovery confirms these empty states already exist: Activity ("No transactions found"), Budgets ("No budgets yet"), Income ("No income recorded yet"), Savings ("Goal reached! 🎉" / "₹X to go"). This task verifies each renders correctly in **both** themes and that Home's empty state (₹0 hero, empty chart, empty Recent) is present and correct — fixing any that are missing or light-only.

**Files:**
- Verify: `client/screens/Dashboard.tsx`, `client/screens/ActivityScreen.tsx`, `client/screens/BudgetsScreen.tsx`, `client/screens/IncomeListScreen.tsx`, `client/screens/SavingsScreen.tsx`.
- Modify: only the screen(s) where an empty state is missing or not dark-correct.

**Interfaces:**
- Produces: no new exports — verification + targeted fixes only.

- [ ] **Step 1: Confirm each empty-state string is present**

Run:
```bash
cd client && grep -rnE "No transactions found|No budgets yet|No income recorded|Goal reached|to go" screens
```
Expected: one hit each for Activity, Budgets, Income, and Savings (the Savings line has both "Goal reached" and "to go"). Tick when all four screens are accounted for.

- [ ] **Step 2: Verify Home's zero state by reading the render path**

Read `client/screens/Dashboard.tsx`. Confirm that with `transactions: []`: the hero shows `₹0` (`monthSpent` is 0), the donut/`spendByCategory` renders an empty/legend state rather than crashing, and `recentTransactions` (sliced from an empty array) renders nothing or an empty hint rather than throwing. If the Recent section has no empty affordance, add one mirroring the Activity empty copy:
```tsx
            <Text className="text-tx-secondary dark:text-tx-secondary-dark text-center py-6" style={{ fontSize: 14, fontWeight: '600' }}>
              No transactions yet
            </Text>
```
Tick when Home renders cleanly with zero data in both themes.

- [ ] **Step 3: Theme-check each empty state**

For each of the five screens, confirm the empty-state text uses `tx-*` tokens with `dark:` variants and sits on a `bg-app`/`bg-card` (tokenized) surface — not a raw light hex. Convert any straggler per Task 2's pattern. Run the grep gate scoped to these files if unsure:
```bash
cd client && grep -nE "#[0-9A-Fa-f]{6}" screens/Dashboard.tsx screens/ActivityScreen.tsx screens/BudgetsScreen.tsx screens/IncomeListScreen.tsx screens/SavingsScreen.tsx
```
Tick when every remaining hex here is allowlisted.

- [ ] **Step 4: Full client suite (no regressions)**

Run: `cd client && npx jest --watchAll=false`
Expected: PASS.

- [ ] **Step 5: Commit (only if a fix was made)**

```bash
git add client/screens
git commit -m "fix(client): complete + dark-correct empty states across screens"
```
If Steps 2–3 required no change, skip the commit and record "empty states verified, no fix needed" in the Task 7 checklist instead.

---

## Task 5: Error-state surfacing audit (network failures stay inline)

The Phase 9 Redux slices already store failures (`state.budget.createError/updateError/deleteError`, `state.savingsGoal.error`, plus transaction/profile errors). Spec §Empty & error states requires that create/update/delete/profile/budget network failures **surface inline** without crashing or losing the user's draft. This task verifies that and adds an inline error affordance where one is missing, plus confirms the Add/Edit `nameError`/`amountError` red states render in dark.

**Files:**
- Verify: `client/screens/BudgetsScreen.tsx`, `client/components/sheets/BudgetSheet.tsx`, `client/screens/SavingsScreen.tsx`, `client/screens/AddTransactionNew.tsx`, `client/app/(logged-in)/profile.tsx`.
- Modify: only where an error has no inline surface.

**Interfaces:**
- Consumes: existing Redux error slices (`state.budget.*Error`, `state.savingsGoal.error`) and local `nameError`/`amountError` state in the Add/Edit flow.
- Produces: no new exports.

- [ ] **Step 1: Map which errors already surface**

Run:
```bash
cd client && grep -rnE "createError|updateError|deleteError|savingsGoal.*error|nameError|amountError" screens components app --include="*.tsx"
```
For each error value, note whether a component reads it and renders something. Tick when you have a per-error yes/no list.

- [ ] **Step 2: Add an inline error line where one is missing**

For any create/update/delete/profile/budget error that is stored but never shown, add a small inline error `Text` near the relevant action, using the soft-red dark-aware treatment (red text reads in both modes; `brand-red` `#E8322A` is allowlisted):
```tsx
{createError ? (
  <Text className="text-center mt-2" style={{ color: '#E8322A', fontSize: 13, fontWeight: '600' }}>
    Couldn't save — check your connection and try again.
  </Text>
) : null}
```
Read the value from Redux with `useSelector((s: any) => s.budget.createError)` (adjust slice/field per the error being surfaced). Do **not** clear the user's draft on failure — leave the sheet/form populated.

- [ ] **Step 3: Confirm the Add/Edit validation reds render in dark**

Read `client/screens/AddTransactionNew.tsx` (and the edit sheet `client/components/sheets/EditTransactionSheet.tsx`). Confirm `nameError`/`amountError` use the red error color and the soft-red field background (`#FFF5F5`/`#FFF0F0`) — and that the surrounding input surface is tokenized so the red reads on a dark card. Convert any light-only input surface per Task 2's pattern. Tick when both validation states are dark-correct.

- [ ] **Step 4: Type-check + full client suite**

Run: `cd client && npx tsc --noEmit && npx jest --watchAll=false`
Expected: PASS.

- [ ] **Step 5: Commit (only if a fix was made)**

```bash
git add client/screens client/components app
git commit -m "fix(client): surface network failures inline and dark-correct validation states"
```
If no change was needed, record "error states verified, no fix needed" in the Task 7 checklist.

---

## Task 6: Transition verification (sheets, toggle thumb, chart fills)

Spec §Transitions: bottom sheets slide/fade in (~200–300ms ease-out), the dark-mode toggle thumb translates +20px, and chart bars / ring fills have subtle height/arc transitions. This task verifies each motion exists and is not a janky instant swap, fixing any that are missing.

**Files:**
- Verify: `client/components/sheets/BottomSheet.tsx`, `client/components/settings/ToggleSwitch.tsx`, `client/components/charts/StackedBar.tsx`, `client/components/charts/Donut.tsx`, `client/components/budgets/BudgetRing.tsx`, `client/components/insights/TrendBars.tsx`, `client/components/savings/GoalRing.tsx`.
- Modify: only components missing the specified motion.

**Interfaces:**
- Produces: no new exports — motion verification + targeted fixes.

- [ ] **Step 1: Verify the bottom-sheet entrance animation**

Read `client/components/sheets/BottomSheet.tsx`. Confirm it animates translateY/opacity on mount over ~200–300ms with an ease-out curve (Animated/Reanimated/`LayoutAnimation`). If the sheet appears instantly, add an ease-out entrance in that range. Tick when the entrance animates.

- [ ] **Step 2: Verify the toggle thumb translate**

Read `client/components/settings/ToggleSwitch.tsx`. Confirm the thumb animates a ~+20px horizontal translate between off/on (not an instant jump). If it snaps, animate the translate. Tick when the thumb slides.

- [ ] **Step 3: Verify chart bar / ring fill transitions**

Read `StackedBar.tsx`, `Donut.tsx`, `BudgetRing.tsx`, `TrendBars.tsx`, `GoalRing.tsx`. Confirm bar heights / arc fills animate (subtle height or arc transition) rather than appearing fully drawn with no motion. Add a subtle transition to any that swap instantly where the design specifies motion. Tick when chart fills animate.

- [ ] **Step 4: Full client suite (no regressions)**

Run: `cd client && npx jest --watchAll=false`
Expected: PASS.

- [ ] **Step 5: Commit (only if a fix was made)**

```bash
git add client/components
git commit -m "fix(client): add missing entrance/toggle/chart transitions"
```
If no change was needed, record "transitions verified, no fix needed" in the Task 7 checklist.

---

## Task 7: Final QA walkthrough + full regression

The core deliverable of this phase is a manual light/dark walkthrough against the prototype, backed by a green regression run of every suite added in Phases 2–9. This task records the checklist and runs both test suites.

**Files:**
- Create: `docs/superpowers/decisions/2026-06-22-phase-10-qa-walkthrough.md`

**Interfaces:**
- Produces: the QA checklist artifact (used as the phase's sign-off record).

- [ ] **Step 1: Run the full client regression**

Run: `cd client && npx jest --watchAll=false`
Expected: PASS — every client suite (selectors, amount input, filters, savings/budget math, redux reducers/sagas, component renders, the Task 1/3 tests) green. Record the pass/fail summary line.

- [ ] **Step 2: Run the full server regression**

Run: `cd server && npm test`
Expected: PASS — budget, savingsGoal, transaction, and userUpdate suites green. Record the summary line.

- [ ] **Step 3: Write the walkthrough checklist artifact**

Create `docs/superpowers/decisions/2026-06-22-phase-10-qa-walkthrough.md` capturing the screen × {light, dark} × {populated, empty, error} matrix to tick during the manual pass:
```markdown
# Phase 10 QA Walkthrough

Toggle light/dark on each screen; verify against the handoff prototype's `data-dark="true"` state.

| Screen | Light | Dark | Empty | Error |
|--------|-------|------|-------|-------|
| Home (Dashboard) | ☐ | ☐ | ☐ (₹0 hero, empty chart, empty Recent) | ☐ |
| Activity | ☐ | ☐ | ☐ ("No transactions found") | ☐ |
| Add / Edit transaction | ☐ | ☐ | — | ☐ (nameError/amountError) |
| Budgets | ☐ | ☐ | ☐ ("No budgets yet") | ☐ (create/update fail) |
| Insights | ☐ | ☐ | ☐ ("No expenses recorded") | — |
| Savings | ☐ | ☐ | ☐ ("Goal reached!" / "₹X to go") | ☐ (set-goal fail) |
| Income list | ☐ | ☐ | ☐ ("No income recorded yet") | — |
| Profile / Settings | ☐ | ☐ | — | ☐ (profile save fail) |

Cross-cutting checks per screen:
- Shadows: Card/TransactionRow → none in dark; tab bar + numpad keys deepen in dark.
- Surfaces/text/borders use tokens (no light-only hex on themeable surfaces).
- Gradients (green hero, red/green buttons) read well on dark; white text contrast holds.
- Charts/rings: `bg-close` track + category colors render on dark.
- Transitions: sheet entrance, toggle thumb +20px, chart/ring fills animate.

Regression: client `npx jest --watchAll=false` ☐ green · server `npm test` ☐ green.

Notes / drift found: …
```
Perform the manual walkthrough, ticking each cell. Record any visual/behavioral drift in the Notes section and fix it following the established token/shadow patterns (re-run the relevant task's tests after a fix).

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/decisions/2026-06-22-phase-10-qa-walkthrough.md
git commit -m "docs: phase 10 QA walkthrough checklist + regression sign-off"
```

---

## Self-Review

**Spec coverage:**
- §Shadows → Task 1 (numpad key + tab bar; Card/TX already correct, noted).
- §Surfaces/text/borders → Task 2 (greeting pill, backspace icon, grep-gate sweep).
- §Gradients, §Charts/rings → allowlist in Global Constraints + Task 7 cross-cutting checks (brand/category colors stay; verified visually).
- §Inputs/chips/numpad → Task 1 (numpad shadow) + Task 2 (backspace icon) + Task 5 Step 3 (validation reds / soft-red fields).
- §Transitions → Task 6.
- §Empty & error states → Task 3 (Insights, the one genuinely missing state), Task 4 (Home + the four existing), Task 5 (network/validation errors).
- §Final QA walkthrough → Task 7 (matrix artifact).
- §Testing → render/unit tests in Tasks 1/3; regression runs in every task's final step and Task 7.
- §Out of scope → Global Constraints (no Insights drill-down, no new features, no perf work).

**Placeholder scan:** Fix tasks (1–3) ship complete code + runnable tests. Verification tasks (4–6) intentionally have verify-then-fix steps because the defect set isn't known in advance for a polish phase — but each gives concrete grep/read targets, concrete fix snippets to apply when a defect is found, and a concrete tick condition, not "handle edge cases."

**Type/name consistency:** `getTabBarStyle(isDark)` and the `SHADOW_KEY*`/`SHADOW_TAB*` constants are defined in Task 1 and consumed there; `hasMonth`/`noExpenses` are local to Task 3. Token hex values (`#192218`, `#252E23`, `#E2E9E0`, `#16201A`, `#E8322A`) are quoted verbatim from `tailwind.config.js`.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-22-phase-10-dark-mode-polish.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
