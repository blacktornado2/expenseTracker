# Phase 8: Profile (View / Edit) + Settings Redesign

## Context

Phase 1 created the Profile drill-down as a near-empty route and renamed the old Profile tab to **Settings** (keeping legacy content as a stopgap). This phase builds the real Profile screen (README §Screens → 6. Profile) and the redesigned Settings hub (README §Screens → 5. Settings), and — because Profile needs new fields — does the **first backend change of the series**: extending the `User` model + the update-profile endpoint.

See roadmap for cross-cutting decisions.

## Goal

A view/edit Profile screen with personal + financial fields persisted to the server, and a redesigned Settings hub including the working dark-mode toggle row wired to the Phase-1 `ThemeContext`.

## Current state (relevant facts)

- `server/models/user.model.js` has: `email, password, firstName, lastName, dob, gender, profilePicture`. **Missing**: `mobile`, `monthlyIncome`, `currency`, `country`.
- `server/routes/user.routes.js` already has `PUT /:email` → `UserController.updateProfile` and `GET /:email` → `getProfile`. Update path exists; it just needs the new fields allowed through.
- Client user state + update saga exist (`user.reducer.ts`, `UPDATE_USER_*` actions, `user.service.ts`).
- `(tabs)/profile.tsx` is the Settings tab holding legacy "Account" content (Phase-1 stopgap).
- `ThemeContext` with `isDark` / `toggleDark()` exists from Phase 1, persisted to AsyncStorage.

## Design

### Backend

- **`User` model**: add `mobile` (String), `monthlyIncome` (Number), `currency` (String, default "INR"), `country` (String). Keep `dob` (exists) and use it for age. Optional fields, sensible defaults.
- **`updateProfile` controller**: whitelist the new fields in the allowed-update set (don't blindly spread the body). Re-validate as needed.
- **`getProfile`**: returns the new fields (they're on the model now). No new route needed.
- Migration: none required (Mongo is schemaless-friendly; existing users get defaults/undefined).

### Profile screen (`client/app/(logged-in)/profile.tsx`)

- Header: back "‹ Settings" (`#0FB46B`), centered "Profile", right **Edit/Save** toggle (green, white text).
- Avatar drop-zone (88×88 circle, bg `#13C076`) — image picker (`expo-image-picker`) for upload; fall back to the initial-in-tile `Avatar` (Phase 1). Upload wiring to `profilePicture` may be minimal (store URI / base64) — keep scope tight; full media hosting is not required.
- Name (Bricolage 20/800) + email beneath.
- **Personal** section card: First name, Last name, Date of birth (shows "· Age N"), Mobile, Email — each row = colored `IconTile` + label + value.
- **Financial** section card: Monthly income, Currency, Country.
- **Edit mode**: each value becomes an inline input (`text`/`date`/`tel`/`email`/`number`). Toggling Save dispatches the update (existing `UPDATE_USER_REQUEST`) and exits edit mode. Age derives from DOB; the dashboard's budget/income figures now derive from `monthlyIncome` (update Phase 2's hero `budget` source to read this).

### Settings redesign (`(tabs)/profile.tsx` → Settings)

- **Profile card** — green gradient (`HeroCard`/`Card`) radius 26: avatar tile + name + "Premium plan". **Tap → Profile.**
- Rows (`Card`, radius 18, `IconTile` + label, optional trailing value):
  - Linked accounts (badge "2") — static/placeholder.
  - Notifications — placeholder.
  - Currency & format (trailing "INR" from profile).
  - Sign out (red text) — wire to existing logout (`LOGOUT_USER_REQUEST`).
  - **Dark mode** — row with a toggle switch (track `#0FB46B` on / `#C8CECC` off; 20px thumb translates +20px). **Wired to `ThemeContext.toggleDark()`** — replaces the Phase-1 temporary debug control.

### Derived

- Age from DOB. Dashboard income/budget from `monthlyIncome`. Never store derived values.

### Error handling

- Update failure: stay in edit mode, surface inline error, keep the user's edits.
- Image-picker permission denied: fall back to initial avatar, no crash.

### Testing

- Server: update `getProfile`/`updateProfile` so the new fields round-trip; test the field whitelist rejects unexpected keys (e.g. can't overwrite `password`/`email` via this path if that's the intended rule).
- Client unit: age-from-DOB; profile-draft → update payload mapping.
- Manual: edit each field, Save, reload → values persisted (server); confirm age updates; toggle dark mode from Settings → whole app theme swaps and persists; sign out works; remove the Phase-1 debug dark-mode control.

## Out of scope

Budgets/savings server persistence (Phase 9). Real "Premium plan" billing, linked-accounts, and notifications backends (placeholders). Full avatar media hosting/CDN.
