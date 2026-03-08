# Phase 6: Prediction Cards & Telegram - Research

**Researched:** 2026-03-07
**Domain:** Image generation (Satori/Workers), Cloudflare R2 storage, Telegram Bot API
**Confidence:** HIGH

## Summary

This phase adds two capabilities to the existing predictions-worker: (1) branded PNG card generation for each prediction using Satori on Cloudflare Workers, stored in R2, and (2) automatic Telegram channel publishing with drip scheduling. The existing codebase already has `card_image_url` and `published_telegram` columns on the predictions table, meaning the DB schema was designed for this from the start. Only a `telegram_message_id` column needs to be added via migration.

The primary technical risk is Satori on Cloudflare Workers -- there are 6 well-documented pitfalls (WASM compilation blocking, image fetching failures, base64 parsing issues, CDN 403s, no WebP support, no Node.js built-ins). The `workers-og` library (v0.0.27) wraps Satori specifically for Workers and handles the WASM bundling issue, making it the standard choice. Fonts must be loaded as ArrayBuffer (TTF/OTF format -- Satori does NOT support WOFF2). The Telegram Bot API is straightforward HTTP -- no SDK needed, just fetch calls to `api.telegram.org`.

**Primary recommendation:** Use `workers-og` for card generation in the existing predictions-worker, store PNGs in R2 with public custom domain access, and use raw Telegram Bot HTTP API (no SDK) for channel posting.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Full details on each card: team names, league, match date/time, odds, prediction type & pick, confidence level, MyTaya logo/branding
- Sport-themed accent colors: green for football, orange for basketball (matches existing site color coding)
- 1200x630 landscape dimensions -- standard OG image size, doubles as shareable card
- Separate result cards generated after settlement showing final score + WIN/LOSS badge (two cards per prediction lifecycle)
- Broadcast channel (not group) -- subscribers read, only admins post
- Bilingual messages (English + Filipino) in each post
- Drip scheduling: post each prediction 2-3 hours before match kickoff/tipoff
- Message format: PNG card as photo + short 2-3 line bilingual caption with match name, pick, odds, and link to full analysis on mytaya.com
- Post result card + caption on resolution (when 30-min cron settles the match)
- End-of-day recap message: today's record (e.g. 3W-1L), running streak, ROI
- Store Telegram message IDs per prediction for future threading/reference
- Prediction detail pages use the PNG card as their OG image (og:image meta tag)
- Download button on prediction detail pages for users to save/share the card PNG
- Blog articles linked to a prediction reuse that prediction's card as their OG image
- Card images stored in Cloudflare R2 (public bucket with predictable URLs)

### Claude's Discretion
- Exact card layout and typography (font choices, spacing, element positioning)
- Satori implementation details (HTML-to-SVG-to-PNG pipeline)
- Telegram Bot API setup specifics
- How the daily recap message is formatted
- R2 bucket naming and URL structure
- Download button placement and styling on prediction pages

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CARD-01 | PNG prediction cards generated for each prediction via Cloudflare Worker | workers-og library on existing predictions-worker, R2 storage |
| CARD-02 | Cards include match details, odds, prediction, and MyTaya branding | Satori HTML/CSS template with sport-themed colors, font loading patterns |
| CARD-03 | Cards are shareable on social media and Telegram | 1200x630 OG-standard dimensions, R2 public URLs, og:image integration in Layout.astro |
| TELE-01 | Telegram bot publishes predictions to group channel automatically | Telegram Bot HTTP API sendPhoto with channel @username, integrated into prediction pipeline |
| TELE-02 | Predictions are drip-fed throughout the day (not all at once) | New cron trigger (hourly) that checks predictions with match_date 2-3h away |
| TELE-03 | Results/resolutions posted to Telegram when matches conclude | Hook into existing resolver.ts after settlement, sendPhoto with result card |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| workers-og | 0.0.27 | HTML-to-PNG on Cloudflare Workers | Wraps Satori + resvg-wasm with proper WASM bundling for Workers; @vercel/og does NOT work on Workers |
| Cloudflare R2 | (binding) | Store generated PNG cards | Zero egress fees, same network as Workers, S3-compatible, already in Cloudflare ecosystem |
| Telegram Bot HTTP API | v7+ | Post cards to channel | Raw fetch -- no SDK needed for simple sendPhoto/sendMessage calls |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @supabase/supabase-js | ^2.98.0 | Already in worker | DB queries for prediction data, telegram_message_id storage |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| workers-og | Raw satori + @resvg/resvg-wasm | More control but must handle WASM compilation manually -- pitfall #1 |
| Raw Telegram HTTP API | telegraf / node-telegram-bot-api | SDKs add bundle size, worker doesn't need webhooks/middleware -- overkill |
| R2 | Cloudflare Images | R2 is simpler for static PNG storage; Images is for transforms |

**Installation:**
```bash
cd workers/predictions-worker
npm install workers-og
```

## Architecture Patterns

### Extended Worker Structure
```
workers/predictions-worker/src/
  index.ts            # Add new cron trigger, dispatch card gen + telegram
  types.ts            # Add Env.CARDS_BUCKET, Env.TELEGRAM_BOT_TOKEN, Env.TELEGRAM_CHANNEL_ID
  card-gen.ts         # NEW: HTML template + workers-og ImageResponse -> R2
  card-templates.ts   # NEW: Prediction card + result card HTML builders
  telegram.ts         # NEW: sendPhoto, sendMessage, daily recap
  resolver.ts         # MODIFY: Hook result card gen + telegram post after settlement
  prediction-gen.ts   # MODIFY: Hook card gen after prediction insert
  blog-gen.ts         # (unchanged)
```

### Pattern 1: Card Generation Pipeline
**What:** Generate PNG from prediction data, upload to R2, store URL in DB
**When to use:** After each prediction is inserted (daily cron) and after each settlement (30-min cron)
**Example:**
```typescript
// Source: workers-og README + Cloudflare R2 docs
import { ImageResponse } from 'workers-og';

async function generateCard(
  prediction: PredictionData,
  env: Env
): Promise<string> {
  const html = buildPredictionCardHtml(prediction);

  const response = new ImageResponse(html, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: 'Bebas Neue',
        data: await loadFont(env, 'bebas-neue-regular.ttf'),
        weight: 400,
      },
      {
        name: 'Inter',
        data: await loadFont(env, 'inter-regular.ttf'),
        weight: 400,
      },
    ],
  });

  const pngBuffer = await response.arrayBuffer();
  const key = `cards/${prediction.slug}.png`;

  await env.CARDS_BUCKET.put(key, pngBuffer, {
    httpMetadata: { contentType: 'image/png' },
  });

  return `https://cards.mytaya.com/${key}`;
}
```

### Pattern 2: Drip Scheduling via Cron
**What:** Hourly cron checks for predictions with match_date 2-3 hours away, publishes those not yet sent
**When to use:** Instead of posting all predictions at generation time
**Example:**
```typescript
// New cron: "0 * * * *" (every hour)
async function publishDueToTelegram(env: Env): Promise<void> {
  const supabase = createSupabaseClient(env);
  const now = new Date();
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);

  // Find predictions with match in 2-3h that haven't been published to Telegram
  const { data } = await supabase
    .from('predictions')
    .select('*')
    .eq('published_telegram', false)
    .eq('published_site', true)
    .gte('match_date', twoHoursLater.toISOString())
    .lte('match_date', threeHoursLater.toISOString());

  for (const pred of data || []) {
    await sendPredictionToTelegram(env, pred);
    await supabase
      .from('predictions')
      .update({ published_telegram: true })
      .eq('id', pred.id);
  }
}
```

### Pattern 3: Telegram HTTP API (No SDK)
**What:** Direct fetch to Telegram Bot API for sendPhoto and sendMessage
**When to use:** Workers environment -- minimal dependencies
**Example:**
```typescript
// Source: Telegram Bot API docs
const TELEGRAM_API = 'https://api.telegram.org/bot';

async function sendPhoto(
  token: string,
  channelId: string,
  photoUrl: string,
  caption: string
): Promise<number | null> {
  const res = await fetch(`${TELEGRAM_API}${token}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: channelId,  // e.g. "@mytaya_predictions"
      photo: photoUrl,     // R2 public URL
      caption,
      parse_mode: 'HTML',
    }),
  });

  const data = await res.json();
  return data.ok ? data.result.message_id : null;
}
```

### Pattern 4: Font Loading Strategy
**What:** Store TTF fonts in R2 or as static assets, load as ArrayBuffer for Satori
**When to use:** Satori requires font data as ArrayBuffer; WOFF2 NOT supported
**Example:**
```typescript
// Store fonts in R2 bucket, fetch once and cache
async function loadFont(env: Env, fontFile: string): Promise<ArrayBuffer> {
  const obj = await env.CARDS_BUCKET.get(`fonts/${fontFile}`);
  if (!obj) throw new Error(`Font not found: ${fontFile}`);
  return obj.arrayBuffer();
}
```

### Anti-Patterns to Avoid
- **Using @vercel/og directly on Workers:** WASM bundling incompatible -- will crash at runtime
- **Embedding images via URL in Satori templates:** Image fetching silently fails on Workers; always fetch images manually and embed as base64 data URLs
- **Using WOFF2 fonts with Satori:** Not supported -- will fail silently or produce squares. Use TTF or OTF
- **Posting all predictions at once to Telegram:** User explicitly wants drip scheduling 2-3h before match
- **Using satori-html with large base64 strings:** Parser breaks on data URLs > ~400KB; use VNode tree manipulation instead (workers-og handles this internally)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTML-to-PNG on Workers | Custom satori + resvg-wasm setup | workers-og | Handles WASM compilation, yoga layout, resvg rendering in one package |
| Telegram bot framework | Webhook handler, command parser | Raw fetch to Bot API | Only need sendPhoto + sendMessage -- no interactive bot features needed |
| Image CDN | Custom caching layer | R2 public bucket + custom domain | Zero egress, built-in CDN, cache headers for free |
| OG image serving | Dynamic endpoint | Static R2 URLs as og:image | Cards are generated once and cached; no need for on-demand generation |

**Key insight:** The entire card pipeline is batch (generate once, store forever) not on-demand, which simplifies the architecture enormously. Generate during cron, store in R2, reference by URL.

## Common Pitfalls

### Pitfall 1: WASM Compilation Blocked on Workers
**What goes wrong:** Cloudflare Workers block dynamic WebAssembly compilation; `initWasm(fetch(...))` fails at runtime
**Why it happens:** Workers require WASM to be statically imported, not dynamically loaded
**How to avoid:** Use workers-og which handles WASM bundling correctly; do NOT try raw satori + resvg-wasm setup
**Warning signs:** Runtime error about WASM compilation during card generation

### Pitfall 2: Satori Image Fetching Silently Fails
**What goes wrong:** External image URLs in Satori templates render as blank spaces with no error
**Why it happens:** Satori's internal image fetcher doesn't work in Workers edge runtime
**How to avoid:** Fetch all images (logos, team badges) manually, convert to base64 data URLs before passing to template
**Warning signs:** Cards render but logos/images are missing

### Pitfall 3: Font Format Incompatibility
**What goes wrong:** WOFF2 fonts produce empty rectangles or crash
**Why it happens:** Satori only supports TTF and OTF font formats
**How to avoid:** Download TTF versions of Bebas Neue and Inter from Google Fonts; store in R2
**Warning signs:** Text renders as squares or empty areas

### Pitfall 4: Telegram Rate Limits
**What goes wrong:** Bot gets temporarily blocked for sending too many messages
**Why it happens:** 30 messages/second global limit; 20 messages/minute in groups
**How to avoid:** Drip scheduling already handles this -- predictions post one at a time, hours apart. Add 1s delay between multiple Telegram calls in recap
**Warning signs:** 429 Too Many Requests responses with retry_after header

### Pitfall 5: R2 Public Access Not Configured
**What goes wrong:** Card URLs return 403 when accessed by Telegram or social media crawlers
**Why it happens:** R2 buckets are private by default; need explicit public access setup
**How to avoid:** Enable public access via custom domain (e.g., cards.mytaya.com) or r2.dev subdomain
**Warning signs:** Cards generate successfully but OG images and Telegram photos fail to load

### Pitfall 6: Workers CPU Time Limits
**What goes wrong:** Card generation times out, especially when generating 5-10 cards in sequence
**Why it happens:** Cloudflare Workers have 30s CPU time (paid plan) or 10ms (free plan); PNG rendering is CPU-intensive
**How to avoid:** Generate cards one at a time with small delays; if hitting limits, use ctx.waitUntil for non-blocking generation. Consider splitting card gen into its own worker if needed
**Warning signs:** Worker logs show "Exceeded CPU time limit" errors

## Code Examples

### Prediction Card HTML Template
```typescript
// Inline CSS with flexbox -- Satori supports a subset of CSS
function buildPredictionCardHtml(pred: {
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: string;
  pick: string;
  odds: number;
  confidence: string;
  sport: string;
}): string {
  const accentColor = pred.sport === 'basketball' ? '#f97316' : '#0F766E';

  return `
    <div style="display:flex;flex-direction:column;width:1200px;height:630px;background:#0A0A0A;color:white;padding:48px;font-family:Inter;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;">
          <span style="font-family:Bebas Neue;font-size:48px;color:#0F766E;">MY</span>
          <span style="font-family:Bebas Neue;font-size:48px;">TAYA</span>
        </div>
        <span style="font-size:20px;color:#9CA3AF;">${pred.league}</span>
      </div>
      <div style="display:flex;flex:1;align-items:center;justify-content:center;gap:40px;">
        <span style="font-family:Bebas Neue;font-size:56px;">${pred.homeTeam}</span>
        <span style="font-size:32px;color:#6B7280;">VS</span>
        <span style="font-family:Bebas Neue;font-size:56px;">${pred.awayTeam}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:24px;background:${accentColor};border-radius:12px;">
        <span style="font-family:Bebas Neue;font-size:36px;">${pred.pick}</span>
        <span style="font-size:28px;">@ ${pred.odds.toFixed(2)}</span>
        <span style="font-size:20px;text-transform:uppercase;">${pred.confidence}</span>
      </div>
      <div style="display:flex;justify-content:center;margin-top:16px;">
        <span style="font-size:16px;color:#6B7280;">mytaya.com</span>
      </div>
    </div>
  `;
}
```

### Result Card Template
```typescript
function buildResultCardHtml(pred: {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  pick: string;
  result: 'win' | 'loss' | 'push';
  sport: string;
}): string {
  const resultColor = pred.result === 'win' ? '#22C55E' : pred.result === 'loss' ? '#EF4444' : '#F59E0B';
  const resultLabel = pred.result.toUpperCase();

  return `
    <div style="display:flex;flex-direction:column;width:1200px;height:630px;background:#0A0A0A;color:white;padding:48px;font-family:Inter;">
      <!-- Similar structure but with score and WIN/LOSS badge -->
      <div style="display:flex;flex:1;align-items:center;justify-content:center;gap:40px;">
        <div style="display:flex;flex-direction:column;align-items:center;">
          <span style="font-family:Bebas Neue;font-size:56px;">${pred.homeTeam}</span>
          <span style="font-family:Bebas Neue;font-size:72px;">${pred.homeScore}</span>
        </div>
        <span style="font-size:32px;color:#6B7280;">-</span>
        <div style="display:flex;flex-direction:column;align-items:center;">
          <span style="font-family:Bebas Neue;font-size:56px;">${pred.awayTeam}</span>
          <span style="font-family:Bebas Neue;font-size:72px;">${pred.awayScore}</span>
        </div>
      </div>
      <div style="display:flex;justify-content:center;">
        <span style="font-family:Bebas Neue;font-size:64px;color:${resultColor};padding:8px 32px;border:4px solid ${resultColor};border-radius:12px;">${resultLabel}</span>
      </div>
    </div>
  `;
}
```

### Telegram Bilingual Caption
```typescript
function buildCaption(pred: {
  homeTeam: string;
  awayTeam: string;
  pickLabelEn: string;
  pickLabelTl: string;
  odds: number;
  slug: string;
}): string {
  return [
    `${pred.homeTeam} vs ${pred.awayTeam}`,
    `Pick: ${pred.pickLabelEn} @ ${pred.odds.toFixed(2)}`,
    `Hula: ${pred.pickLabelTl} @ ${pred.odds.toFixed(2)}`,
    ``,
    `https://mytaya.com/en/predictions/${pred.slug}/`,
  ].join('\n');
}
```

### Wrangler.toml R2 Binding
```toml
# Add to existing wrangler.toml
[[r2_buckets]]
binding = "CARDS_BUCKET"
bucket_name = "mytaya-cards"
preview_bucket_name = "mytaya-cards-preview"

# New secrets needed:
# wrangler secret put TELEGRAM_BOT_TOKEN
# wrangler secret put TELEGRAM_CHANNEL_ID
```

### DB Migration for telegram_message_id
```sql
-- 006_telegram_support.sql
ALTER TABLE public.predictions
  ADD COLUMN IF NOT EXISTS telegram_message_id BIGINT;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Puppeteer/Chrome for OG images | Satori (HTML-to-SVG-to-PNG, no browser) | 2023 | Sub-100ms generation, edge-compatible |
| @vercel/og on all edge runtimes | workers-og for Cloudflare Workers specifically | 2023 | WASM bundling fixed for Workers |
| Telegram Bot SDKs (node-telegram-bot-api) | Raw HTTP fetch for simple use cases | Ongoing | Simpler, no dependencies, Workers-compatible |
| Dynamic OG image endpoints | Pre-generated static PNGs in R2 | Ongoing | Better performance, cacheable, no runtime cost |

**Deprecated/outdated:**
- satori-html: Breaks on large base64 strings; workers-og handles HTML parsing internally
- @vercel/og on Workers: WASM bundling incompatible; use workers-og instead

## Open Questions

1. **R2 bucket public access method**
   - What we know: Can use r2.dev subdomain (free, non-production) or custom domain (cards.mytaya.com)
   - What's unclear: Whether mytaya.com DNS is on Cloudflare (required for custom domain)
   - Recommendation: Start with r2.dev for development, plan custom domain for production. The planner should include a task to configure public access.

2. **Font file storage location**
   - What we know: Satori needs TTF/OTF as ArrayBuffer; Bebas Neue and Inter are the project fonts
   - What's unclear: Whether to store fonts in R2 or bundle them in the worker
   - Recommendation: Store in R2 alongside cards. Fonts are loaded once per invocation; R2 fetch adds ~5ms latency which is negligible compared to PNG rendering time.

3. **Worker CPU time budget**
   - What we know: Paid Workers plan gives 30s CPU time; generating one card takes ~200-500ms
   - What's unclear: Whether generating 5-10 prediction cards + 5-10 result cards in one invocation will hit limits
   - Recommendation: Generate cards sequentially within the existing cron. If timing becomes an issue, use separate ctx.waitUntil calls. Monitor via Worker analytics.

## Sources

### Primary (HIGH confidence)
- [workers-og GitHub](https://github.com/kvnang/workers-og) - API, usage, Workers compatibility
- [Cloudflare R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-usage/) - R2 binding configuration
- [Cloudflare R2 Public Buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/) - Public access setup
- [Telegram Bot API](https://core.telegram.org/bots/api) - sendPhoto, sendMessage, rate limits

### Secondary (MEDIUM confidence)
- [6 Pitfalls of Satori on Workers](https://dev.to/devoresyah/6-pitfalls-of-dynamic-og-image-generation-on-cloudflare-workers-satori-resvg-wasm-1kle) - WASM, fonts, image loading issues
- [Cloudflare Workers Image Generation Guide](https://code.charliegleason.com/getting-started-cloudflare-workers-image-generation) - End-to-end Workers OG setup

### Tertiary (LOW confidence)
- workers-og v0.0.27 version from npm search (last published ~8 months ago) - version may have updated

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - workers-og is the documented solution for Satori on Workers; R2 is native Cloudflare
- Architecture: HIGH - Extends existing predictions-worker cron patterns; DB schema already has card_image_url and published_telegram columns
- Pitfalls: HIGH - 6 pitfalls article is well-documented and cross-verified with multiple sources

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable ecosystem, workers-og may get minor updates)
