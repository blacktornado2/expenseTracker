# Phase 5: Budgets + Add/Edit Budget Sheet

## Context

Budgets is a brand-new tab (placeholder "Coming soon" from Phase 1). This phase builds the full Budgets screen (README §Screens → 3. Budgets) and its Add/Edit Budget bottom sheet (README §Modals). Per the roadmap, budgets are **local-only** (client state + AsyncStorage) until Phase 9 — no Mongo model/route yet.

See roadmap for cross-cutting decisions.

## Goal

Let users set monthly per-category spend limits and track consumption via conic rings, with add/edit/delete persisted to AsyncStorage. Spend is derived live from transactions.

## Current state (relevant facts)

- `client/app/(logged-in)/(tabs)/budgets.tsx` is a Phase-1 placeholder. Its tab accent is `#7C5CFC`; the FAB is already hidden on this tab (Phase 1) because Budgets has its own header `+`.
- No budget state, model, or route exists anywhere.
- `selectSpendByCategory` (Phase 2) gives per-category spend for the current month.

## Design

### Local store

- `budgetsState`: `[{ cat, limit }]`. New slice — either a small Redux slice (`client/redux/.../budget.*`) or a dedicated context/AsyncStorage store. **Recommendation: a `BudgetsContext` backed by AsyncStorage**, to keep the local-first boundary clean and make the Phase-9 swap-to-server obvious. Decide at execution time, but document the choice.
- Persist on every change; hydrate on app start.
- Spend per budget = `selectSpendByCategory[cat]` (derived, never stored).

### Screen layout (padding `54px 18px 26px`)

- Header: "Budgets" title + **`+` button** (38×38, radius 13, green gradient) → Add Budget sheet.
- **Total consumed card** — `Card`. "Total consumed" + "₹spent / ₹limit". A segmented multi-color progress bar (each budget's share) + wrapping legend.
- **Budget grid** — 2 cols, gap 13. Each tile: `Card`, centered. A **conic-gradient ring** (66×66) showing percent consumed — `barColor` (category color) if under limit, `#E25555` if over — with the % in the middle. Below: category name + "₹spent / ₹limit". **Tap → Edit Budget sheet.**

### New components

- `client/components/budgets/BudgetRing.tsx` — conic/arc ring via `react-native-svg` (Phase 2 dep); props `percent`, `color`, `over`.
- `client/components/budgets/SegmentedProgressBar.tsx` — multi-segment bar + legend (also usable by Insights if convenient).
- `client/components/sheets/BudgetSheet.tsx` — reuses `BottomSheet` (Phase 4). Title "New Budget" / "Edit Budget". Add mode: `CategoryChips` limited to categories **without** an existing budget. Edit mode: the locked category shown as a tile. Monthly limit `₹` input. "Save budget" (+ "Delete budget" in edit mode).

### Behavior

- Add/edit/delete write to `budgetsState`; rings/segments recompute from live spend-by-category.
- Over-budget rings turn `#E25555`.
- Empty state: no budgets yet → grid shows a friendly prompt to add one.

### Error handling

- AsyncStorage read/write wrapped in try/catch; on read failure, start with an empty budget list (don't crash).

### Testing

- Unit: ring-percent + over-budget computation (`spent/limit`, clamp, over flag); total-consumed aggregation — pure logic, TDD.
- Manual: add a budget for a category that has spend; confirm ring %, over-budget red, total card, and legend; edit and delete; confirm budgets persist across reload; confirm the "only categories without a budget" rule in Add mode.

## Out of scope

Any server model/route for budgets (Phase 9 migrates this local store to the backend). Cross-month budget history.
