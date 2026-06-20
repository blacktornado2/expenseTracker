# Phase 4: Activity + Edit Transaction Sheet

## Context

The Activity tab today is the legacy `transactions.tsx`. This phase rebuilds it to the design's browse/search/filter screen (README §Screens → 2. Activity) and adds the **Edit Transaction bottom sheet** (README §Modals) reachable by tapping any transaction row across Home, Activity, and the Income list.

Depends on Phase 3 (reuses `CategoryChips`, the validation pattern, and the credit/debit mapping). See roadmap for cross-cutting decisions.

## Goal

A searchable, filterable transaction list, plus a slide-up Edit Transaction sheet that prefills from a row and can save changes or delete.

## Current state (relevant facts)

- `client/app/(logged-in)/(tabs)/transactions.tsx` is the legacy list (renamed to the Activity tab in Phase 1, content unchanged).
- Update/delete txn paths exist: `PUT /transaction/:transactionId`, `DELETE /transaction/:transactionId` via service → saga.
- A separate `transactionDetail.tsx` screen currently handles viewing/editing; the design replaces that interaction with a bottom sheet. Decide at execution time whether to retire `transactionDetail.tsx`.

## Design

### Activity screen layout (padding `54px 18px 26px`)

- Title "Activity" (Bricolage 30/800).
- **Search field** — radius 16, white, 1.5px `border-input`, leading search icon, trailing ✕ clear when text present. Filters by name OR category, case-insensitive.
- **Filter chips** — `All`, `Expenses`, `Income`. Active chip filled with its color (All `#2BB3FF`, Expenses `#E8322A`, Income `#0FB46B`), white text; inactive = white card.
- **Empty state** — centered search icon + "No transactions found" + hint, shown when filters/search yield nothing.
- Transaction list — `TransactionRow` (Phase 1). Row tap → opens Edit Transaction sheet.

Local state: `searchQuery`, `filter`. Derived filtered list via a memoized selector/`useMemo` over Redux transactions.

### Edit Transaction bottom sheet

- New `client/components/sheets/BottomSheet.tsx` — generic slide-up sheet over a `rgba(22,32,26,.45)` scrim; sheet bg `bg-app`, radius `28 28 0 0`, padding `22 20 ~36`; tap scrim to dismiss; ~200–300ms ease-out. (Use `@gorhom/bottom-sheet` or a hand-rolled `Animated`/`Modal` — pick at execution time; the README only specifies look + behavior. This component is reused by Phase 5's budget sheet.)
- New `client/components/sheets/EditTransactionSheet.tsx` — contents: Expense/Income toggle (`SegmentedToggle`), Name / Amount(`₹`) / Date inputs, `CategoryChips` (Phase 3), "Save changes" (green gradient) + "Delete transaction" (red `#FFF0F0` bg, `#E8322A` text).
- Behavior: prefill `txDraft` from the tapped row; on save → dispatch update (map fields back to credit/debit + signed amount); on delete → dispatch delete; close sheet; lists refresh from Redux.

### Wiring row taps

- Provide an `onPressRow(transaction)` from each list (Home, Activity, Income list) that opens the sheet. Centralize sheet state where it can overlay the screen (screen-level state or a small context).

### Error handling

- Save/delete failure: keep the sheet open, show an inline error, don't drop the user's edits.
- Deleting the last transaction → lists fall back to their empty states cleanly.

### Testing

- Unit: the filter/search predicate (name OR category, case-insensitive; All/Expenses/Income) — pure logic, TDD it.
- Unit: row → `txDraft` prefill and the draft → update-payload mapping (credit/debit + sign).
- Manual: search and each filter chip; empty state; open the sheet from Home, Activity, and (once Phase 7 exists) Income list; edit a txn and confirm the change reflects everywhere; delete a txn.

## Out of scope

Add flow (Phase 3). Income list screen (Phase 7) — wire its row taps to this sheet when it's built. Server-side category metadata.
