# Phase 6: Prediction Cards & Telegram - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Branded PNG prediction cards generated via Cloudflare Worker (Satori) and automatic Telegram channel publishing with drip scheduling. Cards serve as OG images, downloadable assets, and Telegram attachments. Result cards generated after match settlement. No community features, no betting slip tracking, no other social platforms — those are separate phases or backlog items.

</domain>

<decisions>
## Implementation Decisions

### Card Visual Design & Content
- Full details on each card: team names, league, match date/time, odds, prediction type & pick, confidence level, MyTaya logo/branding
- Sport-themed accent colors: green for football, orange for basketball (matches existing site color coding)
- 1200x630 landscape dimensions — standard OG image size, doubles as shareable card
- Separate result cards generated after settlement showing final score + WIN/LOSS badge (two cards per prediction lifecycle)

### Telegram Publishing Flow
- Broadcast channel (not group) — subscribers read, only admins post
- Bilingual messages (English + Filipino) in each post
- Drip scheduling: post each prediction 2-3 hours before match kickoff/tipoff
- Message format: PNG card as photo + short 2-3 line bilingual caption with match name, pick, odds, and link to full analysis on mytaya.com

### Result Updates on Telegram
- Post result card + caption on resolution (when 30-min cron settles the match)
- End-of-day recap message: today's record (e.g. 3W-1L), running streak, ROI
- Store Telegram message IDs per prediction for future threading/reference

### Shareability & OG Integration
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

</decisions>

<specifics>
## Specific Ideas

- The existing predictions-worker already has cron triggers — card generation and Telegram publishing extend it
- Satori (by Vercel) renders HTML/CSS to SVG, then converted to PNG — runs on Cloudflare Workers
- R2 is Cloudflare's S3-compatible object storage — zero egress fees, same network as Workers
- The 30-min resolution cron already settles predictions — result cards and Telegram result posts hook into this flow
- Telegram message ID tracking requires a new column on the predictions table (telegram_message_id)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-prediction-cards-telegram*
*Context gathered: 2026-03-07*
