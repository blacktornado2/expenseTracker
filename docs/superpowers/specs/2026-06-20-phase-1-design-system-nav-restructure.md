# Phase 1: Design System + Navigation Restructure

## Context

We're redesigning the Expense Tracker app (React Native / Expo Router client, Node/Express + MongoDB server) to match a new high-fidelity design imported from a Claude Design project (`Expense Tracker - Pop.dc.html`, project "Modernizing Expense Tracker UI", handoff README at `design_handoff_expense_tracker/README.md` in that project).

The full redesign adds two new tabs (Budgets, Insights), three drill-down screens (Profile edit, Savings, Income list), dark mode, custom categories, and a new visual language across all screens. This is too large for a single spec, so it's being broken into phases following the README's suggested build order:

1. **Theme tokens + fonts + shared primitives + nav restructure** ← this spec
2. Home dashboard
3. Add Transaction flow
4. Activity (search/filter) + Edit Transaction sheet
5. Budgets + Add/Edit Budget sheet
6. Insights
7. Savings + Income list drill-downs
8. Profile (view/edit)
9. Dark mode polish pass

Data decisions for later phases (already agreed, recorded here for continuity):
- Budgets and Savings goal will be **local-only** (client state / AsyncStorage) until a dedicated backend phase — no Mongo models or routes for these in early phases.
- Profile screen's new fields (dob, mobile, monthlyIncome, currency, country) will be added to the `User` mongoose model + an update-profile endpoint **when the Profile phase is built**, not now.

## Goal of This Phase

Establish the foundation every later phase builds on: design tokens, fonts, shared presentational primitives, and the navigation shape (5 tabs + FAB + drill-down routes). No new business logic, no backend changes, no visual redesign of screen *content* yet — just the scaffolding.

## Current State (relevant facts)

- Client: Expo Router (`client/app`), NativeWind v4 (Tailwind via `className`), React Navigation bottom tabs (`@react-navigation/bottom-tabs` via `expo-router/Tabs`), Redux + redux-saga for transactions/user.
- Tabs today (`client/app/(logged-in)/(tabs)/_layout.tsx`): Home (`index.tsx`), Transactions (`transactions.tsx`), Profile (`profile.tsx`) — 3 tabs, default `expo-router` Tabs icons (MaterialIcons), no FAB, no dark mode styling.
- `app/_layout.tsx` wires `useColorScheme()` (OS-driven) into React Navigation's `DarkTheme`/`DefaultTheme` — this is system-driven, not a manual toggle, and isn't connected to NativeWind styling at all today.
- Existing shared component: `client/components/ExpenseBox.tsx` (simple title/amount card, plain Tailwind classes, no theme tokens).
- No budgets, savings, dark-mode tokens, or custom-category code exists anywhere in `client/` or `server/` (confirmed via search).
- `User` model (`server/models/user.model.js`) has no `dob`, `mobile`, `monthlyIncome`, `currency`, or `country` fields yet.

## Design

### 1. Theme tokens

- Extend `client/tailwind.config.js` `theme.extend.colors` with the design's named tokens for both light and dark, sourced from the handoff README's Design Tokens table:
  - Surfaces: `bg-app`, `bg-card`, `bg-subtle`, `bg-close`
  - Text: `tx-primary`, `tx-secondary`, `tx-tertiary`, `tx-chip`, `tx-inactive`
  - Borders: `border-row`, `border-input`, `border-chip`
  - Brand: primary green `#0FB46B` (plus gradient stops `#13C076`/`#0A9E5E`), expense red `#E8322A` (gradient to `#C0241D`), over-budget red `#E25555`, income green text `#16A34A`
  - Category colors + soft backgrounds (Groceries, Dining, Transport, Shopping, Bills, Entertainment, Health, Income/Salary, Education, Travel, Fitness, custom palette)
  - Tab accent colors (Home `#0FB46B`, Activity `#2BB3FF`, Budgets `#7C5CFC`, Insights `#F59E0B`, Settings `#F5A623`)
- Light values are the literal default colors; dark values are applied via NativeWind's `dark:` variant classes wherever a token differs between modes (per the README's Light/Dark tables).
- **Manual dark mode control**: replace the OS-driven `useColorScheme()` / `DarkTheme`/`DefaultTheme` wiring in `app/_layout.tsx` with NativeWind's manual color scheme API (`colorScheme` from the `nativewind` package: `colorScheme.set('light' | 'dark')`, `useColorScheme()` from `nativewind` for reads). This matches the design's explicit Settings toggle rather than following the OS setting.
- Persist the chosen scheme in `@react-native-async-storage/async-storage` (already a dependency) and restore it on app start, defaulting to `'light'` if nothing is stored.
- Introduce a thin `ThemeProvider`/context (`client/contexts/ThemeContext.tsx` or similar) that exposes `isDark` and a `toggleDark()` function, backed by the NativeWind API + AsyncStorage persistence, so the Settings phase can wire a toggle row to it without touching this plumbing again.

### 2. Fonts

- Add Plus Jakarta Sans (weights 400/500/600/700/800) and Bricolage Grotesque (weights 600/700/800) via `@expo-google-fonts/plus-jakarta-sans` and `@expo-google-fonts/bricolage-grotesque` (new dependencies) + `expo-font`.
- Load both alongside the existing `useFonts()` call in `app/_layout.tsx`.
- Drop the current `SpaceMono` font load — it's unused by the new design and by anything else in the app (confirmed: only referenced in `app/_layout.tsx`).

### 3. Shared primitives (new files in `client/components/`)

All are presentational only in this phase — no data fetching, no business logic. They take props and render; later phases wire real data into them.

- `Card.tsx` — base container: white/`bg-card` background, configurable radius (default per README's "Cards 22–30" range), `shadow-card` token, dark-mode shadow becomes `none` per the dark token table.
- `IconTile.tsx` — square rounded tile (configurable size, default per the row/stat-card use cases) with a background color/soft-bg prop and a centered icon (children).
- `Avatar.tsx` — circular/rounded tile showing either an initial letter (e.g., "A") on a dark green background, or (future) an uploaded photo — Phase 1 only needs the initial-letter variant since photo upload is a Profile-phase concern.
- `TransactionRow.tsx` — replaces `ExpenseBox.tsx` as the row used for transaction lists: left `IconTile` (category color), middle name + "Category · date" subtitle, right amount (tabular-nums, green `+₹` for income / red `-₹` for expense). Takes plain props (`name`, `category`, `date`, `amount`, `type`, `iconColor`) — no redux/store coupling. `ExpenseBox.tsx` is deleted once its one call site is migrated.
- Icons: use `lucide-react-native` (new dependency) per the README's icon guidance, replacing `@expo/vector-icons/MaterialIcons` usage in the tab bar and these primitives. Existing `@expo/vector-icons` usage elsewhere in the app is left alone in this phase.

### 4. Navigation restructure

- `client/app/(logged-in)/(tabs)/_layout.tsx` expands from 3 tabs to 5, renaming/adding routes:
  - `index.tsx` → **Home** (unchanged route file, new tab icon/accent color `#0FB46B`)
  - `transactions.tsx` → **Activity** (unchanged route file for now, accent `#2BB3FF`)
  - `budgets.tsx` (**new**, placeholder screen rendering a `Card` with "Coming soon", accent `#7C5CFC`)
  - `insights.tsx` (**new**, placeholder screen rendering a `Card` with "Coming soon", accent `#F59E0B`)
  - `profile.tsx` → **Settings** (route file renamed/repurposed; tab icon = gear, accent `#F59E0B`). Its current content stays in this tab as a stopgap "Account" section for now — the Settings *visual redesign* (profile card, linked accounts, dark mode toggle row, etc.) is a later phase. This phase only renames the tab and relocates real profile editing as described next.
- **Profile drill-down**: add `client/app/(logged-in)/profile.tsx` (outside the tabs group, full-screen, no tab bar — Expo Router screen with `headerShown: false` and no bottom tabs). For this phase, this is a near-empty screen (header "‹ Settings" / "Profile" / placeholder body) — the real Profile content/fields arrive in the Profile phase. The point of this phase is just to prove the route exists and is reachable, and that the tab bar correctly disappears on it.
- Tab bar hidden on `profile.tsx` via Expo Router's stack-over-tabs nesting (the route lives in the `(logged-in)` stack, sibling to `(tabs)`, not inside it) — same mechanism later phases reuse for Add Transaction, Savings, and Income-list screens.
- **FAB**: add a `Fab.tsx` component rendered as a sibling overlay inside `(tabs)/_layout.tsx` (absolutely positioned, bottom-right, green gradient `+`). It navigates to a placeholder route for now (`client/app/(logged-in)/addTransactionNew.tsx`, a near-empty screen) — wiring it to the real redesigned Add Transaction flow happens in that phase. **Hidden when the active tab is Budgets** (Budgets gets its own header `+` in its own phase, but we hide the FAB there now so the rule exists from day one).
- No changes to the existing `addTransaction.tsx`, `transactionDetail.tsx`, `login.tsx`, `sign-up.tsx` routes/screens in this phase — they keep working exactly as they do today; only the tab layout, new placeholder routes, and the FAB overlay change.

### Error handling

Nothing new to handle — this phase has no data fetching or async work beyond reading/writing the persisted theme preference (AsyncStorage), which is wrapped in a try/catch defaulting to `'light'` on any read failure.

### Testing

- Manual: launch the app, confirm all 5 tabs render with correct icons/accent colors, confirm Settings tab still shows existing profile content, confirm the FAB appears on Home/Activity/Insights/Settings and not on Budgets, confirm tapping into the Profile drill-down hides the tab bar and back-navigates correctly, confirm Add Transaction placeholder route is reachable from the FAB.
- Manual: toggle dark mode via a temporary debug control (e.g., a button on the placeholder Settings stopgap) and confirm tokens swap and the choice persists across an app reload.
- No automated tests are planned for this phase — primitives are presentational and covered visually; existing Jest setup (`jest-expo`) is untouched.

## Out of Scope (explicitly deferred to later phases)

Hero cards, charts/donut/bar visuals, Budgets/Insights/Savings logic and screens, the numpad Add Transaction flow, category chips and custom category management, Edit Transaction/Budget bottom sheets, Income list, real Profile fields/editing, Settings row redesign, and any backend (Mongo model/route) changes for budgets, savings, or profile fields.
