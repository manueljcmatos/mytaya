# Phase 3: Football Predictions - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Daily football predictions automatically fetched from API-Football, displayed with match details and odds, and auto-resolved when results come in. Users browse today's pending picks and historical results. No statistics dashboard, no prediction cards/images, no Telegram integration — those are later phases.

</domain>

<decisions>
## Implementation Decisions

### Prediction Display & Cards
- Text-only for teams (no team logos/crests) — avoids copyright issues, can add later
- Prediction types: Core 3 only — Match Winner (1X2), Over/Under goals, Both Teams to Score
- Card density and win/loss visual treatment: Claude's discretion

### Data Sourcing & Leagues
- AI-generated predictions via Cloudflare Worker using API-Football match data + odds
- 3-5 curated picks per day (quality over quantity)
- League selection: Claude's discretion based on API-Football availability and PH audience interest
- Odds format: Claude's discretion based on PH market conventions

### Prediction Detail Pages
- Medium-depth analysis: 2-3 paragraphs covering form, key stats, reasoning for the pick
- Separate URLs per language: /tl/mga-hula/[slug] and /en/predictions/[slug] (consistent with site i18n)
- Use Schema.org SportsEvent JSON-LD from Phase 2 on prediction pages
- Resolved predictions update in place with final score and WIN/LOSS outcome (same URL stays alive for SEO)

### Browse & Navigation
- Tab navigation: "Today's Picks" and "Past Results" tabs on the predictions page
- League filter chips: horizontal scrollable chips (All | Premier League | La Liga | etc.)
- Results history: last 30 days with pagination
- Predictions grouped by date with section headers (e.g. "Today — March 7")

### Claude's Discretion
- Prediction card density (compact vs rich)
- Win/loss visual treatment (color-coded borders, badges, etc.)
- League selection and count
- Odds display format (decimal only vs multiple formats)
- Loading states and empty states
- Exact card layout, spacing, typography

</decisions>

<specifics>
## Specific Ideas

- The site already has the Supabase predictions table with bilingual columns and odds fields from Phase 1
- Phase 2's seo.ts has buildSportsEventSchema() ready to be consumed by prediction detail pages
- API-Football is already the confirmed API provider — same one used by betpro.cl reference project
- Cloudflare Worker handles the cron job: fetch matches, generate picks, store in Supabase
- Static site regeneration or ISR needed to display fresh predictions (Astro hybrid mode consideration)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-football-predictions*
*Context gathered: 2026-03-07*
