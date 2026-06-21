# Phase 8: Profile (View/Edit) + Settings Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a view/edit Profile screen whose personal + financial fields persist to the server (the first backend change of the series), redesign the Settings hub with a working dark-mode toggle and sign-out, and derive the Dashboard hero budget from the user's `monthlyIncome`.

**Architecture:** The server gains four `User` fields and a **pure field-whitelist helper** (`pickAllowedUserUpdates`) that `updateProfile` uses instead of blindly spreading `req.body` — the helper is unit-tested in isolation (jest). On the client, **pure utilities** (`ageFromDob`, profile draft↔payload mappings, server-user normalization) are TDD'd with no React. The Redux data layer is completed: the spec claims an update saga exists, but in reality only the `UPDATE_USER_*` actions/reducer-cases exist — there is **no update saga, no update service, no logout saga, and `fetchUser` is an empty stub**. This phase adds `updateUserService`/`getUserProfileService`, an `updateUserSaga`, a `logoutUserSaga`, and rewires `fetchUserSaga` to actually fetch (mirroring the established `transaction.sagas` token-via-`select(userSelector)` pattern), with saga unit tests mirroring `transaction.sagas.test.ts`. Two screens are then built/rebuilt: the Profile drill-down (`app/(logged-in)/profile.tsx`) and the Settings hub (`app/(logged-in)/(tabs)/profile.tsx`). Finally the Dashboard hero reads `monthlyIncome`.

**Tech Stack:** Node/Express + Mongoose (server), jest (server, newly added — devDependency only), React Native + NativeWind 4, Redux + redux-saga, axios, expo-image-picker (newly added via `npx expo install`), expo-router, jest-expo (client)

## Global Constraints

- **Client:** never install npm packages except the one explicitly mandated here — `expo-image-picker`, installed via `npx expo install expo-image-picker` (not `npm install`, so the Expo-compatible version is selected).
- **Server:** the only new dependency permitted is `jest` as a **devDependency**.
- Run client tests from `client/`: `npx jest --testPathPattern="<file>" --no-coverage`. Run server tests from `server/`: `npm test` (after the jest setup in Task 1).
- Client NativeWind class conventions: `text-tx-primary dark:text-tx-primary-dark`, `text-tx-secondary dark:text-tx-secondary-dark`, `text-tx-tertiary dark:text-tx-tertiary-dark`, `bg-bg-app dark:bg-bg-app-dark`, `bg-bg-card dark:bg-bg-card-dark`, `bg-close dark:bg-close-dark`.
- Screen padding convention: `paddingTop: 54, paddingHorizontal: 18, paddingBottom: 26` (or the existing `pt-14 px-5` on the current profile drill-down — prefer the `54/18/26` ScrollView convention used by other screens).
- Brand green `#0FB46B` (tailwind `brand-green`); hero gradient `#13C076` → `#0A9E5E` (`brand-green-start`/`brand-green-end`); avatar fill `#13C076`; error red `#E8322A`; toggle off-track `#C8CECC`.
- Bricolage heading font: `style={{ fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20 }}` for the profile name.
- `Card` props: `{ children, radius? (default 24), className?, style? }` (`client/components/Card.tsx`).
- `HeroCard` props: `{ label, subtitle, amount, progressPct?, footerLeft?, footerRight? }` (`client/components/HeroCard.tsx`) — do not modify.
- `Avatar` props: `{ initial: string, size? (46), radius? (16) }` (`client/components/Avatar.tsx`).
- `IconTile` props: `{ children, backgroundColor: string, size? (34), radius? (11) }` (`client/components/IconTile.tsx`).
- `useTheme()` returns `{ isDark: boolean, toggleDark: () => void }` (`client/contexts/ThemeContext.tsx`).
- Redux saga auth pattern (mirror exactly): `const { token } = yield select(userSelector)`; service takes `token` first arg and sends header `{ authorization: \`Bearer ${token}\` }`. `userSelector(state) => state.user` where the user slice is `{ user, isLoading, error, registerUser, token }`.
- Update endpoint: `PUT {API_BASE_URL}/user/:email` (protected). Profile endpoint: `GET {API_BASE_URL}/user/:email` (protected, returns the raw user document, which uses `_id`).
- Server `updateProfile` must NOT allow `email`, `password`, `_id`, or `role` through the update — only the whitelisted profile fields.
- **Known inherited limitation (do not fix in this phase):** Redux state is not persisted across cold app restarts, so `state.user.token` is null after a reload until the user logs in again (the existing transaction sagas share this limitation). Profile fetch/update works within a logged-in session. Note it in manual testing; out of scope here.

---

## File Map

**Create (server):**
- `server/utils/userUpdate.js` — `pickAllowedUserUpdates(body)` + `ALLOWED_UPDATE_FIELDS`
- `server/utils/__tests__/userUpdate.test.js`

**Modify (server):**
- `server/package.json` — add `jest` devDependency + `"test": "jest"` script
- `server/models/user.model.js` — add `mobile`, `monthlyIncome`, `currency`, `country`
- `server/controllers/user.controller.js` — `updateProfile` uses `pickAllowedUserUpdates` + `$set`

**Create (client):**
- `client/utils/profileCalcs.ts` — `ageFromDob`
- `client/utils/__tests__/profileCalcs.test.ts`
- `client/utils/profileMappings.ts` — `ProfileDraft`/`UpdateUserPayload` types, `userToProfileDraft`, `profileDraftToUpdatePayload`, `normalizeServerUser`
- `client/utils/__tests__/profileMappings.test.ts`
- `client/redux/sagas/__tests__/user.sagas.test.ts`
- `client/components/settings/ToggleSwitch.tsx`
- `client/components/settings/SettingRow.tsx`

**Modify (client):**
- `client/types/global.d.ts` — extend `User`
- `client/redux/services/user.service.ts` — add `updateUserService`, `getUserProfileService`
- `client/redux/sagas/user.sagas.ts` — add `updateUserSaga`, `logoutUserSaga`, rewire `fetchUserSaga`, register watchers
- `client/redux/actions/user.actions.ts` — change `updateUserRequest` signature
- `client/app/(logged-in)/profile.tsx` — the real Profile screen
- `client/app/(logged-in)/(tabs)/profile.tsx` — Settings hub redesign
- `client/screens/Dashboard.tsx` — hero budget from `monthlyIncome`

---

## Task 1: Backend — User fields + whitelisted updateProfile (jest, TDD)

**Files:**
- Modify: `server/package.json`
- Create: `server/utils/userUpdate.js`
- Create: `server/utils/__tests__/userUpdate.test.js`
- Modify: `server/models/user.model.js`
- Modify: `server/controllers/user.controller.js`

**Interfaces:**
- Consumes: nothing
- Produces: `pickAllowedUserUpdates(body?: object) => object` (returns a new object containing only keys in `ALLOWED_UPDATE_FIELDS` that are own-properties of `body`); `ALLOWED_UPDATE_FIELDS: string[]` = `['firstName','lastName','dob','gender','mobile','monthlyIncome','currency','country','profilePicture']`

- [ ] **Step 1: Add jest to the server**

Run from `server/`:

```bash
cd server && npm install --save-dev jest
```

Then edit `server/package.json` — replace the test script line:

```json
    "test": "jest",
```

(Replace the existing `"test": "echo \"Error: no test specified\" && exit 1",` line.)

- [ ] **Step 2: Write the failing test**

Create `server/utils/__tests__/userUpdate.test.js`:

```js
const { pickAllowedUserUpdates, ALLOWED_UPDATE_FIELDS } = require('../userUpdate');

describe('pickAllowedUserUpdates', () => {
  it('keeps all whitelisted profile fields', () => {
    const body = {
      firstName: 'Ada',
      lastName: 'Lovelace',
      dob: '1990-01-01',
      gender: 'female',
      mobile: '9999999999',
      monthlyIncome: 50000,
      currency: 'INR',
      country: 'India',
      profilePicture: 'file:///pic.jpg',
    };
    expect(pickAllowedUserUpdates(body)).toEqual(body);
  });

  it('drops email, password, _id, and role', () => {
    const body = {
      firstName: 'Ada',
      email: 'new@evil.com',
      password: 'hunter2',
      _id: 'abc123',
      role: 'admin',
    };
    expect(pickAllowedUserUpdates(body)).toEqual({ firstName: 'Ada' });
  });

  it('returns an empty object for an empty body', () => {
    expect(pickAllowedUserUpdates({})).toEqual({});
  });

  it('returns an empty object when body is undefined', () => {
    expect(pickAllowedUserUpdates()).toEqual({});
  });

  it('does not include whitelisted keys that are absent from the body', () => {
    expect(pickAllowedUserUpdates({ mobile: '123' })).toEqual({ mobile: '123' });
  });

  it('exposes the expected whitelist', () => {
    expect(ALLOWED_UPDATE_FIELDS).toEqual([
      'firstName', 'lastName', 'dob', 'gender',
      'mobile', 'monthlyIncome', 'currency', 'country', 'profilePicture',
    ]);
  });
});
```

- [ ] **Step 3: Run the test to confirm it fails**

```bash
cd server && npm test
```

Expected: FAIL — cannot find module `../userUpdate`

- [ ] **Step 4: Implement the helper**

Create `server/utils/userUpdate.js`:

```js
const ALLOWED_UPDATE_FIELDS = [
  'firstName',
  'lastName',
  'dob',
  'gender',
  'mobile',
  'monthlyIncome',
  'currency',
  'country',
  'profilePicture',
];

function pickAllowedUserUpdates(body = {}) {
  const updates = {};
  for (const key of ALLOWED_UPDATE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      updates[key] = body[key];
    }
  }
  return updates;
}

module.exports = { pickAllowedUserUpdates, ALLOWED_UPDATE_FIELDS };
```

- [ ] **Step 5: Run the test to confirm it passes**

```bash
cd server && npm test
```

Expected: all PASS

- [ ] **Step 6: Add the model fields**

In `server/models/user.model.js`, add these fields inside the schema, immediately after the `gender` field block (before the closing `});` of `new mongoose.Schema({ ... })`):

```js
  mobile: {
    type: String,
    required: false,
    trim: true,
  },
  monthlyIncome: {
    type: Number,
    required: false,
    default: 0,
  },
  currency: {
    type: String,
    required: false,
    default: "INR",
  },
  country: {
    type: String,
    required: false,
    trim: true,
  },
```

- [ ] **Step 7: Wire the controller to use the whitelist**

In `server/controllers/user.controller.js`, add the import at the top (after the existing `require`s):

```js
const { pickAllowedUserUpdates } = require("../utils/userUpdate");
```

Replace the body of `updateProfile` (the `try` block's `findOneAndUpdate` call) so it uses the whitelist and `$set`:

```js
  updateProfile: async (req, res) => {
    console.log("update function called");
    const { email } = req.params;
    try {
      const updates = pickAllowedUserUpdates(req.body);
      const user = await User.findOneAndUpdate(
        { email },
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
        status: "Success",
        message: "User updated successfully",
        user,
      });
    } catch (error) {
      console.error("Error in updateProfile function:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
```

(`getProfile` needs no change — it returns the full document, which now includes the new fields.)

- [ ] **Step 8: Re-run the server test suite**

```bash
cd server && npm test
```

Expected: all PASS (the helper test still passes; no test exists for the model/controller wiring — that is verified manually per the spec).

- [ ] **Step 9: Commit**

```bash
git add server/package.json server/package-lock.json server/utils/userUpdate.js server/utils/__tests__/userUpdate.test.js server/models/user.model.js server/controllers/user.controller.js
git commit -m "feat(server): add profile fields and whitelist updateProfile"
```

---

## Task 2: Client pure utils — age, draft↔payload mapping, server normalization (TDD)

**Files:**
- Modify: `client/types/global.d.ts`
- Create: `client/utils/profileCalcs.ts`
- Create: `client/utils/__tests__/profileCalcs.test.ts`
- Create: `client/utils/profileMappings.ts`
- Create: `client/utils/__tests__/profileMappings.test.ts`

**Interfaces:**
- Consumes: the extended `User` type
- Produces:
  - `ageFromDob(dob?: string | Date | null, now?: Date) => number | null`
  - `type ProfileDraft = { firstName: string; lastName: string; dob: string; mobile: string; monthlyIncome: string; currency: string; country: string; profilePicture?: string }`
  - `type UpdateUserPayload = { firstName: string; lastName: string; dob: string; mobile: string; monthlyIncome: number; currency: string; country: string; profilePicture?: string }`
  - `userToProfileDraft(user: Partial<User>) => ProfileDraft`
  - `profileDraftToUpdatePayload(draft: ProfileDraft) => UpdateUserPayload`
  - `normalizeServerUser(raw: any) => User` (maps `_id` → `id`, keeps the rest)

- [ ] **Step 1: Extend the User type**

Replace the `User` type in `client/types/global.d.ts` with:

```ts
export type User = {
    id: string;
    email: string;
    firstName: string;
    lastName?: string;
    dob?: Date | string;
    gender?: "male" | "female";
    mobile?: string;
    monthlyIncome?: number;
    currency?: string;
    country?: string;
    profilePicture?: string;
    totalIncome?: number;
    totalExpense?: number;
}
```

- [ ] **Step 2: Write the failing profileCalcs test**

Create `client/utils/__tests__/profileCalcs.test.ts`:

```ts
import { ageFromDob } from '../profileCalcs';

describe('ageFromDob', () => {
  const NOW = new Date('2026-06-22T00:00:00.000Z');

  it('returns null when dob is missing', () => {
    expect(ageFromDob(undefined, NOW)).toBeNull();
    expect(ageFromDob(null, NOW)).toBeNull();
    expect(ageFromDob('', NOW)).toBeNull();
  });

  it('returns null for an invalid date string', () => {
    expect(ageFromDob('not-a-date', NOW)).toBeNull();
  });

  it('computes whole-year age when the birthday has passed this year', () => {
    expect(ageFromDob('1990-01-01', NOW)).toBe(36);
  });

  it('does not count the current year when the birthday is still upcoming', () => {
    expect(ageFromDob('1990-12-31', NOW)).toBe(35);
  });

  it('counts the birthday itself as the new age', () => {
    expect(ageFromDob('2000-06-22', NOW)).toBe(26);
  });

  it('accepts a Date object', () => {
    expect(ageFromDob(new Date('1996-06-21'), NOW)).toBe(30);
  });

  it('defaults the reference date to now without throwing', () => {
    expect(() => ageFromDob('1990-01-01')).not.toThrow();
  });
});
```

- [ ] **Step 3: Run it to confirm it fails**

```bash
cd client && npx jest --testPathPattern="profileCalcs.test" --no-coverage
```

Expected: FAIL — cannot find module `../profileCalcs`

- [ ] **Step 4: Implement profileCalcs**

Create `client/utils/profileCalcs.ts`:

```ts
export function ageFromDob(dob?: string | Date | null, now: Date = new Date()): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;

  let age = now.getFullYear() - d.getFullYear();
  const monthDiff = now.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}
```

- [ ] **Step 5: Run it to confirm it passes**

```bash
cd client && npx jest --testPathPattern="profileCalcs.test" --no-coverage
```

Expected: all PASS

- [ ] **Step 6: Write the failing profileMappings test**

Create `client/utils/__tests__/profileMappings.test.ts`:

```ts
import {
  userToProfileDraft,
  profileDraftToUpdatePayload,
  normalizeServerUser,
  type ProfileDraft,
} from '../profileMappings';

const draft: ProfileDraft = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  dob: '1990-01-01T00:00:00.000Z',
  mobile: '9999999999',
  monthlyIncome: '50000',
  currency: 'INR',
  country: 'India',
  profilePicture: 'file:///pic.jpg',
};

describe('userToProfileDraft', () => {
  it('maps user fields to string-based draft fields', () => {
    const result = userToProfileDraft({
      firstName: 'Ada',
      lastName: 'Lovelace',
      dob: '1990-01-01T00:00:00.000Z',
      mobile: '9999999999',
      monthlyIncome: 50000,
      currency: 'INR',
      country: 'India',
      profilePicture: 'file:///pic.jpg',
    });
    expect(result).toEqual(draft);
  });

  it('fills missing fields with empty strings and a default currency', () => {
    const result = userToProfileDraft({ firstName: 'Bob' });
    expect(result).toEqual({
      firstName: 'Bob',
      lastName: '',
      dob: '',
      mobile: '',
      monthlyIncome: '',
      currency: 'INR',
      country: '',
      profilePicture: undefined,
    });
  });

  it('renders a zero monthlyIncome as an empty string, not "0"', () => {
    const result = userToProfileDraft({ firstName: 'Bob', monthlyIncome: 0 });
    expect(result.monthlyIncome).toBe('');
  });
});

describe('profileDraftToUpdatePayload', () => {
  it('parses monthlyIncome to a number and trims strings', () => {
    const result = profileDraftToUpdatePayload({ ...draft, firstName: '  Ada  ', monthlyIncome: '50000' });
    expect(result).toEqual({
      firstName: 'Ada',
      lastName: 'Lovelace',
      dob: '1990-01-01T00:00:00.000Z',
      mobile: '9999999999',
      monthlyIncome: 50000,
      currency: 'INR',
      country: 'India',
      profilePicture: 'file:///pic.jpg',
    });
  });

  it('coerces an empty or non-numeric monthlyIncome to 0', () => {
    expect(profileDraftToUpdatePayload({ ...draft, monthlyIncome: '' }).monthlyIncome).toBe(0);
    expect(profileDraftToUpdatePayload({ ...draft, monthlyIncome: 'abc' }).monthlyIncome).toBe(0);
  });

  it('omits profilePicture from the payload when it is undefined', () => {
    const { profilePicture, ...rest } = draft;
    const result = profileDraftToUpdatePayload({ ...rest, profilePicture: undefined });
    expect('profilePicture' in result).toBe(false);
  });
});

describe('normalizeServerUser', () => {
  it('maps _id to id and preserves other fields', () => {
    const result = normalizeServerUser({
      _id: 'abc123',
      email: 'ada@example.com',
      firstName: 'Ada',
      monthlyIncome: 50000,
    });
    expect(result.id).toBe('abc123');
    expect(result.email).toBe('ada@example.com');
    expect(result.firstName).toBe('Ada');
    expect(result.monthlyIncome).toBe(50000);
  });

  it('falls back to an existing id when _id is absent', () => {
    expect(normalizeServerUser({ id: 'xyz', firstName: 'Bob' }).id).toBe('xyz');
  });
});
```

- [ ] **Step 7: Run it to confirm it fails**

```bash
cd client && npx jest --testPathPattern="profileMappings.test" --no-coverage
```

Expected: FAIL — cannot find module `../profileMappings`

- [ ] **Step 8: Implement profileMappings**

Create `client/utils/profileMappings.ts`:

```ts
import type { User } from '@/types/global';

export type ProfileDraft = {
  firstName: string;
  lastName: string;
  dob: string;
  mobile: string;
  monthlyIncome: string;
  currency: string;
  country: string;
  profilePicture?: string;
};

export type UpdateUserPayload = {
  firstName: string;
  lastName: string;
  dob: string;
  mobile: string;
  monthlyIncome: number;
  currency: string;
  country: string;
  profilePicture?: string;
};

function toDateString(dob?: Date | string): string {
  if (!dob) return '';
  const d = new Date(dob);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}

export function userToProfileDraft(user: Partial<User>): ProfileDraft {
  return {
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    dob: toDateString(user.dob),
    mobile: user.mobile ?? '',
    monthlyIncome: user.monthlyIncome ? String(user.monthlyIncome) : '',
    currency: user.currency ?? 'INR',
    country: user.country ?? '',
    profilePicture: user.profilePicture,
  };
}

export function profileDraftToUpdatePayload(draft: ProfileDraft): UpdateUserPayload {
  const payload: UpdateUserPayload = {
    firstName: draft.firstName.trim(),
    lastName: draft.lastName.trim(),
    dob: draft.dob,
    mobile: draft.mobile.trim(),
    monthlyIncome: parseFloat(draft.monthlyIncome) || 0,
    currency: draft.currency.trim() || 'INR',
    country: draft.country.trim(),
  };
  if (draft.profilePicture !== undefined) {
    payload.profilePicture = draft.profilePicture;
  }
  return payload;
}

export function normalizeServerUser(raw: any): User {
  const { _id, ...rest } = raw ?? {};
  return { ...rest, id: _id ?? raw?.id } as User;
}
```

- [ ] **Step 9: Run both util suites to confirm they pass**

```bash
cd client && npx jest --testPathPattern="profileCalcs.test|profileMappings.test" --no-coverage
```

Expected: all PASS

- [ ] **Step 10: Verify TypeScript compiles**

```bash
cd client && npx tsc --noEmit 2>&1 | grep -i "profileCalcs\|profileMappings\|global.d.ts"
```

Expected: no output. (If pre-existing unrelated errors appear elsewhere, confirm none reference these files.)

- [ ] **Step 11: Commit**

```bash
git add client/types/global.d.ts client/utils/profileCalcs.ts client/utils/profileMappings.ts "client/utils/__tests__/profileCalcs.test.ts" "client/utils/__tests__/profileMappings.test.ts"
git commit -m "feat: add profile pure utils (age, draft mapping, user normalization)"
```

---

## Task 3: Client data layer — services + sagas (update / fetch / logout)

**Files:**
- Modify: `client/redux/services/user.service.ts`
- Modify: `client/redux/actions/user.actions.ts`
- Modify: `client/redux/sagas/user.sagas.ts`
- Create: `client/redux/sagas/__tests__/user.sagas.test.ts`

**Interfaces:**
- Consumes: `normalizeServerUser`, `UpdateUserPayload` (Task 2); existing `userSelector`, `updateUserSuccess`/`updateUserFailure`/`fetchUserSuccess`/`fetchUserFailure`/`logoutUserSuccess` action creators, `UPDATE_USER_REQUEST`/`FETCH_USER_REQUEST`/`LOGOUT_USER_REQUEST` types
- Produces:
  - `updateUserService(token: string, email: string, payload: UpdateUserPayload) => Promise<{ status, data }>`
  - `getUserProfileService(token: string, email: string) => Promise<{ status, data }>`
  - `updateUserRequest(payload: { email: string } & Partial<UpdateUserPayload>)` (changed signature)
  - exported sagas `updateUserSaga`, `logoutUserSaga`, `fetchUserSaga`

- [ ] **Step 1: Add the services**

In `client/redux/services/user.service.ts`, append:

```ts
import type { UpdateUserPayload } from '@/utils/profileMappings';

export const updateUserService = async (
  token: string,
  email: string,
  payload: Partial<UpdateUserPayload>
) => {
  const { status, data } = await axios.put(`${API_BASE_URL}/user/${email}`, payload, {
    headers: { authorization: `Bearer ${token}` },
  });
  return { status, data };
};

export const getUserProfileService = async (token: string, email: string) => {
  const { status, data } = await axios.get(`${API_BASE_URL}/user/${email}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  return { status, data };
};
```

- [ ] **Step 2: Change the updateUserRequest action signature**

In `client/redux/actions/user.actions.ts`, replace the `updateUserRequest` creator:

```ts
export const updateUserRequest = (payload: { email: string } & Record<string, unknown>) => ({
  type: UPDATE_USER_REQUEST,
  payload,
});
```

(The `User` import may now be unused by this creator but is still used by `updateUserSuccess`/`fetchUserSuccess` etc. — leave the import.)

- [ ] **Step 3: Write the failing saga test**

Create `client/redux/sagas/__tests__/user.sagas.test.ts`:

```ts
import { call, put, select } from 'redux-saga/effects';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { updateUserSaga, logoutUserSaga, fetchUserSaga } from '../user.sagas';
import { userSelector } from '../../store/selectors';
import { updateUserService, getUserProfileService } from '../../services/user.service';
import {
  updateUserSuccess,
  updateUserFailure,
  fetchUserSuccess,
  fetchUserFailure,
  logoutUserSuccess,
} from '../../actions/user.actions';
import { normalizeServerUser } from '../../../utils/profileMappings';

describe('updateUserSaga', () => {
  const action = {
    type: 'UPDATE_USER_REQUEST',
    payload: { email: 'ada@example.com', firstName: 'Ada', monthlyIncome: 50000 },
  };

  it('selects token, calls the service, and puts success with the normalized user', () => {
    const gen = updateUserSaga(action as any);
    expect(gen.next().value).toEqual(select(userSelector));
    expect(gen.next({ token: 'abc' }).value).toEqual(
      call(updateUserService, 'abc', 'ada@example.com', { firstName: 'Ada', monthlyIncome: 50000 })
    );
    const data = { user: { _id: 'id1', email: 'ada@example.com', firstName: 'Ada' } };
    expect(gen.next({ data }).value).toEqual(put(updateUserSuccess(normalizeServerUser(data.user))));
    expect(gen.next().done).toBe(true);
  });

  it('puts a failure action when the service throws', () => {
    const gen = updateUserSaga(action as any);
    gen.next();
    gen.next({ token: 'abc' });
    const error = new Error('network error');
    expect(gen.throw(error).value).toEqual(put(updateUserFailure(error)));
  });
});

describe('fetchUserSaga', () => {
  const action = { type: 'GET_USER_REQUEST', payload: 'ada@example.com' };

  it('selects token, calls the profile service, and puts success with the normalized user', () => {
    const gen = fetchUserSaga(action as any);
    expect(gen.next().value).toEqual(select(userSelector));
    expect(gen.next({ token: 'abc' }).value).toEqual(
      call(getUserProfileService, 'abc', 'ada@example.com')
    );
    const data = { _id: 'id1', email: 'ada@example.com', firstName: 'Ada' };
    expect(gen.next({ data }).value).toEqual(put(fetchUserSuccess(normalizeServerUser(data))));
    expect(gen.next().done).toBe(true);
  });

  it('puts a failure action when the service throws', () => {
    const gen = fetchUserSaga(action as any);
    gen.next();
    gen.next({ token: 'abc' });
    const error = new Error('boom');
    expect(gen.throw(error).value).toEqual(put(fetchUserFailure(error)));
  });
});

describe('logoutUserSaga', () => {
  it('removes the token from AsyncStorage and puts logout success', () => {
    const gen = logoutUserSaga();
    expect(gen.next().value).toEqual(call([AsyncStorage, 'removeItem'], 'JWT_TOKEN'));
    expect(gen.next().value).toEqual(put(logoutUserSuccess()));
    expect(gen.next().done).toBe(true);
  });
});
```

- [ ] **Step 4: Run it to confirm it fails**

```bash
cd client && npx jest --testPathPattern="user.sagas.test" --no-coverage
```

Expected: FAIL — `updateUserSaga`/`logoutUserSaga` are not exported (and `fetchUserSaga` is not exported yet)

- [ ] **Step 5: Rewrite the sagas**

Replace the full contents of `client/redux/sagas/user.sagas.ts`:

```ts
import { call, put, select, takeLatest } from "redux-saga/effects";
import AsyncStorage from '@react-native-async-storage/async-storage';

import { loginUserService, registerUserService, updateUserService, getUserProfileService } from "../services/user.service";
import {
  fetchUserSuccess,
  fetchUserFailure,
  loginUserSuccess,
  loginUserFailure,
  registerUserSuccess,
  updateUserSuccess,
  updateUserFailure,
  logoutUserSuccess,
} from "../actions/user.actions";
import { userSelector } from "../store/selectors";
import { normalizeServerUser } from "../../utils/profileMappings";

import {
  FETCH_USER_REQUEST,
  LOGIN_USER_REQUEST,
  REGISTER_USER_REQUEST,
  UPDATE_USER_REQUEST,
  LOGOUT_USER_REQUEST,
} from "../actions/action.types";

type LoginPayload = { email: string; password: string };
type LoginAction = { type: string; payload: LoginPayload };
type RegisterUserPayload = { name: string; email: string; password: string };
type RegisterUserAction = { type: string; payload: RegisterUserPayload };

const setLoginToken = async (token: string) => {
  await AsyncStorage.setItem('JWT_TOKEN', token);
};

function* loginUserSaga(action: LoginAction) {
  try {
    const { email, password } = action.payload;
    const { token, user } = yield loginUserService({ email, password });
    yield setLoginToken(token);
    yield put(loginUserSuccess(user, token));
  } catch (error: any) {
    yield put(loginUserFailure(error));
  }
}

function* registerUserSaga(action: RegisterUserAction) {
  try {
    const { email, password, name } = action.payload;
    const response = yield registerUserService({ name, email, password });
    if (response.status === 201) {
      return yield put(registerUserSuccess(response.data?.message));
    }
  } catch (error) {
    console.log("error: ", error);
  }
}

export function* fetchUserSaga(action: any) {
  try {
    const { token } = yield select(userSelector);
    const { data } = yield call(getUserProfileService, token, action.payload);
    yield put(fetchUserSuccess(normalizeServerUser(data)));
  } catch (error) {
    yield put(fetchUserFailure(error as Error));
  }
}

export function* updateUserSaga(action: any) {
  try {
    const { token } = yield select(userSelector);
    const { email, ...payload } = action.payload;
    const { data } = yield call(updateUserService, token, email, payload);
    yield put(updateUserSuccess(normalizeServerUser(data.user)));
  } catch (error) {
    yield put(updateUserFailure(error as Error));
  }
}

export function* logoutUserSaga() {
  try {
    yield call([AsyncStorage, 'removeItem'], 'JWT_TOKEN');
  } catch (error) {
    console.log("logout cleanup failed", error);
  }
  yield put(logoutUserSuccess());
}

export function* watchFetchUser() {
  yield takeLatest(LOGIN_USER_REQUEST, loginUserSaga);
  yield takeLatest(FETCH_USER_REQUEST, fetchUserSaga);
  yield takeLatest(REGISTER_USER_REQUEST, registerUserSaga);
  yield takeLatest(UPDATE_USER_REQUEST, updateUserSaga);
  yield takeLatest(LOGOUT_USER_REQUEST, logoutUserSaga);
}
```

(Note: this removes the now-unused `import { fetchUser } from "../../utils/api/requests"` — the stub is no longer referenced. Leave the stub file in place; deleting it is out of scope.)

- [ ] **Step 6: Run the saga test to confirm it passes**

```bash
cd client && npx jest --testPathPattern="user.sagas.test" --no-coverage
```

Expected: all PASS

- [ ] **Step 7: Run the full client suite (no regressions)**

```bash
cd client && npx jest --no-coverage
```

Expected: all PASS

- [ ] **Step 8: Verify TypeScript compiles**

```bash
cd client && npx tsc --noEmit 2>&1 | grep -i "user.sagas\|user.service\|user.actions"
```

Expected: no output.

- [ ] **Step 9: Commit**

```bash
git add client/redux/services/user.service.ts client/redux/actions/user.actions.ts client/redux/sagas/user.sagas.ts "client/redux/sagas/__tests__/user.sagas.test.ts"
git commit -m "feat: wire user update/fetch/logout sagas and services"
```

---

## Task 4: Profile screen (view/edit) + expo-image-picker

**Files:**
- Modify: `client/app/(logged-in)/profile.tsx`
- (install) `expo-image-picker`

**Interfaces:**
- Consumes: `userSelector` (existing); `fetchUserRequest`, `updateUserRequest` (Tasks 3); `userToProfileDraft`, `profileDraftToUpdatePayload`, `type ProfileDraft` (Task 2); `ageFromDob` (Task 2); `Avatar`, `IconTile`, `Card` (existing); `useRouter` (expo-router)
- Produces: the Profile drill-down default export

- [ ] **Step 1: Install expo-image-picker**

```bash
cd client && npx expo install expo-image-picker
```

- [ ] **Step 2: Build the Profile screen**

Replace the full contents of `client/app/(logged-in)/profile.tsx`:

```tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { User as UserIcon, Phone, Mail, Cake, Wallet, Coins, Globe } from 'lucide-react-native';

import Avatar from '@/components/Avatar';
import IconTile from '@/components/IconTile';
import Card from '@/components/Card';
import { userSelector } from '@/redux/store/selectors';
import { fetchUserRequest, updateUserRequest } from '@/redux/actions/user.actions';
import { userToProfileDraft, profileDraftToUpdatePayload, type ProfileDraft } from '@/utils/profileMappings';
import { ageFromDob } from '@/utils/profileCalcs';

const GREEN = '#0FB46B';

type RowProps = {
  icon: React.ReactNode;
  tileBg: string;
  label: string;
  value: string;
  editing: boolean;
  onChangeText?: (v: string) => void;
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
  editable?: boolean;
  placeholder?: string;
};

function Row({ icon, tileBg, label, value, editing, onChangeText, keyboardType = 'default', editable = true, placeholder }: RowProps) {
  return (
    <View className="flex-row items-center py-3" style={{ gap: 12 }}>
      <IconTile backgroundColor={tileBg} size={38} radius={12}>
        {icon}
      </IconTile>
      <View className="flex-1">
        <Text className="text-tx-tertiary dark:text-tx-tertiary-dark text-xs font-semibold">{label}</Text>
        {editing && editable ? (
          <TextInput
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            placeholder={placeholder}
            placeholderTextColor="#9AA096"
            className="text-tx-primary dark:text-tx-primary-dark"
            style={{ fontSize: 15, fontWeight: '700', paddingVertical: 2 }}
          />
        ) : (
          <Text className="text-tx-primary dark:text-tx-primary-dark font-bold" style={{ fontSize: 15 }}>
            {value || '—'}
          </Text>
        )}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isLoading, error } = useSelector(userSelector) as any;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProfileDraft>(userToProfileDraft(user ?? {}));
  const [hadError, setHadError] = useState(false);
  const wasSaving = useRef(false);

  useEffect(() => {
    if (user?.email) {
      dispatch(fetchUserRequest(user.email));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the draft in sync with the latest user whenever we're not editing.
  useEffect(() => {
    if (!editing && user) {
      setDraft(userToProfileDraft(user));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Exit edit mode on a successful save; stay (with an error) on failure.
  useEffect(() => {
    if (wasSaving.current && !isLoading) {
      wasSaving.current = false;
      if (error) {
        setHadError(true);
      } else {
        setEditing(false);
        setHadError(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const setField = (key: keyof ProfileDraft) => (v: string) => setDraft((d) => ({ ...d, [key]: v }));

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return; // permission denied → keep the fallback avatar, no crash
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });
    if (!result.canceled && result.assets?.[0]) {
      setDraft((d) => ({ ...d, profilePicture: result.assets[0].uri }));
    }
  };

  const onToggle = () => {
    if (editing) {
      if (!user?.email) return;
      setHadError(false);
      wasSaving.current = true;
      dispatch(updateUserRequest({ email: user.email, ...profileDraftToUpdatePayload(draft) }));
    } else {
      setDraft(userToProfileDraft(user ?? {}));
      setEditing(true);
    }
  };

  const fullName = `${draft.firstName} ${draft.lastName}`.trim() || user?.firstName || 'You';
  const age = ageFromDob(draft.dob);
  const dobDisplay = draft.dob ? new Date(draft.dob).toLocaleDateString('en-IN') : '';

  return (
    <SafeAreaView className="flex-1 bg-bg-app dark:bg-bg-app-dark">
      <ScrollView contentContainerStyle={{ paddingTop: 54, paddingHorizontal: 18, paddingBottom: 26 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-5">
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: GREEN }} className="font-bold text-base">‹ Settings</Text>
          </Pressable>
          <Text className="text-tx-primary dark:text-tx-primary-dark font-extrabold text-base">Profile</Text>
          <Pressable
            onPress={onToggle}
            style={{ backgroundColor: GREEN, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 8 }}
          >
            <Text style={{ color: '#FFFFFF' }} className="font-bold text-sm">{editing ? 'Save' : 'Edit'}</Text>
          </Pressable>
        </View>

        {/* Avatar + name */}
        <View className="items-center mb-6">
          <Pressable onPress={editing ? pickImage : undefined}>
            {draft.profilePicture ? (
              <Image
                source={{ uri: draft.profilePicture }}
                style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: '#13C076' }}
              />
            ) : (
              <Avatar initial={(draft.firstName || user?.firstName || 'U')[0]} size={88} radius={44} />
            )}
          </Pressable>
          {editing ? (
            <Text style={{ color: GREEN }} className="font-semibold text-xs mt-2">Tap avatar to change</Text>
          ) : null}
          <Text
            style={{ fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20 }}
            className="text-tx-primary dark:text-tx-primary-dark mt-3"
          >
            {fullName}
          </Text>
          <Text className="text-tx-tertiary dark:text-tx-tertiary-dark text-sm">{user?.email ?? ''}</Text>
        </View>

        {/* Personal */}
        <Text className="text-tx-secondary dark:text-tx-secondary-dark font-bold text-sm mb-1">Personal</Text>
        <Card radius={20} className="px-4 py-1 mb-5">
          <Row editing={editing} tileBg="#E6F6EC" icon={<UserIcon size={18} color="#16A34A" />} label="First name" value={draft.firstName} onChangeText={setField('firstName')} />
          <Row editing={editing} tileBg="#EFEAFE" icon={<UserIcon size={18} color="#7C5CFC" />} label="Last name" value={draft.lastName} onChangeText={setField('lastName')} />
          <Row editing={editing} tileBg="#FFF1E6" icon={<Cake size={18} color="#E8703A" />} label="Date of birth" value={editing ? draft.dob : `${dobDisplay}${age !== null ? `  ·  Age ${age}` : ''}`} onChangeText={setField('dob')} placeholder="YYYY-MM-DD" />
          <Row editing={editing} tileBg="#E6F0FF" icon={<Phone size={18} color="#2563EB" />} label="Mobile" value={draft.mobile} onChangeText={setField('mobile')} keyboardType="phone-pad" />
          <Row editing={false} tileBg="#FDE8E8" icon={<Mail size={18} color="#DC2626" />} label="Email" value={user?.email ?? ''} editable={false} />
        </Card>

        {/* Financial */}
        <Text className="text-tx-secondary dark:text-tx-secondary-dark font-bold text-sm mb-1">Financial</Text>
        <Card radius={20} className="px-4 py-1 mb-5">
          <Row editing={editing} tileBg="#E6F6EC" icon={<Wallet size={18} color="#16A34A" />} label="Monthly income" value={editing ? draft.monthlyIncome : (draft.monthlyIncome ? `₹${Number(draft.monthlyIncome).toLocaleString('en-IN')}` : '')} onChangeText={setField('monthlyIncome')} keyboardType="numeric" />
          <Row editing={editing} tileBg="#FFF7E6" icon={<Coins size={18} color="#D97706" />} label="Currency" value={draft.currency} onChangeText={setField('currency')} />
          <Row editing={editing} tileBg="#E6F6F6" icon={<Globe size={18} color="#0D9488" />} label="Country" value={draft.country} onChangeText={setField('country')} />
        </Card>

        {hadError && error ? (
          <Text style={{ color: '#E8322A' }} className="text-center font-semibold mb-2">
            Failed to save changes. Please try again.
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd client && npx tsc --noEmit 2>&1 | grep -i "profile.tsx"
```

Expected: no output referencing `app/(logged-in)/profile.tsx`. (If `expo-image-picker` types are missing, confirm the install in Step 1 succeeded.)

- [ ] **Step 4: Run the full client suite (no regressions)**

```bash
cd client && npx jest --no-coverage
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add client/package.json client/package-lock.json "client/app/(logged-in)/profile.tsx"
git commit -m "feat: build view/edit Profile screen with avatar picker"
```

---

## Task 5: Settings hub redesign (dark mode + sign out)

**Files:**
- Create: `client/components/settings/ToggleSwitch.tsx`
- Create: `client/components/settings/SettingRow.tsx`
- Modify: `client/app/(logged-in)/(tabs)/profile.tsx`

**Interfaces:**
- Consumes: `useTheme` (existing); `userSelector` (existing); `logoutUserRequest` (existing); `Card`, `IconTile`, `Avatar` (existing); `useRouter` (expo-router)
- Produces:
  - `ToggleSwitch` component `{ value: boolean; onValueChange: (v: boolean) => void }`
  - `SettingRow` component `{ icon: React.ReactNode; tileBg: string; label: string; onPress?: () => void; trailing?: React.ReactNode; labelColor?: string }`
  - the Settings default export

- [ ] **Step 1: Build the ToggleSwitch**

Create `client/components/settings/ToggleSwitch.tsx`:

```tsx
import React from 'react';
import { Pressable, View } from 'react-native';

type ToggleSwitchProps = {
  value: boolean;
  onValueChange: (v: boolean) => void;
};

const ON_TRACK = '#0FB46B';
const OFF_TRACK = '#C8CECC';

export default function ToggleSwitch({ value, onValueChange }: ToggleSwitchProps) {
  return (
    <Pressable
      testID="toggle-switch"
      onPress={() => onValueChange(!value)}
      style={{
        width: 48,
        height: 28,
        borderRadius: 14,
        backgroundColor: value ? ON_TRACK : OFF_TRACK,
        justifyContent: 'center',
        padding: 4,
      }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: '#FFFFFF',
          transform: [{ translateX: value ? 20 : 0 }],
        }}
      />
    </Pressable>
  );
}
```

- [ ] **Step 2: Build the SettingRow**

Create `client/components/settings/SettingRow.tsx`:

```tsx
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import IconTile from '@/components/IconTile';
import Card from '@/components/Card';

type SettingRowProps = {
  icon: React.ReactNode;
  tileBg: string;
  label: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  labelColor?: string;
};

export default function SettingRow({ icon, tileBg, label, onPress, trailing, labelColor }: SettingRowProps) {
  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <Card radius={18} className="flex-row items-center px-4 py-3 mb-3" style={{ gap: 12 }}>
        <IconTile backgroundColor={tileBg} size={38} radius={12}>
          {icon}
        </IconTile>
        <Text
          className="flex-1 font-bold text-[15px] text-tx-primary dark:text-tx-primary-dark"
          style={labelColor ? { color: labelColor } : undefined}
        >
          {label}
        </Text>
        {trailing}
      </Card>
    </Pressable>
  );
}
```

- [ ] **Step 3: Rebuild the Settings screen**

Replace the full contents of `client/app/(logged-in)/(tabs)/profile.tsx`:

```tsx
import React from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { Link2, Bell, Coins, LogOut, Moon } from 'lucide-react-native';

import Avatar from '@/components/Avatar';
import IconTile from '@/components/IconTile';
import SettingRow from '@/components/settings/SettingRow';
import ToggleSwitch from '@/components/settings/ToggleSwitch';
import { useTheme } from '@/contexts/ThemeContext';
import { userSelector } from '@/redux/store/selectors';
import { logoutUserRequest } from '@/redux/actions/user.actions';

export default function Settings() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isDark, toggleDark } = useTheme();
  const { user } = useSelector(userSelector) as any;

  const name = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Your account';

  const onSignOut = () => {
    dispatch(logoutUserRequest());
    router.replace('/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-app dark:bg-bg-app-dark">
      <ScrollView contentContainerStyle={{ paddingTop: 54, paddingHorizontal: 18, paddingBottom: 26 }}>
        <Text
          style={{ fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 30 }}
          className="text-tx-primary dark:text-tx-primary-dark mb-4"
        >
          Settings
        </Text>

        {/* Profile card → Profile screen */}
        <Pressable onPress={() => router.push('/profile')}>
          <LinearGradient
            colors={['#13C076', '#0A9E5E']}
            style={{ borderRadius: 26, padding: 18, marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 14 }}
          >
            <Avatar initial={(user?.firstName ?? 'U')[0]} size={52} radius={18} />
            <View className="flex-1">
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 17 }}>{name}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '600', fontSize: 13, marginTop: 2 }}>
                Premium plan
              </Text>
            </View>
            <Text style={{ color: '#FFFFFF', fontSize: 22 }}>›</Text>
          </LinearGradient>
        </Pressable>

        <SettingRow
          tileBg="#E6F0FF"
          icon={<Link2 size={18} color="#2563EB" />}
          label="Linked accounts"
          trailing={
            <View style={{ backgroundColor: '#E6F0FF', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ color: '#2563EB', fontWeight: '700', fontSize: 12 }}>2</Text>
            </View>
          }
        />

        <SettingRow tileBg="#FFF1E6" icon={<Bell size={18} color="#E8703A" />} label="Notifications" />

        <SettingRow
          tileBg="#FFF7E6"
          icon={<Coins size={18} color="#D97706" />}
          label="Currency & format"
          trailing={
            <Text className="text-tx-tertiary dark:text-tx-tertiary-dark font-bold text-sm">
              {user?.currency ?? 'INR'}
            </Text>
          }
        />

        {/* Dark mode toggle — wired to ThemeContext */}
        <SettingRow
          tileBg="#EFEAFE"
          icon={<Moon size={18} color="#7C5CFC" />}
          label="Dark mode"
          trailing={<ToggleSwitch value={isDark} onValueChange={toggleDark} />}
        />

        {/* Sign out */}
        <SettingRow
          tileBg="#FDE8E8"
          icon={<LogOut size={18} color="#DC2626" />}
          label="Sign out"
          labelColor="#DC2626"
          onPress={onSignOut}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
```

(This removes the Phase-1 debug dark-mode control entirely.)

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd client && npx tsc --noEmit 2>&1 | grep -i "settings\|(tabs)/profile.tsx\|ToggleSwitch\|SettingRow"
```

Expected: no output.

- [ ] **Step 5: Run the full client suite (no regressions)**

```bash
cd client && npx jest --no-coverage
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add client/components/settings/ToggleSwitch.tsx client/components/settings/SettingRow.tsx "client/app/(logged-in)/(tabs)/profile.tsx"
git commit -m "feat: redesign Settings hub with dark-mode toggle and sign out"
```

---

## Task 6: Dashboard hero budget from monthlyIncome

**Files:**
- Modify: `client/screens/Dashboard.tsx`

**Interfaces:**
- Consumes: `user.monthlyIncome` (now on the user state via Tasks 2-4)
- Produces: no new exports — the hero budget derives from `monthlyIncome` with a fallback

- [ ] **Step 1: Derive the budget from monthlyIncome**

In `client/screens/Dashboard.tsx`, the hero currently uses a hardcoded `DEFAULT_MONTHLY_BUDGET = 50000`. Keep the constant as a fallback, and add a derived budget. Replace the budget-related derivations (the lines computing `budgetLeft` and `spentPct`, around lines 66-68) with:

```ts
  const saved = monthIncome - monthSpent;
  const monthlyBudget = user?.monthlyIncome && user.monthlyIncome > 0 ? user.monthlyIncome : DEFAULT_MONTHLY_BUDGET;
  const budgetLeft = Math.max(0, monthlyBudget - monthSpent);
  const spentPct = monthlyBudget > 0 ? (monthSpent / monthlyBudget) * 100 : 0;
```

Then update the `HeroCard` `footerRight` prop (around line 119) to read the derived budget:

```tsx
          footerRight={`of ₹${monthlyBudget.toLocaleString('en-IN')}`}
```

(Leave the Income stat card as-is — it correctly shows transaction-derived income; the spec's "budget/income figures" change targets the hero budget source.)

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && npx tsc --noEmit 2>&1 | grep -i "Dashboard"
```

Expected: no new errors referencing the budget lines. (A pre-existing unrelated `Property 'transactions' does not exist on type 'Transaction'` error may remain — confirm it predates this change with `git stash` if unsure.)

- [ ] **Step 3: Run the full client suite (no regressions)**

```bash
cd client && npx jest --no-coverage
```

Expected: all PASS.

- [ ] **Step 4: Commit**

```bash
git add client/screens/Dashboard.tsx
git commit -m "feat: derive Dashboard hero budget from user monthlyIncome"
```

---

## Manual Testing Checklist

After all tasks are complete, verify manually:

**Server (with the app pointed at a running server + Mongo):**
- [ ] `PUT /user/:email` with `{ firstName, mobile, monthlyIncome, currency, country, dob }` persists and the response `user` reflects the new values
- [ ] `PUT /user/:email` with `{ password: 'x', email: 'new@x.com', _id: 'y' }` does NOT change the password, email, or _id (whitelist holds)
- [ ] `GET /user/:email` returns the new fields
- [ ] `cd server && npm test` passes

**Client (logged-in session):**
- [ ] Settings tab shows the new hub: green profile card, Linked accounts (badge 2), Notifications, Currency & format (trailing currency), Dark mode toggle, Sign out — and the Phase-1 debug toggle is gone
- [ ] Tapping the profile card opens the Profile screen
- [ ] Profile screen loads the current user's fields (fetched on mount)
- [ ] Tapping Edit turns each editable row into an input; Email is never editable
- [ ] Editing fields and tapping Save persists to the server; re-opening Profile (or reload within session) shows the saved values
- [ ] Date of birth shows "· Age N" in view mode and the age updates after changing DOB and saving
- [ ] In edit mode, tapping the avatar opens the image picker; granting permission and choosing an image shows it; **denying permission falls back to the initial avatar with no crash**
- [ ] A save failure keeps you in edit mode, preserves your edits, and shows the inline error
- [ ] Toggling Dark mode from Settings swaps the whole app theme and persists across reload
- [ ] Sign out clears the session and returns to the login screen
- [ ] Dashboard hero "of ₹X" reflects the saved `monthlyIncome` (falls back to ₹50,000 when income is unset/0)
- [ ] Known limitation confirmed acceptable: after a cold app restart, Profile fetch/update may fail until the user logs in again (no Redux token persistence — shared with transactions, out of scope)

## Out of scope

Budgets/savings server persistence (Phase 9). Redux token rehydration across cold restarts (pre-existing, shared with transactions). Real "Premium plan" billing, linked-accounts, and notifications backends (placeholders). Full avatar media hosting/CDN — only the local image URI is captured into `profilePicture`. Server integration tests (the whitelist is unit-tested; round-trip is verified manually).
