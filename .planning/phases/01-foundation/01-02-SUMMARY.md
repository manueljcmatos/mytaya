---
phase: 01-foundation
plan: 02
subsystem: ui
tags: [astro, layout, header, footer, i18n, theme-toggle, language-switcher, pwa, hreflang, seo]

# Dependency graph
requires:
  - phase: 01-foundation-01
    provides: "Astro project skeleton, i18n routing, CSS theme system, constants module"
provides:
  - "Base Layout.astro with hreflang tags, OG meta, FOUC prevention, PWA registration"
  - "Header component with desktop/mobile nav, language switcher, theme toggle, Telegram CTA"
  - "Footer component with brand, nav links, gambling disclaimer"
  - "LanguageSwitcher component using getAlternatePath route mapping with flag SVGs"
  - "ThemeToggle component with localStorage persistence and view transition support"
affects: [01-foundation, 02-content, 03-api, 04-predictions, 05-blog]

# Tech tracking
tech-stack:
  added: []
  patterns: [astro-layout-shell, glass-header-blur, mobile-hamburger-menu, flag-svg-language-switcher, fouc-prevention-inline-script, hreflang-bilingual-seo]

key-files:
  created:
    - src/layouts/Layout.astro
    - src/components/Header.astro
    - src/components/Footer.astro
    - src/components/LanguageSwitcher.astro
    - src/components/ThemeToggle.astro
  modified: []

key-decisions:
  - "Wordmark 'MY' in brand primary + 'TAYA' in theme text using Bebas Neue display font"
  - "x-default hreflang points to Filipino (tl) URL as the default locale"
  - "LanguageSwitcher shows alternate language flag+label (what user switches TO, not current)"
  - "View transition support via astro:after-swap event listeners on theme toggle and mobile menu"

patterns-established:
  - "Layout shell: all pages use Layout.astro which imports Header/Footer and provides head/default slots"
  - "Component i18n: getLangFromUrl(Astro.url) + useTranslations(lang) in every component frontmatter"
  - "Localized links: NAV_ITEMS[lang] from constants.ts for consistent URL generation"
  - "Theme toggle: sun/moon SVG icons with localStorage persistence and FOUC prevention"

requirements-completed: [FOUND-02, FOUND-06, FOUND-08]

# Metrics
duration: 3min
completed: 2026-03-07
---

# Phase 1 Plan 2: Layout & Shell Components Summary

**Bilingual layout shell with hreflang SEO, glass-blur sticky header, flag-based language switcher, localStorage theme toggle, and gambling disclaimer footer**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-07T16:19:35Z
- **Completed:** 2026-03-07T16:22:39Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Layout.astro wraps every page with hreflang tags (fil, en, x-default), OG/Twitter meta, FOUC prevention, and PWA registration
- Header with sticky glass blur, desktop centered nav, mobile hamburger menu, language switcher, theme toggle, and Telegram CTA
- Footer with MyTaya brand column, predictions/resources nav columns, copyright, 18+ badge, and PAGCOR gambling disclaimer
- LanguageSwitcher maps between localized routes (hula/predictions) using flag SVGs (PH/US)
- ThemeToggle persists dark/light preference to localStorage with no flash on page load

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Layout.astro with hreflang, FOUC prevention, OG meta, and PWA registration** - `aec33e6` (feat)
2. **Task 2: Create Header, Footer, LanguageSwitcher, and ThemeToggle components** - `06f35ed` (feat)

## Files Created/Modified
- `src/layouts/Layout.astro` - Base layout with hreflang, OG meta, FOUC prevention script, Google Fonts, PWA manifest/registration, JSON-LD slot
- `src/components/Header.astro` - Sticky glass header with desktop nav, mobile menu, Telegram CTA using NAV_ITEMS constants
- `src/components/Footer.astro` - 3-column footer with brand, prediction links, resource links, gambling disclaimer, 18+ notice
- `src/components/LanguageSwitcher.astro` - Flag-based language toggle using getAlternatePath for cross-locale URL mapping
- `src/components/ThemeToggle.astro` - Sun/moon theme toggle with localStorage persistence and astro:after-swap support

## Decisions Made
- **Wordmark design:** "MY" in brand primary (#0F766E) + "TAYA" in theme text color using Bebas Neue display font -- simple, bold, local feel
- **x-default hreflang:** Points to Filipino (tl) URL since tl is the default locale and primary audience
- **Language switcher UX:** Shows the alternate language flag and code (what user switches TO), not the current language -- clearer call to action
- **View transitions:** Added astro:after-swap event listeners on both ThemeToggle and mobile menu scripts for future Astro view transition support

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed stray closing tag in LanguageSwitcher SVG**
- **Found during:** Task 2 (LanguageSwitcher creation)
- **Issue:** Philippine flag SVG had an extra `</g>` closing tag without matching opener
- **Fix:** Removed the stray `</g>` tag
- **Files modified:** src/components/LanguageSwitcher.astro
- **Verification:** `npm run build` succeeds
- **Committed in:** 06f35ed (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor SVG markup fix. No scope creep.

## Issues Encountered
- Astro.preferredLocale warning on static build for index.astro -- this is expected behavior since locale detection requires server-side headers. The redirect still works in SSR mode and falls back to default locale (tl) in static builds.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Layout shell complete, every page can now use `<Layout title="...">` to get full SEO, theming, and navigation
- Ready for Plan 03 (locale-prefixed pages) to create actual routed pages under /tl/ and /en/
- All i18n infrastructure (translations, route mapping, language switching) verified working

## Self-Check: PASSED

All 5 created files verified on disk. Both task commits (aec33e6, 06f35ed) verified in git log.

---
*Phase: 01-foundation*
*Completed: 2026-03-07*
