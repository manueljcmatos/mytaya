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

-- 4. Seed PBA teams (12 current teams)
INSERT INTO public.teams (name, slug, sport)
VALUES
  ('Barangay Ginebra San Miguel', 'barangay-ginebra-san-miguel', 'basketball'),
  ('San Miguel Beermen', 'san-miguel-beermen', 'basketball'),
  ('TNT Tropang Giga', 'tnt-tropang-giga', 'basketball'),
  ('Magnolia Hotshots', 'magnolia-hotshots', 'basketball'),
  ('Meralco Bolts', 'meralco-bolts', 'basketball'),
  ('Rain or Shine Elasto Painters', 'rain-or-shine-elasto-painters', 'basketball'),
  ('NLEX Road Warriors', 'nlex-road-warriors', 'basketball'),
  ('Phoenix Super LPG Fuel Masters', 'phoenix-super-lpg-fuel-masters', 'basketball'),
  ('Blackwater Bossing', 'blackwater-bossing', 'basketball'),
  ('Converge FiberXers', 'converge-fiberxers', 'basketball'),
  ('Terrafirma Dyip', 'terrafirma-dyip', 'basketball'),
  ('NorthPort Batang Pier', 'northport-batang-pier', 'basketball')
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
