# Architecture Research

**Domain:** Bilingual sports betting predictions platform (Philippines)
**Researched:** 2026-03-07
**Confidence:** HIGH (proven reference architecture from betpro.cl + verified Astro/Supabase/CF docs)

## System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        DATA SOURCES                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │ API-Football │  │ Manual Entry │  │ Cloudflare   │               │
│  │ (NBA, futbol)│  │ (Boxing,PBA) │  │ Workers AI   │               │
│  └──────┬───────┘  └──────┬───────┘  │ (blog posts) │               │
│         │                 │          └──────┬───────┘               │
├─────────┴─────────────────┴────────────────┴────────────────────────┤
│                    CLOUDFLARE WORKERS (Cron)                         │
│  ┌────────────────────┐  ┌────────────────────┐                     │
│  │ predictions-cron   │  │ blog-cron          │                     │
│  │ - Fetch fixtures   │  │ - Generate posts   │                     │
│  │ - Generate picks   │  │ - Bilingual content│                     │
│  │ - Resolve results  │  │ - Store in Supabase│                     │
│  │ - Card images      │  └─────────┬──────────┘                     │
│  │ - Telegram publish │            │                                │
│  └─────────┬──────────┘            │                                │
├────────────┴───────────────────────┴────────────────────────────────┤
│                    SUPABASE (PostgreSQL)                             │
│  ┌────────────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐          │
│  │predictions │  │ blog_    │  │  leads  │  │ stats/   │          │
│  │            │  │ posts    │  │         │  │ results  │          │
│  └─────┬──────┘  └────┬─────┘  └────┬────┘  └────┬─────┘          │
├────────┴──────────────┴─────────────┴─────────────┴────────────────┤
│                    ASTRO 5 STATIC SITE                              │
│  ┌───────────────────────────────────────────────────────┐         │
│  │  Build-time: Fetch from Supabase → Generate HTML      │         │
│  │                                                        │         │
│  │  /tl/  (Filipino)        /en/  (English)              │         │
│  │  ├── index               ├── index                    │         │
│  │  ├── hula/ (predictions) ├── predictions/             │         │
│  │  ├── blog/               ├── blog/                    │         │
│  │  └── resulta/            └── results/                 │         │
│  │                                                        │         │
│  │  React Islands: Lead form, Charts, Dynamic filters    │         │
│  └───────────────────────────────────────────────────────┘         │
├─────────────────────────────────────────────────────────────────────┤
│                    CLOUDFLARE PAGES (CDN)                           │
│  Static HTML served at edge worldwide                               │
├─────────────────────────────────────────────────────────────────────┤
│                    TELEGRAM BOT API                                  │
│  ┌────────────────────────────────────────────┐                     │
│  │ Channel: Daily prediction cards + results  │                     │
│  │ Format: Image card + caption text          │                     │
│  │ Drip: Staggered publishing throughout day  │                     │
│  └────────────────────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Astro Static Site** | Render bilingual pages at build time, SEO, PWA shell | Astro 5 + React islands + Tailwind CSS v4 |
| **Supabase PostgreSQL** | Single source of truth for predictions, blog posts, leads, stats | PostgREST API, RLS for public read access |
| **Predictions Worker** | Fetch match data, generate predictions, resolve results, generate card images, publish to Telegram | Single CF Worker with cron triggers, `workers-og` for card images |
| **Blog Worker** | Generate bilingual AI blog posts daily | CF Worker with cron trigger, Workers AI binding |
| **Cloudflare Pages** | Host static output, edge CDN delivery | `astro build` output deployed via Wrangler or Git integration |
| **Telegram Bot** | Automated prediction publishing to channel | Bot API via HTTPS from Workers (sendPhoto/sendMessage) |
| **R2 Bucket** | Store generated prediction card images | CF R2 bound to predictions worker |
| **KV Namespace** | Queue management for drip publishing | CF KV bound to predictions worker |

## Recommended Project Structure

```
mytaya/
├── src/
│   ├── components/          # Shared UI components
│   │   ├── PredictionCard.tsx    # React island - interactive prediction display
│   │   ├── LeadForm.tsx          # React island - form submission
│   │   ├── ResultTracker.tsx     # React island - win rate charts
│   │   ├── Header.astro          # Site header with lang switcher
│   │   ├── Footer.astro          # Site footer
│   │   ├── OperatorCard.astro    # Affiliate operator display
│   │   └── TelegramBanner.astro  # CTA to join Telegram channel
│   ├── i18n/                # Internationalization
│   │   ├── ui.ts                 # UI string translations {tl: {...}, en: {...}}
│   │   ├── utils.ts              # getLocale(), t() helper, getLangFromUrl()
│   │   └── routes.ts             # Localized route mapping
│   ├── layouts/
│   │   └── Layout.astro          # Base layout with hreflang, OG tags, theme
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client (build-time + client-side)
│   │   └── constants.ts          # Sports, leagues, operators config
│   ├── pages/
│   │   ├── index.astro           # Root redirect (auto-detect → /tl/ or /en/)
│   │   ├── tl/                   # Filipino pages
│   │   │   ├── index.astro
│   │   │   ├── hula/             # Predictions (taya/hula)
│   │   │   │   ├── index.astro
│   │   │   │   ├── basketball/
│   │   │   │   ├── boxing/
│   │   │   │   └── [slug].astro
│   │   │   ├── blog/
│   │   │   │   ├── [...page].astro
│   │   │   │   └── [slug].astro
│   │   │   ├── resulta.astro
│   │   │   └── responsableng-pagsusugal.astro
│   │   └── en/                   # English pages (mirror structure)
│   │       ├── index.astro
│   │       ├── predictions/
│   │       │   ├── index.astro
│   │       │   ├── basketball/
│   │       │   ├── boxing/
│   │       │   └── [slug].astro
│   │       ├── blog/
│   │       │   ├── [...page].astro
│   │       │   └── [slug].astro
│   │       ├── results.astro
│   │       └── responsible-gambling.astro
│   ├── content/             # Astro Content Collections (static guides)
│   │   └── config.ts
│   └── styles/
│       └── global.css            # Tailwind v4 imports + custom properties
├── public/                  # Static assets (icons, fonts, images)
├── workers/                 # Cloudflare Workers (standalone JS)
│   ├── mytaya-predictions-cron.js
│   ├── mytaya-blog-cron.js
│   ├── wrangler-predictions.toml
│   └── wrangler-blog.toml
├── supabase/
│   ├── config.toml
│   └── migrations/          # SQL migration files
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

### Structure Rationale

- **`src/pages/tl/` and `src/pages/en/`:** Astro i18n routing with prefix-based locales. Each locale gets its own page tree, enabling fully static generation per language with proper hreflang tags. Filipino (`tl`) as default locale (can be served without prefix if desired).
- **`src/i18n/`:** Centralized translation strings and helper functions. Avoids scattering translations across components. The `ui.ts` file holds all UI strings as a flat object per locale.
- **`workers/`:** Standalone JS files deployed independently via Wrangler. NOT part of the Astro build. Each worker has its own `wrangler-*.toml` config with cron schedules and bindings.
- **`supabase/`:** Database migrations tracked in source control. Enables reproducible schema setup and local development with `supabase start`.

## Architectural Patterns

### Pattern 1: Build-Time Data Fetching (Astro + Supabase)

**What:** Astro pages fetch predictions and blog posts from Supabase at build time using `getStaticPaths()`. The site is fully static HTML — no server-side rendering at request time.
**When to use:** All prediction listing pages, blog pages, results/stats pages.
**Trade-offs:** Extremely fast (CDN-served HTML), excellent SEO, but content is only as fresh as the last build. Requires rebuild triggers.

```typescript
// src/pages/en/predictions/[slug].astro
export async function getStaticPaths() {
  const { data } = await supabase
    .from('predictions')
    .select('*')
    .eq('published_site', true);

  return data.map(p => ({
    params: { slug: p.slug },
    props: { prediction: p },
  }));
}
```

### Pattern 2: Drip Publishing via Cron (Workers)

**What:** Instead of publishing all daily predictions at once, the worker generates them in one batch (morning cron) then publishes one at a time to Telegram + marks as site-visible on staggered cron runs throughout the day.
**When to use:** Telegram channel engagement. Drip keeps the channel active all day rather than one burst.
**Trade-offs:** More engaging for followers, but requires tracking publish state per prediction (`published_telegram`, `published_site` columns).

```javascript
// Morning cron (10:00 UTC): Generate all predictions for the day
// Half-hourly cron (11:30-20:30 UTC): Publish one unpublished prediction
[triggers]
crons = ["0 2 * * *", "30 3-12 * * *"]  // Adjusted for PHT (UTC+8)
```

### Pattern 3: Workers as Pure HTTP Clients (No SDK)

**What:** Cloudflare Workers interact with Supabase via raw HTTP fetch to the PostgREST API, not the `supabase-js` SDK. This avoids Node.js dependencies and keeps workers as single standalone JS files.
**When to use:** All worker-to-Supabase communication.
**Trade-offs:** More verbose code but zero dependencies, simpler deployment, faster cold starts. Proven pattern from betpro reference.

```javascript
async function supabaseSelect(env, table, filter) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    headers: {
      apikey: env.SUPABASE_KEY,
      Authorization: `Bearer ${env.SUPABASE_KEY}`,
    },
  });
  return res.json();
}
```

### Pattern 4: Bilingual Content at Every Layer

**What:** Both the Workers (content generation) and Astro (rendering) must handle bilingual content. Workers generate predictions and blog posts with both `title_tl`/`title_en` fields. Astro renders the correct language based on the current locale route.
**When to use:** Every piece of user-facing content.
**Trade-offs:** Database schema has paired columns (doubles field count for text content), but eliminates runtime translation and enables static generation.

```sql
-- Database stores both languages
CREATE TABLE predictions (
  title_tl text NOT NULL,     -- Filipino title
  title_en text NOT NULL,     -- English title
  analysis_tl text,           -- Filipino analysis
  analysis_en text,           -- English analysis
  -- Non-text fields are shared (odds, teams, dates are universal)
  home_team text NOT NULL,
  away_team text NOT NULL,
  odds numeric(5,2) NOT NULL,
  ...
);
```

### Pattern 5: Prediction Card Image Generation (workers-og)

**What:** Workers generate branded PNG prediction cards using `workers-og` (Satori-based). Cards are stored in R2 and sent to Telegram as photos. Also used as OG images for social sharing.
**When to use:** Every published prediction gets a card for Telegram and social media sharing.
**Trade-offs:** Satori has limitations (no CSS grid, inline styles only, must base64-encode images). But runs at edge with no external service needed.

## Data Flow

### Prediction Lifecycle

```
API-Football (fixtures)
    │
    ▼
[Predictions Worker - Morning Cron]
    │ 1. Fetch today's fixtures from API-Football
    │ 2. Generate prediction (market, odds, confidence)
    │ 3. Generate bilingual titles/analysis (Workers AI)
    │ 4. Insert into Supabase (published_telegram=false, published_site=false)
    │
    ▼
Supabase: predictions table (status: pending)
    │
    ▼
[Predictions Worker - Drip Cron (every 30 min)]
    │ 1. Resolve any finished matches (check API-Football results)
    │ 2. Pick one unpublished prediction
    │ 3. Generate card image (workers-og → R2)
    │ 4. Send to Telegram channel (sendPhoto)
    │ 5. Mark published_telegram=true, published_site=true
    │
    ▼
[Astro Build Trigger]
    │ Cloudflare Pages rebuild (webhook or scheduled)
    │ getStaticPaths() fetches published_site=true predictions
    │ Generates /tl/hula/[slug] and /en/predictions/[slug]
    │
    ▼
Cloudflare Pages CDN → User Browser
```

### Blog Post Lifecycle

```
[Blog Worker - Daily Cron]
    │ 1. Pick topic (trending match, league analysis, betting guide)
    │ 2. Generate post in Filipino via Workers AI
    │ 3. Generate post in English via Workers AI
    │ 4. Insert into Supabase blog_posts table
    │
    ▼
Supabase: blog_posts table
    │
    ▼
[Astro Build]
    │ Generates /tl/blog/[slug] and /en/blog/[slug]
    │
    ▼
Cloudflare Pages CDN
```

### Lead Capture Flow

```
User fills form (React island)
    │
    ▼
supabase-js client → Supabase leads table (direct insert via anon key + RLS)
    │
    ▼
(Optional: Supabase Database Webhook → notification)
```

### Build Trigger Strategy

```
Option A (Simple): Scheduled Cloudflare Pages rebuild
    - Set CF Pages to rebuild every 2-4 hours via deploy hook cron
    - Worker calls deploy hook after morning generation

Option B (Event-driven): Worker triggers rebuild after publishing
    - After marking predictions published_site=true, POST to CF Pages deploy hook
    - More frequent but only when content changes

Recommended: Option A for launch, Option B later for fresher content.
```

## Key Architectural Decisions

### i18n Routing Strategy

Use Astro's built-in i18n with prefix-based routing:

```javascript
// astro.config.mjs
export default defineConfig({
  i18n: {
    defaultLocale: 'tl',
    locales: ['tl', 'en'],
    routing: {
      prefixDefaultLocale: true, // /tl/... and /en/...
    },
  },
});
```

**Why `prefixDefaultLocale: true`:** Both languages are equally important for the PH market. Having `/tl/` and `/en/` prefixes makes the structure symmetrical and clear for SEO (hreflang tags). The root `/` serves as a language detection/redirect page only.

### Sports-Specific Architecture

| Sport | Data Source | Prediction Generation | Complexity |
|-------|------------|----------------------|------------|
| **Football** | API-Football (full API) | Automated via Worker cron | Low (proven in betpro) |
| **NBA** | API-Football or API-Basketball | Automated via Worker cron | Medium (different markets than football) |
| **PBA** | Manual entry or scraping | Semi-automated or manual | High (no reliable API) |
| **Boxing** | Manual/editorial | Manual blog posts + picks | Low (editorial only) |

**Implication for build order:** Start with football (proven), then NBA (similar API), then PBA/Boxing (manual workflows). The Worker architecture supports multiple sport modules within a single worker file.

### Cron Schedule (Philippine Time)

Workers run on UTC. Philippine Standard Time is UTC+8.

| Cron (UTC) | PHT | Purpose |
|------------|-----|---------|
| `0 2 * * *` | 10:00 AM | Morning batch: resolve yesterday, generate today's picks |
| `30 3-12 * * *` | 11:30 AM - 8:30 PM | Drip: publish one prediction every 30 min |
| `0 4 * * *` | 12:00 PM | Blog post generation |

### Database Schema Strategy

Supabase tables use RLS (Row Level Security) with public read-only access via anon key:

| Table | Purpose | Access |
|-------|---------|--------|
| `predictions` | All sports predictions with bilingual fields | Public read, Worker write (service key) |
| `blog_posts` | AI-generated bilingual blog content | Public read, Worker write |
| `leads` | Form submissions | Anon insert (RLS), no public read |
| `operators` | Affiliate operator info | Public read, admin write |

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-5k daily visitors | Static site on CF Pages handles this trivially. No changes needed. |
| 5k-50k daily visitors | Increase build frequency (every 1-2 hours). Add client-side Supabase queries for live-ish data on prediction pages. |
| 50k+ daily visitors | Consider Astro SSR on CF Workers for truly dynamic pages. Add CF Cache API. Supabase connection pooling via Supavisor. |

### Scaling Priorities

1. **First bottleneck:** Build frequency. Static site means content staleness. Fix with more frequent builds or hybrid SSR for prediction pages.
2. **Second bottleneck:** API-Football rate limits (varies by plan). Fix with caching fixtures data in KV and only fetching deltas.

## Anti-Patterns

### Anti-Pattern 1: Client-Side-Only Translations

**What people do:** Use React state/context for language switching, translating everything in the browser.
**Why it's wrong:** Search engines see only one language. Kills SEO for the non-default language. No proper hreflang. Slower initial render.
**Do this instead:** Static generation per locale via Astro i18n routing. Each language is a separate URL path with its own HTML.

### Anti-Pattern 2: Supabase SDK in Workers

**What people do:** Import `@supabase/supabase-js` in Cloudflare Workers.
**Why it's wrong:** Adds unnecessary bundle size, potential Node.js API incompatibilities, slower cold starts. The SDK is designed for browser/Node environments.
**Do this instead:** Use raw `fetch()` to PostgREST endpoints. Workers have native fetch. Three helper functions (select, insert, update) cover all needs. Proven in betpro reference.

### Anti-Pattern 3: Single Monolithic Worker for Everything

**What people do:** One worker handles predictions, blog posts, Telegram, image generation, and API endpoints.
**Why it's wrong:** betpro's pronosticos worker grew to 1,800 lines. Harder to debug, deploy, and maintain. Different cron schedules get tangled.
**Do this instead:** Separate workers per concern (predictions-cron, blog-cron). They can share utility functions via copy-paste (workers are standalone .js files, not modules). Consider a third worker for Telegram-specific logic if it grows complex.

### Anti-Pattern 4: Storing Translations in Database Only

**What people do:** Put all UI strings in Supabase and fetch at build time.
**Why it's wrong:** Adds build-time dependency on database availability for static content. UI strings change rarely and should be in code.
**Do this instead:** UI strings in `src/i18n/ui.ts` (in code, versioned). Dynamic content (predictions, blog posts) in Supabase with bilingual columns (`title_tl`, `title_en`).

### Anti-Pattern 5: Over-Engineering the Build Trigger

**What people do:** Set up Supabase Database Webhooks to trigger CF Pages rebuilds on every row change.
**Why it's wrong:** Predictions are drip-published throughout the day. Each publish would trigger a rebuild. Too many builds, most redundant.
**Do this instead:** Scheduled rebuild 2-4 times daily, or a single rebuild triggered after the morning batch completes. Tolerance for 1-2 hour content delay is acceptable for a predictions site.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **API-Football** | HTTP GET from Worker, `x-apisports-key` header | Rate limited per plan. Cache fixture data in KV. Covers football + NBA. |
| **Telegram Bot API** | HTTP POST from Worker (sendPhoto, sendMessage) | Bot must be admin in channel. Use `parse_mode: 'HTML'` for rich text. |
| **Cloudflare Workers AI** | Bound AI binding in Worker (`env.AI`) | Used for bilingual blog post generation and prediction analysis text. |
| **Cloudflare R2** | Bound bucket in Worker (`env.CARDS_BUCKET`) | Store generated prediction card PNGs. Public bucket or signed URLs. |
| **Cloudflare KV** | Bound namespace in Worker (`env.TG_QUEUE`) | Lightweight queue state for drip publishing. |
| **Supabase PostgREST** | HTTP fetch from Workers (write) + supabase-js from Astro (read) | Service role key in Workers, anon key in Astro client. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Workers → Supabase | HTTP REST (PostgREST) | Service role key for write access. Raw fetch, no SDK. |
| Astro → Supabase | supabase-js client | Anon key, read-only. Both build-time (getStaticPaths) and client-side (lead form). |
| Workers → Telegram | HTTP POST (Bot API) | sendPhoto with form-data for card images, sendMessage for text-only. |
| Workers → R2 | Bound bucket API | `env.CARDS_BUCKET.put()` for card storage. |
| Workers → Workers AI | Bound AI API | `env.AI.run()` for text generation. |
| CF Pages ← Astro Build | Deploy output | `astro build` generates `dist/`, deployed to Pages. |

## Build Order Dependencies

This determines the phase structure for the roadmap:

```
1. Supabase Schema (foundation - everything depends on this)
   │
   ├──▶ 2. Astro Site Shell (i18n routing, layout, basic pages)
   │       │
   │       └──▶ 4. Astro Content Pages (predictions, blog, results)
   │               │
   │               └──▶ 6. Polish (PWA, SEO, structured data, theme)
   │
   └──▶ 3. Predictions Worker (football first, proven path)
           │
           ├──▶ 5. Blog Worker (depends on understanding Worker patterns)
           │
           └──▶ 7. Telegram Integration (can be added to Worker later)
                   │
                   └──▶ 8. Card Image Generation (workers-og, R2)
```

**Key dependency insight:** The Supabase schema and the Astro site shell can be built in parallel with the first Worker. But the Astro content pages cannot be completed until the Worker is populating data. Start with football predictions (proven in betpro) to establish the full pipeline before adding basketball/boxing.

## Sources

- [Astro i18n Routing Documentation](https://docs.astro.build/en/guides/internationalization/)
- [Astro + Supabase Guide](https://docs.astro.build/en/guides/backend/supabase/)
- [Cloudflare Workers Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- [Supabase + Cloudflare Workers Integration](https://developers.cloudflare.com/workers/databases/third-party-integrations/supabase/)
- [Cloudflare Pages Astro Deployment](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/)
- [Supabase Database Webhooks](https://supabase.com/docs/guides/database/webhooks)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- betpro.cl reference project (local codebase analysis - HIGH confidence)

---
*Architecture research for: MyTaya - Philippine sports betting predictions platform*
*Researched: 2026-03-07*
