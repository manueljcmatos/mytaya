# YouTube Pipeline Design - MyTaya

## Overview
Automated YouTube Shorts pipeline for MyTaya, replicating betpro.cl's architecture adapted for Filipino audience.

## Architecture
```
Cloudflare Worker (cron) → AI Script (Llama 3.1, Filipino)
  → GitHub Actions (repository_dispatch)
    → Google TTS (fil-PH) → Remotion Render (1080x1920)
    → Upload: R2 + YouTube Shorts + Telegram
    → Update Supabase (youtube_url)
```

## Video Compositions

| ID | Name | Content | Duration |
|----|------|---------|----------|
| HulaNgAraw | Pick of the Day | Best prediction analysis | 45s |
| BalitaSports | Sports News | Daily sports news | 45s |
| AlaminMo | Fun Fact | Basketball/football trivia | 45s |
| QuizSports | Sports Quiz | Multiple choice question | 45s |

All: 1080x1920, 30fps, 1350 frames

## Branding
- Colors: `#0F766E` (primary), `#14B8A6` (accent), `#0A0A0A` (bg)
- Fonts: Bebas Neue (display), Inter (body)
- Logo: white logo MyTaya.png on dark background

## TTS
- Google Cloud TTS: `fil-PH-Wavenet-A` (female)
- Speaking rate: 1.0x, pitch: 0

## Cron Schedule (UTC → PHT+8)
- Mon/Wed/Fri: 05:00 AlaminMo + 13:00 HulaNgAraw
- Tue/Thu: 05:00 AlaminMo + 07:00 BalitaSports
- Sat/Sun: 05:00 HulaNgAraw + 13:00 HulaNgAraw

## Components to Build
1. `workers/mytaya-video-cron.js` — Cron worker + AI script generation
2. `video/` — Remotion project with 4 compositions
3. `.github/workflows/render-video.yml` — Build + upload pipeline
4. Supabase migration — `youtube_url` column on predictions
5. `src/pages/{tl,en}/videos.astro` — Videos gallery page

## YouTube Channel
- URL: https://www.youtube.com/channel/UC528pjVS-RMykQ2VIP4Qs_g
- Upload as Shorts (vertical format)
- Category: 17 (Sports)
