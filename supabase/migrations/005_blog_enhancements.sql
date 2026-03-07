-- Blog Enhancements Migration
-- Adds prediction linking, bilingual slugs, and read time to posts table

-- Add prediction_id foreign key to link blog posts to predictions
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS prediction_id UUID REFERENCES public.predictions(id);

-- Add bilingual slug columns for SEO-optimized URLs
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS slug_en TEXT,
  ADD COLUMN IF NOT EXISTS slug_tl TEXT;

-- Add read time estimation column
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS read_time_minutes INTEGER DEFAULT 5;

-- Unique indexes on bilingual slugs (for URL routing)
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_slug_en ON public.posts (slug_en);
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_slug_tl ON public.posts (slug_tl);

-- Index on prediction_id for cross-linking queries
CREATE INDEX IF NOT EXISTS idx_posts_prediction_id ON public.posts (prediction_id);

-- Index on sport for blog index filtering
CREATE INDEX IF NOT EXISTS idx_posts_sport ON public.posts (sport);
