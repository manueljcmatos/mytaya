# Phase 7: PBA, Boxing & Manual Content - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Manual prediction entry for Philippine-identity sports (PBA, NCAA Philippines, boxing) displayed alongside existing automated predictions. These sports lack reliable APIs for automation and require editorial/manual content creation via Supabase dashboard. Boxing predictions use a fight card format with fighter profiles. No custom admin UI, no multi-user system, no new social platforms -- those are separate phases or backlog items.

</domain>

<decisions>
## Implementation Decisions

### Manual Entry Workflow
- Predictions created directly via Supabase dashboard table editor -- no custom admin page or CLI needed
- Solo operator (single author) -- no multi-user roles or access control required
- Manual predictions are first-class citizens in the existing pipeline: card generation (PNG via workers-og), Telegram drip publishing, and blog article generation all trigger automatically
- Resolution is manual via Supabase -- update the result field directly after match/fight ends, existing 30-min cron handles result card generation and Telegram result posting
- Database schema must support manual entry: fields like match_date, home_team, away_team (or fighter names for boxing), league, pick, odds, confidence, analysis text (bilingual) should be insertable via Supabase UI

### Claude's Discretion
- Boxing fight card visual layout and fighter profile display format
- How PBA/NCAA PH predictions coexist with NBA in the basketball section (tab structure, league grouping)
- How bilingual editorial content fields are structured in the database
- Whether boxing gets its own dedicated page/section or integrates into existing predictions flow
- Visual differentiation between automated and manual predictions (if any)
- PBA/NCAA team seeding in the teams table

</decisions>

<specifics>
## Specific Ideas

- The existing predictions-worker cron already handles card generation and Telegram publishing -- manual predictions just need to be in the right table format to be picked up
- PBA and NCAA PH are basketball leagues, so they share infrastructure with NBA (same sport, same display components)
- Boxing is fundamentally different from team sports -- fighter vs fighter, weight classes, records, rounds -- and likely needs distinct display treatment
- Supabase's table editor provides a decent data entry experience for a solo operator without building custom forms

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 07-pba-boxing-manual-content*
*Context gathered: 2026-03-08*
