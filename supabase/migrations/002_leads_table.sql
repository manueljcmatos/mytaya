-- Run this migration in Supabase SQL editor before the lead capture form goes live
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  source TEXT DEFAULT 'website',
  lang TEXT DEFAULT 'tl',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE leads ADD CONSTRAINT leads_email_unique UNIQUE (email);
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous insert" ON leads FOR INSERT TO anon WITH CHECK (true);
