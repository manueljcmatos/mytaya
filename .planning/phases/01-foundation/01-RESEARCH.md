# Phase 1: Foundation - Research

**Researched:** 2026-03-07
**Domain:** Bilingual Astro 5 static site with Supabase schema, i18n routing, dark/light theming, PWA support
**Confidence:** HIGH

## Summary

Phase 1 delivers the site shell that all subsequent phases build upon: a bilingual (Filipino/English) Astro 5 static site with Supabase schema, dark/light theme toggle, and PWA installability. The betpro.cl reference project provides a proven architecture template using the exact same stack (Astro 5 + React 19 + Tailwind CSS v4 + Supabase), but mytaya needs additional i18n routing, a distinct Philippine-inspired visual identity, and multi-sport navigation.

The core technical challenges are: (1) Astro's built-in i18n routing with `prefixDefaultLocale: true` for symmetric `/tl/` and `/en/` URL paths, (2) a CSS custom properties-based dark/light theme system compatible with Tailwind v4's `@custom-variant`, (3) Supabase schema with bilingual paired columns and odds-tracking fields, and (4) PWA integration via `@vite-pwa/astro`. All of these are well-documented patterns with high confidence.

**Primary recommendation:** Mirror betpro's architecture patterns (Layout, Header/Footer, global.css theming, Supabase client) but add Astro i18n routing configuration, language switcher with flag icons, and a completely fresh color palette/typography. Use `@vite-pwa/astro` instead of betpro's raw `vite-plugin-pwa` approach for cleaner Astro integration.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Dark theme as default -- typical for betting sites, easier on eyes at night
- Claude has full discretion on color palette, typography, and logo/wordmark design
- Must be distinctly different from betpro.cl -- fresh Philippine-inspired identity
- Should feel like a credible sports prediction brand for the Philippine market
- Homepage sections (in order): Today's predictions, Recent results, Latest blog posts, Affiliate operators -- all as empty-state placeholders in Phase 1
- Sports organization: Tabs by sport (Basketball | Football | Boxing)
- Primary CTA: Join Telegram group (prominent placement)
- Language toggle: Flag icons (PH flag for Filipino, US/UK flag for English) in the header
- Main nav items: Predictions, Results, Blog/News, Operators
- "Taya" means "bet" in Filipino -- brand should feel local and casual, not corporate
- Astro built-in i18n routing is sufficient (no external i18n library needed)
- Supabase schema must include paired bilingual columns (title_tl/title_en) and odds-tracking fields from day 1

### Claude's Discretion
- Color palette and accent colors
- Typography choices (font families, weights, sizes)
- Logo/wordmark design (text-only, icon+text, or symbol)
- URL structure for i18n (/en/ + /tl/ vs clean English URLs)
- Blog translation approach (paired vs separate posts)
- Translation fallback behavior
- Sports sub-navigation pattern
- Mobile navigation pattern (hamburger vs bottom tab bar)
- Footer layout and content
- Loading skeletons and empty states
- Exact spacing, border radius, shadows

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOUND-01 | Site renders in Filipino and English with auto-detection based on browser language | Astro i18n routing with `Astro.preferredLocale` for Accept-Language detection; root `/` page redirects to `/tl/` or `/en/` based on browser preference |
| FOUND-02 | User can manually toggle between Filipino and English from any page | Language switcher component using `getRelativeLocaleUrl()` helper from `astro:i18n`; flag icons in header |
| FOUND-03 | Each language has its own URL structure with proper hreflang tags for SEO | `prefixDefaultLocale: true` gives symmetric `/tl/` and `/en/` paths; `<link rel="alternate" hreflang>` tags in Layout; `@astrojs/sitemap` with i18n config for sitemap hreflang |
| FOUND-04 | Supabase schema stores predictions with paired bilingual columns | Predictions table with `pick_label_tl`/`pick_label_en`, `analysis_tl`/`analysis_en` paired columns; proven pattern from betpro (single-language) extended to bilingual |
| FOUND-05 | Predictions table captures odds at prediction time for ROI calculation | `odds` decimal column on predictions table; `prediction_stats` table for computed win rate and ROI; SQL migration pattern from betpro reference |
| FOUND-06 | User can toggle dark/light theme with persistence across sessions | CSS custom properties for theme tokens (like betpro); Tailwind v4 `@custom-variant dark (&:where(.dark, .dark *));`; localStorage persistence with FOUC-preventing inline script in `<head>` |
| FOUND-07 | Site is installable as PWA with offline support and push notification capability | `@vite-pwa/astro` integration with Workbox; service worker registration via `virtual:pwa-register`; manifest with Philippine-themed icons |
| FOUND-08 | Fresh Philippine-inspired visual identity with responsive design | New color palette, typography, and layout distinct from betpro's gold/black scheme; responsive via Tailwind v4 breakpoints; mobile-first approach |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | 5.x (latest) | Static site generator with i18n routing | Committed. Built-in i18n routing handles `/tl/` and `/en/` paths natively. Islands architecture keeps JS minimal. |
| React | 19.x | Interactive islands (theme toggle, language switcher) | Committed. Only loads where interactivity is needed via `client:load` / `client:visible` directives. |
| Tailwind CSS | 4.x | Utility-first styling with CSS-first configuration | Committed. v4 uses `@import "tailwindcss"` and `@theme` blocks in CSS, no config file needed. |
| @tailwindcss/vite | 4.x | Tailwind Vite plugin | Required for Tailwind v4 in Astro. Replaces the old `@astrojs/tailwind` integration. |
| @supabase/supabase-js | 2.x | Supabase client for build-time data fetching | Fetch predictions at build time in `getStaticPaths()`. Anon key only (public read). |
| @vite-pwa/astro | latest | PWA integration (service worker, manifest, installability) | Astro-specific integration for vite-plugin-pwa. Handles service worker registration and manifest injection. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @astrojs/react | 4.x | React integration for Astro islands | Required for any React component with `client:*` directives |
| @astrojs/sitemap | 3.x | XML sitemap with i18n hreflang support | Configure with i18n locales for automatic hreflang in sitemap |
| @tailwindcss/typography | latest | Prose styling for blog/analysis content | Apply to blog posts and prediction analysis sections |
| workbox-precaching | 7.x | Service worker precaching strategies | Peer dependency of @vite-pwa/astro for offline support |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@vite-pwa/astro` | Raw `vite-plugin-pwa` in Vite config (betpro approach) | `@vite-pwa/astro` is the recommended Astro-specific wrapper. Betpro uses the raw plugin, but the Astro integration handles lifecycle hooks properly. Use `@vite-pwa/astro`. |
| Astro built-in i18n | astro-i18n-aut, Paraglide.js | Overkill for 2 locales. Built-in i18n covers routing, URL helpers, and language detection. No external library needed. |
| CSS custom properties for theming | Tailwind `dark:` variant only | CSS vars give more control over theme tokens (backgrounds, borders, text colors). Betpro's proven pattern with `--t-bg`, `--t-text`, etc. is more maintainable than scattering `dark:` everywhere. |

**Installation:**
```bash
# Create Astro project
npm create astro@latest mytaya

# Add integrations
npx astro add react sitemap

# Core dependencies
npm install @supabase/supabase-js

# Tailwind v4 (CSS-first)
npm install tailwindcss @tailwindcss/vite @tailwindcss/typography

# PWA
npm install -D @vite-pwa/astro

# Dev dependencies
npm install -D @types/react @types/react-dom
```

## Architecture Patterns

### Recommended Project Structure
```
mytaya/
├── src/
│   ├── components/
│   │   ├── Header.astro          # Site header with nav, lang switcher, theme toggle
│   │   ├── Footer.astro          # Site footer with links, disclaimer
│   │   ├── LanguageSwitcher.astro # Flag icons for TL/EN toggle
│   │   ├── ThemeToggle.astro     # Sun/moon icon for dark/light toggle
│   │   ├── TelegramBanner.astro  # CTA to join Telegram channel
│   │   ├── SportTabs.astro       # Basketball | Football | Boxing tabs
│   │   └── EmptyState.astro      # Placeholder for sections filled in later phases
│   ├── i18n/
│   │   ├── ui.ts                 # UI string translations { tl: {...}, en: {...} }
│   │   ├── utils.ts              # t() helper, getLangFromUrl(), useTranslations()
│   │   └── routes.ts             # Localized route name mapping
│   ├── layouts/
│   │   └── Layout.astro          # Base layout: hreflang tags, OG meta, theme init, PWA
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client (build-time reads via anon key)
│   │   └── constants.ts          # Sports, nav items, social links config
│   ├── pages/
│   │   ├── index.astro           # Root: language detection redirect to /tl/ or /en/
│   │   ├── tl/                   # Filipino pages
│   │   │   ├── index.astro       # Homepage (Filipino)
│   │   │   ├── hula/             # Predictions (empty state)
│   │   │   │   └── index.astro
│   │   │   ├── resulta/          # Results (empty state)
│   │   │   │   └── index.astro
│   │   │   ├── blog/             # Blog (empty state)
│   │   │   │   └── index.astro
│   │   │   └── mga-operator/     # Operators (empty state)
│   │   │       └── index.astro
│   │   └── en/                   # English pages (mirror structure)
│   │       ├── index.astro
│   │       ├── predictions/
│   │       │   └── index.astro
│   │       ├── results/
│   │       │   └── index.astro
│   │       ├── blog/
│   │       │   └── index.astro
│   │       └── operators/
│   │           └── index.astro
│   └── styles/
│       └── global.css            # Tailwind v4 imports, @theme, CSS custom properties
├── public/
│   ├── icon-192.png              # PWA icon
│   ├── icon-512.png              # PWA icon
│   ├── favicon.svg               # Browser favicon
│   └── flags/                    # PH and US/UK flag images for lang switcher
├── supabase/
│   ├── config.toml               # Supabase CLI config
│   └── migrations/
│       └── 00000000000000_foundation.sql  # Initial schema
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

### Pattern 1: Astro i18n Routing with Symmetric Prefixes
**What:** Both `/tl/` and `/en/` are explicit URL prefixes. Root `/` redirects based on browser language.
**When to use:** Always -- this is the core routing pattern for the entire site.
**Example:**
```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import AstroPWA from '@vite-pwa/astro';

export default defineConfig({
  site: 'https://mytaya.com',
  i18n: {
    locales: ['tl', 'en'],
    defaultLocale: 'tl',
    fallback: { tl: 'en' },
    routing: {
      prefixDefaultLocale: true, // /tl/... and /en/...
      redirectToDefaultLocale: false, // Root / handles its own redirect
    },
  },
  integrations: [
    react(),
    sitemap({
      i18n: {
        defaultLocale: 'tl',
        locales: { tl: 'fil-PH', en: 'en-PH' },
      },
    }),
    AstroPWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'MyTaya - Mga Hula sa Sports',
        short_name: 'MyTaya',
        description: 'Mga tamang hula sa basketball, football, at boxing para sa Filipino',
        theme_color: '#0A0A0A', // Will be set to brand accent
        background_color: '#0A0A0A',
        display: 'standalone',
        start_url: '/tl/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        navigateFallback: '/404',
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

### Pattern 2: CSS Custom Properties Theme System (Proven from betpro)
**What:** Define theme tokens as CSS custom properties in `:root` (dark) and `:root.light` (light). Use Tailwind v4's `@custom-variant` for class-based dark mode toggling.
**When to use:** Every component that has theme-dependent colors.
**Example:**
```css
/* src/styles/global.css */
@import "tailwindcss";
@plugin "@tailwindcss/typography";

/* Override Tailwind's default dark mode to use class-based toggle */
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  /* Brand tokens - these go into Tailwind's theme system */
  --color-brand-primary: #...; /* Main accent color */
  --color-brand-light: #...;
  --color-win: #22C55E;
  --color-loss: #EF4444;

  --font-display: '...', sans-serif;
  --font-body: '...', sans-serif;
}

/* Theme variables - toggled by .light class on <html> */
:root {
  /* Dark theme (default) */
  --t-bg: #0A0A0A;
  --t-bg-card: #141414;
  --t-border: #1F1F1F;
  --t-text: #F5F5F5;
  --t-text-sec: #9CA3AF;
  --t-header-bg: #0A0A0Ae6;
  /* ... more tokens */
}

:root.light {
  --t-bg: #F5F5F0;
  --t-bg-card: #FFFFFF;
  --t-border: #E2E2DD;
  --t-text: #1A1A1A;
  --t-text-sec: #6B7280;
  --t-header-bg: #FFFFFFe6;
  /* ... more tokens */
}
```

### Pattern 3: Language Detection at Root
**What:** The root `/` page detects browser language via `Astro.preferredLocale` and redirects to the appropriate locale path.
**When to use:** Only on the root `index.astro` page.
**Example:**
```astro
---
// src/pages/index.astro
const preferred = Astro.preferredLocale || 'tl';
const target = preferred === 'en' ? '/en/' : '/tl/';
return Astro.redirect(target, 302);
---
```

### Pattern 4: Translation Helper (from Astro i18n recipe)
**What:** A simple `t()` function that looks up UI strings by locale. No external library needed.
**When to use:** Every Astro component rendering UI text.
**Example:**
```typescript
// src/i18n/ui.ts
export const languages = { tl: 'Filipino', en: 'English' };
export const defaultLang = 'tl';

export const ui = {
  tl: {
    'nav.predictions': 'Mga Hula',
    'nav.results': 'Mga Resulta',
    'nav.blog': 'Blog',
    'nav.operators': 'Mga Operator',
    'hero.title': 'Mga Tamang Hula sa Sports',
    'hero.subtitle': 'Basketball, Football, at Boxing para sa Filipino',
    'cta.telegram': 'Sumali sa Telegram',
    'cta.predictions': 'Mga Hula Ngayon',
    'theme.toggle': 'Baguhin ang tema',
    'footer.disclaimer': 'Ang pagsusugal ay may panganib. Magsugal nang responsable.',
    'empty.predictions': 'Wala pang mga hula. Babalik kami!',
    'empty.results': 'Wala pang mga resulta.',
    'empty.blog': 'Wala pang mga artikulo.',
    'empty.operators': 'Wala pang mga operator.',
  },
  en: {
    'nav.predictions': 'Predictions',
    'nav.results': 'Results',
    'nav.blog': 'Blog',
    'nav.operators': 'Operators',
    'hero.title': 'Expert Sports Predictions',
    'hero.subtitle': 'Basketball, Football, and Boxing for the Filipino Bettor',
    'cta.telegram': 'Join Telegram',
    'cta.predictions': "Today's Predictions",
    'theme.toggle': 'Toggle theme',
    'footer.disclaimer': 'Gambling involves risk. Gamble responsibly.',
    'empty.predictions': 'No predictions yet. Stay tuned!',
    'empty.results': 'No results yet.',
    'empty.blog': 'No articles yet.',
    'empty.operators': 'No operators yet.',
  },
} as const;

// src/i18n/utils.ts
import { ui, defaultLang } from './ui';

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof typeof ui[typeof defaultLang]) {
    return ui[lang][key] || ui[defaultLang][key];
  };
}
```

### Pattern 5: Hreflang Tags in Layout
**What:** Every page includes `<link rel="alternate">` hreflang tags pointing to both language versions.
**When to use:** In the base Layout.astro component.
**Example:**
```astro
---
// src/layouts/Layout.astro
import { getAbsoluteLocaleUrl } from 'astro:i18n';

const currentPath = Astro.url.pathname;
// Extract the path after the locale prefix
const pathWithoutLocale = currentPath.replace(/^\/(tl|en)/, '') || '/';

const tlUrl = getAbsoluteLocaleUrl('tl', pathWithoutLocale);
const enUrl = getAbsoluteLocaleUrl('en', pathWithoutLocale);
---
<head>
  <link rel="alternate" hreflang="fil" href={tlUrl} />
  <link rel="alternate" hreflang="en" href={enUrl} />
  <link rel="alternate" hreflang="x-default" href={enUrl} />
</head>
```

### Pattern 6: Theme Toggle with FOUC Prevention
**What:** Inline script in `<head>` reads localStorage before paint to prevent flash of wrong theme.
**When to use:** In Layout.astro, before any visible content.
**Example:**
```html
<!-- In <head>, before any stylesheet -->
<script is:inline>
  (function(){
    var t = localStorage.getItem('theme');
    // Default is dark (no class needed), light mode adds .light
    if (t === 'light') document.documentElement.classList.add('light');
  })();
</script>
```

### Anti-Patterns to Avoid
- **Client-side-only translations:** Never use React state/context for language switching. Each language must be a separate static URL path for SEO. The i18n must happen at the routing level, not the component level.
- **Using `@astrojs/tailwind` with Tailwind v4:** The old Astro Tailwind integration does not support v4. Use `@tailwindcss/vite` as a Vite plugin instead (betpro pattern).
- **Hardcoding theme colors:** Always use CSS custom properties (`var(--t-bg)`, `var(--t-text)`) so dark/light mode works. Never hardcode hex values in components.
- **Duplicating page content inline:** Use the `t()` translation helper for all UI strings. Keep content DRY through shared components that accept a `lang` prop.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| i18n URL routing | Custom middleware for locale detection | Astro built-in i18n (`i18n` config in astro.config.mjs) | Built-in handles prefixing, fallbacks, Accept-Language detection, URL helpers |
| Service worker / PWA | Manual service worker registration | `@vite-pwa/astro` with Workbox | SW lifecycle management, precaching, update prompts are complex; Workbox handles edge cases |
| Sitemap with hreflang | Manual XML sitemap generation | `@astrojs/sitemap` with i18n config | Automatic hreflang generation in sitemap XML |
| Theme persistence | Custom theme context/provider | CSS custom properties + localStorage + inline `<head>` script | Zero JS framework overhead; betpro's proven pattern |
| Database migrations | Manual SQL via Supabase dashboard | Supabase CLI migrations in `supabase/migrations/` | Reproducible schema, version controlled, local dev support |

**Key insight:** The betpro reference project has already solved most of these patterns. The main addition is i18n routing, which Astro handles natively. Do not introduce external i18n libraries.

## Common Pitfalls

### Pitfall 1: Flash of Unstyled Content (FOUC) on Theme Toggle
**What goes wrong:** Page loads in dark mode, then flashes to light mode when JS hydrates.
**Why it happens:** Theme class is applied after DOM is ready, causing a visible flash.
**How to avoid:** Place a synchronous inline `<script is:inline>` in `<head>` (before stylesheets) that reads localStorage and adds the `.light` class before any paint. Betpro does this correctly.
**Warning signs:** Visible flash when loading the site with light mode preference saved.

### Pitfall 2: Tailwind v4 Configuration Confusion
**What goes wrong:** Trying to use `tailwind.config.js` or `@astrojs/tailwind` with Tailwind v4.
**Why it happens:** Tailwind v4 is CSS-first. The config file approach and the old Astro integration do not work.
**How to avoid:** Use `@tailwindcss/vite` as a Vite plugin. All configuration goes in `global.css` using `@theme` blocks and `@custom-variant`. Follow betpro's pattern exactly.
**Warning signs:** "Cannot find module 'tailwind.config'" errors, or styles not applying.

### Pitfall 3: Astro i18n Locale Code for Filipino
**What goes wrong:** Using `fil` vs `tl` inconsistently, or using wrong hreflang codes.
**Why it happens:** ISO 639-1 code for Filipino is `tl` (Tagalog), ISO 639-3 is `fil`. HTML `lang` attribute and hreflang use different standards.
**How to avoid:** Use `tl` as the Astro locale code (short, used in URLs). Use `fil` or `fil-PH` in hreflang tags and HTML `lang` attributes. The `@astrojs/sitemap` i18n config maps `tl` to `fil-PH`.
**Warning signs:** Google Search Console warnings about invalid hreflang codes.

### Pitfall 4: PWA Service Worker Caching Stale Content
**What goes wrong:** Service worker caches old HTML/CSS, users see outdated content after deploy.
**Why it happens:** Default Workbox precaching strategy caches everything aggressively.
**How to avoid:** Use `registerType: 'autoUpdate'` (betpro pattern) so the SW updates silently. Configure reasonable cache expiry. For a static site that rebuilds, `autoUpdate` is the right strategy.
**Warning signs:** Users reporting they see old content even after you deploy.

### Pitfall 5: Missing Language Switcher URL Mapping
**What goes wrong:** Language switcher links to wrong page or 404s because localized route names differ (e.g., `/tl/hula/` vs `/en/predictions/`).
**Why it happens:** Filipino and English page slugs are different (localized route names).
**How to avoid:** Create a route mapping in `src/i18n/routes.ts` that maps equivalent pages across locales. The language switcher uses this map to construct the alternate URL.
**Warning signs:** 404s when switching language on non-index pages.

### Pitfall 6: Supabase Anon Key Exposure
**What goes wrong:** Using service role key in client-side code, exposing write access.
**Why it happens:** Copy-pasting from backend code.
**How to avoid:** Astro site uses `PUBLIC_SUPABASE_ANON_KEY` (read-only via RLS). Service role key is ONLY in Workers (server-side). Enable RLS on all tables with public read policies. Betpro's pattern: fallback values for anon key are safe (public key, read-only).
**Warning signs:** Service role key visible in browser devtools or source code.

## Code Examples

### Supabase Foundation Migration
```sql
-- supabase/migrations/00000000000000_foundation.sql

-- Leagues (NBA, PBA, football leagues, boxing)
CREATE TABLE IF NOT EXISTS public.leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sport TEXT NOT NULL CHECK (sport IN ('basketball', 'football', 'boxing')),
  country TEXT NOT NULL,
  api_source TEXT CHECK (api_source IN ('api-sports', 'betsapi', 'manual')),
  api_league_id INTEGER,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Teams
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  league_id UUID REFERENCES public.leagues(id),
  api_team_id INTEGER,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Predictions (core content with bilingual columns + odds tracking)
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  league_id UUID REFERENCES public.leagues(id),
  home_team_id UUID REFERENCES public.teams(id),
  away_team_id UUID REFERENCES public.teams(id),
  match_date TIMESTAMPTZ NOT NULL,

  -- Bilingual content (FOUND-04)
  pick TEXT NOT NULL,  -- 'home', 'away', 'draw', 'over', 'under'
  pick_label_tl TEXT NOT NULL,  -- "Lakers mananalo"
  pick_label_en TEXT NOT NULL,  -- "Lakers to win"
  analysis_tl TEXT,
  analysis_en TEXT,

  -- Odds tracking (FOUND-05)
  odds DECIMAL(6,2) NOT NULL,
  odds_source TEXT,  -- Where odds were taken from
  stake INTEGER CHECK (stake BETWEEN 1 AND 10),
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),

  -- Resolution
  result TEXT CHECK (result IN ('win', 'loss', 'push', 'void')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'settled', 'cancelled')),
  settled_at TIMESTAMPTZ,

  -- Publishing
  published_site BOOLEAN DEFAULT false,
  published_telegram BOOLEAN DEFAULT false,
  card_image_url TEXT,

  -- API tracking
  api_fixture_id INTEGER,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Blog posts (bilingual)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title_tl TEXT NOT NULL,
  title_en TEXT NOT NULL,
  content_tl TEXT NOT NULL,
  content_en TEXT NOT NULL,
  excerpt_tl TEXT,
  excerpt_en TEXT,
  category TEXT CHECK (category IN ('news', 'analysis', 'tips', 'boxing')),
  sport TEXT CHECK (sport IN ('basketball', 'football', 'boxing', 'general')),
  featured_image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Prediction statistics (for ROI dashboard)
CREATE TABLE IF NOT EXISTS public.prediction_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport TEXT NOT NULL CHECK (sport IN ('basketball', 'football', 'boxing', 'all')),
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'alltime')),
  period_start DATE NOT NULL,
  total_picks INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  pushes INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2),
  roi DECIMAL(8,2),
  streak INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Leads (newsletter signup)
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  site_origin TEXT DEFAULT 'mytaya',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Public read access for content tables
CREATE POLICY "Public read leagues" ON public.leagues FOR SELECT USING (true);
CREATE POLICY "Public read teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Public read published predictions" ON public.predictions FOR SELECT USING (published_site = true);
CREATE POLICY "Public read published posts" ON public.posts FOR SELECT USING (is_published = true);
CREATE POLICY "Public read stats" ON public.prediction_stats FOR SELECT USING (true);

-- Anon insert for leads (with no read access)
CREATE POLICY "Anon insert leads" ON public.leads FOR INSERT WITH CHECK (true);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_predictions_sport ON public.predictions USING btree ((SELECT sport FROM leagues WHERE id = league_id));
CREATE INDEX IF NOT EXISTS idx_predictions_match_date ON public.predictions (match_date DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_status ON public.predictions (status);
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON public.predictions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_published ON public.predictions (published_site, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_published ON public.posts (is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_stats_sport_period ON public.prediction_stats (sport, period);
```

### Supabase Client (Build-Time)
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
```

### Language Switcher Component
```astro
---
// src/components/LanguageSwitcher.astro
import { getRelativeLocaleUrl } from 'astro:i18n';
import { getLangFromUrl } from '../i18n/utils';

const lang = getLangFromUrl(Astro.url);
const pathWithoutLocale = Astro.url.pathname.replace(/^\/(tl|en)/, '') || '/';

// Map localized routes (e.g., /tl/hula/ <-> /en/predictions/)
import { getAlternatePath } from '../i18n/routes';
const alternateLang = lang === 'tl' ? 'en' : 'tl';
const alternatePath = getAlternatePath(pathWithoutLocale, lang, alternateLang);
const switchUrl = getRelativeLocaleUrl(alternateLang, alternatePath);
---

<a href={switchUrl} class="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors"
   style="border: 1px solid var(--t-border);"
   aria-label={lang === 'tl' ? 'Switch to English' : 'Lumipat sa Filipino'}>
  {lang === 'tl' ? (
    <img src="/flags/us.svg" alt="English" class="w-5 h-4 rounded-sm" />
    <span class="text-xs font-medium" style="color: var(--t-text-sec);">EN</span>
  ) : (
    <img src="/flags/ph.svg" alt="Filipino" class="w-5 h-4 rounded-sm" />
    <span class="text-xs font-medium" style="color: var(--t-text-sec);">TL</span>
  )}
</a>
```

### Route Mapping for Language Switcher
```typescript
// src/i18n/routes.ts
const routeMap: Record<string, Record<string, string>> = {
  tl: {
    '/': '/',
    '/hula/': '/predictions/',
    '/resulta/': '/results/',
    '/blog/': '/blog/',
    '/mga-operator/': '/operators/',
  },
  en: {
    '/': '/',
    '/predictions/': '/hula/',
    '/results/': '/resulta/',
    '/blog/': '/blog/',
    '/operators/': '/mga-operator/',
  },
};

export function getAlternatePath(
  path: string,
  fromLang: string,
  toLang: string
): string {
  const map = routeMap[fromLang];
  if (!map) return path;
  // Try exact match first, then prefix match
  if (map[path]) return map[path];
  for (const [from, to] of Object.entries(map)) {
    if (path.startsWith(from) && from !== '/') {
      return path.replace(from, to);
    }
  }
  return path; // Fallback: same path
}
```

### PWA Registration in Layout
```astro
---
// In src/layouts/Layout.astro
import { pwaInfo } from 'virtual:pwa-info';
---
<head>
  <!-- PWA manifest link -->
  { pwaInfo && <Fragment set:html={pwaInfo.webManifest.linkTag} /> }
</head>
<body>
  <slot />
  <!-- PWA registration script -->
  <script>
    import { registerSW } from 'virtual:pwa-register';
    registerSW({ immediate: true });
  </script>
</body>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` | CSS-first `@theme` blocks in global.css | Tailwind v4 (2025) | No config file. All theme tokens in CSS. Use `@tailwindcss/vite` plugin. |
| `@astrojs/tailwind` integration | `@tailwindcss/vite` as Vite plugin | Tailwind v4 + Astro 5 | Old integration does not support v4. Must use Vite plugin approach (betpro pattern). |
| `darkMode: 'class'` in tailwind.config | `@custom-variant dark (&:where(.dark, .dark *));` in CSS | Tailwind v4 (2025) | Dark mode configuration moved to CSS. |
| External i18n libraries | Astro built-in i18n routing | Astro 3.5+ (2023) | No astro-i18n-aut or Paraglide needed for simple 2-locale sites. |
| `vite-plugin-pwa` in Vite config | `@vite-pwa/astro` as Astro integration | @vite-pwa/astro v0.2+ | Proper Astro lifecycle hooks, cleaner config. |

**Deprecated/outdated:**
- `@astrojs/tailwind`: Does not support Tailwind CSS v4. Use `@tailwindcss/vite` instead.
- `tailwind.config.js`: Replaced by CSS-first configuration in v4.
- `astro-i18n-aut`: Community package that duplicates built-in Astro i18n.

## Open Questions

1. **Filipino locale code in hreflang**
   - What we know: Astro locale uses `tl` for URLs. HTML `lang` should be `fil` (ISO 639-3) or `tl` (ISO 639-1). Google supports `tl` in hreflang.
   - What's unclear: Whether to use `fil-PH` or `tl` in hreflang tags for maximum Google compatibility.
   - Recommendation: Use `tl` in URLs and Astro config, `fil-PH` in hreflang tags (via sitemap i18n config). Google supports both.

2. **PWA start_url for bilingual site**
   - What we know: PWA manifest has a single `start_url`. Site serves two language paths.
   - What's unclear: Whether `start_url` should be `/tl/` (default locale) or `/` (language detection redirect).
   - Recommendation: Use `/tl/` as start_url since Filipino is the default locale and primary market. Users who prefer English can switch manually.

3. **Exact font pairing for Philippine brand identity**
   - What we know: Betpro uses Oswald (display) + Outfit (body) + JetBrains Mono (mono). MyTaya must be visually distinct.
   - What's unclear: Which fonts best convey "local, casual, credible" for PH market.
   - Recommendation: Claude's discretion per CONTEXT.md. Research suggests bold condensed sans-serif for display (sports feel) with a modern geometric sans for body.

## Sources

### Primary (HIGH confidence)
- [Astro i18n Routing Documentation](https://docs.astro.build/en/guides/internationalization/) -- prefixDefaultLocale, fallback, Accept-Language detection
- [Astro i18n API Reference](https://docs.astro.build/en/reference/modules/astro-i18n/) -- getRelativeLocaleUrl, getAbsoluteLocaleUrl
- [Tailwind CSS v4 Dark Mode](https://tailwindcss.com/docs/dark-mode) -- @custom-variant dark, class-based toggle
- [@vite-pwa/astro Official Docs](https://vite-pwa-org.netlify.app/frameworks/astro) -- AstroPWA integration, service worker registration
- betpro.cl reference project (local codebase) -- Layout.astro, global.css, Header.astro, supabase.ts, astro.config.mjs patterns

### Secondary (MEDIUM confidence)
- [Astro i18n Configuration Guide (BetterLink)](https://eastondev.com/blog/en/posts/dev/20251202-astro-i18n-guide/) -- practical implementation walkthrough
- [Tailwind v4 Dark Mode Implementation](https://www.thingsaboutweb.dev/en/posts/dark-mode-with-tailwind-v4-nextjs) -- @custom-variant usage patterns
- [@vite-pwa/astro GitHub](https://github.com/vite-pwa/astro) -- README, version compatibility

### Tertiary (LOW confidence)
- None -- all findings verified against primary or secondary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- exact same stack as betpro reference, all versions verified
- Architecture: HIGH -- betpro provides proven patterns, i18n is official Astro feature
- Pitfalls: HIGH -- betpro encountered and solved theme FOUC, Tailwind v4 migration; i18n locale codes verified against official docs
- Supabase schema: MEDIUM -- based on architecture research schema + betpro reference, but actual column needs may evolve

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable stack, 30-day validity)
