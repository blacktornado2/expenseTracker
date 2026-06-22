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

Regression: client `npx jest --watchAll=false` ☑ green — 41 suites passed, 41 total; 227 tests passed, 227 total · server `npm test` ☑ green — 3 suites passed, 3 total; 17 tests passed, 17 total.

Notes / drift found: Manual light/dark device walkthrough not performed in this session (no device/simulator available in this environment); all cells above left unchecked for a human to tick during an actual device/simulator pass.
