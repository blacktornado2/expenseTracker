# Phase 4: Activity Screen + Edit Transaction Sheet

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy transaction list with a searchable/filterable Activity screen and add a slide-up Edit Transaction sheet reachable from Home and Activity that can update or delete any row.

**Architecture:** Pure Redux saga layer handles update/delete; two pure utility modules (filter predicate + draft mappings) are TDD'd in isolation; a generic `BottomSheet` + a form `EditTransactionSheet` live in a new `components/sheets/` folder; the new `ActivityScreen` replaces `TransactionHistory`; Dashboard wires its rows to the same sheet.

**Tech Stack:** React Native + NativeWind 4, Redux + redux-saga, `react-native-modal-datetime-picker`, `expo-linear-gradient`, `date-fns`, lucide-react-native, jest-expo

## Global Constraints

- Keep existing NativeWind className patterns: `text-tx-primary dark:text-tx-primary-dark`, `bg-bg-app dark:bg-bg-app-dark`, etc.
- Never install new packages — all required deps already exist (`react-native-reanimated`, `react-native-modal-datetime-picker`, `expo-linear-gradient`, `react-native-gesture-handler`)
- Use `react-test-renderer` + `act` as test renderer, matching existing tests in `client/`
- Run tests from the `client/` directory: `cd client && npx jest --testPathPattern="<file>" --no-coverage`
- Saga tests use generator stepping (`gen.next().value`) matching `transaction.sagas.test.ts` pattern
- `TransactionRow` props: `name`, `category`, `date` (Date), `amount`, `type` ('income'|'expense'), `iconColor`, `icon` (ReactNode)
- Raw Redux transaction shape: `{ _id: string, transactionType: 'credit'|'debit', amount: number, date: string, category: string, description?: string }`
- Screen padding convention: `paddingTop: 54, paddingHorizontal: 18, paddingBottom: 26`
- Bricolage 30/800 heading: `style={{ fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 30 }}`

---

## File Map

**Create:**
- `client/utils/transactionFilters.ts` — pure filter/search predicate
- `client/utils/__tests__/transactionFilters.test.ts`
- `client/utils/transactionMappings.ts` — raw→draft and draft→updatePayload converters
- `client/utils/__tests__/transactionMappings.test.ts`
- `client/components/sheets/BottomSheet.tsx` — generic slide-up sheet (Modal + Animated)
- `client/components/sheets/__tests__/BottomSheet.test.tsx`
- `client/components/sheets/EditTransactionSheet.tsx` — prefill form with save/delete
- `client/screens/ActivityScreen.tsx` — search/filter list + sheet state

**Modify:**
- `client/redux/actions/action.types.ts` — add 6 update/delete action type constants
- `client/redux/actions/transaction.actions.ts` — add update/delete action creators
- `client/redux/services/transaction.service.ts` — add update/delete HTTP calls
- `client/redux/sagas/transaction.sagas.ts` — add update/delete sagas + watch them
- `client/redux/reducers/transaction.reducer.ts` — handle update/delete + pending flags
- `client/redux/reducers/__tests__/transaction.reducer.test.ts` — add update/delete cases
- `client/redux/sagas/__tests__/transaction.sagas.update.test.ts` — new test file for update/delete sagas
- `client/app/(logged-in)/(tabs)/transactions.tsx` — swap `TransactionHistory` → `ActivityScreen`
- `client/screens/Dashboard.tsx` — replace `router.push('/transactionDetail')` with sheet state

**Retire (delete):**
- `client/screens/TransactionHistory.tsx`
- `client/screens/TransactionDetail.tsx`
- `client/app/transactionDetail.tsx`

---

## Task 1: Redux — Update/Delete action types, actions, service, saga, reducer

**Files:**
- Modify: `client/redux/actions/action.types.ts`
- Modify: `client/redux/actions/transaction.actions.ts`
- Modify: `client/redux/services/transaction.service.ts`
- Modify: `client/redux/sagas/transaction.sagas.ts`
- Modify: `client/redux/reducers/transaction.reducer.ts`
- Modify: `client/redux/reducers/__tests__/transaction.reducer.test.ts`
- Create: `client/redux/sagas/__tests__/transaction.sagas.update.test.ts`

**Interfaces:**
- Produces: `updateTransaction(payload: UpdateTransactionPayload)`, `deleteTransaction(id: string)` action creators; `updateTransactionSuccess`, `updateTransactionFailure`, `deleteTransactionSuccess`, `deleteTransactionFailure` action creators; `updateTransactionService(token, id, payload)`, `deleteTransactionService(token, id)` service functions; `updateTransactionSaga`, `deleteTransactionSaga` generator exports; reducer state now includes `updateError: any`, `deleteError: any`, `updatePending: boolean`, `deletePending: boolean`

- [ ] **Step 1: Write the failing reducer tests**

Append to `client/redux/reducers/__tests__/transaction.reducer.test.ts`:

```ts
import {
  UPDATE_TRANSACTION_SUCCESS,
  UPDATE_TRANSACTION_FAILURE,
  DELETE_TRANSACTION_SUCCESS,
  DELETE_TRANSACTION_FAILURE,
  UPDATE_TRANSACTION_REQUEST,
  DELETE_TRANSACTION_REQUEST,
} from '../../actions/action.types';

describe('transactionReducer — update/delete', () => {
  const base = { transactions: [{ _id: '1', amount: 100 }, { _id: '2', amount: 200 }], createError: null, updateError: null, deleteError: null, updatePending: false, deletePending: false };

  it('sets updatePending=true on UPDATE_TRANSACTION_REQUEST', () => {
    const next = transactionReducer(base, { type: UPDATE_TRANSACTION_REQUEST, payload: {} });
    expect(next.updatePending).toBe(true);
    expect(next.updateError).toBeNull();
  });

  it('updates a transaction in-place and clears updatePending on UPDATE_TRANSACTION_SUCCESS', () => {
    const state = { ...base, updatePending: true };
    const next = transactionReducer(state, { type: UPDATE_TRANSACTION_SUCCESS, payload: { _id: '1', amount: 150 } });
    expect(next.transactions).toEqual([{ _id: '1', amount: 150 }, { _id: '2', amount: 200 }]);
    expect(next.updateError).toBeNull();
    expect(next.updatePending).toBe(false);
  });

  it('stores the error and clears updatePending on UPDATE_TRANSACTION_FAILURE', () => {
    const state = { ...base, updatePending: true };
    const error = new Error('update failed');
    const next = transactionReducer(state, { type: UPDATE_TRANSACTION_FAILURE, payload: error });
    expect(next.transactions).toEqual(base.transactions);
    expect(next.updateError).toBe(error);
    expect(next.updatePending).toBe(false);
  });

  it('sets deletePending=true on DELETE_TRANSACTION_REQUEST', () => {
    const next = transactionReducer(base, { type: DELETE_TRANSACTION_REQUEST, payload: { id: '1' } });
    expect(next.deletePending).toBe(true);
    expect(next.deleteError).toBeNull();
  });

  it('removes the transaction and clears deletePending on DELETE_TRANSACTION_SUCCESS', () => {
    const state = { ...base, deletePending: true };
    const next = transactionReducer(state, { type: DELETE_TRANSACTION_SUCCESS, payload: { id: '1' } });
    expect(next.transactions).toEqual([{ _id: '2', amount: 200 }]);
    expect(next.deleteError).toBeNull();
    expect(next.deletePending).toBe(false);
  });

  it('stores the error and clears deletePending on DELETE_TRANSACTION_FAILURE', () => {
    const state = { ...base, deletePending: true };
    const error = new Error('delete failed');
    const next = transactionReducer(state, { type: DELETE_TRANSACTION_FAILURE, payload: error });
    expect(next.transactions).toEqual(base.transactions);
    expect(next.deleteError).toBe(error);
    expect(next.deletePending).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd client && npx jest --testPathPattern="transaction.reducer.test" --no-coverage
```

Expected: FAIL — `UPDATE_TRANSACTION_REQUEST` not defined

- [ ] **Step 3: Add 6 action type constants**

Append to `client/redux/actions/action.types.ts`:

```ts
export const UPDATE_TRANSACTION_REQUEST = "UPDATE_TRANSACTION_REQUEST";
export const UPDATE_TRANSACTION_SUCCESS = "UPDATE_TRANSACTION_SUCCESS";
export const UPDATE_TRANSACTION_FAILURE = "UPDATE_TRANSACTION_FAILURE";

export const DELETE_TRANSACTION_REQUEST = "DELETE_TRANSACTION_REQUEST";
export const DELETE_TRANSACTION_SUCCESS = "DELETE_TRANSACTION_SUCCESS";
export const DELETE_TRANSACTION_FAILURE = "DELETE_TRANSACTION_FAILURE";
```

- [ ] **Step 4: Add action creators**

Append to `client/redux/actions/transaction.actions.ts`:

```ts
import {
  // existing imports …
  UPDATE_TRANSACTION_REQUEST,
  UPDATE_TRANSACTION_SUCCESS,
  UPDATE_TRANSACTION_FAILURE,
  DELETE_TRANSACTION_REQUEST,
  DELETE_TRANSACTION_SUCCESS,
  DELETE_TRANSACTION_FAILURE,
} from "./action.types";

export type UpdateTransactionPayload = {
  id: string;
  transactionType: 'credit' | 'debit';
  amount: number;
  category: string;
  date: string;
  description: string;
};

export const updateTransaction = (payload: UpdateTransactionPayload) => ({
  type: UPDATE_TRANSACTION_REQUEST,
  payload,
});

export const updateTransactionSuccess = (data: any) => ({
  type: UPDATE_TRANSACTION_SUCCESS,
  payload: data,
});

export const updateTransactionFailure = (error: any) => ({
  type: UPDATE_TRANSACTION_FAILURE,
  payload: error,
});

export const deleteTransaction = (id: string) => ({
  type: DELETE_TRANSACTION_REQUEST,
  payload: { id },
});

export const deleteTransactionSuccess = (id: string) => ({
  type: DELETE_TRANSACTION_SUCCESS,
  payload: { id },
});

export const deleteTransactionFailure = (error: any) => ({
  type: DELETE_TRANSACTION_FAILURE,
  payload: error,
});
```

- [ ] **Step 5: Add service calls**

Append to `client/redux/services/transaction.service.ts`:

```ts
import type { UpdateTransactionPayload } from '../actions/transaction.actions';

export const updateTransactionService = async (
  token: string,
  id: string,
  payload: Omit<UpdateTransactionPayload, 'id'>
) => {
  const { status, data } = await axios.put(`${API_BASE_URL}/transaction/${id}`, payload, {
    headers: { 'authorization': `Bearer ${token}` },
  });
  return { status, data };
};

export const deleteTransactionService = async (token: string, id: string) => {
  const { status, data } = await axios.delete(`${API_BASE_URL}/transaction/${id}`, {
    headers: { 'authorization': `Bearer ${token}` },
  });
  return { status, data };
};
```

- [ ] **Step 6: Update reducer**

Replace the full content of `client/redux/reducers/transaction.reducer.ts` with:

```ts
import {
  GET_TRANSACTIONS_SUCCESS,
  CREATE_TRANSACTION_SUCCESS,
  CREATE_TRANSACTION_FAILURE,
  UPDATE_TRANSACTION_REQUEST,
  UPDATE_TRANSACTION_SUCCESS,
  UPDATE_TRANSACTION_FAILURE,
  DELETE_TRANSACTION_REQUEST,
  DELETE_TRANSACTION_SUCCESS,
  DELETE_TRANSACTION_FAILURE,
} from '../actions/action.types';

const initialState = {
  transactions: [] as any[],
  createError: null as any,
  updateError: null as any,
  deleteError: null as any,
  updatePending: false,
  deletePending: false,
};

const transactionReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case GET_TRANSACTIONS_SUCCESS:
      return { ...state, transactions: action.payload };
    case CREATE_TRANSACTION_SUCCESS:
      return { ...state, transactions: [action.payload, ...state.transactions], createError: null };
    case CREATE_TRANSACTION_FAILURE:
      return { ...state, createError: action.payload };
    case UPDATE_TRANSACTION_REQUEST:
      return { ...state, updatePending: true, updateError: null };
    case UPDATE_TRANSACTION_SUCCESS:
      return {
        ...state,
        updatePending: false,
        updateError: null,
        transactions: state.transactions.map((txn) =>
          txn._id === action.payload._id ? action.payload : txn
        ),
      };
    case UPDATE_TRANSACTION_FAILURE:
      return { ...state, updatePending: false, updateError: action.payload };
    case DELETE_TRANSACTION_REQUEST:
      return { ...state, deletePending: true, deleteError: null };
    case DELETE_TRANSACTION_SUCCESS:
      return {
        ...state,
        deletePending: false,
        deleteError: null,
        transactions: state.transactions.filter((txn) => txn._id !== action.payload.id),
      };
    case DELETE_TRANSACTION_FAILURE:
      return { ...state, deletePending: false, deleteError: action.payload };
    default:
      return state;
  }
};

export default transactionReducer;
```

- [ ] **Step 7: Add update/delete sagas**

Append to `client/redux/sagas/transaction.sagas.ts`:

```ts
import {
  // existing imports …
  UPDATE_TRANSACTION_REQUEST,
  DELETE_TRANSACTION_REQUEST,
} from "../actions/action.types";
import {
  // existing imports …
  updateTransactionSuccess,
  updateTransactionFailure,
  deleteTransactionSuccess,
  deleteTransactionFailure,
} from '../actions/transaction.actions';
import {
  // existing imports …
  updateTransactionService,
  deleteTransactionService,
} from '../services/transaction.service';

export function* updateTransactionSaga(action: any) {
  try {
    const { token } = yield select(userSelector);
    const { id, ...payload } = action.payload;
    const { data } = yield call(updateTransactionService, token, id, payload);
    yield put(updateTransactionSuccess(data));
  } catch (err) {
    yield put(updateTransactionFailure(err));
  }
}

export function* deleteTransactionSaga(action: any) {
  try {
    const { token } = yield select(userSelector);
    yield call(deleteTransactionService, token, action.payload.id);
    yield put(deleteTransactionSuccess(action.payload.id));
  } catch (err) {
    yield put(deleteTransactionFailure(err));
  }
}
```

Also add `takeLatest` calls inside `watchTransactionsRequests`:

```ts
yield takeLatest(UPDATE_TRANSACTION_REQUEST, updateTransactionSaga);
yield takeLatest(DELETE_TRANSACTION_REQUEST, deleteTransactionSaga);
```

- [ ] **Step 8: Write saga tests**

Create `client/redux/sagas/__tests__/transaction.sagas.update.test.ts`:

```ts
import { call, put, select } from 'redux-saga/effects';
import { updateTransactionSaga, deleteTransactionSaga } from '../transaction.sagas';
import { userSelector } from '../../store/selectors';
import { updateTransactionService, deleteTransactionService } from '../../services/transaction.service';
import {
  updateTransactionSuccess,
  updateTransactionFailure,
  deleteTransactionSuccess,
  deleteTransactionFailure,
} from '../../actions/transaction.actions';

describe('updateTransactionSaga', () => {
  const action = {
    type: 'UPDATE_TRANSACTION_REQUEST',
    payload: { id: '123', transactionType: 'debit' as const, amount: 150, category: 'groceries', date: '2026-06-21', description: 'Updated' },
  };

  it('selects token, calls update service with id + rest of payload, puts success', () => {
    const gen = updateTransactionSaga(action);
    expect(gen.next().value).toEqual(select(userSelector));
    const { id, ...payload } = action.payload;
    expect(gen.next({ token: 'abc' }).value).toEqual(call(updateTransactionService, 'abc', id, payload));
    const data = { _id: '123', amount: 150 };
    expect(gen.next({ data }).value).toEqual(put(updateTransactionSuccess(data)));
    expect(gen.next().done).toBe(true);
  });

  it('puts failure when service throws', () => {
    const gen = updateTransactionSaga(action);
    gen.next();
    gen.next({ token: 'abc' });
    const error = new Error('network error');
    expect(gen.throw(error).value).toEqual(put(updateTransactionFailure(error)));
  });
});

describe('deleteTransactionSaga', () => {
  const action = { type: 'DELETE_TRANSACTION_REQUEST', payload: { id: '123' } };

  it('selects token, calls delete service with id, puts success with the id', () => {
    const gen = deleteTransactionSaga(action);
    expect(gen.next().value).toEqual(select(userSelector));
    expect(gen.next({ token: 'abc' }).value).toEqual(call(deleteTransactionService, 'abc', '123'));
    expect(gen.next({ data: {} }).value).toEqual(put(deleteTransactionSuccess('123')));
    expect(gen.next().done).toBe(true);
  });

  it('puts failure when service throws', () => {
    const gen = deleteTransactionSaga(action);
    gen.next();
    gen.next({ token: 'abc' });
    const error = new Error('network error');
    expect(gen.throw(error).value).toEqual(put(deleteTransactionFailure(error)));
  });
});
```

- [ ] **Step 9: Run all transaction tests**

```bash
cd client && npx jest --testPathPattern="transaction\.(reducer|sagas)" --no-coverage
```

Expected: all PASS

- [ ] **Step 10: Commit**

```bash
git add client/redux/actions/action.types.ts \
        client/redux/actions/transaction.actions.ts \
        client/redux/services/transaction.service.ts \
        client/redux/sagas/transaction.sagas.ts \
        client/redux/sagas/__tests__/transaction.sagas.update.test.ts \
        client/redux/reducers/transaction.reducer.ts \
        client/redux/reducers/__tests__/transaction.reducer.test.ts
git commit -m "feat: add update/delete transaction redux layer with pending flags"
```

---

## Task 2: Pure Utils — filter predicate and draft/payload mappings (TDD)

**Files:**
- Create: `client/utils/transactionFilters.ts`
- Create: `client/utils/__tests__/transactionFilters.test.ts`
- Create: `client/utils/transactionMappings.ts`
- Create: `client/utils/__tests__/transactionMappings.test.ts`

**Interfaces:**
- Produces: `filterTransactions<T>(transactions: T[], filter: ActivityFilter, query: string): T[]` where `ActivityFilter = 'all' | 'expenses' | 'income'`; `rawToTxDraft(txn: RawStoreTxn): TxDraft`; `txDraftToUpdatePayload(draft: TxDraft): UpdatePayload`; exported types `TxDraft`, `RawStoreTxn`, `UpdatePayload`

- [ ] **Step 1: Write failing filter tests**

Create `client/utils/__tests__/transactionFilters.test.ts`:

```ts
import { filterTransactions } from '../transactionFilters';

const txns = [
  { transactionType: 'debit' as const, category: 'groceries', description: 'Supermarket' },
  { transactionType: 'credit' as const, category: 'income', description: 'Salary' },
  { transactionType: 'debit' as const, category: 'dining', description: 'Pizza night' },
];

describe('filterTransactions', () => {
  it('returns all when filter is all and query is empty', () => {
    expect(filterTransactions(txns, 'all', '')).toHaveLength(3);
  });

  it('returns only debit when filter is expenses', () => {
    const result = filterTransactions(txns, 'expenses', '');
    expect(result).toHaveLength(2);
    result.forEach((t) => expect(t.transactionType).toBe('debit'));
  });

  it('returns only credit when filter is income', () => {
    const result = filterTransactions(txns, 'income', '');
    expect(result).toHaveLength(1);
    expect(result[0].description).toBe('Salary');
  });

  it('filters by description case-insensitively', () => {
    expect(filterTransactions(txns, 'all', 'pizza')).toHaveLength(1);
  });

  it('filters by category case-insensitively', () => {
    expect(filterTransactions(txns, 'all', 'GROCERIES')).toHaveLength(1);
  });

  it('combines type filter and search query', () => {
    const result = filterTransactions(txns, 'expenses', 'night');
    expect(result).toHaveLength(1);
    expect(result[0].description).toBe('Pizza night');
  });

  it('returns empty array when nothing matches', () => {
    expect(filterTransactions(txns, 'all', 'zzz')).toHaveLength(0);
  });

  it('trims query whitespace before comparing', () => {
    expect(filterTransactions(txns, 'all', '  salary  ')).toHaveLength(1);
  });

  it('matches a transaction with no description via category', () => {
    const noDesc = [{ transactionType: 'debit' as const, category: 'groceries' }];
    expect(filterTransactions(noDesc, 'all', 'groc')).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run to confirm fail**

```bash
cd client && npx jest --testPathPattern="transactionFilters.test" --no-coverage
```

Expected: FAIL — cannot find module `../transactionFilters`

- [ ] **Step 3: Implement filterTransactions**

Create `client/utils/transactionFilters.ts`:

```ts
export type ActivityFilter = 'all' | 'expenses' | 'income';

type Filterable = {
  transactionType: 'credit' | 'debit';
  category: string;
  description?: string;
};

export function filterTransactions<T extends Filterable>(
  transactions: T[],
  filter: ActivityFilter,
  query: string
): T[] {
  const q = query.trim().toLowerCase();
  return transactions.filter((txn) => {
    if (filter === 'expenses' && txn.transactionType !== 'debit') return false;
    if (filter === 'income' && txn.transactionType !== 'credit') return false;
    if (q) {
      const nameMatch = (txn.description ?? '').toLowerCase().includes(q);
      const catMatch = txn.category.toLowerCase().includes(q);
      if (!nameMatch && !catMatch) return false;
    }
    return true;
  });
}
```

- [ ] **Step 4: Run filter tests to confirm pass**

```bash
cd client && npx jest --testPathPattern="transactionFilters.test" --no-coverage
```

Expected: all PASS

- [ ] **Step 5: Write failing mapping tests**

Create `client/utils/__tests__/transactionMappings.test.ts`:

```ts
import { rawToTxDraft, txDraftToUpdatePayload } from '../transactionMappings';
import type { RawStoreTxn, TxDraft } from '../transactionMappings';

describe('rawToTxDraft', () => {
  it('maps debit to expense entryType', () => {
    const raw: RawStoreTxn = { _id: 'a1', transactionType: 'debit', amount: 500, date: '2026-06-21T00:00:00.000Z', category: 'groceries', description: 'Weekly shop' };
    const draft = rawToTxDraft(raw);
    expect(draft).toEqual({ id: 'a1', entryType: 'expense', name: 'Weekly shop', amountStr: '500', date: '2026-06-21T00:00:00.000Z', category: 'groceries' });
  });

  it('maps credit to income entryType', () => {
    const raw: RawStoreTxn = { _id: 'b2', transactionType: 'credit', amount: 3000, date: '2026-06-01T00:00:00.000Z', category: 'income', description: 'Salary' };
    expect(rawToTxDraft(raw).entryType).toBe('income');
  });

  it('defaults name to empty string when description is missing', () => {
    const raw: RawStoreTxn = { _id: 'c3', transactionType: 'debit', amount: 100, date: '2026-06-01T00:00:00.000Z', category: 'dining' };
    expect(rawToTxDraft(raw).name).toBe('');
  });

  it('stringifies the amount', () => {
    const raw: RawStoreTxn = { _id: 'd4', transactionType: 'debit', amount: 125.5, date: '2026-06-01T00:00:00.000Z', category: 'dining' };
    expect(rawToTxDraft(raw).amountStr).toBe('125.5');
  });
});

describe('txDraftToUpdatePayload', () => {
  it('maps expense to debit transactionType with correct amount and description', () => {
    const draft: TxDraft = { id: 'a1', entryType: 'expense', name: 'Weekly shop', amountStr: '500', date: '2026-06-21T00:00:00.000Z', category: 'groceries' };
    const payload = txDraftToUpdatePayload(draft);
    expect(payload.transactionType).toBe('debit');
    expect(payload.amount).toBe(500);
    expect(payload.description).toBe('Weekly shop');
    expect(payload.category).toBe('groceries');
  });

  it('maps income to credit transactionType', () => {
    const draft: TxDraft = { id: 'b2', entryType: 'income', name: 'Salary', amountStr: '3000', date: '2026-06-01T00:00:00.000Z', category: 'income' };
    expect(txDraftToUpdatePayload(draft).transactionType).toBe('credit');
  });

  it('parses decimal amountStr to float', () => {
    const draft: TxDraft = { id: 'c', entryType: 'expense', name: 'Lunch', amountStr: '125.50', date: '2026-06-21T00:00:00.000Z', category: 'dining' };
    expect(txDraftToUpdatePayload(draft).amount).toBe(125.5);
  });

  it('defaults amount to 0 for empty amountStr', () => {
    const draft: TxDraft = { id: 'd', entryType: 'expense', name: 'Bad', amountStr: '', date: '2026-06-21T00:00:00.000Z', category: 'dining' };
    expect(txDraftToUpdatePayload(draft).amount).toBe(0);
  });
});
```

- [ ] **Step 6: Run to confirm fail**

```bash
cd client && npx jest --testPathPattern="transactionMappings.test" --no-coverage
```

Expected: FAIL — cannot find module `../transactionMappings`

- [ ] **Step 7: Implement transactionMappings**

Create `client/utils/transactionMappings.ts`:

```ts
export type RawStoreTxn = {
  _id: string;
  transactionType: 'credit' | 'debit';
  amount: number;
  date: string;
  category: string;
  description?: string;
};

export type TxDraft = {
  id: string;
  entryType: 'expense' | 'income';
  name: string;
  amountStr: string;
  date: string;
  category: string;
};

export type UpdatePayload = {
  transactionType: 'credit' | 'debit';
  amount: number;
  category: string;
  date: string;
  description: string;
};

export function rawToTxDraft(txn: RawStoreTxn): TxDraft {
  return {
    id: txn._id,
    entryType: txn.transactionType === 'credit' ? 'income' : 'expense',
    name: txn.description ?? '',
    amountStr: String(txn.amount),
    date: txn.date,
    category: txn.category,
  };
}

export function txDraftToUpdatePayload(draft: TxDraft): UpdatePayload {
  return {
    transactionType: draft.entryType === 'income' ? 'credit' : 'debit',
    amount: parseFloat(draft.amountStr) || 0,
    category: draft.category,
    date: draft.date,
    description: draft.name,
  };
}
```

- [ ] **Step 8: Run mapping tests to confirm pass**

```bash
cd client && npx jest --testPathPattern="transactionMappings.test" --no-coverage
```

Expected: all PASS

- [ ] **Step 9: Commit**

```bash
git add client/utils/transactionFilters.ts \
        client/utils/__tests__/transactionFilters.test.ts \
        client/utils/transactionMappings.ts \
        client/utils/__tests__/transactionMappings.test.ts
git commit -m "feat: add transaction filter predicate and draft/payload mapping utils"
```

---

## Task 3: BottomSheet — Generic Slide-Up Sheet Component

**Files:**
- Create: `client/components/sheets/BottomSheet.tsx`
- Create: `client/components/sheets/__tests__/BottomSheet.test.tsx`

**Interfaces:**
- Consumes: nothing from prior tasks
- Produces: `BottomSheet` component with props `{ visible: boolean; onClose: () => void; children: React.ReactNode }`. When `visible` transitions true→false, animates the sheet down and fades the scrim, then unmounts. Reused by Phase 5's budget sheet.

- [ ] **Step 1: Write failing BottomSheet tests**

Create `client/components/sheets/__tests__/BottomSheet.test.tsx`:

```tsx
import React from 'react';
import { Text } from 'react-native';
import { create, act } from 'react-test-renderer';
import BottomSheet from '../BottomSheet';

// Suppress non-native driver warning in test env
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

describe('BottomSheet', () => {
  it('renders nothing when visible is false', () => {
    const tree = create(
      <BottomSheet visible={false} onClose={jest.fn()}>
        <Text>content</Text>
      </BottomSheet>
    );
    expect(tree.toJSON()).toBeNull();
  });

  it('renders children when visible is true', () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <BottomSheet visible onClose={jest.fn()}>
          <Text testID="child">hello</Text>
        </BottomSheet>
      );
    });
    expect(tree!.toJSON()).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run to confirm fail**

```bash
cd client && npx jest --testPathPattern="BottomSheet.test" --no-coverage
```

Expected: FAIL — cannot find module `../BottomSheet`

- [ ] **Step 3: Implement BottomSheet**

Create `client/components/sheets/BottomSheet.tsx`:

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet } from 'react-native';

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export default function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const [rendered, setRendered] = useState(false);
  const translateY = useRef(new Animated.Value(800)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else if (rendered) {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 800, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start(() => {
        setRendered(false);
        translateY.setValue(800);
        opacity.setValue(0);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!rendered) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY }] }]}
          className="bg-bg-app dark:bg-bg-app-dark"
        >
          {children}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(22,32,26,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 22,
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
});
```

- [ ] **Step 4: Run BottomSheet tests to confirm pass**

```bash
cd client && npx jest --testPathPattern="BottomSheet.test" --no-coverage
```

Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add client/components/sheets/BottomSheet.tsx \
        client/components/sheets/__tests__/BottomSheet.test.tsx
git commit -m "feat: add generic BottomSheet slide-up component"
```

---

## Task 4: EditTransactionSheet — Prefill Form with Save/Delete

**Files:**
- Create: `client/components/sheets/EditTransactionSheet.tsx`

**Interfaces:**
- Consumes: `BottomSheet` (Task 3); `updateTransaction`, `deleteTransaction` action creators (Task 1); `rawToTxDraft`, `txDraftToUpdatePayload`, `TxDraft`, `RawStoreTxn` (Task 2); `SegmentedToggle`, `CategoryChips`, `CategoryOption` (existing); `LinearGradient`, `DateTimePickerModal`, `getCategoryMeta`, `BUILT_IN_CATEGORIES`, `getIconByKey`, `loadCustomCategories` (existing); `transactionSelector` for `updateError`, `deleteError`, `updatePending`, `deletePending`
- Produces: `EditTransactionSheet` with props `{ txn: RawStoreTxn | null; onClose: () => void }`. Passes `txn` to `BottomSheet`'s `visible` prop (`!!txn`). Watches `updatePending` / `deletePending` to close on success or stay open on failure.

- [ ] **Step 1: Create EditTransactionSheet**

Create `client/components/sheets/EditTransactionSheet.tsx`:

```tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { CalendarDays, Pencil } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';

import BottomSheet from './BottomSheet';
import SegmentedToggle from '@/components/SegmentedToggle';
import CategoryChips, { type CategoryOption } from '@/components/categories/CategoryChips';
import { BUILT_IN_CATEGORIES, getIconByKey } from '@/constants/categoryPalette';
import { getCategoryMeta } from '@/constants/categoryMeta';
import { loadCustomCategories, type CustomCategory } from '@/utils/customCategories';
import { transactionSelector } from '@/redux/store/selectors';
import { updateTransaction, deleteTransaction } from '@/redux/actions/transaction.actions';
import { rawToTxDraft, txDraftToUpdatePayload, type RawStoreTxn, type TxDraft } from '@/utils/transactionMappings';

type EntryType = 'expense' | 'income';

const ENTRY_OPTIONS = [
  { value: 'expense' as EntryType, label: 'Expense' },
  { value: 'income' as EntryType, label: 'Income' },
] as const;

type Props = {
  txn: RawStoreTxn | null;
  onClose: () => void;
};

export default function EditTransactionSheet({ txn, onClose }: Props) {
  const dispatch = useDispatch();
  const { updateError, deleteError, updatePending, deletePending } = useSelector(transactionSelector as any);

  const [draft, setDraft] = useState<TxDraft | null>(null);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [amountError, setAmountError] = useState(false);

  const wasUpdating = useRef(false);
  const wasDeleting = useRef(false);

  useEffect(() => {
    if (txn) {
      setDraft(rawToTxDraft(txn));
      setNameError(false);
      setAmountError(false);
      wasUpdating.current = false;
      wasDeleting.current = false;
    }
  }, [txn]);

  useEffect(() => {
    loadCustomCategories().then(setCustomCategories);
  }, []);

  useEffect(() => {
    if (wasUpdating.current && !updatePending) {
      wasUpdating.current = false;
      if (!updateError) onClose();
    }
  }, [updatePending]);

  useEffect(() => {
    if (wasDeleting.current && !deletePending) {
      wasDeleting.current = false;
      if (!deleteError) onClose();
    }
  }, [deletePending]);

  const categoryOptions: CategoryOption[] = useMemo(() => {
    const builtIns = BUILT_IN_CATEGORIES.map(({ key, label }) => {
      const meta = getCategoryMeta(key);
      return { key, label, color: meta.color, Icon: meta.Icon };
    });
    const custom = customCategories.map((cat) => ({
      key: cat.key,
      label: cat.label,
      color: cat.color,
      Icon: getIconByKey(cat.icon),
      custom: true as const,
    }));
    return [...builtIns, ...custom];
  }, [customCategories]);

  const onSave = () => {
    if (!draft) return;
    const hasNameError = draft.name.trim().length === 0;
    const hasAmountError = parseFloat(draft.amountStr) <= 0 || !draft.amountStr;
    setNameError(hasNameError);
    setAmountError(hasAmountError);
    if (hasNameError || hasAmountError) return;
    wasUpdating.current = true;
    dispatch(updateTransaction({ id: draft.id, ...txDraftToUpdatePayload(draft) }));
  };

  const onDelete = () => {
    if (!draft) return;
    wasDeleting.current = true;
    dispatch(deleteTransaction(draft.id));
  };

  const isBusy = updatePending || deletePending;
  const error = (wasUpdating.current || !updatePending) && updateError
    ? 'Failed to save changes. Please try again.'
    : (wasDeleting.current || !deletePending) && deleteError
    ? 'Failed to delete. Please try again.'
    : null;

  return (
    <BottomSheet visible={!!txn} onClose={onClose}>
      {draft ? (
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Expense/Income toggle */}
          <View className="items-center mb-5">
            <SegmentedToggle
              options={ENTRY_OPTIONS}
              value={draft.entryType}
              onChange={(v) => setDraft((d) => d ? { ...d, entryType: v } : d)}
            />
          </View>

          {/* Name field */}
          <View
            className="flex-row items-center rounded-2xl px-3 py-3 mb-3"
            style={{ borderWidth: 1, borderColor: nameError ? '#E8322A' : '#E5E5E0', backgroundColor: nameError ? '#FFF5F5' : undefined }}
          >
            <Pencil color="#9AA096" size={18} />
            <TextInput
              value={draft.name}
              onChangeText={(v) => { setDraft((d) => d ? { ...d, name: v } : d); setNameError(false); }}
              placeholder="Name"
              placeholderTextColor="#9AA096"
              style={{ marginLeft: 8, flex: 1, color: '#2B2F2A' }}
            />
          </View>

          {/* Amount field */}
          <View
            className="flex-row items-center rounded-2xl px-3 py-3 mb-3"
            style={{ borderWidth: 1, borderColor: amountError ? '#E8322A' : '#E5E5E0', backgroundColor: amountError ? '#FFF5F5' : undefined }}
          >
            <Text style={{ color: '#9AA096', marginRight: 2, fontWeight: '600' }}>₹</Text>
            <TextInput
              value={draft.amountStr}
              onChangeText={(v) => { setDraft((d) => d ? { ...d, amountStr: v } : d); setAmountError(false); }}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#9AA096"
              style={{ flex: 1, color: '#2B2F2A' }}
            />
          </View>

          {/* Date field */}
          <Pressable
            className="flex-row items-center rounded-2xl px-3 py-3 mb-4"
            style={{ borderWidth: 1, borderColor: '#E5E5E0' }}
            onPress={() => setShowDatePicker(true)}
          >
            <CalendarDays color="#9AA096" size={18} />
            <Text style={{ marginLeft: 8, color: '#2B2F2A' }}>
              {format(new Date(draft.date), 'MMMM dd, yyyy')}
            </Text>
          </Pressable>

          <DateTimePickerModal
            isVisible={showDatePicker}
            mode="date"
            date={new Date(draft.date)}
            onConfirm={(date) => {
              setShowDatePicker(false);
              setDraft((d) => d ? { ...d, date: date.toISOString() } : d);
            }}
            onCancel={() => setShowDatePicker(false)}
          />

          {/* Category */}
          <Text className="text-tx-primary dark:text-tx-primary-dark font-bold mb-3">Category</Text>
          <CategoryChips
            categories={categoryOptions}
            selected={draft.category}
            onSelect={(key) => setDraft((d) => d ? { ...d, category: key } : d)}
            editMode={false}
            onDelete={() => {}}
            onAdd={() => {}}
          />

          {/* Inline error */}
          {error ? (
            <Text style={{ color: '#E8322A', marginTop: 12, textAlign: 'center', fontWeight: '600' }}>
              {error}
            </Text>
          ) : null}

          {/* Save button */}
          <Pressable
            onPress={onSave}
            disabled={isBusy}
            style={{ marginTop: 24, borderRadius: 16, overflow: 'hidden' }}
          >
            <LinearGradient
              colors={['#13C076', '#0A9E5E']}
              style={{ height: 52, alignItems: 'center', justifyContent: 'center' }}
            >
              {isBusy && wasUpdating.current ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15 }}>Save changes</Text>
              )}
            </LinearGradient>
          </Pressable>

          {/* Delete button */}
          <Pressable
            onPress={onDelete}
            disabled={isBusy}
            style={{ marginTop: 12, borderRadius: 16, height: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF0F0' }}
          >
            {isBusy && wasDeleting.current ? (
              <ActivityIndicator color="#E8322A" />
            ) : (
              <Text style={{ color: '#E8322A', fontWeight: '800', fontSize: 15 }}>Delete transaction</Text>
            )}
          </Pressable>
        </ScrollView>
      ) : null}
    </BottomSheet>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && npx tsc --noEmit 2>&1 | grep -i "EditTransactionSheet\|BottomSheet\|transactionMappings"
```

Expected: no errors for the new files

- [ ] **Step 3: Commit**

```bash
git add client/components/sheets/EditTransactionSheet.tsx
git commit -m "feat: add EditTransactionSheet with save/delete and inline error handling"
```

---

## Task 5: ActivityScreen — Search/Filter List

**Files:**
- Create: `client/screens/ActivityScreen.tsx`
- Modify: `client/app/(logged-in)/(tabs)/transactions.tsx`

**Interfaces:**
- Consumes: `filterTransactions`, `ActivityFilter` (Task 2); `RawStoreTxn` type (Task 2); `EditTransactionSheet` (Task 4); `TransactionRow`, `getCategoryMeta`, `transactionSelector` (existing)
- Produces: `ActivityScreen` — a FlatList-based screen with search input, three filter chips, filtered+sorted rows, empty state, and screen-level sheet state

- [ ] **Step 1: Create ActivityScreen**

Create `client/screens/ActivityScreen.tsx`:

```tsx
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, SafeAreaView, Text, TextInput, View } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useSelector } from 'react-redux';

import TransactionRow from '@/components/TransactionRow';
import EditTransactionSheet from '@/components/sheets/EditTransactionSheet';
import { transactionSelector } from '@/redux/store/selectors';
import { getCategoryMeta } from '@/constants/categoryMeta';
import { filterTransactions, type ActivityFilter } from '@/utils/transactionFilters';
import type { RawStoreTxn } from '@/utils/transactionMappings';

const FILTER_CHIPS: { label: string; value: ActivityFilter; color: string }[] = [
  { label: 'All', value: 'all', color: '#2BB3FF' },
  { label: 'Expenses', value: 'expenses', color: '#E8322A' },
  { label: 'Income', value: 'income', color: '#0FB46B' },
];

export default function ActivityScreen() {
  const { transactions } = useSelector(transactionSelector as any);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [selectedTxn, setSelectedTxn] = useState<RawStoreTxn | null>(null);

  const filtered = useMemo(
    () => filterTransactions(transactions ?? [], filter, searchQuery),
    [transactions, filter, searchQuery]
  );

  const sorted = useMemo(
    () =>
      [...filtered].sort(
        (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [filtered]
  );

  return (
    <SafeAreaView className="flex-1 bg-bg-app dark:bg-bg-app-dark">
      <FlatList
        data={sorted}
        keyExtractor={(item: any) => item._id}
        contentContainerStyle={{ paddingTop: 54, paddingHorizontal: 18, paddingBottom: 26 }}
        ListHeaderComponent={
          <View>
            <Text
              style={{ fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 30 }}
              className="text-tx-primary dark:text-tx-primary-dark mb-4"
            >
              Activity
            </Text>

            {/* Search field */}
            <View
              className="flex-row items-center bg-white mb-4"
              style={{ borderRadius: 16, borderWidth: 1.5, borderColor: '#E5E5E0', paddingHorizontal: 12, paddingVertical: 10 }}
            >
              <Search color="#9AA096" size={18} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by name or category"
                placeholderTextColor="#9AA096"
                style={{ flex: 1, marginLeft: 8, color: '#2B2F2A' }}
              />
              {searchQuery.length > 0 ? (
                <Pressable onPress={() => setSearchQuery('')}>
                  <X color="#9AA096" size={18} />
                </Pressable>
              ) : null}
            </View>

            {/* Filter chips */}
            <View className="flex-row mb-4" style={{ gap: 8 }}>
              {FILTER_CHIPS.map((chip) => {
                const active = filter === chip.value;
                return (
                  <Pressable
                    key={chip.value}
                    onPress={() => setFilter(chip.value)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: active ? chip.color : '#FFFFFF',
                    }}
                  >
                    <Text style={{ color: active ? '#FFFFFF' : '#2B2F2A', fontWeight: '700', fontSize: 13 }}>
                      {chip.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center mt-16" style={{ gap: 8 }}>
            <Search color="#9AA096" size={40} />
            <Text className="text-tx-primary dark:text-tx-primary-dark font-bold text-base">
              No transactions found
            </Text>
            <Text className="text-tx-tertiary dark:text-tx-tertiary-dark text-sm text-center">
              Try a different search or filter
            </Text>
          </View>
        }
        renderItem={({ item }: { item: any }) => {
          const meta = getCategoryMeta(item.category);
          const type = item.transactionType === 'credit' ? 'income' : 'expense';
          return (
            <Pressable onPress={() => setSelectedTxn(item as RawStoreTxn)}>
              <TransactionRow
                name={item.description || item.category}
                category={item.category}
                date={new Date(item.date)}
                amount={item.amount}
                type={type}
                iconColor={meta.color}
                icon={<meta.Icon size={20} color="#FFFFFF" />}
              />
            </Pressable>
          );
        }}
      />

      <EditTransactionSheet txn={selectedTxn} onClose={() => setSelectedTxn(null)} />
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Update the tab entry point**

Replace the full content of `client/app/(logged-in)/(tabs)/transactions.tsx`:

```tsx
import React from 'react';
import ActivityScreen from '@/screens/ActivityScreen';

export default function Transactions() {
  return <ActivityScreen />;
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd client && npx tsc --noEmit 2>&1 | grep -i "ActivityScreen\|transactions.tsx"
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add client/screens/ActivityScreen.tsx \
        client/app/(logged-in)/(tabs)/transactions.tsx
git commit -m "feat: add ActivityScreen with search, filter chips, and edit sheet"
```

---

## Task 6: Wire Dashboard Rows + Retire Legacy Files

**Files:**
- Modify: `client/screens/Dashboard.tsx`
- Delete: `client/screens/TransactionHistory.tsx`
- Delete: `client/screens/TransactionDetail.tsx`
- Delete: `client/app/transactionDetail.tsx`

**Interfaces:**
- Consumes: `EditTransactionSheet` (Task 4); `RawStoreTxn` type (Task 2)
- Produces: Dashboard now opens EditTransactionSheet on row tap instead of navigating to `/transactionDetail`. Legacy files removed.

- [ ] **Step 1: Add sheet state + import to Dashboard.tsx**

At the top of `client/screens/Dashboard.tsx`, add:

```tsx
import { useState } from 'react';
import EditTransactionSheet from '@/components/sheets/EditTransactionSheet';
import type { RawStoreTxn } from '@/utils/transactionMappings';
```

Inside the `Dashboard` function body (after the existing `const` declarations), add:

```tsx
const [selectedTxn, setSelectedTxn] = useState<RawStoreTxn | null>(null);
```

- [ ] **Step 2: Replace router.push rows in Dashboard with setSelectedTxn**

Find the block in Dashboard that renders `recentTransactions.map(...)`. Replace:

```tsx
<TouchableOpacity
  key={txn._id ?? txn.id}
  onPress={() => {
    const normalizedTxn = {
      id: txn._id,
      userId: txn.user,
      type: txn.transactionType,
      amount: txn.amount,
      date: txn.date,
      category: {
        name: txn.category,
      },
      description: txn.description || txn.category,
    };
    router.push({
      pathname: '/transactionDetail',
      params: { txn: JSON.stringify(normalizedTxn) },
    });
  }}
>
```

With:

```tsx
<TouchableOpacity
  key={txn._id ?? txn.id}
  onPress={() => setSelectedTxn(txn as RawStoreTxn)}
>
```

- [ ] **Step 3: Add EditTransactionSheet to Dashboard JSX**

At the end of Dashboard's JSX, just before the closing `</SafeAreaView>`, add:

```tsx
<EditTransactionSheet txn={selectedTxn} onClose={() => setSelectedTxn(null)} />
```

- [ ] **Step 4: Verify TypeScript compiles cleanly**

```bash
cd client && npx tsc --noEmit 2>&1 | grep -i "Dashboard\|transactionDetail"
```

Expected: no errors. If `router` is now unused (since we removed the only `router.push('/transactionDetail')` call), remove `const router = useRouter();` and its import if no longer needed. Check Dashboard for any remaining `router` usage (it's also used for `router.push('/profile')` and `router.push('/transactions')`), so it's still needed.

- [ ] **Step 5: Delete legacy files**

```bash
rm client/screens/TransactionHistory.tsx
rm client/screens/TransactionDetail.tsx
rm client/app/transactionDetail.tsx
```

- [ ] **Step 6: Verify nothing still imports the deleted files**

```bash
grep -r "TransactionHistory\|transactionDetail\|TransactionDetail" client/ --include="*.tsx" --include="*.ts"
```

Expected: no output (no remaining imports)

- [ ] **Step 7: Run the full test suite**

```bash
cd client && npx jest --no-coverage
```

Expected: all PASS. If anything references the deleted files, track it down and remove/update the import.

- [ ] **Step 8: Commit**

```bash
git add client/screens/Dashboard.tsx
git rm client/screens/TransactionHistory.tsx \
       client/screens/TransactionDetail.tsx \
       client/app/transactionDetail.tsx
git commit -m "feat: wire Dashboard rows to EditTransactionSheet, retire legacy detail screen"
```

---

## Manual Testing Checklist

After all tasks are complete, verify manually in the simulator:

- [ ] Activity tab shows "Activity" title, search field, three filter chips, full transaction list
- [ ] Typing in search filters by name (case-insensitive)
- [ ] Typing in search filters by category (case-insensitive)
- [ ] Clearing search (✕ button) restores full list
- [ ] "Expenses" chip shows only debit transactions; "Income" shows only credits; "All" shows both
- [ ] Combining a chip + search query filters correctly
- [ ] Empty state (search icon + "No transactions found") appears when no results
- [ ] Tapping any Activity row slides up the EditTransactionSheet
- [ ] Sheet is prefilled with the tapped row's type, name, amount, date, category
- [ ] Tapping the scrim dismisses the sheet
- [ ] Changing entryType toggle updates the segment highlight
- [ ] Saving edits closes the sheet; the row reflects the new values in the list
- [ ] Deleting the transaction closes the sheet; the row is gone from all lists
- [ ] Deleting the last transaction leaves the empty state clean
- [ ] Tapping a Recent row on Home opens the same sheet
- [ ] After editing from Home, the Activity tab also shows the updated value
- [ ] Network failure on save: sheet stays open, error message appears inline

