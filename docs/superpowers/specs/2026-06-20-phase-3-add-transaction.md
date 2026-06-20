# Phase 3: Add Transaction Flow

## Context

Phase 1 added a FAB that navigates to a placeholder `addTransactionNew.tsx`. This phase builds the real redesigned Add Transaction full-screen flow (README §Screens → 8. Add Transaction) and wires it to create transactions via the existing Redux/saga + backend. It also introduces the **category chip selector and custom-category management** that Phase 4's Edit Transaction sheet reuses.

See the roadmap for cross-cutting decisions.

## Goal

A full-screen Add flow with an on-screen numpad, expense/income toggle, validated name/amount/date, and a selectable (and editable) category chip grid — submitting prepends a new transaction and navigates to Activity.

## Current state (relevant facts)

- Legacy `client/app/(logged-in)/addTransaction.tsx` exists and still works (form-based). Phase 1 left it untouched and pointed the FAB at a placeholder.
- Transaction create path exists: `transaction.service.ts` → saga → `POST /transaction` (server `transaction.controller.createTransaction`).
- Categories today are free-text strings; no color/icon metadata, no custom categories.

## Design

### Route

- Promote the Phase-1 placeholder to the real screen: `client/app/(logged-in)/addTransactionNew.tsx` (or rename to `addTransaction.tsx` after retiring the legacy one — decide at execution time; keep the FAB target consistent). Full-screen, no tab bar (already wired in Phase 1 as a `(logged-in)` stack sibling).

### Layout

- **Top bar**: "Cancel" (→ Home) + title ("New expense" / "New income", driven by `entryType`).
- **Expense/Income segmented toggle** — reuse `SegmentedToggle` (Phase 2). Expense active `#E8322A`, Income active `#0FB46B`.
- **Amount display** — centered "Amount" label + big `₹{amount}` (Bricolage 58/800). Color: green for income, dark for expense, **red `#E8322A` when `amountError`** (save attempted at 0).
- **Name field** (required) — pencil icon + text input; red border `#E8322A` / bg `#FFF5F5` when `nameError`.
- **Date field** — calendar icon + date input, defaults to today.
- **Category section** — header with an **Edit** toggle. Wrapping selectable chips (category color + icon + name; selected = soft bg + colored border + colored text). In edit mode: chips show a red ✕ delete badge + a dashed "Add" chip. Add-category editor: icon preview (opens a 30-icon picker), color swatch (opens a 12-color picker), name input, confirm.
- **Numpad** — 3-col grid `1–9 . 0 ⌫`, each 58px, white, radius 18, key shadow. Builds the amount string; `.` once; max 2 decimals; any key clears `amountError`.
- **Submit** — full-width 56px radius 18; "Add expense" (red gradient) / "Add income" (green gradient).

### New components

- `client/components/numpad/Numpad.tsx` + `NumpadKey.tsx` — pure UI; `onKey(key)` callback. Amount-string logic (append digit, single decimal, 2-decimal cap, backspace) lives in a tested pure helper `client/utils/amountInput.ts`.
- `client/components/categories/CategoryChips.tsx` — selectable chip grid; props: `categories`, `selected`, `onSelect`, `editMode`, `onDelete`, `onAdd`.
- `client/components/categories/CategoryEditor.tsx` — icon picker (30) + color swatch (12) + name input + confirm.
- `client/components/categories/IconPicker.tsx`, `ColorPicker.tsx`.

### Category metadata + custom categories

- A static map `client/constants/categories.ts`: built-in categories → `{ color, soft, icon }` (from README §Design Tokens → Category colors). The 12-swatch custom palette and 30-icon set also live here.
- Custom categories (`customCatMeta`) persist in **AsyncStorage** (roadmap: local-first). Loaded on app start, merged with built-ins.

### Submit behavior

- Validate: name non-empty (else `nameError`); amount > 0 (else `amountError`, amount turns red).
- On success: dispatch create-transaction (mapping `income → credit`, `expense → debit`; signed amount handled per existing service contract), reset the draft, navigate to **Activity**.
- The new txn appears on Home/Activity (they read Redux), so no manual list-prepend hack needed beyond the normal optimistic/refetch flow already used.

### Error handling

- Network/create failure: keep the user on the Add screen, surface an inline error, do not lose their draft.
- Numpad input is fully guarded by the `amountInput.ts` helper (no NaN, no multi-decimal).

### Testing

- Unit: `amountInput.ts` (append, decimal rules, 2-decimal cap, backspace, clear) — pure logic, TDD it.
- Unit: the income/expense ↔ credit/debit mapping in the create path.
- Manual: add an expense and an income; confirm validation reds; confirm a custom category can be created, selected, and persists across reload; confirm submit lands on Activity with the new row present.

## Out of scope

Editing existing transactions (Phase 4). Server-side category metadata (stays client-side; revisited in Phase 9). Retiring the legacy `addTransaction.tsx` is optional cleanup — fine to delete once the new flow is verified.
