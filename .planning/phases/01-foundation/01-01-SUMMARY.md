---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [astro, react, tailwind-v4, supabase, i18n, pwa, css-custom-properties, typescript]

# Dependency graph
requires: []
provides:
  - "Astro 5 project skeleton with React, sitemap, PWA integrations"
  - "i18n routing for /tl/ and /en/ URL prefixes with translation helpers"
  - "Tailwind v4 theme system with deep teal brand palette and dark/light CSS custom properties"
  - "Supabase client (conditional, env-based) for build-time data fetching"
  - "Foundation SQL migration with 6 tables, bilingual columns, odds tracking, RLS"
  - "Constants module with sports, nav items, type definitions"
affects: [01-foundation, 02-content, 03-api, 04-predictions, 05-blog]

# Tech tracking
tech-stack:
  added: [astro@5.18.0, react@19.2.4, tailwindcss@4.2.1, "@tailwindcss/vite@4.2.1", "@tailwindcss/typography@0.5.19", "@astrojs/react@4.4.2", "@astrojs/sitemap@3.7.0", "@supabase/supabase-js@2.98.0", "@vite-pwa/astro"]
  patterns: [css-custom-properties-theming, class-based-dark-mode, conditional-supabase-client, astro-i18n-prefix-routing, bilingual-paired-columns]

key-files:
  created:
    - astro.config.mjs
    - src/styles/global.css
    - src/i18n/ui.ts
    - src/i18n/utils.ts
    - src/i18n/routes.ts
    - src/lib/supabase.ts
    - src/lib/constants.ts
    - src/env.d.ts
    - src/pages/index.astro
    - supabase/migrations/00000000000000_foundation.sql
    - supabase/config.toml
    - .env.example
    - public/favicon.svg
    - .gitignore
  modified: []

key-decisions:
  - "Deep teal (#0F766E) brand palette instead of betpro's gold -- Philippine tropical identity"
  - "Bebas Neue (display) + Inter (body) fonts -- distinct from betpro's Oswald/Outfit"
  - "Denormalized sport column on predictions table for query performance"
  - "Astro i18n fallback set to en->tl (non-default falls back to default)"
  - "Conditional Supabase client (null if env vars missing) -- no hardcoded fallback keys"

patterns-established:
  - "CSS custom properties: --t-* prefix for theme tokens toggled via :root/.light class"
  - "i18n: getLangFromUrl() + useTranslations() for all UI text"
  - "Routes: getAlternatePath() for language switcher URL mapping"
  - "Supabase: conditional client export, null-safe usage"
  - "Tailwind v4: @tailwindcss/vite plugin, @theme block, @custom-variant dark"

requirements-completed: [FOUND-01, FOUND-03, FOUND-04, FOUND-05, FOUND-06, FOUND-07]

# Metrics
duration: 5min
completed: 2026-03-07
---

# Phase 1 Plan 1: Project Init Summary

**Astro 5 bilingual project with deep teal theme system, i18n routing (tl/en), Tailwind v4 CSS custom properties, and Supabase foundation schema with 6 RLS-enabled tables**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-07T16:11:02Z
- **Completed:** 2026-03-07T16:16:28Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments
- Astro 5 project builds successfully with React, sitemap, PWA, and Tailwind v4 via @tailwindcss/vite
- Bilingual i18n routing configured with /tl/ and /en/ prefixes, translation helpers, and route mapping
- Deep teal brand palette with full dark/light theme system using CSS custom properties
- Supabase migration with predictions (bilingual + odds), posts, leagues, teams, stats, and leads tables

## Task Commits

Each task was committed atomically:

1. **Task 1: Initialize Astro project with all integrations, i18n config, theme system, and translation helpers** - `58eac16` (feat)
2. **Task 2: Create Supabase foundation migration with bilingual predictions schema** - `474dd00` (feat)

## Files Created/Modified
- `astro.config.mjs` - Astro config with i18n, React, sitemap, PWA integrations, Tailwind vite plugin
- `src/styles/global.css` - Tailwind v4 imports, @theme brand tokens, dark/light CSS custom properties, reusable CSS classes
- `src/i18n/ui.ts` - UI string translations for Filipino (tl) and English (en) with 50+ keys each
- `src/i18n/utils.ts` - getLangFromUrl() and useTranslations() helpers
- `src/i18n/routes.ts` - Localized route mapping for language switcher (hula<->predictions, etc.)
- `src/lib/supabase.ts` - Conditional Supabase client from env vars
- `src/lib/constants.ts` - Sports enum, nav items, social links, type definitions
- `src/env.d.ts` - Astro client types and PWA virtual module declarations
- `src/pages/index.astro` - Root language detection redirect
- `supabase/migrations/00000000000000_foundation.sql` - 6 tables with RLS, policies, indexes
- `supabase/config.toml` - Supabase CLI configuration
- `.env.example` - Environment variable template
- `public/favicon.svg` - Minimal teal SVG favicon
- `.gitignore` - Node, build, env exclusions
- `package.json` - Project dependencies
- `tsconfig.json` - TypeScript strict config with React JSX

## Decisions Made
- **Brand palette:** Deep teal (#0F766E primary, #14B8A6 light) -- distinctly different from betpro's gold (#C8A84E), evokes Philippine tropical identity
- **Typography:** Bebas Neue for display headings (bold condensed, sports feel), Inter for body text (modern geometric, excellent readability) -- both different from betpro's Oswald/Outfit
- **Predictions sport column:** Added denormalized `sport` column directly on predictions table instead of using invalid subquery index from RESEARCH.md -- simpler queries, better performance
- **i18n fallback:** Set `en: 'tl'` (English falls back to Filipino) since `tl` is defaultLocale and Astro forbids defaultLocale as fallback key
- **Supabase client:** Conditional creation (returns null if env vars missing) with no hardcoded fallback keys, unlike betpro's approach

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Astro i18n fallback configuration**
- **Found during:** Task 1 (build verification)
- **Issue:** Plan and RESEARCH.md specified `fallback: { tl: 'en' }` but Astro rejects the defaultLocale as a fallback key
- **Fix:** Changed to `fallback: { en: 'tl' }` (non-default locale falls back to default)
- **Files modified:** astro.config.mjs
- **Verification:** `npm run build` succeeds
- **Committed in:** 58eac16 (Task 1 commit)

**2. [Rule 3 - Blocking] Added .gitignore for clean commits**
- **Found during:** Task 1 (commit preparation)
- **Issue:** No .gitignore existed, node_modules and dist would be committed
- **Fix:** Created .gitignore with standard Node/Astro exclusions
- **Files modified:** .gitignore
- **Verification:** `git status` shows clean exclusions
- **Committed in:** 58eac16 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes necessary for correct builds and clean git history. No scope creep.

## Issues Encountered
- Astro `create-astro` CLI refused to scaffold in non-empty directory (due to .planning/ and .git). Created project structure manually with correct file contents instead of using template. No functionality lost.

## User Setup Required

External services require manual configuration before Supabase features work:
- `PUBLIC_SUPABASE_URL` - from Supabase Dashboard -> Settings -> API -> Project URL
- `PUBLIC_SUPABASE_ANON_KEY` - from Supabase Dashboard -> Settings -> API -> Project API keys -> anon/public
- Run the foundation migration SQL against your Supabase project

## Next Phase Readiness
- Project skeleton complete, ready for Layout, Header, Footer, and page components (Plan 02)
- i18n infrastructure ready for all components to use getLangFromUrl() and useTranslations()
- Theme system ready for all components to use CSS custom properties
- Supabase migration ready to apply when database is configured

## Self-Check: PASSED

All 14 created files verified on disk. Both task commits (58eac16, 474dd00) verified in git log.

---
*Phase: 01-foundation*
*Completed: 2026-03-07*
