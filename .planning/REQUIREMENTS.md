# Requirements: MyTaya

**Defined:** 2026-03-07
**Core Value:** Every Filipino sports bettor visiting mytaya.com finds accurate, timely predictions for basketball, boxing, and football in their preferred language (Filipino or English)

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

- [x] **FOUND-01**: Site renders in Filipino (Tagalog) and English with auto-detection based on browser language
- [x] **FOUND-02**: User can manually toggle between Filipino and English from any page
- [x] **FOUND-03**: Each language has its own URL structure with proper hreflang tags for SEO
- [x] **FOUND-04**: Supabase schema stores predictions with paired bilingual columns (title_tl/title_en, etc.)
- [x] **FOUND-05**: Predictions table captures odds at prediction time for ROI calculation
- [x] **FOUND-06**: User can toggle dark/light theme with persistence across sessions
- [x] **FOUND-07**: Site is installable as PWA with offline support and push notification capability
- [x] **FOUND-08**: Fresh Philippine-inspired visual identity (NOT betpro clone) with responsive design

### Football Predictions

- [x] **FTBL-01**: Daily football predictions are fetched automatically from API-Football
- [x] **FTBL-02**: Each prediction displays match details: teams, league, time, odds, prediction type
- [x] **FTBL-03**: Predictions are resolved automatically when match results come in
- [x] **FTBL-04**: User can view today's pending predictions and past resolved predictions
- [x] **FTBL-05**: Individual prediction pages with detailed analysis in both languages

### Basketball Predictions

- [x] **BASK-01**: Daily NBA predictions are fetched via API-Basketball or API-Football
- [x] **BASK-02**: NBA predictions display teams, conference, odds, spread, and prediction type
- [x] **BASK-03**: NBA predictions are resolved automatically when game results come in
- [ ] **BASK-04**: PBA predictions can be created manually with full match details and analysis
- [ ] **BASK-05**: NCAA Philippines / UAAP predictions can be created manually
- [ ] **BASK-06**: User can filter predictions by league (NBA, PBA, NCAA PH)

### Boxing Predictions

- [ ] **BOX-01**: Boxing predictions can be created manually as editorial content
- [ ] **BOX-02**: Each boxing prediction includes fighter profiles, records, odds, and analysis
- [ ] **BOX-03**: Boxing predictions are displayed in a dedicated section with fight card format
- [ ] **BOX-04**: Boxing content is available in both Filipino and English

### Blog & News

- [x] **BLOG-01**: AI-generated daily sports articles published via Cloudflare Worker
- [x] **BLOG-02**: Blog posts are generated in both Filipino and English
- [x] **BLOG-03**: Blog has paginated index with featured/recent articles
- [x] **BLOG-04**: Individual blog post pages with proper SEO metadata
- [x] **BLOG-05**: News sitemap generated for Google News eligibility

### Statistics & Tracking

- [x] **STAT-01**: Dashboard shows overall win rate across all sports
- [x] **STAT-02**: Dashboard shows ROI based on tracked odds
- [x] **STAT-03**: Dashboard shows current streak (wins/losses)
- [x] **STAT-04**: Statistics can be filtered by sport (football, basketball, boxing)
- [x] **STAT-05**: Profit chart visualizes performance over time

### Prediction Cards & Telegram

- [x] **CARD-01**: PNG prediction cards are generated for each prediction via Cloudflare Worker
- [x] **CARD-02**: Cards include match details, odds, prediction, and MyTaya branding
- [ ] **CARD-03**: Cards are shareable on social media and Telegram
- [ ] **TELE-01**: Telegram bot publishes predictions to group channel automatically
- [ ] **TELE-02**: Predictions are drip-fed throughout the day (not all at once)
- [ ] **TELE-03**: Results/resolutions are posted to Telegram when matches conclude

### SEO & Compliance

- [x] **SEO-01**: Schema.org SportsEvent structured data on prediction pages
- [x] **SEO-02**: Schema.org BlogPosting structured data on blog posts
- [x] **SEO-03**: Proper meta tags (title, description, OG, Twitter cards) on all pages
- [x] **SEO-04**: Sitemap with i18n support and hreflang annotations
- [x] **SEO-05**: Responsible gambling page with PAGCOR compliance awareness
- [x] **SEO-06**: Age verification notice and gambling disclaimers on relevant pages

### Affiliate & Monetization

- [x] **AFFL-01**: Affiliate operator cards featuring PAGCOR-licensed PH operators
- [x] **AFFL-02**: Operator cards display name, logo, welcome bonus, and affiliate link
- [x] **AFFL-03**: Operators page with comparison and detailed reviews
- [x] **AFFL-04**: Lead capture form with email validation (Zod) for newsletter/tips signup

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Analytics

- **ADV-01**: User can view individual tipster performance if multiple editors contribute
- **ADV-02**: Prediction confidence scoring with historical calibration
- **ADV-03**: Bankroll management calculator

### Social & Community

- **SOC-01**: User comments on predictions
- **SOC-02**: Prediction sharing with referral tracking
- **SOC-03**: Community leaderboard for prediction contests

### X/Twitter Integration

- **XTWT-01**: Cross-posting predictions to X/Twitter
- **XTWT-02**: Result announcements on X/Twitter

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile app | Web-first, PWA handles mobile |
| User accounts/login | Public read-only site |
| Live streaming/scores | Prediction-focused, not a scores platform |
| Real-time chat | Not a social platform |
| Payment processing | Affiliate model only |
| Boxing API integration | No reliable boxing APIs exist; editorial approach |
| Admin dashboard | Workers + Supabase direct management sufficient for v1 |
| Multi-currency odds display | Philippine market only for v1 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1: Foundation | Complete |
| FOUND-02 | Phase 1: Foundation | Complete |
| FOUND-03 | Phase 1: Foundation | Complete |
| FOUND-04 | Phase 1: Foundation | Complete |
| FOUND-05 | Phase 1: Foundation | Complete |
| FOUND-06 | Phase 1: Foundation | Complete |
| FOUND-07 | Phase 1: Foundation | Complete |
| FOUND-08 | Phase 1: Foundation | Complete |
| FTBL-01 | Phase 3: Football Predictions | Complete |
| FTBL-02 | Phase 3: Football Predictions | Complete |
| FTBL-03 | Phase 3: Football Predictions | Complete |
| FTBL-04 | Phase 3: Football Predictions | Complete |
| FTBL-05 | Phase 3: Football Predictions | Complete |
| BASK-01 | Phase 4: NBA Predictions & Statistics | Complete |
| BASK-02 | Phase 4: NBA Predictions & Statistics | Complete |
| BASK-03 | Phase 4: NBA Predictions & Statistics | Complete |
| BASK-04 | Phase 7: PBA, Boxing & Manual Content | Pending |
| BASK-05 | Phase 7: PBA, Boxing & Manual Content | Pending |
| BASK-06 | Phase 7: PBA, Boxing & Manual Content | Pending |
| BOX-01 | Phase 7: PBA, Boxing & Manual Content | Pending |
| BOX-02 | Phase 7: PBA, Boxing & Manual Content | Pending |
| BOX-03 | Phase 7: PBA, Boxing & Manual Content | Pending |
| BOX-04 | Phase 7: PBA, Boxing & Manual Content | Pending |
| BLOG-01 | Phase 5: Blog Automation | Complete |
| BLOG-02 | Phase 5: Blog Automation | Complete |
| BLOG-03 | Phase 5: Blog Automation | Complete |
| BLOG-04 | Phase 5: Blog Automation | Complete |
| BLOG-05 | Phase 5: Blog Automation | Complete |
| STAT-01 | Phase 4: NBA Predictions & Statistics | Complete |
| STAT-02 | Phase 4: NBA Predictions & Statistics | Complete |
| STAT-03 | Phase 4: NBA Predictions & Statistics | Complete |
| STAT-04 | Phase 4: NBA Predictions & Statistics | Complete |
| STAT-05 | Phase 4: NBA Predictions & Statistics | Complete |
| CARD-01 | Phase 6: Prediction Cards & Telegram | Complete |
| CARD-02 | Phase 6: Prediction Cards & Telegram | Complete |
| CARD-03 | Phase 6: Prediction Cards & Telegram | Pending |
| TELE-01 | Phase 6: Prediction Cards & Telegram | Pending |
| TELE-02 | Phase 6: Prediction Cards & Telegram | Pending |
| TELE-03 | Phase 6: Prediction Cards & Telegram | Pending |
| SEO-01 | Phase 2: SEO, Compliance & Affiliates | Complete |
| SEO-02 | Phase 2: SEO, Compliance & Affiliates | Complete |
| SEO-03 | Phase 2: SEO, Compliance & Affiliates | Complete |
| SEO-04 | Phase 2: SEO, Compliance & Affiliates | Complete |
| SEO-05 | Phase 2: SEO, Compliance & Affiliates | Complete |
| SEO-06 | Phase 2: SEO, Compliance & Affiliates | Complete |
| AFFL-01 | Phase 2: SEO, Compliance & Affiliates | Complete |
| AFFL-02 | Phase 2: SEO, Compliance & Affiliates | Complete |
| AFFL-03 | Phase 2: SEO, Compliance & Affiliates | Complete |
| AFFL-04 | Phase 2: SEO, Compliance & Affiliates | Complete |

**Coverage:**
- v1 requirements: 49 total
- Mapped to phases: 49
- Unmapped: 0

---
*Requirements defined: 2026-03-07*
*Last updated: 2026-03-07 after roadmap creation*
