# Handoff: Expense Tracker (Mobile App)

## Overview
A personal finance / expense-tracking mobile app. Users track income and expenses, set category budgets, view monthly spending insights, manage a savings goal, and edit their profile. The design targets an **iOS-sized mobile viewport (402 × 874 px)** and includes a full light/dark theme.

The reference prototype renders inside an iOS device frame, but the device bezel is **scaffolding only** — implement the app screens, not the bezel.

---

## About the Design Files
The file in this bundle — `Expense Tracker - Pop.dc.html` — is a **design reference created in HTML**. It is an interactive prototype showing the intended look, layout, and behavior. **It is not production code to copy directly.**

Your task is to **recreate these designs in the target codebase's environment** using its established patterns and libraries:
- If the project is **React Native / Expo**, build these as native screens with a navigator (recommended for this app — it's a mobile product).
- If it's **SwiftUI / Kotlin Compose**, recreate natively.
- If it's a **React/Vue web app**, recreate as components inside a mobile-width container.
- If no codebase exists yet, **React Native (Expo) + React Navigation** is the recommended stack for this design.

Do not ship the HTML directly. Use it as the single source of truth for visual + behavioral intent.

> **How to read the prototype's code:** it's written as a single-component reactive template. The `<script data-dc-script>` block at the bottom holds all state and logic in a `renderVals()` method; the markup above binds to those values via `{{ ... }}` holes. Treat `renderVals()` as the spec for state and derived data, and the markup as the spec for layout/styles.

---

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, radii, shadows, and interactions are all specified. Recreate the UI pixel-accurately using the codebase's component library, then wire the documented behavior. All exact values are in the **Design Tokens** section.

---

## Tech & Foundations

- **Viewport**: designed at **402 px wide** (iPhone logical width). All px values below are at this width.
- **Fonts** (Google Fonts):
  - **Plus Jakarta Sans** — body/UI. Weights used: 400, 500, 600, 700, 800.
  - **Bricolage Grotesque** — display/headings (page titles, big numbers, card headers). Weights: 600, 700, 800.
- **Theme**: light + dark, driven by a `darkMode` boolean. In the prototype this toggles a `data-dark="true"` attribute that swaps CSS variables. In a native app, implement as a theme context with the two token sets in **Design Tokens**.
- **Icons**: all icons are inline SVG in a Feather/Lucide-style stroke aesthetic (`stroke-width` 2–2.4, round caps/joins, 24×24 viewBox). Use **lucide-react / lucide-react-native** equivalents where possible; exact `d` paths are in the HTML if you need to match precisely.
- **No emoji** except one intentional 🎉 in the savings "Goal reached!" state.

---

## Navigation Model

A bottom tab bar with **5 tabs** + a **floating action button (FAB)**:

| Tab | Accent color | Icon (lucide) |
|---|---|---|
| Home | `#0FB46B` | `home` |
| Activity | `#2BB3FF` | `align-justify` / list |
| Budgets | `#7C5CFC` | `pie-chart`/clock-style ring |
| Insights | `#F59E0B` | `bar-chart-2` |
| Settings | `#F5A623` | `settings` (gear) |

- Inactive tab color: `--tx-inactive` (`#B4B9B0` light / `#607060` dark).
- **FAB**: green gradient `+` button, fixed bottom-right, opens the Add screen. **Hidden on the Budgets screen** (Budgets has its own `+` in its header) and on all full-screen/non-tab views (Add, Profile, Savings, Income list).
- Tab bar itself is **hidden** on: Add, Profile, Income list, Savings screens (these are full-screen flows / drill-downs).

Screens reachable outside the tab bar (drill-downs):
- **Profile** ← from Settings header card, or from the avatar on the Home header.
- **Savings** ← from the "Saved" stat card on Home.
- **Income list** ← from the "Income" stat card on Home.
- **Add** ← from the FAB.

---

## Screens / Views

### 1. Home (Dashboard)
**Purpose:** At-a-glance monthly overview + recent activity.

**Layout** (vertical scroll, `54px 18px 26px` padding):
1. **Header row** (space-between):
   - Left: time-based greeting with a small **icon pill** (26×26, radius 9), then "March overview" title.
     - Greeting changes by time of day with matching icon + colors:
       - 5–12h: "Good morning", sun icon, color `#F59E0B`, pill bg `#FFFBEB`
       - 12–17h: "Good afternoon", sun icon, color `#F97316`, pill bg `#FFF7ED`
       - 17–21h: "Good evening", sunset icon, color `#E8703A`, pill bg `#FFF1E6`
       - else: "Good night", moon icon, color `#7C5CFC`, pill bg `#EFEAFE`
   - Right: **avatar** — 46×46, radius 16, bg `#16201A`, white "A" initial, weight 800. **Tap → Profile.**
2. **Balance hero card** — radius 30, padding 24, green gradient `linear-gradient(140deg,#13C076,#0A9E5E)`, shadow `0 18px 38px rgba(15,180,107,.32)`, white text. Decorative translucent circles top-right/bottom-right. Contains: uppercase name label, "Spent this month", big amount (Bricolage 44/800, tabular-nums), a progress bar (track `rgba(255,255,255,.28)`, fill white at `spentPct%`), and a row "₹X left" / "of ₹budget".
3. **Two stat cards** (flex, gap 12):
   - **Income** card — white, radius 22, padding 16. Icon tile 34×34 radius 11 bg `#E6F6EC` (green up-right arrow). Label "Income", value `₹4,200`. **Tap → Income list.**
   - **Saved** card — same style, icon bg `#EFEAFE` (purple savings icon). Label "Saved", value = live computed savings. **Tap → Savings.**
4. **"Where it goes" card** — white radius 26. Header with a **bar/pie chart toggle** (segmented, 2 options). Bar mode: a single horizontal stacked bar of category proportions. Pie mode: an SVG donut. Below: wrapping legend of categories (color dot + name).
5. **Recent** section — header "Recent" + "See all" link (`#0FB46B`, → Activity). List of transaction rows.

**Transaction row** (reused across Home/Activity/Income list): white card, radius 20, padding `14px 16px`, shadow `--shadow-tx`, flex gap 14. Left: 46×46 radius 15 category-colored tile with white category icon. Middle: name (15/800, ellipsis) + "Category · date" (12.5/600, `--tx-tertiary`). Right: amount, tabular-nums, weight 800 — income `+₹` in `#16A34A`, expense `-₹` in `--tx-primary`. **Tap → Edit Transaction modal.**

### 2. Activity (Transactions)
**Purpose:** Browse, search, and filter all transactions.

**Layout** (`54px 18px 26px`):
- Title "Activity" (Bricolage 30/800).
- **Search field** — radius 16, white, 1.5px border `--border-input`, leading search icon, trailing clear (✕) button when text present. Filters by name OR category (case-insensitive).
- **Filter chips** — `All`, `Expenses`, `Income`. Active chip filled with its color (All `#2BB3FF`, Expenses `#E8322A`, Income `#0FB46B`), white text; inactive = white card.
- **Empty state** when no results: centered search icon + "No transactions found" + hint.
- Transaction list (same row component).

### 3. Budgets
**Purpose:** Set monthly category spend limits and track consumption.

**Layout** (`54px 18px 26px`):
- Header: "Budgets" title + **`+` button** (38×38, radius 13, green gradient) → Add Budget modal.
- **Total consumed card** — white radius 24. "Total consumed" + "₹spent / ₹limit". A segmented multi-color progress bar (each budget's share). Wrapping legend.
- **Budget grid** — 2 columns, gap 13. Each tile: white radius 24, centered. A **conic-gradient ring** (66×66) showing percent consumed (`barColor` if under, `#E25555` if over) with the % in the middle. Below: category name + "₹spent / ₹limit". **Tap → Edit Budget modal.**

### 4. Insights  *(newest screen)*
**Purpose:** Month-over-month spending analysis. (Phase 2 planned: tap a category to see its month-by-month trend.)

**Layout** (`54px 18px 26px`):
- Title "Insights" (Bricolage 30/800).
- **Month pills** — horizontal scroll row; each pill "Mon 'YY" (e.g. "Mar '26"). Active pill = green `#0FB46B` filled white text; inactive = `--bg-close` / `--tx-secondary`. Tapping a pill selects that month.
- **Summary card** — green gradient (same family as Home hero), radius 26. Uppercase "MONTH YEAR" label. **Hero "Total spent"** (Bricolage 40/800). Below a `rgba(255,255,255,.22)` divider: a 2-up row of **Income** and **Saved** (Bricolage 18/800). If a previous month exists, a trend line under another divider: "↑ ₹X more than [prevMonth]" or "↓ ₹X less than [prevMonth]".
- **Spending trend card** — white radius 24. "Spending trend" header. A 6-bar chart (one bar per month, height ∝ spend, max bar = 74px tall). The selected month's bar is green `#0FB46B`; others `--bg-close`. **Tapping a bar selects that month** (syncs with pills + summary).
- **"Where it went" card** — white radius 24. Category breakdown for the selected month, sorted **highest → lowest spend**. Each row: 36×36 category icon tile, then name + amount on one line, a thin progress bar (category color, 75% opacity, width = % of total), and "X% of total" beneath. Empty state: "No expenses recorded".

**Data note:** The current month (March) is computed live from the transaction list; prior months use seeded mock data (see State Management). In production, all months derive from real transactions grouped by month.

### 5. Settings
**Purpose:** Account hub.

**Layout** (`54px 18px 26px`):
- **Profile card** — green gradient radius 26, avatar tile + name + "Premium plan". **Tap → Profile.**
- Rows (white, radius 18, shadow `--shadow-tx`, icon tile + label, optional trailing value):
  - Linked accounts (badge "2")
  - Notifications
  - Currency & format (trailing "INR")
  - Sign out (red text `#E25555`/`#E8322A`)
  - **Dark mode** — row with a toggle switch. Track `#0FB46B` when on / `#C8CECC` off; 20px white thumb translates +20px when on. Toggles the app theme.

### 6. Profile  *(drill-down, no tab bar)*
**Purpose:** View/edit personal + financial details.

- Header: back "‹ Settings" (`#0FB46B`), centered "Profile", right **Edit/Save** toggle button (green `#0FB46B`, white text).
- Avatar drop-zone (88×88 circle, bg `#13C076`) — a user-uploaded photo slot in the prototype; in production this is an image picker / avatar upload.
- Name (Bricolage 20/800) + email beneath.
- **Personal** section (uppercase label) — card with rows: First name, Last name, Date of birth (shows "· Age N"), Mobile, Email. Each row: colored icon tile + field label + value.
- **Financial** section — card with rows: Monthly income, Currency, Country.
- **Edit mode:** every value becomes an inline input (`text`/`date`/`tel`/`email`/`number`). Toggling Save persists and exits edit mode. Age and the dashboard's income figures derive from these fields.

### 7. Savings  *(drill-down, no tab bar)*
**Purpose:** Track monthly savings + a savings goal.

- Header: back "‹ Home" + centered "Savings".
- **Hero card** (green gradient radius 28): "March 2026" label, "Saved this month", big amount (Bricolage 44/800), two pills: "X% of income" and a trend "↑/↓ ₹X vs Feb".
- **This month card** (white radius 24): Income bar (full, green) and Expenses bar (red, width = expenses/income), then a divider and "Net saved +₹X" in green.
- **6-month trend card**: 6 bars, current month highlighted green, others `--bg-close`.
- **Monthly goal card** (white radius 24): header + "Edit goal" button. Edit reveals an inline `₹` number input + "Set" button. Body: an **SVG progress ring** (88×88, r=36, stroke 8, green arc via `stroke-dasharray`, % in center) beside the saved amount, "of ₹goal goal", a thin progress bar, and "₹X to go" / "Goal reached! 🎉".

### 8. Add Transaction  *(full-screen flow, no tab bar)*
**Purpose:** Enter a new expense or income via an on-screen numpad.

- Top bar: "Cancel" (→ Home) + title ("New expense"/"New income").
- **Expense/Income segmented toggle** — Expense active = `#E8322A`, Income active = `#0FB46B`.
- **Amount display** — centered, "Amount" label + big `₹{amount}` (Bricolage 58/800). Color: green for income, dark for expense, **red `#E8322A` when amountError** (save attempted with 0).
- **Name field** (required) — pencil icon + text input. Turns red (`#E8322A` border, `#FFF5F5` bg) when nameError.
- **Date field** — calendar icon + date input (defaults to today).
- **Category** section — header with **Edit** toggle. Wrapping selectable chips (category color + icon + name; selected = soft bg + colored border + colored text). In edit mode, chips show a red ✕ delete badge and an "Add" dashed chip appears. **Add-category editor**: icon preview (opens a 30-icon picker), color swatch (opens a 12-color picker), name input, confirm.
- **Numpad** — 3-column grid of keys `1–9 . 0 ⌫`, each 58px tall, white, radius 18. Builds the amount string (max 2 decimals).
- **Submit button** — full-width 56px, radius 18; "Add expense" (red gradient) / "Add income" (green gradient).

### 9. Income list  *(drill-down, no tab bar)*
- Back "← Home" + "Income" title. Green summary card: total income + count. List of income transactions (same row component, but with soft-bg icon tiles), or an empty state.

### Modals (bottom sheets)
Both slide up from the bottom over a `rgba(22,32,26,.45)` scrim; sheet bg `--bg-app`, radius `28px 28px 0 0`, padding `22px 20px ~36px`. Tap scrim to dismiss.

- **Edit Transaction** — Expense/Income toggle, Name / Amount(`₹`) / Date inputs, category chips, "Save changes" (green gradient) + "Delete transaction" (red `#FFF0F0` bg, `#E8322A` text).
- **Add/Edit Budget** — title "New Budget"/"Edit Budget". Add mode: category chips (only categories without an existing budget). Edit mode: the locked category shown as a tile. Monthly limit `₹` input. "Save budget" (+ "Delete budget" in edit mode).

---

## Interactions & Behavior

- **Tab navigation**: sets the active screen; tab icon adopts its accent color when active.
- **FAB**: opens Add screen; resets the draft (expense mode, today's date, empty amount/name, first expense category).
- **Numpad entry**: `del` removes last char; `.` adds a decimal once; digits append; blocks >2 decimal places; resets `amountError` on any key.
- **Save (Add)**: validates name non-empty (else `nameError`) and amount > 0 (else `amountError`, amount turns red). On success: prepend transaction, update `monthSpent` (expenses only), reset draft, navigate to Activity.
- **Chart toggle** (Home): switches `chartMode` between `bar` and `pie`.
- **Insights month select**: pills and trend bars both set `insightsMonth`; the summary, trend highlight, and breakdown all react.
- **Edit Transaction**: prefills draft from the row; recomputes `monthSpent` deltas on save/delete.
- **Budgets**: add/edit/delete write to `budgetsState`; rings/segments recompute from live spend-by-category.
- **Profile edit**: toggles inline inputs; derived values (age, dashboard income) update from fields.
- **Savings goal**: "Edit goal" reveals input seeded with current goal; "Set" persists if > 0.
- **Dark mode toggle**: swaps the entire token set.
- **Transitions**: bottom sheets slide/fade in; toggle thumb transl­ates; bars have subtle height transitions. Keep durations ~200–300ms, ease-out.

---

## State Management

All state lives in one component in the prototype. In production, split by domain (e.g. a transactions store, a budgets store, a profile store, a UI/nav store). Key state:

| State | Type | Notes |
|---|---|---|
| `nav` | string | Active screen: `home`, `transactions`, `budgets`, `insights`, `settings`, `profile`, `add`, `income-list`, `savings`. Replace with a real navigator. |
| `transactions` | array | `{ name, category, amount (+income/−expense), date, isoDate? }` |
| `monthSpent` | number | Running expense total for the current month. |
| `draft` | object | Add-screen working values: `{ amount, category, name, date }`. |
| `nameError` / `amountError` | boolean | Add-screen validation flags. |
| `entryType` | `expense`/`income` | Add-screen mode. |
| `expenseCats` / `incomeCats` | string[] | Category names per type. |
| `customCatMeta` | map | User-created categories → `{ color, path (icon), soft }`. |
| `catEditMode`, `addingCat`, `newCat*`, pickers | various | Category management UI state. |
| `filter`, `searchQuery` | string | Activity filtering. |
| `budgetsState` | array | `{ cat, limit }`. Spend is derived from transactions. |
| `budgetModal`, `budgetDraft` | object | Budget sheet state. |
| `txModal`, `txDraft` | object | Edit-transaction sheet state. |
| `profile` | object | `{ firstName, lastName, dob, mobile, email, currency, country, monthlyIncome }`. |
| `profileEditing` | boolean | Profile edit mode. |
| `chartMode` | `bar`/`pie` | Home chart. |
| `darkMode` | boolean | Theme. |
| `savingsGoal` | number | Monthly savings target. |
| `savingsHistory` | array | `{ month, saved }` for the 6-month savings trend (seed/mock). |
| `showGoalInput`, `goalDraft` | — | Savings goal editing. |
| `insightsMonth` | number | Selected month index (0–5). |
| `monthlyData` | array | `{ month, year, spent, income, cats:{category:amount} }`. **Seed/mock for past months; current month is computed live.** In production, derive all months by grouping real transactions. |

**Derived data** (compute, don't store): per-category spend, budget ring %, savings amount = income − spent, savings rate, insights breakdown + trend deltas, age from DOB.

---

## Design Tokens

### Colors — Light (default)
| Token | Hex |
|---|---|
| `--bg-app` | `#FBFAF7` |
| `--bg-card` | `#FFFFFF` |
| `--bg-subtle` | `#ECEBE6` |
| `--bg-close` | `#F0EFE8` |
| `--tx-primary` | `#16201A` |
| `--tx-secondary` | `#8E948C` |
| `--tx-tertiary` | `#9AA096` |
| `--tx-chip` | `#6B7066` |
| `--tx-inactive` | `#B4B9B0` |
| `--border-row` | `#F3F2EB` |
| `--border-input` | `#F0EFE8` |
| `--border-chip` | `#ECEBE6` |

### Colors — Dark (`data-dark="true"`)
| Token | Hex |
|---|---|
| `--bg-app` | `#111810` |
| `--bg-card` | `#192218` |
| `--bg-subtle` | `#202C1E` |
| `--bg-close` | `#1E2A1C` |
| `--tx-primary` | `#E2E9E0` |
| `--tx-secondary` | `#9EAE9C` |
| `--tx-tertiary` | `#7E8E7C` |
| `--tx-chip` | `#9AAA98` |
| `--tx-inactive` | `#607060` |
| `--border-row` | `#252E23` |
| `--border-input` | `#263024` |
| `--border-chip` | `#263024` |

### Brand / accent
| Use | Value |
|---|---|
| Primary green (gradient) | `linear-gradient(140deg,#13C076,#0A9E5E)` (cards) · `linear-gradient(135deg,#13C076,#0A9E5E)` (buttons/FAB) |
| Primary green (solid) | `#0FB46B` |
| Expense red | `#E8322A` (gradient to `#C0241D`) |
| Over-budget red | `#E25555` |
| Income green text | `#16A34A` |

### Category colors (color · soft-bg)
| Category | Color | Soft |
|---|---|---|
| Groceries | `#2FB872` | `#E6F6EE` |
| Dining | `#FF6B5E` | `#FFEDEA` |
| Transport | `#2BB3FF` | `#E6F4FF` |
| Shopping | `#7C5CFC` | `#EFEAFE` |
| Bills | `#F5A623` | `#FEF2DE` |
| Entertainment | `#FF5CA8` | `#FFEAF3` |
| Health | `#18BFA8` | `#E3F8F4` |
| Income/Salary | `#16A34A` | `#E6F6EC` |
| Education | `#3B82F6` | `#EFF6FF` |
| Travel | `#06B6D4` | `#ECFEFF` |
| Fitness | `#10B981` | `#ECFDF5` |
| (custom palette) | 12 swatches incl. `#F59E0B`, `#8B5CF6`, `#EF4444`, `#8A8F86` | see HTML |

### Tab accent colors
Home `#0FB46B` · Activity `#2BB3FF` · Budgets `#7C5CFC` · Insights `#F59E0B` · Settings `#F5A623` · inactive `--tx-inactive`.

### Typography
| Role | Font | Size / weight |
|---|---|---|
| Page title | Bricolage Grotesque | 30 / 800 |
| Big number (hero) | Bricolage Grotesque | 40–58 / 800, tabular-nums, letter-spacing −1px |
| Card header | Bricolage Grotesque | 16 / 700 |
| Body / labels | Plus Jakarta Sans | 13–15 / 700–800 |
| Secondary text | Plus Jakarta Sans | 11–12.5 / 600–700 |
| Tab label | Plus Jakarta Sans | 9 / 800 |

### Radius
Cards 22–30 · rows/inputs 14–20 · chips/pills 10–20 · icon tiles 11–15 · FAB/buttons 18 · sheets `28 28 0 0`.

### Shadows
| Token | Value |
|---|---|
| `--shadow-card` | `0 8px 22px rgba(22,32,26,.05)` |
| `--shadow-tx` | `0 6px 18px rgba(22,32,26,.04)` |
| `--shadow-tab` | `0 -4px 24px rgba(22,32,26,.07)` |
| `--shadow-key` | `0 3px 10px rgba(22,32,26,.05)` |
| FAB | `0 8px 28px rgba(15,180,107,.50)` |
| Hero card | `0 18px 38px rgba(15,180,107,.32)` |
(dark mode: card/tx shadows → `none`; tab/key shadows deepen — see token tables.)

### Spacing
Screen padding `54px 18px 26px` (top inset accounts for the status bar). Card padding 16–24. Common gaps: 8–14.

### Currency / format
Currency is **INR (₹)**, formatted with `Intl.NumberFormat('en-IN')`. Amounts show 2 decimals in lists (`₹1,234.50`) and rounded for big summary figures (`₹2,180`).

---

## Assets
- **Fonts**: Plus Jakarta Sans + Bricolage Grotesque (Google Fonts).
- **Icons**: inline SVG, Feather/Lucide style — map to `lucide-react`/`lucide-react-native`. Exact `d` paths are in the HTML (`META` map + per-screen SVGs) if you need 1:1 matches.
- **Avatar photo**: user-uploaded (prototype uses a drag-drop image slot). Implement with an image picker; fall back to the initial-in-tile avatar.
- No raster image assets are required; all visuals are SVG/CSS.

---

## Files
- `Expense Tracker - Pop.dc.html` — the complete interactive prototype (all screens, state, and logic). Open in a browser to interact. Read the `<script data-dc-script>` block for the authoritative state model and the markup above it for exact styling.

---

## Suggested Build Order
1. Theme tokens (light/dark) + fonts + the transaction-row and card primitives.
2. Tab navigator + 5 tab screens shells + FAB.
3. Home dashboard (hero, stat cards, chart toggle, recent list).
4. Add Transaction flow (numpad, validation, categories).
5. Activity (search/filter) + Edit Transaction sheet.
6. Budgets (grid, rings) + Add/Edit Budget sheet.
7. Insights (month pills, summary, trend, breakdown).
8. Savings + Income list drill-downs.
9. Profile (view/edit).
10. Dark mode pass + polish (transitions, empty states, error states).
