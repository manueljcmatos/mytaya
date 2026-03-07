# MyTaya

## What This Is

MyTaya (mytaya.com) is a Philippine sports betting predictions platform focused on Basketball and Boxing — the two most popular sports in the Philippines. The site publishes daily predictions (taya), blog/news content, and prognostics across a bilingual experience (Filipino/Tagalog + English). Built with Astro 5 + React, backed by Supabase, with Cloudflare Workers handling automated prediction generation and multi-channel publishing. "Taya" means "bet" in Filipino — the brand is local, casual, and culturally rooted.

## Core Value

Every Filipino sports bettor visiting mytaya.com must find accurate, timely predictions for the sports they care about most — basketball (NBA, PBA, FIBA, NCAA PH) and boxing — in their preferred language (Filipino or English), with the same quality and consistency across web and Telegram.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Static site at mytaya.com with Astro 5 + React islands
- [ ] Bilingual support (Filipino/Tagalog + English) with auto-detect and manual toggle
- [ ] Basketball predictions: NBA, PBA, FIBA/World, NCAA Philippines
- [ ] Boxing predictions: manual/editorial content (no API — blog posts + manual picks)
- [ ] Football predictions via API-Football (existing API, start here while building basketball)
- [ ] Blog/news section with AI-generated daily posts in both languages
- [ ] SEO-optimized with Schema.org structured data, hreflang tags, meta tags
- [ ] Statistics/results tracker (win rate, ROI, streak)
- [ ] Lead capture form with validation
- [ ] Dark/light theme toggle
- [ ] PWA support
- [ ] Affiliate operator cards (research popular PH-licensed operators)
- [ ] Telegram group integration for automated tips (future — prepare hooks)
- [ ] Prediction cards (PNG) for sharing on Telegram and social media
- [ ] Responsive design with fresh Philippine-inspired visual identity
- [ ] News sitemap for Google News eligibility
- [ ] Responsible gambling page (PAGCOR compliance awareness)

### Out of Scope

- Mobile app — web-first, PWA handles mobile
- User accounts/login — public read-only site
- Real-time chat or community features — not a social platform
- Boxing API integration — manual/editorial for v1, boxing APIs are unreliable
- Live streaming or live scores — prediction-focused, not a scores platform
- X/Twitter integration — focus on Telegram for PH market (Telegram is dominant)
- Payment processing — affiliate model only

## Context

- **Reference project:** betpro.cl — Chilean football betting predictions site. Same tech stack and architecture. MyTaya is the Philippine version adapted for local sports (basketball, boxing) and language (Filipino + English).
- **Sports landscape:** Basketball is by far the #1 sport in the Philippines (PBA is the local league, NBA is hugely followed). Boxing has deep cultural significance (Pacquiao legacy). Football is growing but secondary.
- **API situation:** API-Football covers football + some basketball (NBA). PBA/NCAA PH may need manual data entry or alternative APIs. Boxing is entirely editorial/manual.
- **Language:** Filipino (Tagalog-based) is the national language. English is widely spoken and used in media. Bilingual approach captures the full market.
- **Social:** Telegram is the dominant messaging platform for betting communities in the Philippines, more so than X/Twitter.
- **Regulation:** PAGCOR (Philippine Amusement and Gaming Corporation) regulates gambling. Site should include responsible gambling awareness.
- **Design:** New visual identity — NOT a copy of betpro's dark/gold theme. Should reflect Philippine culture and sports energy. Fresh colors, typography, and layout.

## Constraints

- **Tech stack**: Astro 5 + React + Tailwind CSS v4 — same as betpro for code reuse and familiarity
- **Hosting**: Cloudflare Pages + Workers — stay on Cloudflare ecosystem
- **Database**: Supabase PostgreSQL — single source of truth for all predictions
- **APIs**: API-Football for match data (football + NBA), Telegram Bot API for notifications
- **Workers**: Pure JS — standalone .js files deployed via Wrangler
- **Domain**: mytaya.com — Philippine audience, bilingual Filipino/English
- **i18n**: Static generation per locale (Astro i18n routing) — no client-side-only translation

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Filipino + English bilingual with auto-detect | Captures full PH market; auto-detect reduces friction | — Pending |
| Basketball + Boxing primary, Football secondary | Matches PH sports consumption patterns | — Pending |
| Boxing as editorial/manual content | No reliable boxing APIs; editorial gives brand voice | — Pending |
| New visual identity (not betpro clone) | Different market, different culture, different brand | — Pending |
| Telegram over X/Twitter | Telegram dominates PH betting community | — Pending |
| Same tech stack as betpro | Code reuse, proven architecture, faster development | — Pending |
| Research PH operators for affiliates | Don't assume — find what's actually popular/licensed in PH | — Pending |
| Astro i18n routing for bilingual | Static generation per locale for SEO; not client-only JS toggle | — Pending |

---
*Last updated: 2026-03-07 after initialization*
