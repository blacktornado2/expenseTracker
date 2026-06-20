# Phase 2: Home Dashboard

## Context

Phase 1 established tokens, fonts, the 5-tab navigator, the FAB, and the shared primitives (`Card`, `IconTile`, `Avatar`, `TransactionRow`). The Home tab (`client/app/(logged-in)/(tabs)/index.tsx`) is still the old dashboard. This phase rebuilds Home to match the design's "at-a-glance monthly overview + recent activity" screen (README §Screens → 1. Home).

See the roadmap (`2026-06-20-redesign-roadmap.md`) for cross-cutting decisions; they are assumed here and not repeated.

## Goal

Replace the Home tab content with the redesigned dashboard: greeting header + avatar, balance hero card, two stat cards (Income / Saved), the "Where it goes" chart card with bar/pie toggle, and a Recent transactions list — all reading from real transaction data in Redux.

## Current state (relevant facts)

- `index.tsx` renders the legacy dashboard via `ExpenseBox` (removed in Phase 1) / `TransactionRow`.
- Transactions live in Redux (`client/redux/reducers/transaction.reducer.ts`), fetched per-user via saga. Each txn: `{ transactionType: "credit"|"debit", amount, category, date, description }`.
- Selectors exist in `client/redux/store/selectors.ts`.
- No chart/donut/bar code exists yet.

## Design

### Layout (vertical scroll, padding `54px 18px 26px`)

1. **Header row** (space-between):
   - Left: time-based greeting in a 26×26 radius-9 icon pill + "March overview" title. Greeting/icon/colors switch by hour (README §1: morning/afternoon/evening/night sun/sunset/moon variants with their pill bg + color). Compute the month label live from the current date.
   - Right: `Avatar` (46×46, radius 16, dark-green bg, white initial, weight 800). **Tap → Profile drill-down** (the Phase-1 route).
2. **Balance hero card** — new `HeroCard` component. Radius 30, padding 24, green gradient (`linear-gradient(140deg,#13C076,#0A9E5E)` → `expo-linear-gradient`), hero shadow, white text, decorative translucent circles. Contents: uppercase name label, "Spent this month", big amount (Bricolage 44/800, tabular-nums), progress bar (white fill at `spentPct%`), "₹X left / of ₹budget" row. `spent = sum of expense txns this month`; `budget` is the user's monthly budget figure (use profile monthlyIncome or a sensible default until Profile phase wires the real value).
3. **Two stat cards** (flex, gap 12) — reuse `Card` + `IconTile`:
   - **Income** card: icon tile bg `#E6F6EC`, green up-right arrow, label "Income", value = sum of income txns this month. **Tap → Income list** (Phase 7 route; until then, a no-op or placeholder).
   - **Saved** card: icon tile bg `#EFEAFE`, purple savings icon, value = `income − spent`. **Tap → Savings** (Phase 7 route; placeholder until then).
4. **"Where it goes" card** — new `SpendBreakdownCard`. Header with a segmented **bar/pie toggle** (`chartMode` local state). Bar mode: single horizontal stacked bar of category proportions. Pie mode: SVG donut (`react-native-svg`). Below: wrapping legend (color dot + category name). Proportions = per-category expense spend this month (derived selector).
5. **Recent** section — header "Recent" + "See all" link (`#0FB46B`) → Activity tab. List of `TransactionRow` items (most recent N). Row tap → Edit Transaction sheet (Phase 4; until then, navigate to existing `transactionDetail.tsx` or no-op).

### New components

- `client/components/HeroCard.tsx` — gradient hero (used here + Insights + Savings; build generic enough to reuse: title label, big amount, optional progress bar, optional footer row/pills).
- `client/components/SpendBreakdownCard.tsx` — chart card with bar/pie toggle + legend.
- `client/components/charts/StackedBar.tsx` and `client/components/charts/Donut.tsx` — pure presentational SVG, take `[{label, value, color}]`.
- `client/components/SegmentedToggle.tsx` — 2-option segmented control (reused by Add screen's expense/income toggle in Phase 3).

### Derived selectors (add to `selectors.ts`)

- `selectCurrentMonthTransactions`
- `selectMonthSpent` (sum of expenses this month)
- `selectMonthIncome` (sum of income this month)
- `selectSpendByCategory` (map category → spend, for the chart)

All map `credit ↔ income`, `debit ↔ expense` at this layer (roadmap §data model reconciliation).

### Dependencies

- `react-native-svg` (donut/charts) — new if not present.
- `expo-linear-gradient` — for the hero gradient (new if not present).

### Error handling

Empty transactions → hero shows ₹0, chart card shows an empty legend / "No spending yet", Recent shows an empty state. No crashes on a brand-new account.

### Testing

- Manual: seed a few income + expense txns; confirm hero amount, stat cards, chart proportions, and Recent list all reflect them; toggle bar/pie; confirm greeting changes with device time; confirm avatar → Profile and "See all" → Activity navigation.
- Unit: the derived selectors (`selectMonthSpent`, `selectMonthIncome`, `selectSpendByCategory`) with a fixture transaction list — these have real logic and deserve tests.

## Out of scope

Real Income list / Savings / Edit Transaction targets (placeholders OK; wired in Phases 4 & 7). Real budget figure from profile (Phase 8). Dark-mode fine-tuning of the new gradients (Phase 10 pass; just use the `dark:` tokens as you go).
