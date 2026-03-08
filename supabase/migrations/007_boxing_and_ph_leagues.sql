-- Migration 007: Boxing columns, Philippine basketball leagues, PBA teams, and auto-settle trigger
-- Supports manual content entry for boxing and PH basketball predictions

-- 1. Boxing-specific nullable columns on predictions
ALTER TABLE public.predictions ADD COLUMN IF NOT EXISTS fighter_1_record TEXT;
ALTER TABLE public.predictions ADD COLUMN IF NOT EXISTS fighter_2_record TEXT;
ALTER TABLE public.predictions ADD COLUMN IF NOT EXISTS weight_class TEXT;
ALTER TABLE public.predictions ADD COLUMN IF NOT EXISTS scheduled_rounds INTEGER;

-- 2. Seed Philippine basketball leagues
INSERT INTO public.leagues (name, slug, sport, country, api_source, is_active)
VALUES
  ('PBA', 'pba', 'basketball', 'Philippines', 'manual', true),
  ('NCAA Philippines', 'ncaa-ph', 'basketball', 'Philippines', 'manual', true),
  ('UAAP', 'uaap', 'basketball', 'Philippines', 'manual', true)
ON CONFLICT (slug) DO NOTHING;

-- 3. Seed Boxing league
INSERT INTO public.leagues (name, slug, sport, country, api_source, is_active)
VALUES
  ('Boxing', 'boxing', 'boxing', 'International', 'manual', true)
ON CONFLICT (slug) DO NOTHING;

-- 4. Seed PBA teams (12 current teams) — linked to PBA league via league_id
INSERT INTO public.teams (name, slug, league_id)
SELECT t.name, t.slug, l.id
FROM (VALUES
  ('Barangay Ginebra San Miguel', 'barangay-ginebra-san-miguel'),
  ('San Miguel Beermen', 'san-miguel-beermen'),
  ('TNT Tropang Giga', 'tnt-tropang-giga'),
  ('Magnolia Hotshots', 'magnolia-hotshots'),
  ('Meralco Bolts', 'meralco-bolts'),
  ('Rain or Shine Elasto Painters', 'rain-or-shine-elasto-painters'),
  ('NLEX Road Warriors', 'nlex-road-warriors'),
  ('Phoenix Super LPG Fuel Masters', 'phoenix-super-lpg-fuel-masters'),
  ('Blackwater Bossing', 'blackwater-bossing'),
  ('Converge FiberXers', 'converge-fiberxers'),
  ('Terrafirma Dyip', 'terrafirma-dyip'),
  ('NorthPort Batang Pier', 'northport-batang-pier')
) AS t(name, slug)
CROSS JOIN public.leagues l
WHERE l.slug = 'pba'
ON CONFLICT (slug) DO NOTHING;

-- 5. Partial index for boxing queries
CREATE INDEX IF NOT EXISTS idx_predictions_boxing
  ON public.predictions (sport, match_date)
  WHERE sport = 'boxing';

-- 6. Auto-settle trigger: sets status='settled' and settled_at=now() when result transitions from NULL to non-null
CREATE OR REPLACE FUNCTION public.auto_settle_on_result()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.result IS NULL AND NEW.result IS NOT NULL THEN
    NEW.status := 'settled';
    NEW.settled_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_settle ON public.predictions;
CREATE TRIGGER trg_auto_settle
  BEFORE UPDATE ON public.predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_settle_on_result();
