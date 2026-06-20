# Phase 10: Dark Mode Polish + Final QA

## Context

By now every screen exists and dark-mode tokens have been applied opportunistically as each phase was built (the cross-cutting rule: tokens + `dark:` variants from day one). This final phase is a dedicated sweep to make dark mode pixel-correct everywhere, finish transitions/empty/error states, and run an end-to-end QA pass against the design (README §Suggested Build Order step 10).

This is intentionally **last** — a polish pass only makes sense once all screens are in place.

See roadmap for cross-cutting decisions.

## Goal

Every screen looks correct in both light and dark mode, all transitions/empty/error states match the design, and the app passes a full manual walkthrough against the handoff prototype.

## Current state (relevant facts)

- `ThemeContext` (`isDark`/`toggleDark()`, AsyncStorage-persisted) from Phase 1; Settings toggle from Phase 8.
- Light + dark token sets in `tailwind.config.js` from Phase 1.
- All screens (Home, Activity, Add, Budgets, Insights, Savings, Income, Profile, Settings) + sheets exist.

## Design / checklist

### Dark mode correctness sweep

Go screen-by-screen with dark mode on and compare to the prototype's `data-dark="true"` state:

- **Shadows**: per the dark token table, `--shadow-card` and `--shadow-tx` become `none` in dark; `--shadow-tab` / `--shadow-key` deepen. Confirm every `Card`, `TransactionRow`, tab bar, and numpad key follows this.
- **Surfaces/text/borders**: confirm every screen uses `bg-app`/`bg-card`/`bg-subtle`/`bg-close` and `tx-*`/`border-*` tokens, never a hard-coded light hex. Grep for raw hex in `client/app` and `client/components` and convert stragglers.
- **Gradients**: the green hero gradient and red/green button gradients stay the same in both modes (brand colors) — verify they read well on dark surfaces (decorative translucent circles, white text contrast).
- **Charts/rings**: donut, stacked bar, budget rings, trend bars — confirm `bg-close` track color and category colors render correctly on dark.
- **Inputs/chips/numpad**: focus, selected, and error states (`#E8322A` red, `#FFF5F5`/`#FFF0F0` soft reds) all have correct dark equivalents.

### Transitions

- Bottom sheets slide/fade in (~200–300ms ease-out).
- Dark-mode toggle thumb translates +20px.
- Chart bars / ring fills have subtle height/arc transitions.
- Confirm no janky/instant swaps where the design specifies motion.

### Empty & error states (verify each exists and is styled)

- Home: no transactions → ₹0 hero, empty chart legend, empty Recent.
- Activity: "No transactions found" (search/filter yields nothing).
- Insights: "No expenses recorded" for a month with none.
- Budgets: no budgets → add prompt.
- Income list: empty state.
- Savings: "Goal reached! 🎉" vs "₹X to go".
- Add/Edit: `nameError` / `amountError` red states.
- Network failures across create/update/delete/profile/budgets surface inline (don't crash, don't lose drafts).

### Final QA walkthrough

End-to-end against the prototype: navigate every tab + every drill-down, open every sheet, toggle light/dark on each, create/edit/delete a transaction, set a budget, set a savings goal, edit profile — in both themes. Note and fix any visual or behavioral drift from the README.

### Testing

- Manual: the full light/dark walkthrough above is the core deliverable; keep a checklist of screens × {light, dark} × {populated, empty, error} and tick each.
- Regression: re-run the unit tests added across Phases 2–9 (selectors, amount input, filters, savings/budget math, server CRUD) — confirm still green.
- No new automated tests are strictly required; this phase is verification + visual fit-and-finish.

## Out of scope

New features. The Insights category drill-down (a post-port enhancement, see Phase 6 out-of-scope). Performance optimization beyond removing obvious jank.
