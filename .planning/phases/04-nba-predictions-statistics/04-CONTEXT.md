# Phase 4: NBA Predictions & Statistics - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Add NBA predictions to the existing predictions system (alongside football) and build a statistics dashboard showing win rate, ROI, streaks, and a profit chart across all sports. No PBA/NCAA PH, no boxing, no prediction cards/images, no Telegram — those are later phases.

</domain>

<decisions>
## Implementation Decisions

### NBA Prediction Specifics
- Prediction types: Spread, Moneyline, and Over/Under total points (3 core NBA bet types)
- Show conference badge (Eastern/Western) on NBA prediction cards
- 3-5 curated picks per day (same quality-first approach as football)
- Extend the existing predictions-worker (not a separate Worker) — add NBA logic to shared cron infrastructure

### Statistics Dashboard Layout
- Hero stat cards at top: Win Rate (% + W/L count), ROI (% + units), Current Streak (W/L count)
- Sport filter: Tabs — All Sports | Football | Basketball
- Time period chips below sport tabs: 7 days | 30 days | All Time
- Recent picks table below the chart: last 10 resolved picks showing match, pick, result, profit

### Profit Chart Visualization
- Line chart showing cumulative profit in units (flat stake, 1 unit per bet)
- Interactive with hover/tap tooltips (date, cumulative profit, number of picks)
- Chart syncs with sport filter and time period — updates when tabs/chips change
- Lightweight JS charting library (e.g. Recharts since React islands are already in use)

### Cross-Sport Integration
- Shared predictions listing page with sport tabs (Basketball | Football) — not separate pages
- Homepage "Today's Predictions" shows both sports mixed, sorted by kickoff/tipoff time
- Same URL pattern for detail pages: /en/predictions/[slug] with sport identifiable from slug prefix
- Single "Predictions" nav item — sport selection happens on the page via tabs

### Claude's Discretion
- Specific charting library choice (Recharts, Chart.js, or lightweight alternative)
- NBA prediction card layout details (how spread/conference badge are positioned)
- Color palette for the profit chart (should match site theme)
- Empty states when no data exists for a sport/time period
- How to handle the NBA offseason (no games available)
- Exact stat card visual design and responsive behavior

</decisions>

<specifics>
## Specific Ideas

- The existing predictions-worker from Phase 3 already handles football — NBA should be additive, not a rewrite
- Phase 3's PredictionList React island already has sport filtering infrastructure (league chips) — this extends to sport-level tabs
- The Supabase predictions table already has a `sport` column — NBA predictions just use 'basketball' value
- ROI calculation: (total_profit / total_stakes) * 100 where each bet is 1 unit at the given odds
- Streak: consecutive W or L from most recent resolved prediction backward

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-nba-predictions-statistics*
*Context gathered: 2026-03-07*
