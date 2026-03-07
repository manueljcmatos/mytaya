# Pitfalls Research

**Domain:** Philippine sports betting predictions platform (basketball, boxing, football)
**Researched:** 2026-03-07
**Confidence:** MEDIUM-HIGH (verified across multiple sources; PAGCOR regulatory landscape is evolving rapidly)

## Critical Pitfalls

### Pitfall 1: Tracking Win Rate Instead of ROI as Primary Metric

**What goes wrong:**
The platform publishes predictions and prominently displays "65% win rate" as proof of quality. But win rate is a vanity metric in sports betting -- a 65% hit rate on heavy favorites (odds 1.30-1.50) loses money over time. Users follow tips, lose money, and blame the platform. Credibility collapses.

**Why it happens:**
Developers and non-bettors assume "more correct predictions = better service." Academic research shows calibration (how closely predicted probability matches actual outcome) matters far more than raw accuracy. A poorly calibrated model with 70% accuracy produces -35% ROI, while a well-calibrated model with lower accuracy produces +34% ROI.

**How to avoid:**
- Track and display ROI alongside win rate from day one. Show profit/loss if users had flat-staked each prediction.
- Record the odds at time of prediction, not just the outcome. Without odds, ROI calculation is impossible.
- Use unit-based tracking (1 unit = fixed bet size). Show "+12.5 units this month" not just "68% correct."
- Display closing line value (CLV) -- did the prediction beat the closing odds? This is the gold standard for measuring prediction skill.
- Separate tracking by sport, league, and bet type (spread, moneyline, over/under).

**Warning signs:**
- Prediction records stored without odds values
- Dashboard showing only W/L counts without financial context
- Users asking "why am I losing if your predictions are 65% correct?"

**Phase to address:**
Database schema design and prediction model (early phase). The Supabase schema must capture odds at prediction time. Retrofitting odds tracking is painful.

---

### Pitfall 2: Google Treating the Site as YMYL Gambling Content

**What goes wrong:**
Google classifies sports betting prediction sites under "Your Money or Your Life" (YMYL), subjecting them to the strictest E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) scrutiny. The site gets poor rankings or is flagged despite having quality content because it lacks trust signals, responsible gambling disclaimers, or transparent authorship.

**Why it happens:**
Developers focus on technical SEO (sitemaps, meta tags, page speed) but neglect the content trust layer that Google's quality raters specifically check for gambling-adjacent content. Google has expanded gambling content definitions significantly in 2025, and any site providing links to gambling services or facilitating betting is now classified as promoting gambling.

**How to avoid:**
- Include a prominent Responsible Gambling page with PAGCOR-aligned messaging (required tagline: "Gambling is addictive, know when to stop" -- PAGCOR is rolling out localized translations of this in 2026).
- Add clear author/editorial attribution. E-E-A-T demands visible expertise.
- Include disclaimers on every prediction page: "For entertainment purposes. Past performance does not guarantee future results."
- Never auto-link to unlicensed operators. Only feature PAGCOR-licensed affiliate operators.
- Implement Schema.org structured data (SportsEvent, Article) to help Google understand content intent.
- Create a News Sitemap for Google News eligibility -- but expect 6-12 months for domain authority to build.
- Avoid keyword stuffing on prediction pages. Google penalizes gambling sites more aggressively for this.

**Warning signs:**
- Pages indexed but ranking on page 5+ despite quality content
- Google Search Console showing "manual actions" or YMYL quality warnings
- Competitor tipster sites with worse content but better trust signals outranking you

**Phase to address:**
Content structure and SEO setup phase. Responsible gambling page, disclaimers, and Schema.org markup must ship with the initial launch, not be bolted on later.

---

### Pitfall 3: Broken Bilingual hreflang Implementation Destroying SEO

**What goes wrong:**
The Filipino/English bilingual setup has broken hreflang tags -- missing return links, wrong language codes, missing self-referential tags, or canonical/hreflang misalignment. Google ignores the hreflang annotations entirely, causing wrong-language pages to rank, duplicate content penalties, or Filipino pages never appearing in search.

**Why it happens:**
hreflang requires bidirectional links (if page A links to page B's translation, B must link back to A). Astro's i18n routing handles URL structure but does NOT automatically generate correct hreflang tags -- you must implement them manually in layouts. Developers deploy updates to one language version without syncing the other, and sitemaps drift out of sync with HTML annotations.

**How to avoid:**
- Use Astro's built-in i18n routing (`getRelativeLocaleUrl()`) for URL generation, but build a custom `<head>` component that programmatically generates all hreflang tags including `x-default`.
- Use correct ISO codes: `tl` for Tagalog/Filipino (NOT `fil` which is the ISO 639-2 code -- `tl` is ISO 639-1 and what Google expects) and `en` for English.
- Every page must include a self-referential hreflang tag pointing to itself.
- Configure `@astrojs/sitemap` with i18n options to auto-generate per-locale sitemap entries.
- Canonical tags must match hreflang URLs exactly -- no trailing slash mismatches, no http/https mix.
- Build a CI check that validates hreflang bidirectionality on every deploy.

**Warning signs:**
- Google Search Console's "International Targeting" report showing hreflang errors
- Filipino pages not appearing in Google.com.ph search results
- Both language versions competing for the same keywords

**Phase to address:**
i18n and SEO foundation phase. This must be validated with Google Search Console within the first weeks of launch.

---

### Pitfall 4: Satori + resvg-wasm Image Generation Failing on Cloudflare Workers

**What goes wrong:**
Prediction cards (PNG images for Telegram/social sharing) are generated on Cloudflare Workers using Satori + resvg-wasm. The pipeline has at least 6 documented failure modes: WASM compilation blocked, external image fetching silently fails, large base64 strings crash satori-html parser, CDN fetches return 403, WebP images cause cryptic errors, and Node.js buffer APIs are unavailable.

**Why it happens:**
Cloudflare Workers is not Node.js -- it is a V8 isolate environment. Canvas API does not exist. WASM must be statically imported (no dynamic compilation). Satori's internal image fetch uses patterns that fail silently in this environment. These are not edge cases -- they are fundamental platform constraints that most tutorials do not mention.

**How to avoid:**
- Use static WASM imports with wrangler's esbuild. Create a post-build script that patches the worker file to inject compiled WASM into `globalThis`.
- Never rely on Satori's internal image fetching. Always pre-fetch images manually and convert to base64 data URLs before passing to Satori.
- For large images, use placeholder strings in satori-html templates and patch the VNode tree after parsing.
- Include `User-Agent` and `Accept` headers on all server-side image fetches.
- Store PNG variants of all images (Satori only supports PNG and JPEG, not WebP).
- Use Web APIs (`String.fromCharCode()` + `btoa()` in 8KB chunks) instead of `node:buffer`.
- Consider `workers-og` package as an alternative to raw Satori -- it wraps many of these workarounds.
- Set memory budget: Workers have ~128MB limit. Prediction card generation must stay well under.

**Warning signs:**
- Image generation works locally but fails silently on deployed Workers
- Blank images in Telegram messages
- "l is not iterable" or "Wasm code generation disallowed" errors in Worker logs

**Phase to address:**
Prediction card generation phase. Build a proof-of-concept Worker for image generation early, before designing elaborate card templates. Validate the pipeline end-to-end on deployed Workers, not just local dev.

---

### Pitfall 5: API-Basketball PBA Data Being Incomplete or Unreliable

**What goes wrong:**
The platform promises PBA (Philippine Basketball Association) predictions alongside NBA, but API-Basketball's PBA coverage is listed but untested. PBA data may have delayed scores, missing player statistics, incomplete schedules, or gaps during off-season. The platform launches with broken or empty PBA sections, undermining credibility with the core Philippine audience.

**Why it happens:**
API-Basketball covers 370+ leagues, but coverage depth varies dramatically. NBA data is comprehensive (it is the flagship product). Minor/regional leagues like PBA, NCAA Philippines, and FIBA regional tournaments often have basic scores but lack the statistical depth needed for meaningful predictions (player props, advanced metrics, real-time injury reports).

**How to avoid:**
- Before committing to API-Basketball for PBA, test the actual endpoints: query PBA fixtures, check if player stats are populated, verify score update latency during a live PBA game.
- Design the architecture to support multiple data sources per league. PBA may need a hybrid approach: API-Basketball for schedules/scores + manual entry for detailed predictions.
- Plan for manual/editorial PBA predictions as the fallback (same approach as boxing). Do not block launch on full API coverage.
- Separate NBA predictions (high API reliability) from PBA predictions (potentially manual) in the UI so quality differences are not jarring.
- NCAA Philippines data is almost certainly not in any API. Plan for fully manual data from the start.

**Warning signs:**
- API-Basketball PBA endpoints returning empty arrays for stats
- Score updates lagging by hours instead of minutes
- PBA game schedules missing or incorrect

**Phase to address:**
API integration phase. Run a data quality audit for each target league BEFORE building prediction pipelines that depend on specific data fields.

---

### Pitfall 6: PAGCOR Compliance Exposure from Affiliate Links

**What goes wrong:**
The platform features affiliate operator cards linking to betting operators. PAGCOR's 2025-2026 regulatory overhaul requires gaming affiliates and support providers to be accredited. The site links to unlicensed operators or fails to display required responsible gambling messaging, exposing it to regulatory action or -- more likely -- being blocked by Philippine ISPs that enforce PAGCOR blacklists.

**Why it happens:**
PAGCOR implemented a new Regulatory Framework for Gaming Affiliates and Support Service Providers (effective October 2025) with a Q1 2026 final compliance deadline for legacy operations. Advertising restrictions have expanded: gambling ads are already banned during primetime TV/radio, and regulators are considering full-day bans. The regulatory landscape is tightening rapidly, and a predictions site with affiliate links occupies a gray area.

**How to avoid:**
- Only feature operators that are verifiably PAGCOR-licensed. PAGCOR maintains a public list of accredited operators -- cross-reference before adding any affiliate.
- Include PAGCOR's responsible gambling tagline ("Gambling is addictive, know when to stop") on every page with affiliate links. PAGCOR is mandating localized (Filipino) translations in 2026.
- Include age-gating (18+ disclaimer) prominently.
- Add a self-exclusion information link (PAGCOR is requiring online self-exclusion tools on gaming platforms in 2026).
- Document that mytaya.com is a predictions/editorial site, NOT a gambling operator. This distinction matters for regulatory classification.
- Monitor PAGCOR announcements quarterly -- regulations are actively evolving. The separation of PAGCOR's commercial and regulatory functions signals even stricter enforcement ahead.

**Warning signs:**
- Featured operators not appearing on PAGCOR's licensed operator list
- Receiving takedown notices or ISP blocking reports from Philippine users
- Philippine users reporting they cannot access the site

**Phase to address:**
Affiliate integration phase. Research actual PAGCOR-licensed operators before building affiliate cards. The operator list must be curated, not scraped from generic affiliate networks.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoding prediction odds in content files instead of Supabase | Faster initial content creation | Cannot calculate ROI, no historical tracking, no API-driven dashboards | Never -- schema must include odds from day one |
| Client-side-only language toggle (JS-based) instead of Astro i18n routing | Simpler implementation | SEO disaster: Google sees single-language content, hreflang impossible, no Filipino-language indexing | Never -- static generation per locale is a core requirement |
| Using Satori locally (Node.js) instead of on Workers | Works immediately with no WASM issues | Two different runtimes to maintain, local images work but deployed ones fail, divergent behavior | MVP only -- must migrate to Workers before launch |
| Storing prediction images in Supabase Storage instead of Cloudflare R2 | Single platform simplicity | Egress costs at scale, slower delivery to PH users (no edge caching), Supabase storage rate limits | MVP only -- move to R2 + CDN when traffic grows |
| Flat file translations (JSON) without a CMS or translation management | Quick setup | Translation files drift apart, missing keys cause blank strings, no translator workflow | Acceptable for 2 languages; problematic at 3+ |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| API-Football/Basketball | Assuming all leagues have equal data depth | Audit data coverage per league before building features. NBA = rich, PBA = basic, NCAA PH = nonexistent |
| API-Football/Basketball | Not caching API responses; hitting rate limits | Cache fixtures/standings in Supabase. Only fetch live scores during game windows. Use scheduled Workers, not on-demand requests |
| API-Football/Basketball | Using the free plan for production | Free tier has severe rate limits. Budget for Mega plan (900 req/min) if covering multiple leagues with scheduled updates |
| Telegram Bot API | Sending messages to groups without rate limiting | 20 messages per minute per group. Queue messages with delays. Use `adaptive_retry` from API 8.0 429 responses |
| Telegram Bot API | Sending prediction card images without compression | Large PNGs hit Telegram's 10MB file limit and are slow on mobile data in PH. Compress to JPEG or optimize PNG size |
| Supabase | Exposing RLS-unprotected tables via the public anon key | Even for a "read-only" public site, enable RLS on all tables. Prediction data and affiliate config should not be writable via the public API |
| @astrojs/sitemap | Not configuring i18n options | Sitemap generates single-locale URLs. Must pass `i18n` config with `defaultLocale` and `locales` mapping for proper bilingual sitemap |
| Cloudflare Pages | Deploying without setting `NODE_VERSION` env var | Build may use old Node.js version, causing Astro 5 build failures. Pin `NODE_VERSION=20` in Cloudflare Pages settings |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Generating prediction card images on every page request | Slow response times, Worker CPU limit exceeded | Pre-generate images via scheduled Workers, cache in R2, serve static URLs | Any meaningful traffic (>100 concurrent users) |
| Loading all predictions on a single page without pagination | Slow initial load, high Supabase bandwidth | Paginate by date. Use Astro's static generation to pre-build daily pages | >30 days of prediction history |
| Fetching live odds/scores client-side from Supabase on every visit | Supabase connection pool exhaustion, slow on PH mobile connections | Use Astro's static generation for historical data. Only use client-side fetch for genuinely live data during active games | >1000 daily visitors |
| Unoptimized images in blog posts and prediction cards | Core Web Vitals fail, slow on PH mobile networks (average 20-30 Mbps mobile, but highly variable) | Use Astro's `<Image>` component with automatic optimization. Serve WebP with PNG fallback. Use Cloudflare Image Resizing | Immediately noticeable on mobile |
| Bilingual content doubling static build output | Build times grow linearly with content volume | Acceptable with Astro's static build. Monitor build times -- Cloudflare Pages has 20-minute build limit | >500 content pages per language (1000+ total pages) |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing Supabase service role key in Workers | Full database access including writes/deletes | Use separate Supabase API keys: anon key for public reads, service role only in secure Workers with environment variables |
| API-Football/Basketball API key in client-side code | API key theft, rate limit abuse, billing exposure | All API calls through Workers. Never expose sports API keys to the browser |
| Affiliate tracking links without redirect validation | Open redirect vulnerability, phishing risk | Whitelist allowed affiliate domains. Use server-side redirect validation |
| No rate limiting on lead capture form | Spam floods, Supabase row count explosion | Add Cloudflare Turnstile (CAPTCHA alternative) to the form. Rate limit by IP in Workers |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Language auto-detect redirecting without user control | Filipino users with English browser settings see wrong language; frustrated users cannot find the toggle | Auto-detect on first visit ONLY, set a cookie/localStorage preference, make the language toggle prominent in the header. Never redirect returning users |
| Showing empty prediction sections for leagues without data | "This site is broken" perception, especially for PBA/NCAA PH where data may be sparse | Show "Coming soon" with signup CTA instead of empty states. Only launch league sections when prediction pipeline is validated |
| Prediction cards not optimized for Telegram mobile view | Text too small to read, images cropped in chat | Design cards at 1200x630 (OG standard) but test readability at Telegram's mobile thumbnail size (~320px wide). Use large fonts, high contrast |
| No timezone handling for Philippine users | Game times shown in UTC or US timezones confuse PH users | Display all times in PHT (UTC+8) by default. Store in UTC in Supabase, convert on display |
| Dark theme as default | May not match expectations of Filipino sports betting audience used to bright, colorful interfaces | Default to light theme with PH-inspired colors. Offer dark mode as toggle. Research competitor PH betting sites for design conventions |

## "Looks Done But Isn't" Checklist

- [ ] **Bilingual i18n:** Often missing `x-default` hreflang tag -- verify all pages include `<link rel="alternate" hreflang="x-default" href="...">` pointing to the default (English) version
- [ ] **Bilingual i18n:** Often missing self-referential hreflang tags -- verify each page links to itself in its own language
- [ ] **Prediction tracking:** Often missing odds capture -- verify every prediction record in Supabase includes the odds at time of publication, not just W/L outcome
- [ ] **Prediction tracking:** Often missing timezone -- verify prediction timestamps are stored in UTC with PHT display conversion
- [ ] **Responsible gambling:** Often missing on prediction pages -- verify disclaimer text appears on EVERY page with predictions or affiliate links, not just a standalone page
- [ ] **Telegram integration:** Often missing rate limiting -- verify the bot queues messages with 3-second delays between group sends
- [ ] **SEO:** Often missing News Sitemap -- verify `/news-sitemap.xml` exists and follows Google News sitemap protocol (separate from main sitemap)
- [ ] **Affiliate cards:** Often missing PAGCOR license verification -- verify each featured operator appears on PAGCOR's official licensed operator list
- [ ] **Image generation:** Often works only locally -- verify prediction card generation on a deployed Cloudflare Worker, not just local dev

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Win rate without ROI tracking | HIGH | Retroactively adding odds requires manual research of historical odds. Redesign prediction schema, backfill data, update all dashboards |
| Broken hreflang | MEDIUM | Fix hreflang component, redeploy all pages, request reindexing in Google Search Console. Allow 2-4 weeks for Google to reprocess |
| PAGCOR non-compliance | HIGH | Remove all non-licensed affiliate links immediately. Add compliance messaging. Research and replace with licensed operators. May require site redesign if heavily affiliate-integrated |
| Workers image generation failure | MEDIUM | Fall back to pre-generated static images. Rebuild pipeline with `workers-og` wrapper or move generation to a traditional Node.js serverless function (Supabase Edge Function as backup) |
| PBA API data gaps | LOW | Switch to manual/editorial PBA predictions (same as boxing). No architectural change needed if the system was designed for hybrid API+manual from the start |
| Google YMYL penalty | HIGH | Add E-E-A-T signals (author bios, editorial policy, responsible gambling page). May take 3-6 months to recover rankings |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Win rate vs ROI tracking | Database schema design | Query Supabase: every prediction row has `odds_at_publish` and `unit_stake` columns |
| Google YMYL compliance | Content/SEO foundation | Lighthouse audit + manual check of responsible gambling page, disclaimers, Schema.org markup |
| Broken hreflang | i18n foundation | Google Search Console International Targeting report shows zero errors |
| Image generation on Workers | Prediction card PoC (early) | Deploy a test Worker that generates a PNG and returns it via HTTP -- verify in production environment |
| PBA API data gaps | API integration | Run data quality audit script against API-Basketball PBA endpoints before building prediction pipelines |
| PAGCOR affiliate compliance | Affiliate integration | Cross-reference every featured operator against PAGCOR's published licensed operator list |
| Telegram rate limiting | Telegram bot integration | Load test: send predictions to 5+ groups and verify no 429 errors or dropped messages |
| Language auto-detect UX | i18n/UX implementation | Test with PH users whose browser is set to English -- verify they can easily switch to Filipino |
| Prediction card mobile readability | Card template design | Screenshot cards at 320px width and verify text is legible without zooming |

## Sources

- [Tips.GG: Why Accuracy Doesn't Equal Profit](https://tips.gg/article/why-accuracy-doesnt-equal-profit-in-sports-betting-understanding-the-roi-paradox/) -- MEDIUM confidence (industry source, corroborated by academic research)
- [OpticOdds: Calibration Over Accuracy](https://opticodds.com/blog/calibration-the-key-to-smarter-sports-betting) -- MEDIUM confidence
- [ScienceDirect: ML model selection accuracy vs calibration](https://www.sciencedirect.com/science/article/pii/S266682702400015X) -- HIGH confidence (peer-reviewed)
- [DEV.to: 6 Pitfalls of OG Image Generation on Cloudflare Workers](https://dev.to/devoresyah/6-pitfalls-of-dynamic-og-image-generation-on-cloudflare-workers-satori-resvg-wasm-1kle) -- HIGH confidence (first-hand developer experience with code examples)
- [Astro Docs: i18n Routing](https://docs.astro.build/en/guides/internationalization/) -- HIGH confidence (official documentation)
- [Search Engine Journal: Common Hreflang Mistakes](https://www.searchenginejournal.com/ask-an-seo-what-are-the-most-common-hreflang-mistakes/556455/) -- MEDIUM confidence
- [API-Football: Rate Limit Documentation](https://www.api-football.com/news/post/how-ratelimit-works) -- HIGH confidence (official)
- [API-Basketball: Coverage](https://www.api-basketball.com/coverage) -- HIGH confidence (official)
- [Telegram Bot FAQ: Rate Limits](https://core.telegram.org/bots/faq) -- HIGH confidence (official)
- [PAGCOR Regulatory Framework for Affiliates (Chambers & Partners)](https://chambers.com/articles/pagcor-issues-rules-on-accreditation-of-gaming-affiliates-and-support-providers-under-new-regime) -- MEDIUM confidence (legal analysis)
- [AGB: PAGCOR Tightens Regulations 2026](https://agbrief.com/news/philippines/11/02/2026/pagcor-tightens-regulations-on-online-gambling/) -- MEDIUM confidence (industry news)
- [Google Ads: Gambling and Games Policy](https://support.google.com/adspolicy/answer/6018017?hl=en) -- HIGH confidence (official Google policy)
- [Google Policy Update: Offline Gambling Expansion Nov 2025](https://support.google.com/adspolicy/answer/16090550?hl=en) -- HIGH confidence (official)
- [Fortis Media: Google Ads Gambling Certification Guide](https://www.fortismedia.com/en/articles/google-ads-gambling-policy/) -- MEDIUM confidence
- [AffPapa: iGaming SEO 2025](https://affpapa.com/igaming-seo-strategies-you-need-a-practical-guide/) -- LOW confidence (industry blog)
- [Sportmonks: Common Football API Mistakes](https://www.sportmonks.com/blogs/5-common-mistakes-developers-make-with-football-apis-and-how-to-avoid-them/) -- MEDIUM confidence

---
*Pitfalls research for: Philippine sports betting predictions platform (MyTaya)*
*Researched: 2026-03-07*
