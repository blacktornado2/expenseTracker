# Phase 6: Insights

## Context

Insights is a brand-new tab (Phase-1 placeholder, accent `#F59E0B`). This phase builds the month-over-month spending analysis screen (README §Screens → 4. Insights). It reuses the `HeroCard` (Phase 2) and chart primitives.

See roadmap for cross-cutting decisions.

## Goal

Let users pick a month and see total spent, income, saved, a month-over-month trend, a 6-bar spending-trend chart, and a sorted category breakdown — current month computed live from transactions, prior months from seeded data until full history exists.

## Current state (relevant facts)

- `client/app/(logged-in)/(tabs)/insights.tsx` is a Phase-1 placeholder.
- Per-month aggregation does not exist yet; Phase 2 added current-month selectors only.

## Design

### Data

- `monthlyData`: `[{ month, year, spent, income, cats: {category: amount} }]` for ~6 months.
- **Current month** is computed live by grouping real transactions (new selector `selectMonthlyData` that buckets transactions by month and sums per category).
- **Prior months** use seeded/mock data initially (README "Data note"). Keep the seed in one obvious place (`client/utils/data/` already holds mock JSON) so it's easy to delete once real history is sufficient.
- `insightsMonth`: selected month index (0–5), local state.

### Screen layout (padding `54px 18px 26px`)

- Title "Insights" (Bricolage 30/800).
- **Month pills** — horizontal scroll; each "Mon 'YY" (e.g. "Mar '26"). Active = green `#0FB46B` filled white; inactive = `bg-close` / `tx-secondary`. Tapping selects that month (sets `insightsMonth`).
- **Summary card** — `HeroCard` (green gradient, radius 26). Uppercase "MONTH YEAR" label; hero "Total spent" (Bricolage 40/800); below a translucent divider a 2-up Income / Saved row (Bricolage 18/800); if a previous month exists, a trend line: "↑ ₹X more than [prevMonth]" / "↓ ₹X less than [prevMonth]".
- **Spending trend card** — `Card`. "Spending trend" header. A 6-bar chart (one bar/month, height ∝ spend, max bar 74px). Selected month's bar green `#0FB46B`; others `bg-close`. **Tapping a bar selects that month** (syncs pills + summary).
- **"Where it went" card** — `Card`. Category breakdown for the selected month, sorted **highest → lowest**. Each row: 36×36 category icon tile, name + amount on one line, a thin progress bar (category color @75%, width = % of total), "X% of total" beneath. Empty state: "No expenses recorded".

### New components

- `client/components/insights/MonthPills.tsx` — horizontal selectable pills.
- `client/components/insights/TrendBars.tsx` — 6-bar tappable chart (reuse/generalize Phase 2 bar primitive if reasonable).
- `client/components/insights/CategoryBreakdownList.tsx` — sorted rows with inline progress bars.
- `HeroCard` reused for the summary card (already built Phase 2 with optional footer rows/pills).

### Derived

- Trend delta = `selectedSpent − prevMonthSpent`.
- Breakdown % = `categoryAmount / monthSpent`.
- All computed, never stored.

### Testing

- Unit: monthly bucketing selector (`selectMonthlyData`) with a fixture spanning multiple months; trend delta; breakdown sort + percentages — pure logic, TDD.
- Manual: select months via pills and via trend bars (confirm they stay in sync); confirm summary, trend highlight, and breakdown all react; confirm sort order and empty state.

## Out of scope

Tap-a-category drill-down to its month-by-month trend (README marks this "Phase 2 planned" for the *design* — defer; it's a future enhancement, not part of this 10-phase port). Replacing seeded prior-month data with full real history (happens naturally once enough real transactions exist / Phase 9).
