# Expense Tracker Redesign — Phase Roadmap

## Question answered: how many phases?

**10 phases total.** Phase 1 is already specced (`2026-06-20-phase-1-design-system-nav-restructure.md`). This roadmap defines Phases 2–10, each with its own plan file in this folder.

The handoff README (`design_handoff_expense_tracker/README.md`) suggests a 10-step build order. That order is UI-only and assumes everything is client-side mock state. Our app already has a real Node/Express + MongoDB backend and Redux/redux-saga, so two things change versus the README:

1. The README's "step 1" (tokens/fonts/primitives) and "step 2" (navigator/shells/FAB) are merged into our **Phase 1**.
2. The README never accounts for **backend work**. Phase 1 explicitly deferred all server changes (budgets, savings, profile fields) to "a dedicated backend phase." We make that explicit: profile backend folds into **Phase 8**, and budgets/savings backend gets its own **Phase 9**.

That nets out to 10 phases.

## Phase list

| Phase | Name | Plan file | Touches backend? |
|---|---|---|---|
| 1 | Design system + nav restructure | `…-phase-1-design-system-nav-restructure.md` | No |
| 2 | Home dashboard | `…-phase-2-home-dashboard.md` | No |
| 3 | Add Transaction flow | `…-phase-3-add-transaction.md` | Light (create txn) |
| 4 | Activity + Edit Transaction sheet | `…-phase-4-activity-edit-transaction.md` | Light (update/delete txn) |
| 5 | Budgets + Add/Edit Budget sheet | `…-phase-5-budgets.md` | No (local-only) |
| 6 | Insights | `…-phase-6-insights.md` | No |
| 7 | Savings + Income list drill-downs | `…-phase-7-savings-income-list.md` | No (local-only) |
| 8 | Profile (view/edit) | `…-phase-8-profile.md` | **Yes** (User fields + endpoint) |
| 9 | Backend persistence (budgets, savings, sync) | `…-phase-9-backend-persistence.md` | **Yes** (new models/routes) |
| 10 | Dark mode polish + final QA | `…-phase-10-dark-mode-polish.md` | No |

## Dependency graph

```
Phase 1 (foundation: tokens, fonts, primitives, 5-tab nav, FAB)
   │
   ├─► Phase 2 (Home)  ───────────────┐
   ├─► Phase 3 (Add)   ───────────────┤
   │        │                         │
   │        ▼                         │
   ├─► Phase 4 (Activity + Edit) ◄────┘ (reuses TransactionRow, category chips, sheet pattern)
   │
   ├─► Phase 5 (Budgets)      ─┐
   ├─► Phase 6 (Insights)     ─┤ (independent of each other; all consume txn data + tokens)
   ├─► Phase 7 (Savings/Income)┘
   │
   ├─► Phase 8 (Profile + backend profile fields)
   │
   ├─► Phase 9 (Backend persistence for budgets/savings → migrate Phase 5/7 local state to server)
   │
   └─► Phase 10 (Dark mode polish across everything above — must be last)
```

Hard ordering rules:
- **Phase 1 first.** Everything depends on tokens, fonts, and primitives.
- **Phase 3 before Phase 4.** Phase 4's Edit Transaction sheet reuses the category-chip selector and validation built in Phase 3. (If you'd rather not block, Phase 4 can stub the chips and Phase 3 backfills — but plan-as-written assumes 3 → 4.)
- **Phase 9 after Phases 5 and 7.** You can't migrate local budget/savings state to the server until those screens exist and define the data shape.
- **Phase 10 last.** A dark-mode polish pass only makes sense once all screens exist.
- Phases 5, 6, 7, 8 are mutually independent and can be reordered or parallelized.

## Cross-cutting decisions (apply to every phase)

These were set in Phase 1 and hold for the whole series:

1. **Tokens, not literals.** Every color/spacing/radius value comes from the Tailwind tokens added in Phase 1, via NativeWind `className` + `dark:` variants. No raw hex in screens.
2. **Fonts.** Bricolage Grotesque for display/headings/big numbers; Plus Jakarta Sans for body/UI. Loaded in Phase 1.
3. **Manual dark mode.** Driven by the Phase-1 `ThemeContext` (`isDark` / `toggleDark()`), persisted to AsyncStorage. Not OS-driven.
4. **Icons.** `lucide-react-native`. No emoji except the single 🎉 in the savings "Goal reached!" state.
5. **Currency.** INR (₹), `Intl.NumberFormat('en-IN')`; 2 decimals in lists, rounded for big hero figures.
6. **Local-first for budgets & savings goal.** Client state + AsyncStorage until Phase 9. No Mongo models/routes for these before Phase 9.
7. **Derived data is computed, never stored.** Per-category spend, ring %, savings = income − spent, savings rate, insights deltas, age from DOB.
8. **Presentational primitives stay store-agnostic.** `Card`, `IconTile`, `Avatar`, `TransactionRow` (Phase 1) take plain props; screens wire Redux/local state into them.

## Data model reconciliation (important, spans Phases 3, 4, 9)

The existing backend differs from the design's vocabulary — plan for the mapping rather than a rewrite:

- **Transaction type.** Server `transaction.model.js` uses `transactionType: "credit" | "debit"`. The design speaks of **income/expense** with a signed `amount` (+income / −expense). Keep the server enum; map at the client edge (`credit ↔ income`, `debit ↔ expense`) in the Redux service/selector layer. Big rewrites of the schema are out of scope.
- **Category metadata.** The design has per-category color + soft-bg + icon, plus user-created custom categories (`customCatMeta`). The server only stores a `category` string. Category → visual metadata is a **client concern** (a tokens/constants map from Phase 1/3). Custom categories persist client-side (AsyncStorage) until Phase 9 decides whether they need server storage.
- **No `monthSpent` field.** It's derived from transactions, never persisted.

## A note on plan depth

These phase files are written at **spec depth** (Context / Goal / Design / Out-of-scope / Testing), matching the existing Phase-1 spec — enough to start a phase and to see the whole arc. They are intentionally **not** yet broken into bite-sized TDD execution steps. When you actually start a phase, run the `superpowers:writing-plans` skill on that phase's spec to produce the task-by-task execution plan (in `docs/superpowers/plans/`), then execute it. That keeps execution detail close in time to the code it touches, instead of stale.
