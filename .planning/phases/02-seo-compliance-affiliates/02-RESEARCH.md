# Phase 2: SEO, Compliance & Affiliates - Research

**Researched:** 2026-03-07
**Domain:** SEO structured data, PAGCOR gambling compliance, affiliate monetization, XML sitemaps
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Research and feature top PAGCOR-licensed Philippine operators with affiliate programs
- Each operator gets a dedicated review page (good for SEO and trust)
- Operators page must be bilingual (Filipino + English)

### Claude's Discretion
- Responsible gambling page tone, content depth, and disclaimer placement
- Age verification approach (notice vs gate popup)
- Disclaimer locations across the site (footer, prediction pages, operator cards)
- Lead capture offer (Telegram invite, newsletter, or both)
- Lead capture form fields (email only vs email + name)
- Lead capture form placement (footer, homepage, popup, or combination)
- Schema.org markup comprehensiveness (SportsEvent, BlogPosting, Organization, BreadcrumbList)
- Google News eligibility strategy (news sitemap format vs standard)
- Operator card layout (comparison table vs rich cards)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SEO-01 | Schema.org SportsEvent structured data on prediction pages | SportsEvent JSON-LD pattern with homeTeam/awayTeam/startDate/sport properties; Layout already supports `schema` prop |
| SEO-02 | Schema.org BlogPosting structured data on blog posts | BlogPosting JSON-LD with headline/datePublished/author/inLanguage; same Layout `schema` prop |
| SEO-03 | Proper meta tags (title, description, OG, Twitter cards) on all pages | Layout.astro already implements OG + Twitter Card meta; enhance with per-page customization |
| SEO-04 | Sitemap with i18n support and hreflang annotations | @astrojs/sitemap already installed and configured with i18n; add news sitemap endpoint |
| SEO-05 | Responsible gambling page with PAGCOR compliance awareness | PAGCOR requires 21+ age notice, "Gambling can be Addictive" messaging, problem gambling resources |
| SEO-06 | Age verification notice and gambling disclaimers on relevant pages | Footer already has 18+ badge and disclaimer; update to 21+ per PAGCOR, add to prediction/operator pages |
| AFFL-01 | Affiliate operator cards featuring PAGCOR-licensed PH operators | Rich card components with operator data from static JSON/TS data file |
| AFFL-02 | Operator cards display name, logo, welcome bonus, and affiliate link | OperatorCard component with structured props; rel="sponsored nofollow" on affiliate links |
| AFFL-03 | Operators page with comparison and detailed reviews | Operators index page (shell exists) + individual /operators/[slug] review pages |
| AFFL-04 | Lead capture form with email validation (Zod) for newsletter/tips signup | Zod schema + React form component with Supabase insert; Telegram funnel CTA |
</phase_requirements>

## Summary

This phase adds trust infrastructure, SEO enhancements, and monetization to the existing MyTaya Astro site. The codebase is well-prepared: Layout.astro already accepts a `schema` prop for JSON-LD injection, has OG/Twitter Card meta tags, and @astrojs/sitemap is installed with i18n configuration. The Footer already has a gambling disclaimer and 18+ badge (needs updating to 21+ per PAGCOR). Shell pages exist for operators in both languages (`/tl/mga-operator/` and `/en/operators/`).

The primary technical work involves: (1) creating Schema.org JSON-LD generators for SportsEvent and BlogPosting types, (2) building a responsible gambling page with PAGCOR-compliant messaging in both languages, (3) building operator card components and individual review pages with affiliate links, (4) adding a lead capture form with Zod validation, and (5) creating a news sitemap endpoint for Google News eligibility. The existing i18n system (ui.ts translations + getLangFromUrl utility) handles all bilingual content needs.

**Primary recommendation:** Use static TypeScript data files for operator information (not a database table) since operator data changes infrequently, and leverage the existing Layout.astro `schema` prop to inject all structured data without modifying the layout itself.

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | ^5.18.0 | Static site framework | Already the project framework |
| @astrojs/sitemap | ^3.7.0 | XML sitemap generation with i18n | Already installed and configured |
| @astrojs/react | ^4.4.2 | React islands for interactive components | Already installed; needed for lead capture form |
| @supabase/supabase-js | ^2.98.0 | Database for lead capture storage | Already installed |
| tailwindcss | ^4.2.1 | Styling | Already installed |

### New Dependencies
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | ^3.24 | Email/form validation schemas | Lead capture form validation (AFFL-04 requirement) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zod | Built-in HTML5 validation | Zod is specified in requirements (AFFL-04); provides TypeScript type inference |
| Static operator data | Supabase table | Static TS files are simpler, no API calls, operators change rarely |
| Custom news sitemap endpoint | @astrojs/sitemap news namespace | Custom endpoint gives full control over Google News XML format |

**Installation:**
```bash
npm install zod
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── operators/
│   │   ├── OperatorCard.astro        # Individual operator card
│   │   └── OperatorGrid.astro        # Grid layout for cards
│   ├── seo/
│   │   ├── SportsEventSchema.astro   # SportsEvent JSON-LD generator
│   │   ├── BlogPostingSchema.astro   # BlogPosting JSON-LD generator
│   │   └── OrganizationSchema.astro  # Site-wide Organization schema
│   ├── compliance/
│   │   ├── GamblingDisclaimer.astro   # Reusable disclaimer banner
│   │   └── AgeNotice.astro           # 21+ age verification notice
│   └── LeadCaptureForm.tsx           # React island for form interactivity
├── data/
│   └── operators.ts                  # Static operator data (PAGCOR-licensed)
├── pages/
│   ├── tl/
│   │   ├── mga-operator/
│   │   │   ├── index.astro           # Operators listing (exists, needs content)
│   │   │   └── [slug].astro          # Individual operator review
│   │   └── responsableng-pagsusugal.astro  # Responsible gambling page (TL)
│   ├── en/
│   │   ├── operators/
│   │   │   ├── index.astro           # Operators listing (exists, needs content)
│   │   │   └── [slug].astro          # Individual operator review
│   │   └── responsible-gambling.astro      # Responsible gambling page (EN)
│   └── news-sitemap.xml.ts           # Google News sitemap endpoint
├── i18n/
│   └── ui.ts                         # Add new translation keys
└── lib/
    ├── constants.ts                  # Add PAGCOR constants
    └── schemas.ts                    # Zod validation schemas
```

### Pattern 1: JSON-LD via Layout schema Prop
**What:** Pass structured data as a plain object to Layout's existing `schema` prop
**When to use:** Every page that needs structured data (predictions, blog posts, operator reviews)
**Example:**
```astro
---
// Source: Existing Layout.astro interface
const schema = {
  "@context": "https://schema.org",
  "@type": "SportsEvent",
  "name": "Lakers vs Celtics",
  "startDate": "2026-03-08T19:00:00-05:00",
  "homeTeam": { "@type": "SportsTeam", "name": "Los Angeles Lakers" },
  "awayTeam": { "@type": "SportsTeam", "name": "Boston Celtics" },
  "sport": "Basketball",
  "location": { "@type": "Place", "name": "Crypto.com Arena" },
  "description": "NBA prediction with expert analysis",
  "url": canonicalUrl
};
---
<Layout title="Lakers vs Celtics Prediction" schema={schema}>
  <!-- page content -->
</Layout>
```

### Pattern 2: Static Data File for Operators
**What:** TypeScript file exporting operator objects with all display and affiliate data
**When to use:** Operator cards, review pages, comparison features
**Example:**
```typescript
// src/data/operators.ts
export interface Operator {
  slug: string;
  name: string;
  logo: string;           // Path to logo in public/
  welcomeBonus: { tl: string; en: string };
  description: { tl: string; en: string };
  review: { tl: string; en: string };    // Full review content
  affiliateUrl: string;
  pagcorLicensed: boolean;
  rating: number;         // 1-5
  features: string[];
  sportsCovered: string[];
}

export const operators: Operator[] = [
  {
    slug: 'bk8',
    name: 'BK8',
    logo: '/operators/bk8.png',
    welcomeBonus: {
      tl: 'Hanggang P2,044,000 Welcome Bonus',
      en: 'Up to P2,044,000 Welcome Bonus'
    },
    // ...
  }
];
```

### Pattern 3: News Sitemap as Astro Endpoint
**What:** Custom `.xml.ts` endpoint that generates Google News-compliant XML
**When to use:** News sitemap for Google News eligibility
**Example:**
```typescript
// src/pages/news-sitemap.xml.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  // Fetch recent blog posts (last 2 days per Google News spec)
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  <url>
    <loc>https://mytaya.com/tl/blog/article-slug/</loc>
    <news:news>
      <news:publication>
        <news:name>MyTaya</news:name>
        <news:language>fil</news:language>
      </news:publication>
      <news:publication_date>2026-03-07</news:publication_date>
      <news:title>Article Title</news:title>
    </news:news>
  </url>
</urlset>`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' }
  });
};
```

### Pattern 4: React Island for Lead Capture
**What:** Interactive form using React (client:visible) with Zod validation
**When to use:** Lead capture form in footer or dedicated section
**Example:**
```tsx
// src/components/LeadCaptureForm.tsx
import { useState } from 'react';
import { z } from 'zod';

const leadSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
});

export default function LeadCaptureForm({ lang }: { lang: 'tl' | 'en' }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = leadSchema.safeParse({ email });
    if (!result.success) return;

    setStatus('loading');
    // Insert to Supabase leads table
    const res = await fetch('/api/leads', { method: 'POST', body: JSON.stringify({ email }) });
    setStatus(res.ok ? 'success' : 'error');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button type="submit">{lang === 'tl' ? 'Mag-subscribe' : 'Subscribe'}</button>
    </form>
  );
}
```

### Anti-Patterns to Avoid
- **Hardcoding operator data in components:** Keep operator data in a single `operators.ts` file; components should receive data as props
- **Using the same disclaimer text everywhere:** Create a reusable GamblingDisclaimer component with configurable verbosity (short for cards, full for dedicated page)
- **Skipping rel="sponsored" on affiliate links:** Google requires `rel="sponsored"` on paid/affiliate links; omitting risks manual penalty
- **Forgetting hreflang on new pages:** Every new page (responsible gambling, operator reviews) must have both `/tl/` and `/en/` versions with proper hreflang linking

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| XML sitemap generation | Custom XML builder | @astrojs/sitemap (already installed) | Handles sitemap-index, entry limits, i18n hreflang automatically |
| Email validation | Custom regex | Zod `z.string().email()` | Handles edge cases (IDN domains, plus addressing) correctly |
| JSON-LD serialization | Manual string concatenation | `JSON.stringify()` + Layout schema prop | Layout already has `<script type="application/ld+json">` injection |
| OG/Twitter meta tags | Per-page meta blocks | Layout.astro props (title, description, ogImage, ogType) | Layout already handles all meta tag generation |
| Hreflang tags | Manual link elements | Layout.astro + @astrojs/sitemap i18n | Both already generate hreflang; Layout handles `<link rel="alternate">` |

**Key insight:** The Phase 1 Layout.astro was built with SEO in mind -- it already has schema prop, OG tags, Twitter cards, hreflang links, and canonical URLs. Phase 2 is about filling in the content and data, not rebuilding infrastructure.

## Common Pitfalls

### Pitfall 1: PAGCOR Age Requirement is 21, Not 18
**What goes wrong:** Many gambling sites default to 18+ age notices, but PAGCOR requires 21+
**Why it happens:** International gambling standard is 18+; Philippines is different
**How to avoid:** Update the existing Footer 18+ badge to 21+. Use PAGCOR's exact language: "Gambling for 21 years old and above only"
**Warning signs:** Any mention of "18+" in gambling context on a PH-targeted site

### Pitfall 2: Affiliate Links Without rel="sponsored"
**What goes wrong:** Google treats undisclosed affiliate links as link scheme violations
**Why it happens:** Developers forget or don't know about rel="sponsored"
**How to avoid:** All affiliate `<a>` tags must have `rel="sponsored nofollow noopener"` and `target="_blank"`
**Warning signs:** Any `<a href>` pointing to an operator domain without rel attributes

### Pitfall 3: News Sitemap Including Old Articles
**What goes wrong:** Google News sitemaps should only contain articles from the last 2 days
**Why it happens:** Developers generate once and include all articles
**How to avoid:** Filter by publication_date in the news sitemap endpoint; articles older than 48 hours get standard sitemap only
**Warning signs:** News sitemap with dates older than 2 days

### Pitfall 4: Missing Bilingual Versions of New Pages
**What goes wrong:** Adding responsible gambling or operator review pages in one language only
**Why it happens:** Easy to forget to create both `/tl/` and `/en/` versions
**How to avoid:** Every new page must exist under both `/tl/` and `/en/` paths with proper hreflang. Use a checklist per page.
**Warning signs:** Pages that exist under one locale prefix but not the other

### Pitfall 5: Schema.org SportsEvent Without Required Properties
**What goes wrong:** Google Rich Results Test fails or shows warnings
**Why it happens:** Minimal properties provided (just name)
**How to avoid:** Include at minimum: name, startDate, homeTeam, awayTeam, sport, location, url
**Warning signs:** Rich Results Test showing "missing recommended field" warnings

### Pitfall 6: Supabase Leads Table Without RLS
**What goes wrong:** Anonymous users could read all email addresses
**Why it happens:** Supabase tables are open by default; developers forget to add Row Level Security
**How to avoid:** Create leads table with RLS enabled; policy allows INSERT only (anon), no SELECT/UPDATE/DELETE for anon
**Warning signs:** Table created without `ALTER TABLE leads ENABLE ROW LEVEL SECURITY`

## Code Examples

### SportsEvent JSON-LD Generator
```typescript
// src/lib/seo.ts
// Source: https://schema.org/SportsEvent
export function buildSportsEventSchema(prediction: {
  title: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  startDate: string;  // ISO 8601
  venue?: string;
  url: string;
  description?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "name": prediction.title,
    "startDate": prediction.startDate,
    "homeTeam": { "@type": "SportsTeam", "name": prediction.homeTeam },
    "awayTeam": { "@type": "SportsTeam", "name": prediction.awayTeam },
    "sport": prediction.sport,
    ...(prediction.venue && {
      "location": { "@type": "Place", "name": prediction.venue }
    }),
    "url": prediction.url,
    ...(prediction.description && { "description": prediction.description }),
    "eventAttendanceMode": "https://schema.org/MixedEventAttendanceMode",
    "eventStatus": "https://schema.org/EventScheduled"
  };
}
```

### BlogPosting JSON-LD Generator
```typescript
// src/lib/seo.ts
// Source: https://schema.org/BlogPosting
export function buildBlogPostingSchema(post: {
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  image?: string;
  url: string;
  lang: 'tl' | 'en';
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.description,
    "datePublished": post.datePublished,
    ...(post.dateModified && { "dateModified": post.dateModified }),
    "author": {
      "@type": "Organization",
      "name": "MyTaya",
      "url": "https://mytaya.com"
    },
    ...(post.image && { "image": post.image }),
    "url": post.url,
    "inLanguage": post.lang === 'tl' ? 'fil' : 'en',
    "publisher": {
      "@type": "Organization",
      "name": "MyTaya",
      "url": "https://mytaya.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://mytaya.com/icon-512.png"
      }
    },
    "mainEntityOfPage": { "@type": "WebPage", "@id": post.url }
  };
}
```

### PAGCOR Disclaimer Component
```astro
---
// src/components/compliance/GamblingDisclaimer.astro
interface Props {
  lang: 'tl' | 'en';
  variant?: 'full' | 'compact';
}
const { lang, variant = 'compact' } = Astro.props;

const text = {
  tl: {
    warning: 'Ang pagsusugal ay maaaring magdulot ng adiksyon. Alamin kung kailan titigil.',
    ageNotice: 'Para sa 21 taong gulang pataas lamang.',
    hotline: 'PAGCOR Hotline: (02) 8538-9090',
  },
  en: {
    warning: 'Gambling can be addictive. Know when to stop.',
    ageNotice: 'For 21 years old and above only.',
    hotline: 'PAGCOR Hotline: (02) 8538-9090',
  },
};
const t = text[lang];
---
<div class="gambling-disclaimer">
  <span class="age-badge">21+</span>
  <p>{t.warning}</p>
  <p>{t.ageNotice}</p>
  {variant === 'full' && <p>{t.hotline}</p>}
</div>
```

### Supabase Leads Table Migration
```sql
-- Create leads table for email capture
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  source TEXT DEFAULT 'website',
  lang TEXT DEFAULT 'tl',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint on email
ALTER TABLE leads ADD CONSTRAINT leads_email_unique UNIQUE (email);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts only (no read/update/delete)
CREATE POLICY "Allow anonymous insert" ON leads
  FOR INSERT TO anon
  WITH CHECK (true);
```

### Leads API Endpoint
```typescript
// src/pages/api/leads.ts
import type { APIRoute } from 'astro';
import { z } from 'zod';

const leadSchema = z.object({
  email: z.string().email(),
  lang: z.enum(['tl', 'en']).default('tl'),
});

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const result = leadSchema.safeParse(body);

  if (!result.success) {
    return new Response(JSON.stringify({ error: 'Invalid email' }), { status: 400 });
  }

  // Import supabase client
  const { supabase } = await import('../../lib/supabase');
  if (!supabase) {
    return new Response(JSON.stringify({ error: 'Service unavailable' }), { status: 503 });
  }

  const { error } = await supabase.from('leads').upsert(
    { email: result.data.email, lang: result.data.lang },
    { onConflict: 'email' }
  );

  if (error) {
    return new Response(JSON.stringify({ error: 'Failed to save' }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Microdata for structured data | JSON-LD in `<script>` tags | 2020+ | Google recommends JSON-LD; easier to maintain |
| Manual sitemap.xml | @astrojs/sitemap integration | Astro 2.0+ | Auto-generated from pages, i18n built-in |
| 18+ age requirement | 21+ per PAGCOR | Philippine law | Must use 21+ for PH market |
| Separate news sitemap plugin | Custom endpoint + standard sitemap | 2024+ | More control, Astro endpoints handle XML natively |

**Deprecated/outdated:**
- `changefreq` and `priority` sitemap fields: Google ignores these; include for protocol compliance but don't rely on them
- `rel="nofollow"` alone for affiliate links: Use `rel="sponsored nofollow"` -- `sponsored` is the correct semantic since 2019

## Discretion Recommendations

Based on research, here are recommendations for areas marked as Claude's discretion:

### Age Verification: Notice Banner (not gate popup)
Use a non-blocking age notice banner in the site header or above content, not a popup gate. Rationale: MyTaya is a predictions/editorial platform, not a sportsbook. A gate popup creates friction without legal necessity for non-gambling sites. The 21+ badge and disclaimer satisfy PAGCOR awareness requirements.

### Disclaimer Locations
- **Footer:** Always visible (already exists, update to 21+)
- **Prediction pages:** Compact disclaimer below prediction content
- **Operator cards:** Small "21+" badge on each card
- **Operator review pages:** Full disclaimer with PAGCOR hotline

### Lead Capture: Email-Only with Telegram CTA
- **Fields:** Email only (lower friction = higher conversion)
- **Offer:** "Get free daily predictions in your inbox + join our Telegram" (both channels)
- **Placement:** Footer section (always accessible) + homepage section above operators
- Telegram is primary channel per user context; email captures users who prefer it

### Schema.org Comprehensiveness
Implement all four types for maximum SEO coverage:
1. **SportsEvent** -- prediction pages (required by SEO-01)
2. **BlogPosting** -- blog posts (required by SEO-02)
3. **Organization** -- site-wide on homepage (trust signal for YMYL)
4. **BreadcrumbList** -- all pages (navigation structure)

### Google News: Custom News Sitemap Endpoint
Create a custom `/news-sitemap.xml` endpoint rather than relying on @astrojs/sitemap's news namespace. This gives full control over the news-specific XML format (publication name, language, dates) and the 2-day rolling window requirement.

### Operator Card Layout: Rich Cards
Use rich cards (not comparison table). Cards work better on mobile (the primary audience), allow for visual branding with operator logos, and support CTA buttons. Add a simple comparison summary at the top of the operators page.

## Open Questions

1. **Which specific PAGCOR-licensed operators to feature?**
   - What we know: BK8 is confirmed PAGCOR-licensed with an active affiliate program (up to 45% revenue share). PAGCOR maintains an official list of accredited gaming affiliates and operators.
   - What's unclear: Which other operators have active PH affiliate programs accepting new partners. Operator licensing status changes frequently.
   - Recommendation: Use placeholder operator data during development. Verify current PAGCOR licensing status at https://www.pagcor.ph/regulatory/ before launch. Start with 3-5 well-known operators (BK8, Bet88, etc.) and validate affiliate program availability.

2. **Supabase leads table -- server-side rendering needed?**
   - What we know: The API endpoint pattern (`/api/leads.ts`) requires SSR or hybrid mode for Astro
   - What's unclear: Whether the project is configured for SSR or static-only output
   - Recommendation: If static-only, the lead capture form can POST directly to Supabase from the client-side using the anon key (with RLS). If hybrid/SSR, use the API endpoint pattern for better security.

3. **PAGCOR affiliate accreditation requirement**
   - What we know: As of October 2025, PAGCOR requires gaming affiliates to be formally accredited. The deadline for incentivized 3-year accreditation was December 31, 2025.
   - What's unclear: Whether a predictions/editorial site linking to operators constitutes a "gaming affiliate" under PAGCOR's framework
   - Recommendation: Include a disclaimer that MyTaya is an independent predictions platform, not a licensed gaming operator. Feature only PAGCOR-licensed operators. This is a business/legal decision, not a technical one.

## Sources

### Primary (HIGH confidence)
- [Schema.org SportsEvent](https://schema.org/SportsEvent) - Full property list for SportsEvent type
- [Astro Sitemap Integration docs](https://docs.astro.build/en/guides/integrations-guide/sitemap/) - Configuration options, i18n, namespaces
- [Google News Sitemap specification](https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap) - Required tags, 2-day window, format
- [PAGCOR Responsible Gaming page](https://www.pagcor.ph/regulatory/responsible-gaming.php) - 21+ requirement, mandatory messaging, hotline

### Secondary (MEDIUM confidence)
- [PAGCOR Gaming Affiliate accreditation rules](https://chambers.com/articles/pagcor-issues-rules-on-accreditation-of-gaming-affiliates-and-support-providers-under-new-regime) - October 2025 framework
- [BK8 Affiliate Program](https://www.bk8agent.com/blog/bk8-the-safest-casino-affiliate/) - Commission structure, PAGCOR license confirmation
- [Zod documentation](https://zod.dev/) - Email validation API

### Tertiary (LOW confidence)
- PAGCOR-licensed operator list accuracy -- regulations evolving rapidly in 2025-2026, must verify at implementation time

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - project already uses Astro, sitemap integration installed, Layout supports structured data
- Architecture: HIGH - patterns follow established Astro conventions, Layout.astro schema prop is verified
- Pitfalls: HIGH - PAGCOR 21+ requirement verified from official source; affiliate link requirements well-documented
- Operator data: LOW - licensing status changes; placeholder data needed until verification

**Research date:** 2026-03-07
**Valid until:** 2026-03-21 (14 days -- PAGCOR regulatory landscape is evolving)
