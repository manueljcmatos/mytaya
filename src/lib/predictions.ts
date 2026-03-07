import { supabase } from './supabase';

const PREDICTION_FIELDS = `
  id, slug, pick, pick_label_tl, pick_label_en,
  analysis_tl, analysis_en, odds, confidence, stake,
  match_date, status, result, settled_at, league_id,
  home_team_id, away_team_id
`;

export async function getTodayPredictions() {
  if (!supabase) return [];
  const today = new Date().toISOString().split('T')[0];

  const { data } = await supabase
    .from('predictions')
    .select(PREDICTION_FIELDS)
    .eq('sport', 'football')
    .eq('published_site', true)
    .eq('status', 'pending')
    .gte('match_date', `${today}T00:00:00`)
    .lte('match_date', `${today}T23:59:59`)
    .order('match_date', { ascending: true });

  return data || [];
}

export async function getPastPredictions(page = 1, perPage = 10) {
  if (!supabase) return { data: [], count: 0 };
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, count } = await supabase
    .from('predictions')
    .select(PREDICTION_FIELDS, { count: 'exact' })
    .eq('sport', 'football')
    .eq('published_site', true)
    .eq('status', 'settled')
    .order('match_date', { ascending: false })
    .range(from, to);

  return { data: data || [], count: count || 0 };
}

export async function getPredictionBySlug(slug: string) {
  if (!supabase) return null;

  const { data } = await supabase
    .from('predictions')
    .select('*')
    .eq('slug', slug)
    .single();

  return data;
}

export function formatMatchTime(isoDate: string, lang: 'tl' | 'en'): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat(lang === 'tl' ? 'fil-PH' : 'en-PH', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function formatMatchDate(isoDate: string, lang: 'tl' | 'en'): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat(lang === 'tl' ? 'fil-PH' : 'en-PH', {
    timeZone: 'Asia/Manila',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export async function getLeagues() {
  if (!supabase) return [];

  const { data } = await supabase
    .from('leagues')
    .select('id, name, slug')
    .eq('sport', 'football')
    .eq('is_active', true);

  return data || [];
}
