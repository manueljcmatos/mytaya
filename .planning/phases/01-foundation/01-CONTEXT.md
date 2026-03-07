# Phase 1: Foundation - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Bilingual Astro 5 site shell with Supabase schema, Philippine-inspired visual identity, dark/light theme toggle, and PWA support. This phase delivers the skeleton that all subsequent phases build upon — no predictions, no blog, no operators yet.

</domain>

<decisions>
## Implementation Decisions

### Visual Identity & Colors
- Dark theme as default — typical for betting sites, easier on eyes at night
- Claude has full discretion on color palette, typography, and logo/wordmark design
- Must be distinctly different from betpro.cl — fresh Philippine-inspired identity
- Should feel like a credible sports prediction brand for the Philippine market

### Homepage Layout
- Hero section: Claude's discretion on design for maximum impact
- Homepage sections (in order of importance):
  1. Today's predictions (placeholder/empty state for Phase 1)
  2. Recent results (placeholder/empty state for Phase 1)
  3. Latest blog posts (placeholder/empty state for Phase 1)
  4. Affiliate operators (placeholder/empty state for Phase 1)
- Sports organization: Tabs by sport (Basketball | Football | Boxing)
- Primary CTA: Join Telegram group (prominent placement, even if group isn't live yet — prepare the hook)

### Language Switching UX
- Toggle style: Flag icons (PH flag for Filipino, US/UK flag for English) in the header
- URL structure: Claude's discretion based on SEO best practices
- Blog translation strategy: Claude's discretion
- Fallback behavior for missing translations: Claude's discretion

### Navigation Structure
- Main nav items: Predictions, Results, Blog/News, Operators
- Sports sub-navigation: Claude's discretion (dropdown vs top-level)
- Mobile navigation: Claude's discretion (hamburger vs bottom tab bar)
- Footer content: Claude's discretion (standard betting site footer expected)

### Claude's Discretion
- Color palette and accent colors
- Typography choices (font families, weights, sizes)
- Logo/wordmark design (text-only, icon+text, or symbol)
- URL structure for i18n (/en/ + /tl/ vs clean English URLs)
- Blog translation approach (paired vs separate posts)
- Translation fallback behavior
- Sports sub-navigation pattern
- Mobile navigation pattern
- Footer layout and content
- Loading skeletons and empty states
- Exact spacing, border radius, shadows

</decisions>

<specifics>
## Specific Ideas

- "Taya" means "bet" in Filipino — brand should feel local and casual, not corporate
- Reference project betpro.cl uses same stack — can reuse architecture patterns but NOT visual design
- Astro built-in i18n routing is sufficient (no external i18n library needed)
- Supabase schema must include paired bilingual columns (title_tl/title_en) and odds-tracking fields from day 1
- Homepage sections will be empty-state placeholders in Phase 1 — predictions, blog, operators filled in later phases

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-07*
