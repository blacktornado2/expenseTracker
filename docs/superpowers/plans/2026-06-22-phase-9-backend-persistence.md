# Phase 9: Backend Persistence (Budgets, Savings, Sync) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move budgets and the savings goal from client-only AsyncStorage to server-backed CRUD, migrating the Phase 5/7 stores to Redux/redux-saga + API with a one-time local→server migration.

**Architecture:** Two new Mongoose models (`Budget`, `SavingsGoal`) with controllers/routes mirroring the existing `transaction.*` pattern, all behind `protect` and scoped to `req.user`. On the client, two new Redux slices (actions/types/reducer/saga/service) mirror the transaction slice. The Phase 5/7 hooks (`useBudgets`, `useSavingsGoal`) are reimplemented on top of Redux while keeping their **exact same public signatures**, so the Budgets/Savings screen JSX does not change. A one-time migration util POSTs any existing AsyncStorage data to the server, then clears it behind a flag.

**Tech Stack:** Node/Express 5 + Mongoose 8 + Jest (server); React Native/Expo + Redux + redux-saga + axios + Jest (client). New server dev deps: `mongodb-memory-server`, `supertest`.

## Global Constraints

- Server: every new query MUST be scoped to `req.user.id`; all routes mounted behind `protect`. Error codes: 401 (no/invalid token, via `protect`), 400 (validation failure), 404 (missing record OR record owned by another user), 500 (unexpected). Copy verbatim from spec §Error handling.
- Server controller/route/model file naming mirrors `transaction.model.js` / `transaction.controller.js` / `transaction.routes.js`. Routes registered in `server/app.js` under `/api/...`.
- Client slice file naming mirrors the transaction slice: `*.actions.ts`, `action.types.ts`, `*.reducer.ts`, `*.sagas.ts`, `*.service.ts`, `selectors.ts`. Action type strings follow the `*_REQUEST` / `*_SUCCESS` / `*_FAILURE` convention.
- Client error handling mirrors the **existing** transaction slice: state is mutated on `*_SUCCESS`, errors stored on `*_FAILURE`. (The existing slice is success-applied, not optimistic; follow it for consistency rather than the spec's looser "optimistic" wording.)
- The Budgets screen (`client/screens/BudgetsScreen.tsx`), `client/components/sheets/BudgetSheet.tsx`, and `client/screens/SavingsScreen.tsx` JSX MUST NOT change. Only the hooks behind them change.
- `Budget` public type stays `{ cat: string; limit: number }`; `useSavingsGoal()` stays `{ goal: number; setGoal: (n:number)=>Promise<void> }`.
- Server unit currency/amounts are plain `Number`. No multi-currency, no websockets, no new screens (spec §Out of scope).
- API base URL on client: `Constants.expoConfig?.extra?.API_BASE_URL` (see `client/redux/services/transaction.service.ts`).

## File Structure

**Server (new):**
- `server/models/budget.model.js` — Budget schema, compound unique index `(user, category)`.
- `server/controllers/budget.controller.js` — CRUD, scoped to `req.user`.
- `server/routes/budget.routes.js` — `GET / POST / PUT /:id DELETE /:id`, behind `protect`.
- `server/models/savingsGoal.model.js` — SavingsGoal schema, `user` unique.
- `server/controllers/savingsGoal.controller.js` — get + upsert, scoped to `req.user`.
- `server/routes/savingsGoal.routes.js` — `GET /`, `PUT /`, behind `protect`.
- `server/utils/testDb.js` — in-memory Mongo connect/clear/close helper for integration tests.
- Test files: `server/controllers/__tests__/budget.controller.test.js`, `server/controllers/__tests__/savingsGoal.controller.test.js`.

**Server (modified):**
- `server/app.js` — register both routers.
- `server/package.json` — add `mongodb-memory-server`, `supertest` dev deps.

**Client (new):**
- `client/redux/actions/budget.actions.ts`, `client/redux/reducers/budget.reducer.ts`, `client/redux/sagas/budget.sagas.ts`, `client/redux/services/budget.service.ts`.
- `client/redux/actions/savingsGoal.actions.ts`, `client/redux/reducers/savingsGoal.reducer.ts`, `client/redux/sagas/savingsGoal.sagas.ts`, `client/redux/services/savingsGoal.service.ts`.
- `client/utils/dataMigration.ts` — one-time migration orchestrator.
- `client/docs/...` decision note (Task 10).
- Test files mirror existing `__tests__` layout for reducers, sagas, and `dataMigration`.

**Client (modified):**
- `client/redux/actions/action.types.ts` — add budget + savings-goal types.
- `client/redux/reducers/index.ts` — register `budget`, `savingsGoal`.
- `client/redux/sagas/index.ts` — fork new watchers.
- `client/contexts/BudgetsContext.tsx` — reimplement `useBudgets` on Redux (same signature).
- `client/contexts/SavingsGoalContext.tsx` — reimplement `useSavingsGoal` on Redux (same signature).
- `client/app/(logged-in)/_layout.tsx` — run migration once when token is available.
- `client/utils/transactionMappings.ts` + consumers — centralize credit↔income mapping (Task 10).

---

## Task 1: Budget server model + CRUD + integration tests

**Files:**
- Create: `server/models/budget.model.js`
- Create: `server/controllers/budget.controller.js`
- Create: `server/routes/budget.routes.js`
- Create: `server/utils/testDb.js`
- Create: `server/controllers/__tests__/budget.controller.test.js`
- Modify: `server/app.js`
- Modify: `server/package.json` (dev deps)

**Interfaces:**
- Produces (routes): base `/api/budget`. `GET /` → array of `{_id, user, category, limit, createdAt}`; `POST /` body `{category, limit}` → 201 budget doc; `PUT /:id` body `{limit}` → 200 budget doc; `DELETE /:id` → 200 `{message}`. 400 on missing/invalid `category`/`limit` or duplicate category; 404 on missing/other-user record.
- Produces (controller exports): `getBudgetsByUser`, `createBudget`, `updateBudget`, `deleteBudget`.

- [ ] **Step 1: Add server test deps**

Run:
```bash
cd server && npm install --save-dev mongodb-memory-server supertest
```
Expected: both packages added to `devDependencies` in `server/package.json`.

- [ ] **Step 2: Write the in-memory Mongo test helper**

Create `server/utils/testDb.js`:
```js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongo;

module.exports = {
  connect: async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  },
  clearDatabase: async () => {
    const { collections } = mongoose.connection;
    for (const key of Object.keys(collections)) {
      await collections[key].deleteMany({});
    }
  },
  closeDatabase: async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (mongo) await mongo.stop();
  },
};
```

- [ ] **Step 3: Write the failing budget controller test**

Create `server/controllers/__tests__/budget.controller.test.js`:
```js
const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('../../utils/testDb');
const BudgetController = require('../budget.controller');

// Minimal app that injects a fake authenticated user (bypasses JWT).
function makeApp(userId) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.user = { id: userId }; next(); });
  app.get('/budget', BudgetController.getBudgetsByUser);
  app.post('/budget', BudgetController.createBudget);
  app.put('/budget/:id', BudgetController.updateBudget);
  app.delete('/budget/:id', BudgetController.deleteBudget);
  return app;
}

const USER_A = new mongoose.Types.ObjectId().toString();
const USER_B = new mongoose.Types.ObjectId().toString();

beforeAll(connect);
afterEach(clearDatabase);
afterAll(closeDatabase);

describe('budget controller', () => {
  it('creates a budget scoped to the user and returns it', async () => {
    const res = await request(makeApp(USER_A)).post('/budget').send({ category: 'groceries', limit: 5000 });
    expect(res.status).toBe(201);
    expect(res.body.category).toBe('groceries');
    expect(res.body.limit).toBe(5000);
    expect(res.body.user).toBe(USER_A);
  });

  it('rejects a budget with missing category or limit with 400', async () => {
    const res = await request(makeApp(USER_A)).post('/budget').send({ category: 'groceries' });
    expect(res.status).toBe(400);
  });

  it('enforces one budget per (user, category) with 400 on duplicate', async () => {
    const app = makeApp(USER_A);
    await request(app).post('/budget').send({ category: 'groceries', limit: 5000 });
    const dup = await request(app).post('/budget').send({ category: 'groceries', limit: 9000 });
    expect(dup.status).toBe(400);
  });

  it('returns only the requesting user\'s budgets', async () => {
    await request(makeApp(USER_A)).post('/budget').send({ category: 'groceries', limit: 5000 });
    await request(makeApp(USER_B)).post('/budget').send({ category: 'fuel', limit: 3000 });
    const res = await request(makeApp(USER_A)).get('/budget');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].category).toBe('groceries');
  });

  it('404s when updating another user\'s budget', async () => {
    const created = await request(makeApp(USER_B)).post('/budget').send({ category: 'fuel', limit: 3000 });
    const res = await request(makeApp(USER_A)).put(`/budget/${created.body._id}`).send({ limit: 1 });
    expect(res.status).toBe(404);
  });

  it('updates the user\'s own budget limit', async () => {
    const created = await request(makeApp(USER_A)).post('/budget').send({ category: 'fuel', limit: 3000 });
    const res = await request(makeApp(USER_A)).put(`/budget/${created.body._id}`).send({ limit: 4500 });
    expect(res.status).toBe(200);
    expect(res.body.limit).toBe(4500);
  });

  it('404s when deleting another user\'s budget, 200 for own', async () => {
    const created = await request(makeApp(USER_B)).post('/budget').send({ category: 'fuel', limit: 3000 });
    const denied = await request(makeApp(USER_A)).delete(`/budget/${created.body._id}`);
    expect(denied.status).toBe(404);
    const ok = await request(makeApp(USER_B)).delete(`/budget/${created.body._id}`);
    expect(ok.status).toBe(200);
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `cd server && npx jest budget.controller`
Expected: FAIL — `Cannot find module '../budget.controller'`.

- [ ] **Step 5: Write the Budget model**

Create `server/models/budget.model.js`:
```js
const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  limit: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// One budget per category per user (Phase 5 rule).
budgetSchema.index({ user: 1, category: 1 }, { unique: true });

const Budget = mongoose.model('Budget', budgetSchema);

module.exports = Budget;
```

- [ ] **Step 6: Write the Budget controller**

Create `server/controllers/budget.controller.js`:
```js
const Budget = require('../models/budget.model');

module.exports = {
  getBudgetsByUser: async (req, res) => {
    try {
      const budgets = await Budget.find({ user: req.user.id });
      return res.status(200).json(budgets);
    } catch (err) {
      console.log('Error fetching budgets', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  createBudget: async (req, res) => {
    try {
      const { category, limit } = req.body;
      if (!category || limit === undefined || limit === null) {
        return res.status(400).json({ message: 'category and limit are required' });
      }
      const budget = new Budget({ category, limit, user: req.user.id });
      await budget.save();
      return res.status(201).json(budget);
    } catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({ message: 'A budget for this category already exists' });
      }
      if (err.name === 'ValidationError') {
        return res.status(400).json({ message: err.message });
      }
      console.log('Error creating budget', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  updateBudget: async (req, res) => {
    try {
      const { id } = req.params;
      const { limit } = req.body;
      const budget = await Budget.findOneAndUpdate(
        { _id: id, user: req.user.id },
        { limit },
        { new: true, runValidators: true }
      );
      if (!budget) {
        return res.status(404).json({ message: 'Budget not found' });
      }
      return res.status(200).json(budget);
    } catch (err) {
      if (err.name === 'ValidationError') {
        return res.status(400).json({ message: err.message });
      }
      console.log('Error updating budget', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  deleteBudget: async (req, res) => {
    try {
      const { id } = req.params;
      const budget = await Budget.findOneAndDelete({ _id: id, user: req.user.id });
      if (!budget) {
        return res.status(404).json({ message: 'Budget not found' });
      }
      return res.status(200).json({ message: 'Budget deleted successfully' });
    } catch (err) {
      console.log('Error deleting budget', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
};
```

- [ ] **Step 7: Write the Budget routes**

Create `server/routes/budget.routes.js`:
```js
const router = require('express').Router;

const BudgetController = require('../controllers/budget.controller');
const { protect } = require('../middlewares/auth.middleware');

const BudgetRouter = router();

BudgetRouter.use(protect);

BudgetRouter.get('/', BudgetController.getBudgetsByUser);
BudgetRouter.post('/', BudgetController.createBudget);
BudgetRouter.put('/:id', BudgetController.updateBudget);
BudgetRouter.delete('/:id', BudgetController.deleteBudget);

module.exports = BudgetRouter;
```

- [ ] **Step 8: Register the router in app.js**

Modify `server/app.js` — add the import and mount alongside the existing routers:
```js
const BudgetRouter = require("./routes/budget.routes");
```
```js
app.use("/api/budget", BudgetRouter);
```

- [ ] **Step 9: Run the test to verify it passes**

Run: `cd server && npx jest budget.controller`
Expected: PASS — all 7 cases green.

- [ ] **Step 10: Commit**

```bash
git add server/models/budget.model.js server/controllers/budget.controller.js server/routes/budget.routes.js server/utils/testDb.js server/controllers/__tests__/budget.controller.test.js server/app.js server/package.json server/package-lock.json
git commit -m "feat(server): budget CRUD scoped to user with unique-per-category"
```

---

## Task 2: SavingsGoal server model + upsert + integration tests

**Files:**
- Create: `server/models/savingsGoal.model.js`
- Create: `server/controllers/savingsGoal.controller.js`
- Create: `server/routes/savingsGoal.routes.js`
- Create: `server/controllers/__tests__/savingsGoal.controller.test.js`
- Modify: `server/app.js`

**Interfaces:**
- Consumes: `server/utils/testDb.js` (from Task 1).
- Produces (routes): base `/api/savings-goal`. `GET /` → `{ amount }` (0 when none set); `PUT /` body `{amount}` → 200 `{ amount }` (upsert, one per user).
- Produces (controller exports): `getSavingsGoal`, `upsertSavingsGoal`.

- [ ] **Step 1: Write the failing savings-goal controller test**

Create `server/controllers/__tests__/savingsGoal.controller.test.js`:
```js
const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('../../utils/testDb');
const SavingsGoalController = require('../savingsGoal.controller');

function makeApp(userId) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.user = { id: userId }; next(); });
  app.get('/savings-goal', SavingsGoalController.getSavingsGoal);
  app.put('/savings-goal', SavingsGoalController.upsertSavingsGoal);
  return app;
}

const USER_A = new mongoose.Types.ObjectId().toString();
const USER_B = new mongoose.Types.ObjectId().toString();

beforeAll(connect);
afterEach(clearDatabase);
afterAll(closeDatabase);

describe('savings goal controller', () => {
  it('returns amount 0 when no goal is set', async () => {
    const res = await request(makeApp(USER_A)).get('/savings-goal');
    expect(res.status).toBe(200);
    expect(res.body.amount).toBe(0);
  });

  it('creates the goal on first PUT (upsert)', async () => {
    const res = await request(makeApp(USER_A)).put('/savings-goal').send({ amount: 20000 });
    expect(res.status).toBe(200);
    expect(res.body.amount).toBe(20000);
  });

  it('overwrites the existing goal on a second PUT (one per user)', async () => {
    const app = makeApp(USER_A);
    await request(app).put('/savings-goal').send({ amount: 20000 });
    await request(app).put('/savings-goal').send({ amount: 35000 });
    const res = await request(app).get('/savings-goal');
    expect(res.body.amount).toBe(35000);
  });

  it('scopes the goal to the user', async () => {
    await request(makeApp(USER_A)).put('/savings-goal').send({ amount: 20000 });
    const res = await request(makeApp(USER_B)).get('/savings-goal');
    expect(res.body.amount).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd server && npx jest savingsGoal.controller`
Expected: FAIL — `Cannot find module '../savingsGoal.controller'`.

- [ ] **Step 3: Write the SavingsGoal model**

Create `server/models/savingsGoal.model.js`:
```js
const mongoose = require('mongoose');

const savingsGoalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  amount: {
    type: Number,
    default: 0,
  },
});

const SavingsGoal = mongoose.model('SavingsGoal', savingsGoalSchema);

module.exports = SavingsGoal;
```

- [ ] **Step 4: Write the SavingsGoal controller**

Create `server/controllers/savingsGoal.controller.js`:
```js
const SavingsGoal = require('../models/savingsGoal.model');

module.exports = {
  getSavingsGoal: async (req, res) => {
    try {
      const goal = await SavingsGoal.findOne({ user: req.user.id });
      return res.status(200).json({ amount: goal ? goal.amount : 0 });
    } catch (err) {
      console.log('Error fetching savings goal', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  upsertSavingsGoal: async (req, res) => {
    try {
      const { amount } = req.body;
      if (amount === undefined || amount === null || Number.isNaN(Number(amount))) {
        return res.status(400).json({ message: 'amount is required' });
      }
      const goal = await SavingsGoal.findOneAndUpdate(
        { user: req.user.id },
        { amount },
        { new: true, upsert: true, runValidators: true }
      );
      return res.status(200).json({ amount: goal.amount });
    } catch (err) {
      console.log('Error upserting savings goal', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
};
```

- [ ] **Step 5: Write the SavingsGoal routes**

Create `server/routes/savingsGoal.routes.js`:
```js
const router = require('express').Router;

const SavingsGoalController = require('../controllers/savingsGoal.controller');
const { protect } = require('../middlewares/auth.middleware');

const SavingsGoalRouter = router();

SavingsGoalRouter.use(protect);

SavingsGoalRouter.get('/', SavingsGoalController.getSavingsGoal);
SavingsGoalRouter.put('/', SavingsGoalController.upsertSavingsGoal);

module.exports = SavingsGoalRouter;
```

- [ ] **Step 6: Register the router in app.js**

Modify `server/app.js` — add the import and mount:
```js
const SavingsGoalRouter = require("./routes/savingsGoal.routes");
```
```js
app.use("/api/savings-goal", SavingsGoalRouter);
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `cd server && npx jest savingsGoal.controller`
Expected: PASS — all 4 cases green.

- [ ] **Step 8: Run the full server suite**

Run: `cd server && npm test`
Expected: PASS — budget, savingsGoal, and existing userUpdate suites all green.

- [ ] **Step 9: Commit**

```bash
git add server/models/savingsGoal.model.js server/controllers/savingsGoal.controller.js server/routes/savingsGoal.routes.js server/controllers/__tests__/savingsGoal.controller.test.js server/app.js
git commit -m "feat(server): savings-goal get + upsert scoped to user"
```

---

## Task 3: Budget client action types, actions, reducer

**Files:**
- Modify: `client/redux/actions/action.types.ts`
- Create: `client/redux/actions/budget.actions.ts`
- Create: `client/redux/reducers/budget.reducer.ts`
- Create: `client/redux/reducers/__tests__/budget.reducer.test.ts`
- Modify: `client/redux/reducers/index.ts`

**Interfaces:**
- Produces (types): `GET_BUDGETS_REQUEST/SUCCESS/FAILURE`, `CREATE_BUDGET_REQUEST/SUCCESS/FAILURE`, `UPDATE_BUDGET_REQUEST/SUCCESS/FAILURE`, `DELETE_BUDGET_REQUEST/SUCCESS/FAILURE`.
- Produces (actions): `getBudgets()`, `getBudgetsSuccess(data)`, `createBudget({category, limit})`, `createBudgetSuccess(data)`, `createBudgetFailure(err)`, `updateBudget({id, limit})`, `updateBudgetSuccess(data)`, `updateBudgetFailure(err)`, `deleteBudget(id)`, `deleteBudgetSuccess(id)`, `deleteBudgetFailure(err)`.
- Produces (state shape `state.budget`): `{ budgets: ServerBudget[], createError, updateError, deleteError }` where `ServerBudget = { _id, category, limit }`.

- [ ] **Step 1: Add the action type constants**

Modify `client/redux/actions/action.types.ts` — append:
```ts
// budget actions
export const GET_BUDGETS_REQUEST = "GET_BUDGETS_REQUEST";
export const GET_BUDGETS_SUCCESS = "GET_BUDGETS_SUCCESS";
export const GET_BUDGETS_FAILURE = "GET_BUDGETS_FAILURE";

export const CREATE_BUDGET_REQUEST = "CREATE_BUDGET_REQUEST";
export const CREATE_BUDGET_SUCCESS = "CREATE_BUDGET_SUCCESS";
export const CREATE_BUDGET_FAILURE = "CREATE_BUDGET_FAILURE";

export const UPDATE_BUDGET_REQUEST = "UPDATE_BUDGET_REQUEST";
export const UPDATE_BUDGET_SUCCESS = "UPDATE_BUDGET_SUCCESS";
export const UPDATE_BUDGET_FAILURE = "UPDATE_BUDGET_FAILURE";

export const DELETE_BUDGET_REQUEST = "DELETE_BUDGET_REQUEST";
export const DELETE_BUDGET_SUCCESS = "DELETE_BUDGET_SUCCESS";
export const DELETE_BUDGET_FAILURE = "DELETE_BUDGET_FAILURE";
```

- [ ] **Step 2: Write the budget actions**

Create `client/redux/actions/budget.actions.ts`:
```ts
import {
  GET_BUDGETS_REQUEST,
  GET_BUDGETS_SUCCESS,
  CREATE_BUDGET_REQUEST,
  CREATE_BUDGET_SUCCESS,
  CREATE_BUDGET_FAILURE,
  UPDATE_BUDGET_REQUEST,
  UPDATE_BUDGET_SUCCESS,
  UPDATE_BUDGET_FAILURE,
  DELETE_BUDGET_REQUEST,
  DELETE_BUDGET_SUCCESS,
  DELETE_BUDGET_FAILURE,
} from "./action.types";

export type CreateBudgetPayload = { category: string; limit: number };
export type UpdateBudgetPayload = { id: string; limit: number };

export const getBudgets = () => ({ type: GET_BUDGETS_REQUEST });
export const getBudgetsSuccess = (data: any) => ({ type: GET_BUDGETS_SUCCESS, payload: data });

export const createBudget = (payload: CreateBudgetPayload) => ({ type: CREATE_BUDGET_REQUEST, payload });
export const createBudgetSuccess = (data: any) => ({ type: CREATE_BUDGET_SUCCESS, payload: data });
export const createBudgetFailure = (error: any) => ({ type: CREATE_BUDGET_FAILURE, payload: error });

export const updateBudget = (payload: UpdateBudgetPayload) => ({ type: UPDATE_BUDGET_REQUEST, payload });
export const updateBudgetSuccess = (data: any) => ({ type: UPDATE_BUDGET_SUCCESS, payload: data });
export const updateBudgetFailure = (error: any) => ({ type: UPDATE_BUDGET_FAILURE, payload: error });

export const deleteBudget = (id: string) => ({ type: DELETE_BUDGET_REQUEST, payload: { id } });
export const deleteBudgetSuccess = (id: string) => ({ type: DELETE_BUDGET_SUCCESS, payload: { id } });
export const deleteBudgetFailure = (error: any) => ({ type: DELETE_BUDGET_FAILURE, payload: error });
```

- [ ] **Step 3: Write the failing budget reducer test**

Create `client/redux/reducers/__tests__/budget.reducer.test.ts`:
```ts
import budgetReducer from '../budget.reducer';
import {
  GET_BUDGETS_SUCCESS,
  CREATE_BUDGET_SUCCESS,
  CREATE_BUDGET_FAILURE,
  UPDATE_BUDGET_SUCCESS,
  DELETE_BUDGET_SUCCESS,
} from '../../actions/action.types';

const base = { budgets: [] as any[], createError: null, updateError: null, deleteError: null };

describe('budgetReducer', () => {
  it('replaces budgets on GET_BUDGETS_SUCCESS', () => {
    const next = budgetReducer(base, { type: GET_BUDGETS_SUCCESS, payload: [{ _id: 'a', category: 'fuel', limit: 100 }] });
    expect(next.budgets).toEqual([{ _id: 'a', category: 'fuel', limit: 100 }]);
  });

  it('appends a budget and clears createError on CREATE_BUDGET_SUCCESS', () => {
    const state = { ...base, budgets: [{ _id: 'a', category: 'fuel', limit: 100 }], createError: new Error('x') };
    const next = budgetReducer(state, { type: CREATE_BUDGET_SUCCESS, payload: { _id: 'b', category: 'food', limit: 200 } });
    expect(next.budgets).toHaveLength(2);
    expect(next.budgets[1]).toEqual({ _id: 'b', category: 'food', limit: 200 });
    expect(next.createError).toBeNull();
  });

  it('stores the error on CREATE_BUDGET_FAILURE without touching budgets', () => {
    const state = { ...base, budgets: [{ _id: 'a', category: 'fuel', limit: 100 }] };
    const error = new Error('dup');
    const next = budgetReducer(state, { type: CREATE_BUDGET_FAILURE, payload: error });
    expect(next.budgets).toHaveLength(1);
    expect(next.createError).toBe(error);
  });

  it('replaces a budget in place on UPDATE_BUDGET_SUCCESS', () => {
    const state = { ...base, budgets: [{ _id: 'a', category: 'fuel', limit: 100 }] };
    const next = budgetReducer(state, { type: UPDATE_BUDGET_SUCCESS, payload: { _id: 'a', category: 'fuel', limit: 250 } });
    expect(next.budgets).toEqual([{ _id: 'a', category: 'fuel', limit: 250 }]);
  });

  it('removes a budget on DELETE_BUDGET_SUCCESS', () => {
    const state = { ...base, budgets: [{ _id: 'a', category: 'fuel', limit: 100 }, { _id: 'b', category: 'food', limit: 200 }] };
    const next = budgetReducer(state, { type: DELETE_BUDGET_SUCCESS, payload: { id: 'a' } });
    expect(next.budgets).toEqual([{ _id: 'b', category: 'food', limit: 200 }]);
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `cd client && npx jest budget.reducer --watchAll=false`
Expected: FAIL — `Cannot find module '../budget.reducer'`.

- [ ] **Step 5: Write the budget reducer**

Create `client/redux/reducers/budget.reducer.ts`:
```ts
import {
  GET_BUDGETS_SUCCESS,
  CREATE_BUDGET_SUCCESS,
  CREATE_BUDGET_FAILURE,
  UPDATE_BUDGET_SUCCESS,
  UPDATE_BUDGET_FAILURE,
  DELETE_BUDGET_SUCCESS,
  DELETE_BUDGET_FAILURE,
} from '../actions/action.types';

const initialState = {
  budgets: [] as any[],
  createError: null as any,
  updateError: null as any,
  deleteError: null as any,
};

const budgetReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case GET_BUDGETS_SUCCESS:
      return { ...state, budgets: action.payload };
    case CREATE_BUDGET_SUCCESS:
      return { ...state, budgets: [...state.budgets, action.payload], createError: null };
    case CREATE_BUDGET_FAILURE:
      return { ...state, createError: action.payload };
    case UPDATE_BUDGET_SUCCESS:
      return {
        ...state,
        updateError: null,
        budgets: state.budgets.map((b) => (b._id === action.payload._id ? action.payload : b)),
      };
    case UPDATE_BUDGET_FAILURE:
      return { ...state, updateError: action.payload };
    case DELETE_BUDGET_SUCCESS:
      return { ...state, deleteError: null, budgets: state.budgets.filter((b) => b._id !== action.payload.id) };
    case DELETE_BUDGET_FAILURE:
      return { ...state, deleteError: action.payload };
    default:
      return state;
  }
};

export default budgetReducer;
```

- [ ] **Step 6: Register the reducer**

Modify `client/redux/reducers/index.ts`:
```ts
import budgetReducer from "./budget.reducer";
```
```ts
export const rootReducer = combineReducers({
  user: userReducer,
  transaction: transactionReducer,
  budget: budgetReducer,
});
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `cd client && npx jest budget.reducer --watchAll=false`
Expected: PASS — all 5 cases green.

- [ ] **Step 8: Commit**

```bash
git add client/redux/actions/action.types.ts client/redux/actions/budget.actions.ts client/redux/reducers/budget.reducer.ts client/redux/reducers/__tests__/budget.reducer.test.ts client/redux/reducers/index.ts
git commit -m "feat(client): budget redux actions + reducer"
```

---

## Task 4: Budget client service + sagas

**Files:**
- Create: `client/redux/services/budget.service.ts`
- Create: `client/redux/sagas/budget.sagas.ts`
- Create: `client/redux/sagas/__tests__/budget.sagas.test.ts`
- Modify: `client/redux/sagas/index.ts`

**Interfaces:**
- Consumes: budget actions (Task 3), `userSelector` from `client/redux/store/selectors.ts`.
- Produces (services): `getBudgetsService(token)`, `createBudgetService(token, {category, limit})`, `updateBudgetService(token, id, {limit})`, `deleteBudgetService(token, id)` — each returns `{ status, data }`.
- Produces (saga watcher): `watchBudgetRequests`.

- [ ] **Step 1: Write the budget service**

Create `client/redux/services/budget.service.ts`:
```ts
import axios from 'axios';
import Constants from 'expo-constants';

import type { CreateBudgetPayload } from '../actions/budget.actions';

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL ?? '';

export const getBudgetsService = async (token: string) => {
  const { status, data } = await axios.get(`${API_BASE_URL}/budget`, {
    headers: { authorization: `Bearer ${token}` },
  });
  return { status, data };
};

export const createBudgetService = async (token: string, payload: CreateBudgetPayload) => {
  const { status, data } = await axios.post(`${API_BASE_URL}/budget`, payload, {
    headers: { authorization: `Bearer ${token}` },
  });
  return { status, data };
};

export const updateBudgetService = async (token: string, id: string, payload: { limit: number }) => {
  const { status, data } = await axios.put(`${API_BASE_URL}/budget/${id}`, payload, {
    headers: { authorization: `Bearer ${token}` },
  });
  return { status, data };
};

export const deleteBudgetService = async (token: string, id: string) => {
  const { status, data } = await axios.delete(`${API_BASE_URL}/budget/${id}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  return { status, data };
};
```

- [ ] **Step 2: Write the failing budget saga test**

Create `client/redux/sagas/__tests__/budget.sagas.test.ts`:
```ts
import { call, put, select } from 'redux-saga/effects';
import { createBudgetSaga } from '../budget.sagas';
import { userSelector } from '../../store/selectors';
import { createBudgetService } from '../../services/budget.service';
import { createBudgetSuccess, createBudgetFailure } from '../../actions/budget.actions';

describe('createBudgetSaga', () => {
  const action = { type: 'CREATE_BUDGET_REQUEST', payload: { category: 'fuel', limit: 3000 } };

  it('selects token, calls service, puts success on happy path', () => {
    const gen = createBudgetSaga(action as any);
    expect(gen.next().value).toEqual(select(userSelector));
    expect(gen.next({ token: 'abc' }).value).toEqual(call(createBudgetService, 'abc', action.payload));
    const data = { _id: '1', category: 'fuel', limit: 3000 };
    expect(gen.next({ data }).value).toEqual(put(createBudgetSuccess(data)));
    expect(gen.next().done).toBe(true);
  });

  it('puts a failure action when the service throws', () => {
    const gen = createBudgetSaga(action as any);
    gen.next();
    gen.next({ token: 'abc' });
    const error = new Error('dup');
    expect(gen.throw(error).value).toEqual(put(createBudgetFailure(error)));
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd client && npx jest budget.sagas --watchAll=false`
Expected: FAIL — `Cannot find module '../budget.sagas'`.

- [ ] **Step 4: Write the budget sagas**

Create `client/redux/sagas/budget.sagas.ts`:
```ts
import { call, put, takeLatest, select } from "redux-saga/effects";
import {
  getBudgetsService,
  createBudgetService,
  updateBudgetService,
  deleteBudgetService,
} from '../services/budget.service';
import { userSelector } from "../store/selectors";
import {
  GET_BUDGETS_REQUEST,
  CREATE_BUDGET_REQUEST,
  UPDATE_BUDGET_REQUEST,
  DELETE_BUDGET_REQUEST,
} from "../actions/action.types";
import {
  getBudgetsSuccess,
  createBudgetSuccess,
  createBudgetFailure,
  updateBudgetSuccess,
  updateBudgetFailure,
  deleteBudgetSuccess,
  deleteBudgetFailure,
} from '../actions/budget.actions';

export function* getBudgetsSaga() {
  try {
    const { token } = yield select(userSelector);
    const { data } = yield call(getBudgetsService, token);
    yield put(getBudgetsSuccess(data));
  } catch (err) {
    console.log('get budgets saga failed', err);
  }
}

export function* createBudgetSaga(action: any) {
  try {
    const { token } = yield select(userSelector);
    const { data } = yield call(createBudgetService, token, action.payload);
    yield put(createBudgetSuccess(data));
  } catch (err) {
    yield put(createBudgetFailure(err));
  }
}

export function* updateBudgetSaga(action: any) {
  try {
    const { token } = yield select(userSelector);
    const { id, limit } = action.payload;
    const { data } = yield call(updateBudgetService, token, id, { limit });
    yield put(updateBudgetSuccess(data));
  } catch (err) {
    yield put(updateBudgetFailure(err));
  }
}

export function* deleteBudgetSaga(action: any) {
  try {
    const { token } = yield select(userSelector);
    yield call(deleteBudgetService, token, action.payload.id);
    yield put(deleteBudgetSuccess(action.payload.id));
  } catch (err) {
    yield put(deleteBudgetFailure(err));
  }
}

export function* watchBudgetRequests() {
  yield takeLatest(GET_BUDGETS_REQUEST, getBudgetsSaga);
  yield takeLatest(CREATE_BUDGET_REQUEST, createBudgetSaga);
  yield takeLatest(UPDATE_BUDGET_REQUEST, updateBudgetSaga);
  yield takeLatest(DELETE_BUDGET_REQUEST, deleteBudgetSaga);
}
```

- [ ] **Step 5: Register the watcher**

Modify `client/redux/sagas/index.ts`:
```ts
import { watchBudgetRequests } from './budget.sagas';
```
```ts
  yield fork(watchBudgetRequests);
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `cd client && npx jest budget.sagas --watchAll=false`
Expected: PASS — both cases green.

- [ ] **Step 7: Commit**

```bash
git add client/redux/services/budget.service.ts client/redux/sagas/budget.sagas.ts client/redux/sagas/__tests__/budget.sagas.test.ts client/redux/sagas/index.ts
git commit -m "feat(client): budget service + sagas wired into root saga"
```

---

## Task 5: Migrate `useBudgets` hook to Redux (screens unchanged)

**Files:**
- Modify: `client/contexts/BudgetsContext.tsx`

**Interfaces:**
- Consumes: budget actions (Task 3), `state.budget.budgets` (Task 3 shape), `useDispatch`/`useSelector` from `react-redux`.
- Produces: `useBudgets()` returns `{ budgets: Budget[], addBudget, updateBudget, deleteBudget }` — **identical signature** to the AsyncStorage version, so `BudgetsScreen.tsx` and `BudgetSheet.tsx` are untouched. `Budget` stays `{ cat, limit }`. `BudgetsProvider` stays exported as a passthrough so `app/_layout.tsx` keeps compiling unchanged.

- [ ] **Step 1: Reimplement the context file on Redux**

Replace the entire contents of `client/contexts/BudgetsContext.tsx`:
```tsx
import React, { useEffect, type ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getBudgets,
  createBudget,
  updateBudget as updateBudgetAction,
  deleteBudget as deleteBudgetAction,
} from '@/redux/actions/budget.actions';

export type Budget = {
  cat: string;
  limit: number;
};

type ServerBudget = { _id: string; category: string; limit: number };

export type BudgetsContextValue = {
  budgets: Budget[];
  addBudget: (budget: Budget) => Promise<void>;
  updateBudget: (cat: string, limit: number) => Promise<void>;
  deleteBudget: (cat: string) => Promise<void>;
};

// Provider is now a passthrough — Redux holds the state. Kept so app/_layout.tsx
// (which wraps the tree in <BudgetsProvider>) does not need to change.
export function BudgetsProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useBudgets(): BudgetsContextValue {
  const dispatch = useDispatch();
  const serverBudgets = useSelector(
    (state: any) => (state.budget?.budgets ?? []) as ServerBudget[]
  );

  useEffect(() => {
    dispatch(getBudgets());
  }, [dispatch]);

  const budgets: Budget[] = serverBudgets.map((b) => ({ cat: b.category, limit: b.limit }));

  const idForCat = (cat: string): string | undefined =>
    serverBudgets.find((b) => b.category === cat)?._id;

  const addBudget = async (budget: Budget) => {
    dispatch(createBudget({ category: budget.cat, limit: budget.limit }));
  };

  const updateBudget = async (cat: string, limit: number) => {
    const id = idForCat(cat);
    if (id) dispatch(updateBudgetAction({ id, limit }));
  };

  const deleteBudget = async (cat: string) => {
    const id = idForCat(cat);
    if (id) dispatch(deleteBudgetAction(id));
  };

  return { budgets, addBudget, updateBudget, deleteBudget };
}
```

- [ ] **Step 2: Type-check the screens still compile against the unchanged interface**

Run: `cd client && npx tsc --noEmit`
Expected: PASS — no errors in `screens/BudgetsScreen.tsx` or `components/sheets/BudgetSheet.tsx` (their imports of `useBudgets`/`Budget` are unchanged).

- [ ] **Step 3: Run the existing client suite to confirm no regressions**

Run: `cd client && npx jest --watchAll=false`
Expected: PASS — all suites green.

- [ ] **Step 4: Commit**

```bash
git add client/contexts/BudgetsContext.tsx
git commit -m "refactor(client): back useBudgets with Redux, drop AsyncStorage"
```

---

## Task 6: SavingsGoal client action types, actions, reducer

**Files:**
- Modify: `client/redux/actions/action.types.ts`
- Create: `client/redux/actions/savingsGoal.actions.ts`
- Create: `client/redux/reducers/savingsGoal.reducer.ts`
- Create: `client/redux/reducers/__tests__/savingsGoal.reducer.test.ts`
- Modify: `client/redux/reducers/index.ts`

**Interfaces:**
- Produces (types): `GET_SAVINGS_GOAL_REQUEST/SUCCESS/FAILURE`, `SET_SAVINGS_GOAL_REQUEST/SUCCESS/FAILURE`.
- Produces (actions): `getSavingsGoal()`, `getSavingsGoalSuccess({amount})`, `setSavingsGoal(amount)`, `setSavingsGoalSuccess({amount})`, `setSavingsGoalFailure(err)`.
- Produces (state shape `state.savingsGoal`): `{ amount: number, error }`.

- [ ] **Step 1: Add the action type constants**

Modify `client/redux/actions/action.types.ts` — append:
```ts
// savings goal actions
export const GET_SAVINGS_GOAL_REQUEST = "GET_SAVINGS_GOAL_REQUEST";
export const GET_SAVINGS_GOAL_SUCCESS = "GET_SAVINGS_GOAL_SUCCESS";
export const GET_SAVINGS_GOAL_FAILURE = "GET_SAVINGS_GOAL_FAILURE";

export const SET_SAVINGS_GOAL_REQUEST = "SET_SAVINGS_GOAL_REQUEST";
export const SET_SAVINGS_GOAL_SUCCESS = "SET_SAVINGS_GOAL_SUCCESS";
export const SET_SAVINGS_GOAL_FAILURE = "SET_SAVINGS_GOAL_FAILURE";
```

- [ ] **Step 2: Write the savings-goal actions**

Create `client/redux/actions/savingsGoal.actions.ts`:
```ts
import {
  GET_SAVINGS_GOAL_REQUEST,
  GET_SAVINGS_GOAL_SUCCESS,
  SET_SAVINGS_GOAL_REQUEST,
  SET_SAVINGS_GOAL_SUCCESS,
  SET_SAVINGS_GOAL_FAILURE,
} from "./action.types";

export const getSavingsGoal = () => ({ type: GET_SAVINGS_GOAL_REQUEST });
export const getSavingsGoalSuccess = (data: { amount: number }) => ({
  type: GET_SAVINGS_GOAL_SUCCESS,
  payload: data,
});

export const setSavingsGoal = (amount: number) => ({ type: SET_SAVINGS_GOAL_REQUEST, payload: { amount } });
export const setSavingsGoalSuccess = (data: { amount: number }) => ({
  type: SET_SAVINGS_GOAL_SUCCESS,
  payload: data,
});
export const setSavingsGoalFailure = (error: any) => ({ type: SET_SAVINGS_GOAL_FAILURE, payload: error });
```

- [ ] **Step 3: Write the failing savings-goal reducer test**

Create `client/redux/reducers/__tests__/savingsGoal.reducer.test.ts`:
```ts
import savingsGoalReducer from '../savingsGoal.reducer';
import {
  GET_SAVINGS_GOAL_SUCCESS,
  SET_SAVINGS_GOAL_SUCCESS,
  SET_SAVINGS_GOAL_FAILURE,
} from '../../actions/action.types';

const base = { amount: 0, error: null };

describe('savingsGoalReducer', () => {
  it('sets amount on GET_SAVINGS_GOAL_SUCCESS', () => {
    const next = savingsGoalReducer(base, { type: GET_SAVINGS_GOAL_SUCCESS, payload: { amount: 20000 } });
    expect(next.amount).toBe(20000);
  });

  it('sets amount and clears error on SET_SAVINGS_GOAL_SUCCESS', () => {
    const state = { amount: 0, error: new Error('x') };
    const next = savingsGoalReducer(state, { type: SET_SAVINGS_GOAL_SUCCESS, payload: { amount: 35000 } });
    expect(next.amount).toBe(35000);
    expect(next.error).toBeNull();
  });

  it('stores the error and keeps amount on SET_SAVINGS_GOAL_FAILURE', () => {
    const state = { amount: 20000, error: null };
    const error = new Error('network');
    const next = savingsGoalReducer(state, { type: SET_SAVINGS_GOAL_FAILURE, payload: error });
    expect(next.amount).toBe(20000);
    expect(next.error).toBe(error);
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `cd client && npx jest savingsGoal.reducer --watchAll=false`
Expected: FAIL — `Cannot find module '../savingsGoal.reducer'`.

- [ ] **Step 5: Write the savings-goal reducer**

Create `client/redux/reducers/savingsGoal.reducer.ts`:
```ts
import {
  GET_SAVINGS_GOAL_SUCCESS,
  SET_SAVINGS_GOAL_SUCCESS,
  SET_SAVINGS_GOAL_FAILURE,
} from '../actions/action.types';

const initialState = {
  amount: 0,
  error: null as any,
};

const savingsGoalReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case GET_SAVINGS_GOAL_SUCCESS:
      return { ...state, amount: action.payload.amount };
    case SET_SAVINGS_GOAL_SUCCESS:
      return { ...state, amount: action.payload.amount, error: null };
    case SET_SAVINGS_GOAL_FAILURE:
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

export default savingsGoalReducer;
```

- [ ] **Step 6: Register the reducer**

Modify `client/redux/reducers/index.ts`:
```ts
import savingsGoalReducer from "./savingsGoal.reducer";
```
```ts
export const rootReducer = combineReducers({
  user: userReducer,
  transaction: transactionReducer,
  budget: budgetReducer,
  savingsGoal: savingsGoalReducer,
});
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `cd client && npx jest savingsGoal.reducer --watchAll=false`
Expected: PASS — all 3 cases green.

- [ ] **Step 8: Commit**

```bash
git add client/redux/actions/action.types.ts client/redux/actions/savingsGoal.actions.ts client/redux/reducers/savingsGoal.reducer.ts client/redux/reducers/__tests__/savingsGoal.reducer.test.ts client/redux/reducers/index.ts
git commit -m "feat(client): savings-goal redux actions + reducer"
```

---

## Task 7: SavingsGoal client service + sagas

**Files:**
- Create: `client/redux/services/savingsGoal.service.ts`
- Create: `client/redux/sagas/savingsGoal.sagas.ts`
- Create: `client/redux/sagas/__tests__/savingsGoal.sagas.test.ts`
- Modify: `client/redux/sagas/index.ts`

**Interfaces:**
- Consumes: savings-goal actions (Task 6), `userSelector`.
- Produces (services): `getSavingsGoalService(token)`, `setSavingsGoalService(token, amount)` — each returns `{ status, data }` where `data = { amount }`.
- Produces (saga watcher): `watchSavingsGoalRequests`.

- [ ] **Step 1: Write the savings-goal service**

Create `client/redux/services/savingsGoal.service.ts`:
```ts
import axios from 'axios';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL ?? '';

export const getSavingsGoalService = async (token: string) => {
  const { status, data } = await axios.get(`${API_BASE_URL}/savings-goal`, {
    headers: { authorization: `Bearer ${token}` },
  });
  return { status, data };
};

export const setSavingsGoalService = async (token: string, amount: number) => {
  const { status, data } = await axios.put(`${API_BASE_URL}/savings-goal`, { amount }, {
    headers: { authorization: `Bearer ${token}` },
  });
  return { status, data };
};
```

- [ ] **Step 2: Write the failing savings-goal saga test**

Create `client/redux/sagas/__tests__/savingsGoal.sagas.test.ts`:
```ts
import { call, put, select } from 'redux-saga/effects';
import { setSavingsGoalSaga } from '../savingsGoal.sagas';
import { userSelector } from '../../store/selectors';
import { setSavingsGoalService } from '../../services/savingsGoal.service';
import { setSavingsGoalSuccess, setSavingsGoalFailure } from '../../actions/savingsGoal.actions';

describe('setSavingsGoalSaga', () => {
  const action = { type: 'SET_SAVINGS_GOAL_REQUEST', payload: { amount: 35000 } };

  it('selects token, calls service, puts success on happy path', () => {
    const gen = setSavingsGoalSaga(action as any);
    expect(gen.next().value).toEqual(select(userSelector));
    expect(gen.next({ token: 'abc' }).value).toEqual(call(setSavingsGoalService, 'abc', 35000));
    const data = { amount: 35000 };
    expect(gen.next({ data }).value).toEqual(put(setSavingsGoalSuccess(data)));
    expect(gen.next().done).toBe(true);
  });

  it('puts a failure action when the service throws', () => {
    const gen = setSavingsGoalSaga(action as any);
    gen.next();
    gen.next({ token: 'abc' });
    const error = new Error('network');
    expect(gen.throw(error).value).toEqual(put(setSavingsGoalFailure(error)));
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd client && npx jest savingsGoal.sagas --watchAll=false`
Expected: FAIL — `Cannot find module '../savingsGoal.sagas'`.

- [ ] **Step 4: Write the savings-goal sagas**

Create `client/redux/sagas/savingsGoal.sagas.ts`:
```ts
import { call, put, takeLatest, select } from "redux-saga/effects";
import { getSavingsGoalService, setSavingsGoalService } from '../services/savingsGoal.service';
import { userSelector } from "../store/selectors";
import { GET_SAVINGS_GOAL_REQUEST, SET_SAVINGS_GOAL_REQUEST } from "../actions/action.types";
import {
  getSavingsGoalSuccess,
  setSavingsGoalSuccess,
  setSavingsGoalFailure,
} from '../actions/savingsGoal.actions';

export function* getSavingsGoalSaga() {
  try {
    const { token } = yield select(userSelector);
    const { data } = yield call(getSavingsGoalService, token);
    yield put(getSavingsGoalSuccess(data));
  } catch (err) {
    console.log('get savings goal saga failed', err);
  }
}

export function* setSavingsGoalSaga(action: any) {
  try {
    const { token } = yield select(userSelector);
    const { data } = yield call(setSavingsGoalService, token, action.payload.amount);
    yield put(setSavingsGoalSuccess(data));
  } catch (err) {
    yield put(setSavingsGoalFailure(err));
  }
}

export function* watchSavingsGoalRequests() {
  yield takeLatest(GET_SAVINGS_GOAL_REQUEST, getSavingsGoalSaga);
  yield takeLatest(SET_SAVINGS_GOAL_REQUEST, setSavingsGoalSaga);
}
```

- [ ] **Step 5: Register the watcher**

Modify `client/redux/sagas/index.ts`:
```ts
import { watchSavingsGoalRequests } from './savingsGoal.sagas';
```
```ts
  yield fork(watchSavingsGoalRequests);
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `cd client && npx jest savingsGoal.sagas --watchAll=false`
Expected: PASS — both cases green.

- [ ] **Step 7: Commit**

```bash
git add client/redux/services/savingsGoal.service.ts client/redux/sagas/savingsGoal.sagas.ts client/redux/sagas/__tests__/savingsGoal.sagas.test.ts client/redux/sagas/index.ts
git commit -m "feat(client): savings-goal service + sagas wired into root saga"
```

---

## Task 8: Migrate `useSavingsGoal` hook to Redux (screen unchanged)

**Files:**
- Modify: `client/contexts/SavingsGoalContext.tsx`

**Interfaces:**
- Consumes: savings-goal actions (Task 6), `state.savingsGoal.amount` (Task 6 shape).
- Produces: `useSavingsGoal()` returns `{ goal: number, setGoal: (n:number)=>Promise<void> }` — identical signature, so `SavingsScreen.tsx` is untouched. `SavingsGoalProvider` stays exported as a passthrough.

- [ ] **Step 1: Reimplement the context file on Redux**

Replace the entire contents of `client/contexts/SavingsGoalContext.tsx`:
```tsx
import React, { useEffect, type ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSavingsGoal, setSavingsGoal as setSavingsGoalAction } from '@/redux/actions/savingsGoal.actions';

export type SavingsGoalContextValue = {
  goal: number;
  setGoal: (goal: number) => Promise<void>;
};

// Passthrough provider — Redux holds the state. Kept so app/_layout.tsx
// (which wraps the tree in <SavingsGoalProvider>) does not need to change.
export function SavingsGoalProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useSavingsGoal(): SavingsGoalContextValue {
  const dispatch = useDispatch();
  const goal = useSelector((state: any) => state.savingsGoal?.amount ?? 0);

  useEffect(() => {
    dispatch(getSavingsGoal());
  }, [dispatch]);

  const setGoal = async (next: number) => {
    dispatch(setSavingsGoalAction(next));
  };

  return { goal, setGoal };
}
```

- [ ] **Step 2: Type-check and run the suite**

Run: `cd client && npx tsc --noEmit && npx jest --watchAll=false`
Expected: PASS — `SavingsScreen.tsx` compiles unchanged; all suites green.

- [ ] **Step 3: Commit**

```bash
git add client/contexts/SavingsGoalContext.tsx
git commit -m "refactor(client): back useSavingsGoal with Redux, drop AsyncStorage"
```

---

## Task 9: One-time AsyncStorage → server migration

**Files:**
- Create: `client/utils/dataMigration.ts`
- Create: `client/utils/__tests__/dataMigration.test.ts`
- Modify: `client/app/(logged-in)/_layout.tsx`

**Interfaces:**
- Consumes: budget service `createBudgetService` (Task 4), savings-goal service `setSavingsGoalService` (Task 7), AsyncStorage keys `'BUDGETS'` and `'SAVINGS_GOAL'` (the legacy keys from the old contexts), a new flag key `'PHASE9_MIGRATED'`.
- Produces: `runDataMigration(deps: MigrationDeps): Promise<'skipped' | 'migrated' | 'failed'>` — pure orchestrator with injected deps. On success: clears local + sets flag. On any failure: leaves local intact, flag unset (retry next launch).

- [ ] **Step 1: Write the failing migration test**

Create `client/utils/__tests__/dataMigration.test.ts`:
```ts
import { runDataMigration, type MigrationDeps } from '../dataMigration';

function makeDeps(overrides: Partial<MigrationDeps> = {}): MigrationDeps {
  return {
    isMigrated: jest.fn().mockResolvedValue(false),
    setMigrated: jest.fn().mockResolvedValue(undefined),
    loadLocalBudgets: jest.fn().mockResolvedValue([{ cat: 'fuel', limit: 3000 }]),
    loadLocalGoal: jest.fn().mockResolvedValue(20000),
    postBudget: jest.fn().mockResolvedValue(undefined),
    putGoal: jest.fn().mockResolvedValue(undefined),
    clearLocal: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('runDataMigration', () => {
  it('skips when already migrated', async () => {
    const deps = makeDeps({ isMigrated: jest.fn().mockResolvedValue(true) });
    expect(await runDataMigration(deps)).toBe('skipped');
    expect(deps.postBudget).not.toHaveBeenCalled();
    expect(deps.clearLocal).not.toHaveBeenCalled();
  });

  it('sets the flag and skips POSTs when there is no local data', async () => {
    const deps = makeDeps({
      loadLocalBudgets: jest.fn().mockResolvedValue([]),
      loadLocalGoal: jest.fn().mockResolvedValue(0),
    });
    expect(await runDataMigration(deps)).toBe('skipped');
    expect(deps.postBudget).not.toHaveBeenCalled();
    expect(deps.setMigrated).toHaveBeenCalledTimes(1);
  });

  it('posts each budget + goal, then clears local and sets flag on success', async () => {
    const deps = makeDeps();
    expect(await runDataMigration(deps)).toBe('migrated');
    expect(deps.postBudget).toHaveBeenCalledWith({ category: 'fuel', limit: 3000 });
    expect(deps.putGoal).toHaveBeenCalledWith(20000);
    expect(deps.clearLocal).toHaveBeenCalledTimes(1);
    expect(deps.setMigrated).toHaveBeenCalledTimes(1);
  });

  it('does not post the goal when local goal is 0', async () => {
    const deps = makeDeps({ loadLocalGoal: jest.fn().mockResolvedValue(0) });
    await runDataMigration(deps);
    expect(deps.putGoal).not.toHaveBeenCalled();
    expect(deps.postBudget).toHaveBeenCalledTimes(1);
  });

  it('preserves local data and does not set the flag when a POST fails', async () => {
    const deps = makeDeps({ postBudget: jest.fn().mockRejectedValue(new Error('network')) });
    expect(await runDataMigration(deps)).toBe('failed');
    expect(deps.clearLocal).not.toHaveBeenCalled();
    expect(deps.setMigrated).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd client && npx jest dataMigration --watchAll=false`
Expected: FAIL — `Cannot find module '../dataMigration'`.

- [ ] **Step 3: Write the migration orchestrator**

Create `client/utils/dataMigration.ts`:
```ts
export type MigrationDeps = {
  isMigrated: () => Promise<boolean>;
  setMigrated: () => Promise<void>;
  loadLocalBudgets: () => Promise<{ cat: string; limit: number }[]>;
  loadLocalGoal: () => Promise<number>;
  postBudget: (payload: { category: string; limit: number }) => Promise<void>;
  putGoal: (amount: number) => Promise<void>;
  clearLocal: () => Promise<void>;
};

export type MigrationResult = 'skipped' | 'migrated' | 'failed';

export async function runDataMigration(deps: MigrationDeps): Promise<MigrationResult> {
  if (await deps.isMigrated()) {
    return 'skipped';
  }

  const budgets = await deps.loadLocalBudgets();
  const goal = await deps.loadLocalGoal();

  if (budgets.length === 0 && goal <= 0) {
    await deps.setMigrated();
    return 'skipped';
  }

  try {
    for (const b of budgets) {
      await deps.postBudget({ category: b.cat, limit: b.limit });
    }
    if (goal > 0) {
      await deps.putGoal(goal);
    }
    await deps.clearLocal();
    await deps.setMigrated();
    return 'migrated';
  } catch (err) {
    console.log('data migration failed, will retry next launch', err);
    return 'failed';
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd client && npx jest dataMigration --watchAll=false`
Expected: PASS — all 5 cases green.

- [ ] **Step 5: Wire the migration into the logged-in layout**

Modify `client/app/(logged-in)/_layout.tsx` — add the imports at the top:
```tsx
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userSelector } from '@/redux/store/selectors';
import { getBudgets } from '@/redux/actions/budget.actions';
import { getSavingsGoal } from '@/redux/actions/savingsGoal.actions';
import { useDispatch } from 'react-redux';
import { createBudgetService } from '@/redux/services/budget.service';
import { setSavingsGoalService } from '@/redux/services/savingsGoal.service';
import { runDataMigration } from '@/utils/dataMigration';
```
Inside the layout component body (where `token` is available via `useSelector(userSelector)`), add the effect. Build the deps from AsyncStorage + the services, then refresh Redux from the server after a successful migration:
```tsx
const dispatch = useDispatch();
const { token } = useSelector(userSelector);

useEffect(() => {
  if (!token) return;
  runDataMigration({
    isMigrated: async () => (await AsyncStorage.getItem('PHASE9_MIGRATED')) === 'true',
    setMigrated: async () => { await AsyncStorage.setItem('PHASE9_MIGRATED', 'true'); },
    loadLocalBudgets: async () => {
      const raw = await AsyncStorage.getItem('BUDGETS');
      return raw ? JSON.parse(raw) : [];
    },
    loadLocalGoal: async () => {
      const raw = await AsyncStorage.getItem('SAVINGS_GOAL');
      const n = raw ? Number(raw) : 0;
      return Number.isFinite(n) ? n : 0;
    },
    postBudget: async (payload) => { await createBudgetService(token, payload); },
    putGoal: async (amount) => { await setSavingsGoalService(token, amount); },
    clearLocal: async () => { await AsyncStorage.multiRemove(['BUDGETS', 'SAVINGS_GOAL']); },
  }).then((result) => {
    if (result === 'migrated') {
      dispatch(getBudgets());
      dispatch(getSavingsGoal());
    }
  });
}, [token, dispatch]);
```
(If `client/app/(logged-in)/_layout.tsx` does not already read `token`, add `const { token } = useSelector(userSelector);` once and reuse it. Do not duplicate the `useDispatch`/`useSelector` calls if they already exist — merge into the existing ones.)

- [ ] **Step 6: Type-check and run the full client suite**

Run: `cd client && npx tsc --noEmit && npx jest --watchAll=false`
Expected: PASS — no type errors; all suites green.

- [ ] **Step 7: Commit**

```bash
git add client/utils/dataMigration.ts client/utils/__tests__/dataMigration.test.ts "client/app/(logged-in)/_layout.tsx"
git commit -m "feat(client): one-time AsyncStorage to server migration for budgets + goal"
```

---

## Task 10: Transaction/category reconciliation + custom-category decision

**Files:**
- Modify: `client/utils/transactionMappings.ts`
- Modify: `client/utils/__tests__/transactionMappings.test.ts`
- Create: `docs/superpowers/decisions/2026-06-22-phase-9-custom-categories.md`

**Interfaces:**
- Produces (helpers): `entryTypeToTxnType(entry: 'expense' | 'income'): 'debit' | 'credit'` and `txnTypeToEntryType(txn: 'credit' | 'debit'): 'expense' | 'income'`, exported from `client/utils/transactionMappings.ts`. Existing `rawToTxDraft`/`txDraftToUpdatePayload` are refactored to call them (no behavior change).

- [ ] **Step 1: Add failing tests for the centralized mapping helpers**

Modify `client/utils/__tests__/transactionMappings.test.ts` — add:
```ts
import { entryTypeToTxnType, txnTypeToEntryType } from '../transactionMappings';

describe('credit↔income mapping helpers', () => {
  it('maps entry type to transaction type', () => {
    expect(entryTypeToTxnType('income')).toBe('credit');
    expect(entryTypeToTxnType('expense')).toBe('debit');
  });
  it('maps transaction type to entry type', () => {
    expect(txnTypeToEntryType('credit')).toBe('income');
    expect(txnTypeToEntryType('debit')).toBe('expense');
  });
});
```
(If `client/utils/__tests__/transactionMappings.test.ts` does not exist yet, create it with the two `import` lines for `entryTypeToTxnType`/`txnTypeToEntryType` and the `describe` block above.)

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd client && npx jest transactionMappings --watchAll=false`
Expected: FAIL — `entryTypeToTxnType is not a function` / export missing.

- [ ] **Step 3: Add the helpers and refactor existing mappers to use them**

Modify `client/utils/transactionMappings.ts` — add the two exports and refactor the existing functions to call them:
```ts
export const entryTypeToTxnType = (entry: 'expense' | 'income'): 'credit' | 'debit' =>
  entry === 'income' ? 'credit' : 'debit';

export const txnTypeToEntryType = (txn: 'credit' | 'debit'): 'expense' | 'income' =>
  txn === 'credit' ? 'income' : 'expense';
```
Then change `rawToTxDraft` to use `entryType: txnTypeToEntryType(txn.transactionType)` and `txDraftToUpdatePayload` to use `transactionType: entryTypeToTxnType(draft.entryType)`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd client && npx jest transactionMappings --watchAll=false`
Expected: PASS — helper tests + existing mapping tests green.

- [ ] **Step 5: Audit remaining inline conversions in screens**

Run:
```bash
cd client && grep -rn "'income' ? 'credit'\|'credit' : 'debit'\|=== 'credit' ? 'income'" screens redux/store/selectors.ts --include="*.ts" --include="*.tsx"
```
For each hit that converts between `entryType` and `transactionType` (e.g. in `screens/AddTransactionNew.tsx`), replace the inline ternary with `entryTypeToTxnType(...)` / `txnTypeToEntryType(...)`, importing from `@/utils/transactionMappings`. Do **not** touch raw `transactionType === 'debit'` filters in `selectors.ts` — those are canonical reads, not conversions, and stay as-is.

- [ ] **Step 6: Write the custom-category decision note**

Create `docs/superpowers/decisions/2026-06-22-phase-9-custom-categories.md`:
```markdown
# Phase 9 decision: custom categories stay client-side

**Decision:** Custom category metadata (`customCatMeta` / `loadCustomCategories`) remains in
AsyncStorage on the client. We are NOT adding `categoriesMeta` to the `User` server model in
Phase 9.

**Rationale (YAGNI, per spec §Transaction/category reconciliation):** The spec says to add
per-user custom-category storage **only if** users report losing custom categories across
devices. No such reports exist. Budgets/savings reference categories by string key, which works
whether the key is a built-in or a custom category, so server-side budgets do not require the
custom-category metadata to be persisted server-side.

**Revisit when:** a user reports custom categories disappearing after reinstall or on a second
device. At that point, add an optional `categoriesMeta` array to `user.model.js` and migrate
`loadCustomCategories` to the server following the same slice pattern as budgets.

**Mapping centralization:** credit↔income / debit↔expense conversion is centralized in
`client/utils/transactionMappings.ts` (`entryTypeToTxnType` / `txnTypeToEntryType`). Signed-amount
handling and raw `transactionType` filtering live in `client/redux/store/selectors.ts`.
```

- [ ] **Step 7: Run both full suites**

Run: `cd client && npx jest --watchAll=false && cd ../server && npm test`
Expected: PASS — all client and server suites green.

- [ ] **Step 8: Commit**

```bash
git add client/utils/transactionMappings.ts client/utils/__tests__/transactionMappings.test.ts docs/superpowers/decisions/2026-06-22-phase-9-custom-categories.md
git commit -m "refactor(client): centralize credit/income mapping; document custom-category decision"
```

---

## Manual verification (spec §Testing — manual)

After Task 10, perform the spec's manual sync check (cannot be automated here):

1. On a build **before** this phase (or by seeding AsyncStorage), create a couple of budgets and set a savings goal so local `BUDGETS` / `SAVINGS_GOAL` exist.
2. Launch this build while logged in → confirm the budgets + goal POST to the server (check the DB / network), local copies are cleared, and `PHASE9_MIGRATED` is set.
3. Reinstall the app (or log in on a second device) → confirm the same budgets + goal load from the server (survive reinstall, sync across devices).
4. Confirm a failed migration (e.g. server down) leaves local data intact and retries on the next launch.

---

## Self-Review

**Spec coverage:**
- New server models (Budget, SavingsGoal) → Tasks 1, 2. ✅ Savings *history* deliberately NOT persisted (derived from transactions) — no table created. ✅
- New routes/controllers behind `protect`, scoped to `req.user`, registered in `app.js` → Tasks 1, 2. ✅
- Client Redux slices (actions/types/reducers/sagas/services) for budgets + savings → Tasks 3, 4, 6, 7. ✅
- Replace Phase 5/7 AsyncStorage with dispatches, screens barely change → Tasks 5, 8 (hooks reimplemented, JSX untouched). ✅
- One-time migration with flag, runs once, clears on success, preserves on failure → Task 9. ✅
- Transaction/category reconciliation + custom-category decision documented → Task 10. ✅
- Error handling (401/400/404, scoped) → Tasks 1, 2 (asserted in integration tests). ✅
- Testing (server CRUD scoping, unique-per-category, upsert; client reducers + migration) → Tasks 1, 2, 3, 6, 9. ✅
- Out of scope (no new screens, no multi-currency, no websockets) → respected. ✅

**Placeholder scan:** No TBD/"add error handling"/"similar to Task N" — every step has concrete code or an exact command. ✅

**Type consistency:** Server budget docs `{_id, category, limit}` flow consistently: controller returns them → service → saga → reducer `state.budget.budgets` → `useBudgets` maps `category`→`cat`. Savings `{amount}` flows controller → service → saga → reducer `state.savingsGoal.amount` → `useSavingsGoal().goal`. Action creator names match between actions files, sagas, and reducers. Migration `MigrationDeps` field names match between the test factory, the orchestrator, and the `_layout.tsx` wiring. ✅
