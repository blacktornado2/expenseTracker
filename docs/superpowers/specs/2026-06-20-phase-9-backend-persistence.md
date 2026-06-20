# Phase 9: Backend Persistence (Budgets, Savings, Sync)

## Context

Phases 5 and 7 deliberately kept **budgets** and the **savings goal/history** as local-only (AsyncStorage), per the roadmap's local-first decision. This is the "dedicated backend phase" Phase 1 promised. It moves those domains to the server so data survives reinstalls and syncs across devices, and reconciles any remaining transaction/category data-model gaps.

This phase has **no new screens** — it's a persistence + sync layer behind the existing Phase 5 / Phase 7 UI. The UI should be swappable with minimal change because Phases 5/7 isolated their storage behind a context/store boundary.

See roadmap for cross-cutting decisions, especially §data model reconciliation.

## Goal

Server-backed CRUD for budgets and savings goal/history, with the Phase 5/7 client stores migrated from AsyncStorage to Redux/saga + API, and a one-time migration of any existing local data.

## Current state (relevant facts)

- Server has `User` and `Transaction` models + controllers/routes, JWT `protect` middleware, `config/db.js`. Pattern to mirror: `transaction.model.js` / `transaction.controller.js` / `transaction.routes.js`.
- Client has the Redux/redux-saga/service pattern (`*.actions.ts`, `*.reducer.ts`, `*.sagas.ts`, `*.service.ts`, `action.types.ts`, `selectors.ts`) — mirror it for budgets/savings.
- Phase 5 budgets and Phase 7 savings goal currently persist to AsyncStorage behind a context/store boundary.

## Design

### New server models

- **`Budget`** (`server/models/budget.model.js`): `{ user (ObjectId ref User, required), category (String, required), limit (Number, required), createdAt }`. Unique per `(user, category)` to enforce the "one budget per category" rule from Phase 5.
- **`SavingsGoal`** (`server/models/savingsGoal.model.js`): `{ user (ObjectId ref User, required, unique), amount (Number) }`. One per user.
- (Savings *history* stays derived from transactions per month — do **not** persist a separate history table; the Phase 7 6-bar trend computes from transactions + a current goal. Only the goal target is persisted.)

### New server routes/controllers (mirror transaction pattern, all behind `protect`)

- `server/routes/budget.routes.js`: `GET /budget` (user's budgets), `POST /budget`, `PUT /budget/:id`, `DELETE /budget/:id`. Controller scopes every query to `req.user`.
- `server/routes/savingsGoal.routes.js`: `GET /savings-goal`, `PUT /savings-goal` (upsert). Controller scopes to `req.user`.
- Register both in `server/app.js` alongside the existing routers.

### Client migration

- Add Redux slices mirroring the transaction slice: actions + types (`*_REQUEST/SUCCESS/FAILURE`), reducers, sagas, services for **budgets** and **savings goal**.
- Replace the Phase 5 `BudgetsContext`/AsyncStorage reads/writes with dispatches to the new budget slice; same for the Phase 7 savings goal. **The Budgets and Savings screens' JSX should barely change** — only the data source behind their props.
- **One-time migration**: on first run after this phase, if local AsyncStorage budgets/goal exist, POST them to the server, then clear the local copies (guard with a migration flag so it runs once).

### Transaction / category reconciliation (finish the roadmap item)

- Confirm the `credit↔income` / `debit↔expense` + signed-amount mapping is centralized in one client layer (service/selector), not scattered. Refactor if Phases 3/4 left duplicates.
- **Custom categories**: decide whether `customCatMeta` needs server storage. Recommendation: add an optional `categoriesMeta` (or per-user custom category list) to the `User` model **only if** users report losing custom categories across devices; otherwise leave client-side. Document the decision; don't over-build (YAGNI).

### Error handling

- All new endpoints: 401 via `protect`, 400 on validation failure, 404 when editing/deleting another user's or a missing record, scoped strictly to `req.user`.
- Client sagas: failure actions surface inline errors; optimistic updates roll back on failure (mirror existing transaction error handling).
- Migration: if the server POST fails, keep local data (don't clear) and retry next launch.

### Testing

- Server: budget CRUD scoped to user (can't read/edit another user's budget); unique-per-category enforcement; savings-goal upsert.
- Client: budget/savings reducers + the AsyncStorage→server migration (runs once, clears local on success, preserves on failure).
- Manual: create budgets + set a goal as local (pre-migration build), then run this build → confirm they appear server-side and survive a reinstall; confirm a second device/login sees the same budgets/goal.

## Out of scope

New UI (Budgets/Savings screens already exist). Multi-currency conversion. Real-time sync/websockets — simple request/response is enough.
