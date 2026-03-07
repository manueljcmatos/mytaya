# Phase 5: Blog Automation - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

AI-generated daily sports blog articles in both Filipino and English, published automatically via Cloudflare Worker. Blog index page with pagination, SEO metadata with Schema.org BlogPosting markup, and news sitemap integration. No manual content creation, no comments, no social sharing — those are later phases or backlog items.

</domain>

<decisions>
## Implementation Decisions

### Article Topics & Content Style
- Prediction previews only — one article per featured match, directly tied to prediction data
- Long-form articles (800-1200 words) with deep analysis: form breakdown, head-to-head, key factors, detailed reasoning
- Expert analyst tone — authoritative, data-driven, confident but not hype-y (like a professional tipster)
- Single match per article for unique URLs and long-tail SEO targeting

### Blog Layout & Browsing
- Featured + grid index layout: hero featured article at top, grid of recent articles below
- Sport tabs for filtering (All | Football | Basketball) — consistent with predictions page pattern
- Article cards show: title, 1-2 line excerpt, sport badge, date, estimated read time (no images)
- 12 articles per page with pagination

### Publishing Cadence & Freshness
- 3-5 articles per day, one per prediction pick (1:1 mapping with daily predictions)
- Generated in the same cron run as predictions — single Worker handles both
- Articles updated after match result: append a "Result" section with final score and WIN/LOSS outcome
- No articles on off-season or no-match days — skip rather than generate filler content

### SEO & News Sitemap Strategy
- Match-based slugs: e.g. /en/blog/lakers-vs-celtics-prediction-march-7
- Translated URL paths for bilingual: /tl/blog/[filipino-slug] and /en/blog/[english-slug] (consistent with site i18n)
- Bidirectional cross-linking between blog articles and prediction detail pages
- Blog articles added to existing /news-sitemap.xml (not a separate sitemap)

### Claude's Discretion
- Exact article structure/sections (intro, analysis, pick, etc.)
- How the featured article is selected (latest, most popular league, etc.)
- Schema.org BlogPosting markup details
- Empty state design when no articles exist
- How result appendix is visually differentiated from preview content

</decisions>

<specifics>
## Specific Ideas

- The existing predictions-worker already runs on cron — blog generation should extend it, not create a separate Worker
- Phase 2's news-sitemap.xml endpoint and buildBlogPostingSchema() are ready to consume blog data
- The Supabase database will need a blog_posts table (or similar) to store generated articles
- Cross-linking means the predictions table may need a blog_post_id reference (or vice versa)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-blog-automation*
*Context gathered: 2026-03-07*
