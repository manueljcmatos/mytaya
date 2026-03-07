# Phase 5: Blog Automation - Research

**Researched:** 2026-03-07
**Domain:** AI content generation, blog CMS patterns, news SEO
**Confidence:** HIGH

## Summary

This phase extends the existing predictions-worker to generate long-form blog articles (800-1200 words) for each daily prediction pick, storing them in the existing `posts` table in Supabase and rendering them through new Astro pages. The infrastructure is well-established: the Worker already uses Workers AI (`@cf/meta/llama-3.1-8b-instruct`), the `posts` table schema exists in the foundation migration, `buildBlogPostingSchema()` is ready in `src/lib/seo.ts`, and the `news-sitemap.xml.ts` endpoint has placeholder comments specifically referencing Phase 5.

The main technical work involves: (1) a blog generation module in the Worker that produces bilingual long-form articles from prediction context, (2) a migration to add `prediction_id` foreign key to `posts` for cross-linking, (3) blog index pages with featured article + grid + sport tabs + pagination, (4) individual blog post `[slug].astro` pages with BlogPosting schema, and (5) populating the news sitemap with recent posts.

**Primary recommendation:** Extend the existing predictions-worker with a `blog-gen.ts` module that runs after prediction generation in the same cron, reusing the established AI call pattern. Use Astro SSG with `getStaticPaths()` for blog pages, following the identical pattern from `predictions/[slug].astro`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Prediction previews only -- one article per featured match, directly tied to prediction data
- Long-form articles (800-1200 words) with deep analysis: form breakdown, head-to-head, key factors, detailed reasoning
- Expert analyst tone -- authoritative, data-driven, confident but not hype-y (like a professional tipster)
- Single match per article for unique URLs and long-tail SEO targeting
- Featured + grid index layout: hero featured article at top, grid of recent articles below
- Sport tabs for filtering (All | Football | Basketball) -- consistent with predictions page pattern
- Article cards show: title, 1-2 line excerpt, sport badge, date, estimated read time (no images)
- 12 articles per page with pagination
- 3-5 articles per day, one per prediction pick (1:1 mapping with daily predictions)
- Generated in the same cron run as predictions -- single Worker handles both
- Articles updated after match result: append a "Result" section with final score and WIN/LOSS outcome
- No articles on off-season or no-match days -- skip rather than generate filler content
- Match-based slugs: e.g. /en/blog/lakers-vs-celtics-prediction-march-7
- Translated URL paths for bilingual: /tl/blog/[filipino-slug] and /en/blog/[english-slug] (consistent with site i18n)
- Bidirectional cross-linking between blog articles and prediction detail pages
- Blog articles added to existing /news-sitemap.xml (not a separate sitemap)
- The existing predictions-worker already runs on cron -- blog generation should extend it, not create a separate Worker
- Phase 2's news-sitemap.xml endpoint and buildBlogPostingSchema() are ready to consume blog data
- The Supabase database will need a blog_posts table (or similar) to store generated articles
- Cross-linking means the predictions table may need a blog_post_id reference (or vice versa)

### Claude's Discretion
- Exact article structure/sections (intro, analysis, pick, etc.)
- How the featured article is selected (latest, most popular league, etc.)
- Schema.org BlogPosting markup details
- Empty state design when no articles exist
- How result appendix is visually differentiated from preview content

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BLOG-01 | AI-generated daily sports articles published via Cloudflare Worker | Worker already uses Workers AI; add blog-gen.ts module alongside prediction-gen.ts in same cron |
| BLOG-02 | Blog posts are generated in both Filipino and English | Same bilingual AI prompt pattern as prediction-gen.ts; posts table has title_tl/title_en/content_tl/content_en columns |
| BLOG-03 | Blog has paginated index with featured/recent articles | Astro SSG blog index with Supabase query; sport tabs pattern from predictions page |
| BLOG-04 | Individual blog post pages with proper SEO metadata | [slug].astro pages with buildBlogPostingSchema() from src/lib/seo.ts; hreflang cross-linking |
| BLOG-05 | News sitemap generated for Google News eligibility | Populate existing news-sitemap.xml.ts endpoint; last-2-days filter per Google requirements |
</phase_requirements>

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | (project version) | SSG blog pages | Already used for all pages |
| @supabase/supabase-js | ^2.98.0 | Blog data storage/queries | Already in Worker and frontend |
| Workers AI | @cf/meta/llama-3.1-8b-instruct | Blog article generation | Already used for prediction generation |
| Tailwind CSS v4 | (project version) | Blog page styling | Already used throughout |
| React | (project version) | Blog list island | Consistent with PredictionList pattern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @cloudflare/workers-types | ^4.20250224.0 | Worker type definitions | Already installed in Worker |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Llama 3.1 8B | Llama 4 Scout 17B | Larger context (131K vs 8K) and potentially better quality, but similar pricing (~$0.27-0.85/M tokens); 8B is proven in this project and sufficient for 800-1200 word articles |

**Installation:** No new packages required. All dependencies already installed.

## Architecture Patterns

### Recommended Project Structure
```
workers/predictions-worker/src/
  index.ts           # Add blog generation call after prediction pipeline
  blog-gen.ts        # NEW: Blog article generation module
  prediction-gen.ts  # Existing prediction AI generation
  ...

src/
  pages/
    en/blog/
      index.astro    # EXISTS: Replace empty state with blog index
      [slug].astro   # NEW: Individual blog post pages
    tl/blog/
      index.astro    # EXISTS: Replace empty state with blog index
      [slug].astro   # NEW: Individual blog post pages
  components/
    blog/
      BlogList.tsx   # NEW: React island for client-side pagination + sport filtering
      BlogCard.astro # NEW: SSG blog card component (optional for homepage)
  lib/
    posts.ts         # NEW: Supabase query helpers for blog posts

supabase/migrations/
  005_blog_enhancements.sql  # NEW: Add prediction_id FK, slug_en, slug_tl columns
```

### Pattern 1: Blog Generation in Same Cron
**What:** After predictions are generated, immediately generate corresponding blog articles using the same match context and prediction result
**When to use:** Daily 06:00 UTC cron run
**Example:**
```typescript
// In index.ts scheduled handler, after prediction generation:
if (controller.cron === '0 6 * * *') {
  await fetchAndGeneratePredictions(env);
  await fetchAndGenerateNbaPredictions(env);
  // Blog generation runs after predictions exist
  await generateBlogArticles(env);
}
```

### Pattern 2: Bilingual Blog Slugs
**What:** Each blog post has separate slugs for EN and TL URLs
**When to use:** For blog post URL routing
**Rationale:** Unlike predictions (which use the same slug for both languages), blog articles need translated slugs per CONTEXT.md (e.g., `/en/blog/lakers-vs-celtics-prediction-march-7` and `/tl/blog/lakers-vs-celtics-hula-marso-7`)
```
posts table additions:
  slug_en TEXT  -- e.g. "lakers-vs-celtics-prediction-march-7"
  slug_tl TEXT  -- e.g. "lakers-vs-celtics-hula-marso-7"
```
Note: The existing `slug` column can serve as a canonical ID (same as `slug_en`), with `slug_tl` as the Filipino alternative.

### Pattern 3: Blog Index with React Island
**What:** Client-side React component handles pagination and sport tab filtering
**When to use:** Blog index page
**Why:** Consistent with PredictionList pattern -- Supabase queries happen client-side for dynamic pagination without full page reloads

### Pattern 4: Result Appendix After Match Settlement
**What:** When a prediction is resolved (win/loss/push), update the corresponding blog post to append a result section
**When to use:** In the 30-minute resolution cron, after settling a prediction
**Key detail:** The result section should be visually distinct from the preview content (e.g., a colored callout box with WIN/LOSS badge)

### Pattern 5: Cross-Linking
**What:** Blog articles link to prediction detail pages and vice versa
**How:** `posts.prediction_id` FK references `predictions.id`; prediction detail pages query for linked blog post

### Anti-Patterns to Avoid
- **Separate Worker for blog:** User explicitly decided to extend the existing predictions-worker
- **AI-generated images:** User decided no images on article cards -- text-only cards
- **Generating filler content:** Skip days with no matches entirely
- **Single slug for both languages:** Blog needs translated URLs per CONTEXT.md

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Blog post storage | Custom file-based CMS | Existing Supabase `posts` table | Already defined in foundation migration |
| BlogPosting schema | Manual JSON-LD construction | `buildBlogPostingSchema()` in src/lib/seo.ts | Already built in Phase 2 |
| News sitemap | New sitemap endpoint | Existing `news-sitemap.xml.ts` | Already scaffolded with Phase 5 comments |
| AI text generation | External API integration | Workers AI binding (already configured) | `AI` binding already in wrangler.toml |
| Bilingual content | Translation API | Single AI prompt producing both languages | Proven pattern from prediction-gen.ts |
| Date formatting | Custom date utils | Intl.DateTimeFormat with Asia/Manila TZ | Established project pattern |
| Sport tab filtering | Custom filter logic | SportTabs pattern from predictions page | Consistent UX |

**Key insight:** Almost every infrastructure piece this phase needs already exists -- the `posts` table, the SEO schema builder, the news sitemap endpoint, the Worker AI binding, and the bilingual prompt pattern. This phase is primarily about connecting existing pieces.

## Common Pitfalls

### Pitfall 1: Workers AI Token Limits for Long-Form Content
**What goes wrong:** Requesting 800-1200 word articles (~1000-1500 tokens) from Llama 3.1 8B which defaults to 256 max_tokens
**Why it happens:** Default max_tokens is 256; articles need 1500+ output tokens per language
**How to avoid:** Set `max_tokens: 4000` in the AI call (model context is 7,968 tokens total). Keep the prompt under ~2000 tokens to leave room for output.
**Warning signs:** Truncated articles, incomplete Filipino translations

### Pitfall 2: Blog Slug Uniqueness Conflicts
**What goes wrong:** Two predictions from the same matchup on the same day create duplicate blog slugs
**Why it happens:** If a prediction is regenerated or if both football and basketball have similar team name patterns
**How to avoid:** Use upsert with `onConflict: 'slug'` (same pattern as predictions). Include sport prefix in slug.
**Warning signs:** Supabase unique constraint violations on insert

### Pitfall 3: News Sitemap Showing Old Articles
**What goes wrong:** Google News requires only articles from the last 2 days, but query returns all articles
**Why it happens:** Forgot to add date filter to the sitemap query
**How to avoid:** Filter `published_at >= NOW() - INTERVAL '2 days'` in the sitemap query
**Warning signs:** Google Search Console warnings about news sitemap

### Pitfall 4: Cross-Link Timing
**What goes wrong:** Blog article references prediction that hasn't been committed to DB yet
**Why it happens:** Blog generation runs in the same pipeline as prediction generation
**How to avoid:** Generate blog articles AFTER all predictions are committed. Query the prediction by slug/api_fixture_id to get its UUID for the FK.
**Warning signs:** Null prediction_id in posts table

### Pitfall 5: Filipino Slug Generation
**What goes wrong:** AI-generated Filipino slugs contain special characters or are inconsistent
**Why it happens:** Relying on AI to generate URL-safe Filipino slugs
**How to avoid:** Generate the Filipino slug programmatically (like English slug but with Filipino keywords: "hula" instead of "prediction", month names in Filipino). Don't rely on AI for URL construction.
**Warning signs:** 404s on Filipino blog URLs

### Pitfall 6: Astro Build Performance with Many Posts
**What goes wrong:** As blog posts accumulate, `getStaticPaths()` fetches thousands of posts at build time
**Why it happens:** SSG generates a page for every blog post at build
**How to avoid:** This is acceptable for now (sports prediction sites grow linearly ~3-5 posts/day = ~1800/year). If it becomes a problem later, switch to SSR or on-demand ISR.
**Warning signs:** Build times exceeding 5 minutes

## Code Examples

### Blog Article AI Prompt Structure
```typescript
// Recommended article sections for Claude's discretion:
const articleSections = `
Structure your article with these sections:
1. **Introduction** (2-3 sentences): Set the scene for the match
2. **Form Guide** (1-2 paragraphs): Recent results for both teams
3. **Head-to-Head** (1 paragraph): Historical matchup data
4. **Key Factors** (1-2 paragraphs): Injuries, home advantage, motivation
5. **The Pick** (1 paragraph): Your prediction with reasoning
6. **Betting Angle** (1-2 sentences): Odds value assessment
`;
```

### Blog Post Query Helper Pattern
```typescript
// src/lib/posts.ts - following predictions.ts pattern
export async function getBlogPosts(page = 1, perPage = 12, sport?: string) {
  if (!supabase) return { data: [], count: 0 };
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from('posts')
    .select('*', { count: 'exact' })
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .range(from, to);

  if (sport && sport !== 'all') {
    query = query.eq('sport', sport);
  }

  const { data, count } = await query;
  return { data: data || [], count: count || 0 };
}
```

### News Sitemap Population
```typescript
// Source: Google News Sitemap docs
// Update existing src/pages/news-sitemap.xml.ts
const posts = await supabase
  .from('posts')
  .select('slug, slug_en, slug_tl, title_en, published_at')
  .eq('is_published', true)
  .gte('published_at', twoDaysAgo.toISOString())
  .order('published_at', { ascending: false });

// Each post generates 2 entries (EN + TL):
// <url>
//   <loc>https://mytaya.com/en/blog/${post.slug_en}/</loc>
//   <news:news>
//     <news:publication>
//       <news:name>MyTaya</news:name>
//       <news:language>en</news:language>
//     </news:publication>
//     <news:publication_date>${post.published_at}</news:publication_date>
//     <news:title>${post.title_en}</news:title>
//   </news:news>
// </url>
```

### Result Appendix Update Pattern
```typescript
// In resolver.ts, after settling a prediction:
// Query for linked blog post and append result section
const { data: post } = await supabase
  .from('posts')
  .select('id, content_en, content_tl')
  .eq('prediction_id', prediction.id)
  .single();

if (post) {
  const resultSection_en = `\n\n## Result\n\n**Final Score:** ${homeScore} - ${awayScore}\n**Outcome:** ${result.toUpperCase()}\n\n`;
  const resultSection_tl = `\n\n## Resulta\n\n**Pinal na Iskor:** ${homeScore} - ${awayScore}\n**Kinalabasan:** ${result === 'win' ? 'PANALO' : result === 'loss' ? 'TALO' : 'PUSH'}\n\n`;

  await supabase
    .from('posts')
    .update({
      content_en: post.content_en + resultSection_en,
      content_tl: post.content_tl + resultSection_tl,
    })
    .eq('id', post.id);
}
```

### Estimated Read Time Calculation
```typescript
// Simple word count based estimation
function estimateReadTime(content: string): number {
  const wordCount = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200)); // 200 WPM average
}
```

## Database Schema Changes

The existing `posts` table needs enhancements:

```sql
-- Migration 005: Blog enhancements for Phase 5
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS prediction_id UUID REFERENCES public.predictions(id);
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS slug_en TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS slug_tl TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS read_time_minutes INTEGER DEFAULT 5;

-- Create unique indexes for bilingual slug routing
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_slug_en ON public.posts (slug_en);
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_slug_tl ON public.posts (slug_tl);

-- Index for prediction cross-linking
CREATE INDEX IF NOT EXISTS idx_posts_prediction_id ON public.posts (prediction_id);

-- Index for sport filtering on blog index
CREATE INDEX IF NOT EXISTS idx_posts_sport ON public.posts (sport);
```

## Design Decisions (Claude's Discretion)

### Article Structure
Recommended 6-section format:
1. **Introduction** -- Match context, stakes, narrative hook
2. **Form Guide** -- Last 5 results for each team
3. **Head-to-Head History** -- Previous meetings
4. **Key Factors** -- Injuries, motivation, venue
5. **Our Pick** -- The prediction with reasoning
6. **Betting Value** -- Odds assessment

### Featured Article Selection
Use the most recent article as featured. Simple, predictable, no popularity tracking needed. The hero slot always shows today's latest published article.

### Empty State
Reuse existing `EmptyState.astro` component with the current `'empty.blog'` i18n key ("No articles yet." / "Wala pang mga artikulo."). This is already in place.

### Result Appendix Visual Treatment
Render as a distinct callout box:
- WIN: Green background with check icon
- LOSS: Red background with X icon
- PUSH: Yellow/amber background with minus icon
- Content is appended as markdown in the stored content, rendered client-side with conditional styling based on result keyword detection

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| GPT-4 via OpenAI API | Workers AI (Llama 3.1 8B) on-edge | Project decision | Free-tier eligible, no external API dependency, lower latency |
| Separate blog CMS | Supabase + AI generation | Project decision | Zero manual content creation |
| Single-language blog | Bilingual in single AI call | Established in prediction-gen.ts | One AI call produces both EN and TL content |

## Open Questions

1. **Content quality at 800-1200 words with Llama 3.1 8B**
   - What we know: Model works well for 2-3 paragraph analysis (prediction-gen.ts). 8K context window.
   - What's unclear: Quality of longer-form (1000+ token) bilingual output. Filipino translation quality at longer lengths.
   - Recommendation: Set max_tokens to 4000, test with a few articles. If quality degrades, consider Llama 4 Scout (131K context, similar pricing) as a drop-in replacement.

2. **Blog slug format for Filipino**
   - What we know: English slugs are straightforward (lakers-vs-celtics-prediction-march-7)
   - What's unclear: Whether Filipino month names in URLs add SEO value or just complexity
   - Recommendation: Use a simple pattern: same team-vs-team base with `-hula-` instead of `-prediction-` and keep month in English for URL simplicity (avoid encoding issues with Filipino characters)

## Sources

### Primary (HIGH confidence)
- Project codebase: `workers/predictions-worker/src/` -- existing AI generation pattern, Worker structure
- Project codebase: `supabase/migrations/00000000000000_foundation.sql` -- existing `posts` table schema
- Project codebase: `src/lib/seo.ts` -- existing `buildBlogPostingSchema()` function
- Project codebase: `src/pages/news-sitemap.xml.ts` -- existing placeholder endpoint
- [Google News Sitemap Documentation](https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap) -- required XML format
- [Cloudflare Workers AI Llama 3.1 8B docs](https://developers.cloudflare.com/workers-ai/models/llama-3.1-8b-instruct/) -- model limits and pricing

### Secondary (MEDIUM confidence)
- [Cloudflare Workers AI model catalog](https://developers.cloudflare.com/workers-ai/models/) -- alternative models (Llama 4 Scout)
- [Cloudflare blog on Llama 4 availability](https://blog.cloudflare.com/meta-llama-4-is-now-available-on-workers-ai/) -- Llama 4 Scout specs

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already in use in the project
- Architecture: HIGH - extending proven patterns from prediction pipeline
- Pitfalls: HIGH - based on direct codebase analysis and official API docs

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable -- all technologies are established in this project)
