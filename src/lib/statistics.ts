import type { SupabaseClient } from '@supabase/supabase-js';

export interface StatsResult {
  totalPicks: number;
  wins: number;
  losses: number;
  pushes: number;
  winRate: number;
  roi: number;
  currentStreak: { type: 'win' | 'loss'; count: number };
  profitHistory: { date: string; cumProfit: number; pickCount: number }[];
  recentPicks: RecentPick[];
}

export interface RecentPick {
  slug: string;
  pick: string;
  pick_label_en: string;
  pick_label_tl: string;
  result: string;
  odds: number;
  match_date: string;
  sport: string;
}

export function defaultStats(): StatsResult {
  return {
    totalPicks: 0,
    wins: 0,
    losses: 0,
    pushes: 0,
    winRate: 0,
    roi: 0,
    currentStreak: { type: 'win', count: 0 },
    profitHistory: [],
    recentPicks: [],
  };
}

export async function getStatistics(
  supabase: SupabaseClient,
  sport?: string,
  days?: number
): Promise<StatsResult> {
  let query = supabase
    .from('predictions')
    .select('id, result, odds, settled_at, sport, match_date')
    .eq('status', 'settled')
    .eq('published_site', true)
    .order('settled_at', { ascending: true });

  if (sport && sport !== 'all') {
    query = query.eq('sport', sport);
  }

  if (days) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    query = query.gte('settled_at', since.toISOString());
  }

  const { data } = await query;
  if (!data || data.length === 0) {
    // Still fetch recent picks even if no stats data
    const recentPicks = await fetchRecentPicks(supabase, sport, days);
    return { ...defaultStats(), recentPicks };
  }

  const wins = data.filter((p) => p.result === 'win').length;
  const losses = data.filter((p) => p.result === 'loss').length;
  const pushes = data.filter((p) => p.result === 'push').length;
  const totalPicks = wins + losses + pushes;
  const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;

  // ROI: flat 1 unit per bet
  let totalProfit = 0;
  for (const p of data) {
    if (p.result === 'win') totalProfit += p.odds - 1;
    else if (p.result === 'loss') totalProfit -= 1;
  }
  const roi = totalPicks > 0 ? (totalProfit / totalPicks) * 100 : 0;

  // Current streak (from most recent backward)
  const reversed = [...data].reverse();
  let streakType = (reversed[0]?.result as 'win' | 'loss') || 'win';
  // Skip pushes for streak calculation
  if (streakType === ('push' as string)) streakType = 'win';
  let streakCount = 0;
  for (const p of reversed) {
    if (p.result === 'push') continue;
    if (p.result === streakType) streakCount++;
    else break;
  }

  // Profit history for chart
  let cumProfit = 0;
  let pickCount = 0;
  const profitHistory = data.map((p) => {
    pickCount++;
    if (p.result === 'win') cumProfit += p.odds - 1;
    else if (p.result === 'loss') cumProfit -= 1;
    const dateStr = new Date(p.settled_at || p.match_date).toISOString().split('T')[0];
    return { date: dateStr, cumProfit: Math.round(cumProfit * 100) / 100, pickCount };
  });

  // Recent picks
  const recentPicks = await fetchRecentPicks(supabase, sport, days);

  return {
    totalPicks,
    wins,
    losses,
    pushes,
    winRate: Math.round(winRate * 10) / 10,
    roi: Math.round(roi * 10) / 10,
    currentStreak: { type: streakType, count: streakCount },
    profitHistory,
    recentPicks,
  };
}

async function fetchRecentPicks(
  supabase: SupabaseClient,
  sport?: string,
  days?: number
): Promise<RecentPick[]> {
  let query = supabase
    .from('predictions')
    .select('slug, pick, pick_label_en, pick_label_tl, result, odds, match_date, sport')
    .eq('status', 'settled')
    .eq('published_site', true)
    .order('settled_at', { ascending: false })
    .limit(10);

  if (sport && sport !== 'all') {
    query = query.eq('sport', sport);
  }

  if (days) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    query = query.gte('settled_at', since.toISOString());
  }

  const { data } = await query;
  return (data as RecentPick[]) || [];
}
