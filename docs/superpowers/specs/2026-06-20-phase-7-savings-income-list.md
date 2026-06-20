# Phase 7: Savings + Income List Drill-downs

## Context

Two full-screen drill-downs reached from Home's stat cards (Phase 2 wired the taps to placeholders): **Savings** (from the "Saved" card) and **Income list** (from the "Income" card). README §Screens → 7. Savings and → 9. Income list. Both are full-screen, no tab bar, no FAB (the Phase-1 nesting mechanism already handles this for `(logged-in)` stack siblings).

Per the roadmap, the **savings goal is local-only** (AsyncStorage) until Phase 9.

See roadmap for cross-cutting decisions.

## Goal

A Savings screen tracking monthly savings + an editable goal with a progress ring, and an Income list screen showing income transactions with a summary — both reachable from Home.

## Current state (relevant facts)

- Routes do not exist yet (Phase 2 used placeholders/no-ops for the stat-card taps).
- `selectMonthIncome` / `selectMonthSpent` exist from Phase 2. Savings = income − spent.

## Design

### Routes

- `client/app/(logged-in)/savings.tsx` and `client/app/(logged-in)/income-list.tsx` — both `(logged-in)` stack siblings (full-screen, tab bar hidden, FAB hidden). Update Home's "Saved"/"Income" stat-card taps (Phase 2) to navigate here.

### Savings screen

- Header: back "‹ Home" + centered "Savings".
- **Hero card** (`HeroCard`, green gradient radius 28): "March 2026" label, "Saved this month", big amount (Bricolage 44/800), two pills: "X% of income" and a trend "↑/↓ ₹X vs Feb".
- **This month card** (`Card`): Income bar (full, green) + Expenses bar (red, width = expenses/income), divider, "Net saved +₹X" green.
- **6-month trend card**: 6 bars, current month highlighted green, others `bg-close` (reuse `TrendBars` from Phase 6). Backed by `savingsHistory` (`[{month, saved}]`) — seeded/mock for prior months, current computed live.
- **Monthly goal card** (`Card`): header + "Edit goal" button. Edit reveals an inline `₹` number input + "Set" button (persists if > 0). Body: an **SVG progress ring** (88×88, r=36, stroke 8, green arc via `stroke-dasharray`, % in center) beside the saved amount, "of ₹goal goal", a thin progress bar, and "₹X to go" / "Goal reached! 🎉" (the one allowed emoji).

New: `client/components/savings/GoalRing.tsx` (SVG ring), and `savingsGoal` persisted via AsyncStorage (small context or store slice — mirror whatever pattern Phase 5 chose for budgets, for consistency).

### Income list screen

- Back "← Home" + "Income" title.
- Green summary card (`HeroCard` or `Card`): total income + count.
- List of income transactions (`TransactionRow`, soft-bg icon tiles), or an empty state.
- Row tap → Edit Transaction sheet (Phase 4).

### Derived

- Savings = income − spent; savings rate = savings / income; trend vs prior month — all computed.

### Error handling

- Goal AsyncStorage read/write try/catch; default goal (e.g. 0 / unset) on read failure.
- Zero income → avoid divide-by-zero in "% of income" and the expenses-bar width; show 0% / clamp.

### Testing

- Unit: savings amount, savings rate, goal progress %, "₹X to go" / "goal reached" threshold, vs-prior-month trend — pure logic, TDD.
- Manual: from Home, tap "Saved" → Savings and "Income" → Income list; confirm tab bar + FAB hidden; edit and persist the goal across reload; confirm "Goal reached! 🎉" appears when saved ≥ goal; confirm income list filters to income only and opens the Edit sheet.

## Out of scope

Server persistence of the savings goal / savings history (Phase 9). Profile-driven income figure (Phase 8 refines the income source).
