# Stack Research

**Domain:** Philippine sports betting predictions platform (bilingual)
**Researched:** 2026-03-07
**Confidence:** MEDIUM-HIGH

## Recommended Stack

### Core Technologies (Committed)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Astro | 5.18.x | Static site generator with islands architecture | Committed. Best-in-class static performance, built-in i18n routing, content collections for bilingual content, SSG for SEO |
| React | 19.x | Interactive islands (theme toggle, language switcher, forms) | Committed. Islands architecture keeps JS minimal; React only loads where interactivity is needed |
| Tailwind CSS | 4.2.x | Utility-first styling | Committed. v4 is 5x faster builds, zero-config setup with `@import "tailwindcss"`, CSS-first configuration |
| Supabase | Latest | PostgreSQL database + auth + storage + edge functions | Committed. Managed Postgres with real-time subscriptions, row-level security, generous free tier |
| Cloudflare Pages | N/A | Static site hosting | Committed. Global CDN, free SSL, fast deploys, integrated with Workers |
| Cloudflare Workers | N/A | Serverless compute for cron jobs, image generation, API proxying | Committed. Edge compute, Wrangler CLI, cron triggers for daily prediction pipelines |

### i18n Stack

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Astro built-in i18n | (core) | Route-level internationalization | Built into Astro since v3.5. Supports `prefixDefaultLocale: false` so English lives at `/about` while Filipino lives at `/fil/about`. Includes `getRelativeLocaleUrl()` helper, fallback configuration with `fallbackType: "rewrite"`, and middleware for Accept-Language detection. No external i18n library needed. |
| JSON translation files | N/A | UI string translations | Store `en.json` and `fil.json` in `src/i18n/`. Simple key-value lookup via a `t()` utility function. Lightweight, no library overhead. |
| Content Collections (i18n pattern) | (core) | Bilingual blog/prediction content | Organize as `src/content/blog/en/post.md` and `src/content/blog/fil/post.md`. Astro 5 glob loader handles routing automatically. Each locale gets its own content file for full translation control. |

**i18n Configuration:**
```javascript
// astro.config.mjs
export default defineConfig({
  i18n: {
    locales: ["en", "fil"],
    defaultLocale: "en",
    fallback: { fil: "en" },
    routing: {
      prefixDefaultLocale: false, // /about (en), /fil/about (fil)
      redirectToDefaultLocale: true,
    },
  },
});
```

**Confidence:** HIGH -- verified against Astro official docs. Built-in i18n is mature (introduced v3.5, refined through v5.18).

### Sports Data APIs

| API | Pricing | Purpose | Why Recommended |
|-----|---------|---------|-----------------|
| API-Football (api-football.com) | Free: 100 req/day; Pro: from $10/mo | Football match data, odds, standings | Committed. Already have access. Covers global football leagues. Start with football predictions while basketball infrastructure builds out. |
| API-Basketball (api-sports.io/basketball) | Free: 100 req/day; Pro: from $10/mo | NBA + PBA basketball data | Same provider as API-Football (API-Sports ecosystem). Covers NBA fully. Covers PBA under conference names: Philippine Cup, Commissioner's Cup, Governor's Cup, Fiesta Conference, plus MPBL. Does NOT list NCAA PH or UAAP directly. |
| BetsAPI | Free tier available; paid from $10/mo | PBA, UAAP, NCAA PH data + odds | Covers PBA Cup, PBA Commissioner's Cup, PBA D-League, AND UAAP -- broader Philippine coverage than API-Basketball. Use as supplementary source for Philippine collegiate basketball. |

**API Strategy:**
1. **Primary:** API-Sports ecosystem (API-Football + API-Basketball) -- unified authentication, consistent response format, covers NBA + PBA conferences + football
2. **Supplementary:** BetsAPI for UAAP and NCAA PH coverage that API-Sports lacks
3. **Manual/Editorial:** Boxing content is entirely manual (no reliable boxing API). Create editorial workflow in Supabase with admin interface.
4. **FIBA:** API-Basketball covers FIBA World Cup and continental competitions under international leagues

**Confidence:** MEDIUM -- API-Basketball's Philippine league coverage was verified via their sports page listing. Confirmed: Philippine Cup, Commissioner's Cup, Governor's Cup, Fiesta Conference, MPBL. NOT confirmed: NCAA PH, UAAP (these need BetsAPI or manual entry). BetsAPI's UAAP coverage confirmed via their website.

### Image Generation (Prediction Cards)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Satori | 0.12.x (CF-compatible) | HTML/CSS to SVG conversion | JSX-based templating for prediction card layouts. Supports flexbox, text styling, gradients. Use the version bundled with @cf-wasm/satori for Workers compatibility. |
| @cf-wasm/satori | 0.1.x | Cloudflare Workers-compatible Satori wrapper | Wraps Satori with pre-compiled WASM modules that work in Workers runtime. Avoids the dynamic `WebAssembly.instantiate()` error that blocks vanilla Satori on Workers. |
| @cf-wasm/resvg | 0.3.x | SVG to PNG conversion on Workers | Cloudflare-compatible resvg wrapper. Import from `@cf-wasm/resvg/workerd`. Standard `@resvg/resvg-wasm` fails on Workers due to WASM compilation restrictions. |

**Image Generation Architecture:**
- Cloudflare Worker endpoint: `POST /api/card/:predictionId` or cron-triggered
- Satori renders JSX template to SVG with prediction data (teams, odds, pick, confidence)
- resvg converts SVG to PNG (1200x630 for OG, 1080x1080 for social)
- Store PNG in Cloudflare R2 or Supabase Storage
- Serve via Cloudflare CDN with cache headers

**Critical Pitfalls for CF Workers Image Gen (verified from dev.to article):**
1. Fetch images as base64 before passing to Satori (external fetch fails silently)
2. Use `satori-html` carefully -- breaks on large base64 strings (>400KB). Use placeholder + patch approach.
3. Add `User-Agent` and `Accept` headers when fetching external images
4. Use PNG format only (Satori crashes on WebP with cryptic "l is not iterable" error)
5. No `node:buffer` in Vite builds -- use `btoa()` with chunked `String.fromCharCode()`

**Confidence:** MEDIUM -- @cf-wasm packages are community-maintained, not official Cloudflare. Pinned to satori 0.15.2 (latest @cf-wasm release). Newer satori versions (0.16+) have known Workers compatibility issues. The pitfalls are well-documented.

### SEO & Structured Data

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| astro-seo | latest | Meta tags, OG tags, Twitter cards | Drop-in `<SEO>` component for `<head>`. Full TypeScript support. 100% API-compatible with @astrolib/seo but actively maintained with better types. |
| @astrojs/sitemap | latest | XML sitemap with hreflang | Official Astro integration. Configure `i18n: { defaultLocale: "en", locales: { en: "en-PH", fil: "fil-PH" } }` for automatic hreflang generation in sitemap XML. |
| Custom JSON-LD components | N/A | Schema.org structured data | Build Astro components that render `<script type="application/ld+json">` blocks. Use `SportsEvent`, `Article`, `BlogPosting`, `BreadcrumbList`, `WebSite` schemas. No library needed -- raw JSON-LD in Astro components is cleaner than any abstraction. |

**SEO Strategy for Betting Content:**
- `SportsEvent` schema for each prediction (teams, date, competition)
- `Article` / `BlogPosting` for editorial content (boxing analysis, daily tips)
- `BreadcrumbList` for navigation hierarchy
- `WebSite` with `SearchAction` for sitelinks search box
- hreflang tags via `@astrojs/sitemap` + manual `<link rel="alternate">` in layouts
- News sitemap (`sitemap-news.xml`) for Google News eligibility
- `x-default` hreflang pointing to English version

**Confidence:** HIGH -- JSON-LD in Astro is well-documented with multiple guides. @astrojs/sitemap i18n config is in official docs.

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @astrojs/react | latest | React integration for Astro islands | Required for React components in Astro. Install once, use `client:load` or `client:visible` directives. |
| @astrojs/tailwind | latest | Tailwind CSS integration for Astro | Required for Tailwind v4 in Astro. Handles PostCSS setup. |
| date-fns | 4.x | Date formatting and timezone handling | Format game dates/times in Philippine timezone (Asia/Manila). Lightweight, tree-shakeable. Prefer over dayjs for Astro SSG. |
| sharp | 0.33.x | Image optimization at build time | Astro's default image optimizer. Handles responsive images, WebP/AVIF conversion for team logos and blog images. |
| @supabase/supabase-js | 2.x | Supabase client for data fetching | Fetch predictions, blog posts, statistics from Supabase during Astro build and in Workers. |
| wrangler | 4.x | Cloudflare Workers CLI | Deploy Workers, manage cron triggers, local development with `wrangler dev`. |
| zod | 3.x | Schema validation | Validate API responses, form inputs (lead capture), content collection schemas. Already used by Astro content collections. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Wrangler | Workers local dev + deployment | `wrangler dev` for local testing, `wrangler deploy` for production. Use `wrangler.toml` for cron triggers. |
| Supabase CLI | Local Supabase dev + migrations | `supabase start` for local Postgres, `supabase db push` for schema migrations. |
| Prettier + prettier-plugin-astro | Code formatting | Astro-aware formatting for `.astro` files. |
| ESLint | Linting | Standard JS/TS linting. |

## Supabase Schema Patterns

**Core tables for predictions platform:**

```sql
-- Leagues (NBA, PBA conferences, football leagues)
CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sport TEXT NOT NULL CHECK (sport IN ('basketball', 'football', 'boxing')),
  country TEXT NOT NULL,
  api_source TEXT, -- 'api-sports', 'betsapi', 'manual'
  api_league_id INTEGER,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  league_id UUID REFERENCES leagues(id),
  api_team_id INTEGER,
  logo_url TEXT
);

-- Predictions (core content)
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id),
  home_team_id UUID REFERENCES teams(id),
  away_team_id UUID REFERENCES teams(id),
  match_date TIMESTAMPTZ NOT NULL,
  pick TEXT NOT NULL, -- 'home', 'away', 'draw', 'over', 'under'
  pick_label_en TEXT NOT NULL, -- "Lakers to win"
  pick_label_fil TEXT NOT NULL, -- "Lakers mananalo"
  confidence INTEGER CHECK (confidence BETWEEN 1 AND 5),
  odds DECIMAL(6,2),
  analysis_en TEXT,
  analysis_fil TEXT,
  result TEXT CHECK (result IN ('win', 'loss', 'push', 'void', NULL)),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'settled', 'cancelled')),
  card_image_url TEXT, -- Generated PNG URL
  api_fixture_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  settled_at TIMESTAMPTZ
);

-- Blog posts (bilingual)
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title_en TEXT NOT NULL,
  title_fil TEXT NOT NULL,
  content_en TEXT NOT NULL,
  content_fil TEXT NOT NULL,
  excerpt_en TEXT,
  excerpt_fil TEXT,
  category TEXT CHECK (category IN ('news', 'analysis', 'tips', 'boxing')),
  featured_image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Statistics tracking (win rate, ROI)
CREATE TABLE prediction_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id),
  period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'alltime'
  period_start DATE NOT NULL,
  total_picks INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  pushes INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2),
  roi DECIMAL(8,2),
  streak INTEGER DEFAULT 0, -- positive = win streak, negative = loss streak
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## Installation

```bash
# Core Astro + integrations
npm create astro@latest
npx astro add react tailwind sitemap

# Supabase client
npm install @supabase/supabase-js

# SEO
npm install astro-seo

# Date handling
npm install date-fns

# Schema validation (may already be peer dep of Astro)
npm install zod

# Dev dependencies
npm install -D prettier prettier-plugin-astro @types/react

# Workers (image generation + cron jobs) -- separate package
# In /workers directory:
npm install @cf-wasm/satori @cf-wasm/resvg satori-html
npm install -D wrangler
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Astro built-in i18n | astro-i18n-aut, Paraglide | Never for this project. Built-in i18n handles our 2-locale case perfectly. Third-party libs add complexity for features we don't need (runtime translations, ICU message format). |
| JSON translation files | i18next, Paraglide.js | If you need 5+ languages or complex pluralization rules. Filipino/English bilingual with simple UI strings doesn't justify the overhead. |
| astro-seo | @astrolib/seo | Never. astro-seo is the actively maintained fork with better TypeScript support. 100% API compatible, so migration is trivial if needed. |
| API-Basketball (API-Sports) | Sportradar, SportsDataIO | If you need real-time play-by-play or deeper stats. Sportradar is enterprise-priced ($500+/mo). SportsDataIO is mid-tier. API-Sports is the best value for a predictions site. |
| BetsAPI | Manual scraping | If BetsAPI doesn't cover a league. But scraping PBA/UAAP sites is fragile and legally risky. Prefer manual data entry for uncovered leagues. |
| Satori + resvg (via @cf-wasm) | Puppeteer, html-to-image | If you need full browser rendering (complex CSS, animations). But Puppeteer doesn't run on Workers, and html-to-image needs a DOM. Satori is the only viable option for CF Workers. |
| Cloudflare R2 | Supabase Storage | For high-volume image storage (prediction cards). R2 has no egress fees and integrates natively with Workers. Supabase Storage is fine for smaller volumes. |
| Custom JSON-LD | schema-dts, next-seo | If you want TypeScript autocomplete for schema types. schema-dts provides TS types for Schema.org but adds a dependency for something you can do with plain objects. Consider only if schema complexity grows. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| next-intl / react-i18next | Client-side i18n libraries. They ship JS to the browser for translation, defeating Astro's zero-JS static approach. | Astro built-in i18n + JSON files |
| @astrolib/seo | Unmaintained. Last update was stale. TypeScript types are not properly exported. | astro-seo (maintained fork) |
| moment.js | 300KB+ bundle, deprecated by its own maintainers. | date-fns (tree-shakeable, modern) |
| @resvg/resvg-wasm (vanilla) | Fails on Cloudflare Workers with "Wasm code generation disallowed by embedder" error. | @cf-wasm/resvg (Workers-compatible wrapper) |
| satori > 0.15.x on Workers | Versions 0.16+ have known Cloudflare Workers WebAssembly compatibility issues (GitHub issue #693). | @cf-wasm/satori pinned at 0.1.x (bundles satori 0.15.2) |
| Puppeteer / Playwright for image gen | Cannot run headless browsers on Cloudflare Workers. Too heavy for serverless. | Satori + resvg on Workers |
| astro-i18n-aut | Community integration that duplicates what Astro built-in i18n already does natively. Adds maintenance burden. | Astro built-in i18n |
| ESPN API (unofficial) | Undocumented, unofficial endpoints. Can break without notice. No SLA, no support. | API-Sports (documented, paid, stable) |

## Stack Patterns by Variant

**If PBA season is active:**
- Use API-Basketball for real-time PBA conference data (Philippine Cup, Commissioner's Cup, Governor's Cup)
- Cron Worker fetches daily fixtures and updates Supabase
- Build predictions page at build time from Supabase data

**If PBA is off-season:**
- Switch to NBA / FIBA content as primary basketball
- Increase boxing editorial cadence
- Football predictions fill the gap

**If adding more Philippine leagues (UAAP, NCAA PH):**
- Integrate BetsAPI as secondary data source
- Create adapter layer in Workers that normalizes BetsAPI responses to match API-Sports format
- Store normalized data in same Supabase schema

**If scaling beyond 2 languages:**
- Migrate from JSON files to a translation management system (Crowdin, Lokalise)
- Consider Paraglide.js for type-safe translations
- Current architecture supports this -- just add locale codes to Astro config

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Astro 5.18.x | @astrojs/react 4.x, @astrojs/tailwind 6.x, @astrojs/sitemap 3.x | Use `npx astro add` to install compatible versions automatically |
| Tailwind CSS 4.2.x | @astrojs/tailwind latest | v4 uses CSS-first config (`@import "tailwindcss"`) instead of `tailwind.config.js`. Ensure Astro integration supports v4. |
| @cf-wasm/satori 0.1.x | satori 0.15.2 (bundled) | Do NOT upgrade satori independently. The @cf-wasm wrapper pins a specific version for Workers compatibility. |
| @cf-wasm/resvg 0.3.x | @resvg/resvg-wasm 2.4.1 (legacy) | Workers-compatible. Import from `@cf-wasm/resvg/workerd` specifically. |
| @supabase/supabase-js 2.x | Supabase platform (latest) | v2 is stable. v3 may be in development -- stick with v2 until official migration guide. |
| Wrangler 4.x | Cloudflare Workers runtime | Use latest Wrangler for best compatibility with Workers features. |

## Sources

- [Astro i18n Routing Docs](https://docs.astro.build/en/guides/internationalization/) -- HIGH confidence, official documentation
- [Astro Sitemap Integration Docs](https://docs.astro.build/en/guides/integrations-guide/sitemap/) -- HIGH confidence, official documentation
- [API-Sports Basketball Coverage](https://api-sports.io/sports/basketball) -- MEDIUM confidence, verified Philippine leagues listed (Philippine Cup, Commissioner's Cup, Governor's Cup, Fiesta Conference, MPBL)
- [BetsAPI Philippines Basketball](https://betsapi.com/t/9815/Philippines) -- MEDIUM confidence, verified PBA + UAAP coverage
- [Satori GitHub](https://github.com/vercel/satori) -- HIGH confidence, official repository
- [@cf-wasm/satori npm](https://www.npmjs.com/package/@cf-wasm/satori) -- MEDIUM confidence, community package
- [@cf-wasm/resvg npm](https://www.npmjs.com/package/@cf-wasm/resvg) -- MEDIUM confidence, community package
- [6 Pitfalls of OG Image Gen on CF Workers](https://dev.to/devoresyah/6-pitfalls-of-dynamic-og-image-generation-on-cloudflare-workers-satori-resvg-wasm-1kle) -- MEDIUM confidence, practitioner experience
- [Satori Workers Compatibility Issue #693](https://github.com/vercel/satori/issues/693) -- HIGH confidence, official GitHub issue
- [astro-seo npm](https://www.npmjs.com/package/astro-seo) -- MEDIUM confidence, community package
- [Astro Structured Data Guide](https://johndalesandro.com/blog/astro-add-json-ld-structured-data-to-your-website-for-rich-search-results/) -- MEDIUM confidence, practitioner guide
- [API-Basketball Pricing](https://www.api-basketball.com/pricing) -- HIGH confidence, official pricing page

---
*Stack research for: Philippine sports betting predictions platform*
*Researched: 2026-03-07*
