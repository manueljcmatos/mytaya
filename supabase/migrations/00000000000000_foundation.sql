-- MyTaya Foundation Schema
-- Creates core tables for predictions, blog, stats, and leads
-- All tables have RLS enabled with appropriate public read policies

-- ============================================================
-- LEAGUES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sport TEXT NOT NULL CHECK (sport IN ('basketball', 'football', 'boxing')),
  country TEXT NOT NULL,
  api_source TEXT CHECK (api_source IN ('api-sports', 'betsapi', 'manual')),
  api_league_id INTEGER,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TEAMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  league_id UUID REFERENCES public.leagues(id),
  api_team_id INTEGER,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PREDICTIONS (core content with bilingual columns + odds tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  league_id UUID REFERENCES public.leagues(id),
  home_team_id UUID REFERENCES public.teams(id),
  away_team_id UUID REFERENCES public.teams(id),
  match_date TIMESTAMPTZ NOT NULL,

  -- Denormalized sport column for query performance (avoids JOIN for filtering)
  sport TEXT NOT NULL CHECK (sport IN ('basketball', 'football', 'boxing')),

  -- Bilingual content (FOUND-04)
  pick TEXT NOT NULL,  -- e.g. 'home', 'away', 'draw', 'over', 'under'
  pick_label_tl TEXT NOT NULL,  -- e.g. "Lakers mananalo"
  pick_label_en TEXT NOT NULL,  -- e.g. "Lakers to win"
  analysis_tl TEXT,
  analysis_en TEXT,

  -- Odds tracking (FOUND-05)
  odds DECIMAL(6,2) NOT NULL,
  odds_source TEXT,  -- Where odds were taken from
  stake INTEGER CHECK (stake BETWEEN 1 AND 10),
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),

  -- Resolution
  result TEXT CHECK (result IN ('win', 'loss', 'push', 'void')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'settled', 'cancelled')),
  settled_at TIMESTAMPTZ,

  -- Publishing
  published_site BOOLEAN DEFAULT false,
  published_telegram BOOLEAN DEFAULT false,
  card_image_url TEXT,

  -- API tracking
  api_fixture_id INTEGER,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- POSTS (bilingual blog content)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title_tl TEXT NOT NULL,
  title_en TEXT NOT NULL,
  content_tl TEXT NOT NULL,
  content_en TEXT NOT NULL,
  excerpt_tl TEXT,
  excerpt_en TEXT,
  category TEXT CHECK (category IN ('news', 'analysis', 'tips', 'boxing')),
  sport TEXT CHECK (sport IN ('basketball', 'football', 'boxing', 'general')),
  featured_image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PREDICTION STATS (for ROI dashboard)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.prediction_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport TEXT NOT NULL CHECK (sport IN ('basketball', 'football', 'boxing', 'all')),
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'alltime')),
  period_start DATE NOT NULL,
  total_picks INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  pushes INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2),
  roi DECIMAL(8,2),
  streak INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- LEADS (newsletter signup)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  site_origin TEXT DEFAULT 'mytaya',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PUBLIC READ POLICIES
-- ============================================================
CREATE POLICY "Public read leagues" ON public.leagues
  FOR SELECT USING (true);

CREATE POLICY "Public read teams" ON public.teams
  FOR SELECT USING (true);

CREATE POLICY "Public read published predictions" ON public.predictions
  FOR SELECT USING (published_site = true);

CREATE POLICY "Public read published posts" ON public.posts
  FOR SELECT USING (is_published = true);

CREATE POLICY "Public read stats" ON public.prediction_stats
  FOR SELECT USING (true);

-- Anon insert for leads (no read access for privacy)
CREATE POLICY "Anon insert leads" ON public.leads
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================

-- Predictions: sport filtering (denormalized column avoids JOIN)
CREATE INDEX IF NOT EXISTS idx_predictions_sport ON public.predictions (sport);

-- Predictions: chronological listing
CREATE INDEX IF NOT EXISTS idx_predictions_match_date ON public.predictions (match_date DESC);

-- Predictions: status filtering
CREATE INDEX IF NOT EXISTS idx_predictions_status ON public.predictions (status);

-- Predictions: published content feed
CREATE INDEX IF NOT EXISTS idx_predictions_published ON public.predictions (published_site, created_at DESC);

-- Predictions: created_at for general sorting
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON public.predictions (created_at DESC);

-- Posts: published content feed
CREATE INDEX IF NOT EXISTS idx_posts_published ON public.posts (is_published, published_at DESC);

-- Stats: sport + period lookup
CREATE INDEX IF NOT EXISTS idx_stats_sport_period ON public.prediction_stats (sport, period);
