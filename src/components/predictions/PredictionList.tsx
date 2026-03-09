import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import LeagueFilter from './LeagueFilter';

const translations = {
  tl: {
    todayPicks: 'Mga Hula Ngayon',
    pastResults: 'Mga Nakaraang Resulta',
    noMatches: 'Walang mga laro ngayon',
    noPastResults: 'Wala pang mga resulta',
    odds: 'Odds',
    pick: 'Hula',
    confidence: 'Kumpiyansa',
    win: 'PANALO',
    loss: 'TALO',
    push: 'PUSH',
    pending: 'Naghihintay',
    viewDetails: 'Tingnan ang Detalye',
    loading: 'Naglo-load...',
    prev: 'Nakaraan',
    next: 'Susunod',
    today: 'Ngayon',
    yesterday: 'Kahapon',
    allSports: 'Lahat ng Isports',
    football: 'Football',
    basketball: 'Basketball',
    boxing: 'Boxing',
  },
  en: {
    todayPicks: "Today's Picks",
    pastResults: 'Past Results',
    noMatches: 'No matches today',
    noPastResults: 'No results yet',
    odds: 'Odds',
    pick: 'Pick',
    confidence: 'Confidence',
    win: 'WIN',
    loss: 'LOSS',
    push: 'PUSH',
    pending: 'Pending',
    viewDetails: 'View Details',
    loading: 'Loading...',
    prev: 'Previous',
    next: 'Next',
    today: 'Today',
    yesterday: 'Yesterday',
    allSports: 'All Sports',
    football: 'Football',
    basketball: 'Basketball',
    boxing: 'Boxing',
  },
} as const;

interface Prediction {
  id: string;
  slug: string;
  pick: string;
  pick_label_tl: string;
  pick_label_en: string;
  odds: number;
  confidence: string | null;
  stake: number | null;
  match_date: string;
  status: string;
  result: string | null;
  league_id: string | null;
  sport: string;
  spread_line?: number;
  total_line?: number;
  home_team: { name: string } | null;
  away_team: { name: string } | null;
  league: { name: string; slug: string } | null;
}

interface League {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  lang: 'tl' | 'en';
  initialTab?: 'today' | 'past';
}

const PER_PAGE = 10;

const pickTypeMap: Record<string, string> = {
  home: '1X2',
  away: '1X2',
  draw: '1X2',
  over: 'O/U',
  under: 'O/U',
  btts_yes: 'BTTS',
  btts_no: 'BTTS',
  moneyline_home: 'ML',
  moneyline_away: 'ML',
  spread_home: 'SPREAD',
  spread_away: 'SPREAD',
};

const sportIcons: Record<string, string> = {
  football: '\u26BD',
  basketball: '\uD83C\uDFC0',
  boxing: '\uD83E\uDD4A',
};

function formatTime(isoDate: string): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

function formatDateHeader(isoDate: string, lang: 'tl' | 'en'): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat(lang === 'tl' ? 'fil-PH' : 'en-PH', {
    timeZone: 'Asia/Manila',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function getDateKey(isoDate: string): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function getRelativeLabel(dateKey: string, lang: 'tl' | 'en'): string | null {
  const t = translations[lang];
  const now = new Date();
  const todayKey = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(yesterday);

  if (dateKey === todayKey) return t.today;
  if (dateKey === yesterdayKey) return t.yesterday;
  return null;
}

function groupByDate(predictions: Prediction[]): Map<string, Prediction[]> {
  const groups = new Map<string, Prediction[]>();
  for (const pred of predictions) {
    const key = getDateKey(pred.match_date);
    const group = groups.get(key) || [];
    group.push(pred);
    groups.set(key, group);
  }
  return groups;
}

export default function PredictionList({ lang, initialTab = 'today' }: Props) {
  const t = translations[lang];
  const [tab, setTab] = useState(initialTab);
  const [sport, setSport] = useState<string>('all');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  const hasSupabase = Boolean(supabaseUrl && supabaseAnonKey);

  const fetchLeagues = useCallback(async () => {
    if (!hasSupabase) return;
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
    let query = supabase
      .from('leagues')
      .select('id, name, slug')
      .eq('is_active', true);

    if (sport !== 'all') {
      query = query.eq('sport', sport);
    }

    const { data } = await query;
    setLeagues(data || []);
  }, [hasSupabase, supabaseUrl, supabaseAnonKey, sport]);

  const fetchPredictions = useCallback(async () => {
    if (!hasSupabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
    const today = new Date().toISOString().split('T')[0];

    const fields = `
      id, slug, pick, pick_label_tl, pick_label_en,
      odds, confidence, stake, match_date, status, result, league_id,
      sport, spread_line, total_line,
      home_team:teams!home_team_id(name),
      away_team:teams!away_team_id(name),
      league:leagues!league_id(name, slug)
    `;

    let query = supabase
      .from('predictions')
      .select(fields, { count: 'exact' })
      .eq('published_site', true);

    if (sport !== 'all') {
      query = query.eq('sport', sport);
    }

    if (tab === 'today') {
      query = query
        .eq('status', 'pending')
        .gte('match_date', `${today}T00:00:00`)
        .order('match_date', { ascending: true });
    } else {
      query = query
        .eq('status', 'settled')
        .order('match_date', { ascending: false });
      const from = (page - 1) * PER_PAGE;
      const to = from + PER_PAGE - 1;
      query = query.range(from, to);
    }

    if (selectedLeague) {
      query = query.eq('league_id', selectedLeague);
    }

    const { data, count } = await query;
    setPredictions(data || []);
    setTotalCount(count || 0);
    setLoading(false);
  }, [hasSupabase, supabaseUrl, supabaseAnonKey, tab, page, selectedLeague, sport]);

  useEffect(() => {
    fetchLeagues();
  }, [fetchLeagues]);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  const handleTabChange = (newTab: 'today' | 'past') => {
    setTab(newTab);
    setPage(1);
  };

  const handleSportChange = (newSport: string) => {
    setSport(newSport);
    setSelectedLeague(null);
    setPage(1);
  };

  const handleLeagueSelect = (leagueId: string | null) => {
    setSelectedLeague(leagueId);
    setPage(1);
  };

  const grouped = groupByDate(predictions);
  const totalPages = Math.ceil(totalCount / PER_PAGE);
  const detailBase = lang === 'tl' ? '/tl/hula' : '/en/predictions';

  const resultColors: Record<string, { bg: string; text: string }> = {
    win: { bg: 'rgba(16, 185, 129, 0.2)', text: '#34d399' },
    loss: { bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171' },
    push: { bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24' },
  };

  const sportTabs = [
    { key: 'all', label: t.allSports },
    { key: 'football', label: t.football },
    { key: 'basketball', label: t.basketball },
    { key: 'boxing', label: t.boxing },
  ];

  return (
    <div>
      {/* Sport tabs */}
      <div className="flex gap-2 mb-4">
        {sportTabs.map((s) => (
          <button
            key={s.key}
            onClick={() => handleSportChange(s.key)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
            style={{
              backgroundColor: sport === s.key ? 'var(--brand-primary, #0F766E)' : 'var(--t-surface, #1f2937)',
              color: sport === s.key ? '#ffffff' : 'var(--t-text-sec, #9ca3af)',
              border: sport === s.key ? 'none' : '1px solid var(--t-border, #374151)',
            }}
          >
            {s.key !== 'all' && (
              <span className="mr-1.5" aria-hidden="true">{sportIcons[s.key] || ''}</span>
            )}
            {s.label}
          </button>
        ))}
      </div>

      {/* Today/Past tab buttons */}
      <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ backgroundColor: 'var(--t-surface, #1f2937)' }}>
        <button
          onClick={() => handleTabChange('today')}
          className="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors"
          style={{
            backgroundColor: tab === 'today' ? 'var(--brand-primary, #0F766E)' : 'transparent',
            color: tab === 'today' ? '#ffffff' : 'var(--t-text-sec, #9ca3af)',
          }}
        >
          {t.todayPicks}
        </button>
        <button
          onClick={() => handleTabChange('past')}
          className="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors"
          style={{
            backgroundColor: tab === 'past' ? 'var(--brand-primary, #0F766E)' : 'transparent',
            color: tab === 'past' ? '#ffffff' : 'var(--t-text-sec, #9ca3af)',
          }}
        >
          {t.pastResults}
        </button>
      </div>

      {/* League filter */}
      {leagues.length > 0 && (
        <div className="mb-6">
          <LeagueFilter
            leagues={leagues}
            selectedLeague={selectedLeague}
            onSelect={handleLeagueSelect}
            lang={lang}
          />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl p-5"
              style={{ backgroundColor: 'var(--t-surface, #1f2937)', height: '100px' }}
            />
          ))}
        </div>
      ) : predictions.length === 0 ? (
        <div
          className="text-center py-12 rounded-xl border border-dashed"
          style={{
            borderColor: 'var(--t-border, #374151)',
            backgroundColor: 'color-mix(in srgb, var(--t-bg-card, #111827) 50%, transparent)',
          }}
        >
          <div className="text-3xl mb-3" aria-hidden="true">
            {tab === 'today' ? '\u26BD' : '\uD83D\uDCCA'}
          </div>
          <p className="text-sm" style={{ color: 'var(--t-text-sec, #9ca3af)' }}>
            {tab === 'today' ? t.noMatches : t.noPastResults}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {Array.from(grouped.entries()).map(([dateKey, preds]) => {
            const relativeLabel = getRelativeLabel(dateKey, lang);
            const dateLabel = formatDateHeader(preds[0].match_date, lang);

            return (
              <div key={dateKey}>
                {/* Date section header */}
                <div className="flex items-center gap-3 mb-3">
                  <h3
                    className="text-sm font-semibold whitespace-nowrap"
                    style={{ color: 'var(--t-text-sec, #9ca3af)' }}
                  >
                    {relativeLabel ? `${relativeLabel} \u2014 ${dateLabel}` : dateLabel}
                  </h3>
                  <div
                    className="flex-1 h-px"
                    style={{ backgroundColor: 'var(--t-border, #374151)' }}
                  />
                </div>

                {/* Prediction cards */}
                <div className="flex flex-col gap-3">
                  {preds.map((pred) => {
                    const pickLabel = lang === 'tl' ? pred.pick_label_tl : pred.pick_label_en;
                    const pickType = pickTypeMap[pred.pick] || pred.pick.toUpperCase();
                    const matchTime = formatTime(pred.match_date);
                    const resultStyle = pred.result ? resultColors[pred.result] : null;
                    const resultLabel = pred.result
                      ? t[pred.result as keyof typeof t] || pred.result.toUpperCase()
                      : null;

                    // Build pick type display with spread/total line info
                    let pickTypeDisplay = pickType;
                    if ((pred.pick === 'spread_home' || pred.pick === 'spread_away') && pred.spread_line != null) {
                      const sign = pred.spread_line > 0 ? '+' : '';
                      pickTypeDisplay = `SPREAD ${sign}${pred.spread_line}`;
                    } else if ((pred.pick === 'over' || pred.pick === 'under') && pred.sport === 'basketball' && pred.total_line != null) {
                      pickTypeDisplay = `O/U ${pred.total_line}`;
                    }

                    const sportIcon = sportIcons[pred.sport] || '';

                    return (
                      <a
                        key={pred.id}
                        href={`${detailBase}/${pred.slug}`}
                        className="block rounded-xl p-4 transition-shadow hover:shadow-lg"
                        style={{
                          backgroundColor: 'var(--t-bg-card, var(--t-surface, #1f2937))',
                          border: '1px solid var(--t-border, #374151)',
                        }}
                      >
                        {/* Header row: league + time + pick type */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {pred.league && (
                              <span
                                className="text-xs font-medium px-2 py-0.5 rounded"
                                style={{
                                  backgroundColor: 'var(--t-surface, rgba(255,255,255,0.06))',
                                  color: 'var(--t-text-sec, #9ca3af)',
                                }}
                              >
                                {pred.league.name}
                              </span>
                            )}
                            <span
                              className="text-xs"
                              style={{ color: 'var(--t-text-sec, #9ca3af)' }}
                            >
                              {matchTime} PHT
                            </span>
                            {sport === 'all' && sportIcon && (
                              <span className="text-xs" aria-hidden="true" title={pred.sport}>
                                {sportIcon}
                              </span>
                            )}
                          </div>
                          <span
                            className="text-xs font-bold tracking-wider uppercase px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: 'rgba(15, 118, 110, 0.15)',
                              color: 'var(--brand-primary, #0F766E)',
                              fontFamily: "var(--font-display, 'Bebas Neue', sans-serif)",
                            }}
                          >
                            {pickTypeDisplay}
                          </span>
                        </div>

                        {/* Teams */}
                        {pred.home_team && pred.away_team && (
                          <p
                            className="font-bold text-base mb-1 leading-snug"
                            style={{
                              color: 'var(--t-text, #f9fafb)',
                              fontFamily: "var(--font-display, 'Bebas Neue', sans-serif)",
                              letterSpacing: '0.02em',
                            }}
                          >
                            {pred.home_team.name} vs {pred.away_team.name}
                          </p>
                        )}

                        {/* Pick label */}
                        <p
                          className="text-sm mb-3 leading-snug"
                          style={{ color: 'var(--brand-primary, #0F766E)' }}
                        >
                          {pickLabel}
                        </p>

                        {/* Footer: odds, confidence, result */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs" style={{ color: 'var(--t-text-sec, #9ca3af)' }}>
                            {t.odds}
                          </span>
                          <span
                            className="text-sm font-bold"
                            style={{
                              color: 'var(--t-text, #f9fafb)',
                              fontFamily: "var(--font-display, 'Bebas Neue', sans-serif)",
                            }}
                          >
                            {Number(pred.odds).toFixed(2)}
                          </span>

                          {pred.confidence && (
                            <span
                              className="text-xs font-medium capitalize px-2 py-0.5 rounded-full ml-1"
                              style={{
                                backgroundColor:
                                  pred.confidence === 'high'
                                    ? 'rgba(16, 185, 129, 0.12)'
                                    : pred.confidence === 'medium'
                                      ? 'rgba(245, 158, 11, 0.12)'
                                      : 'rgba(156, 163, 175, 0.12)',
                                color:
                                  pred.confidence === 'high'
                                    ? '#34d399'
                                    : pred.confidence === 'medium'
                                      ? '#fbbf24'
                                      : '#9ca3af',
                              }}
                            >
                              {pred.confidence}
                            </span>
                          )}

                          {pred.status === 'settled' && resultStyle && resultLabel && (
                            <span
                              className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ml-auto"
                              style={{
                                backgroundColor: resultStyle.bg,
                                color: resultStyle.text,
                                fontFamily: "var(--font-display, 'Bebas Neue', sans-serif)",
                              }}
                            >
                              {resultLabel}
                            </span>
                          )}
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Pagination for past results */}
          {tab === 'past' && totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-30"
                style={{
                  backgroundColor: 'var(--t-surface, #1f2937)',
                  color: 'var(--t-text, #f9fafb)',
                  border: '1px solid var(--t-border, #374151)',
                }}
              >
                {t.prev}
              </button>
              <span className="text-sm" style={{ color: 'var(--t-text-sec, #9ca3af)' }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-30"
                style={{
                  backgroundColor: 'var(--t-surface, #1f2937)',
                  color: 'var(--t-text, #f9fafb)',
                  border: '1px solid var(--t-border, #374151)',
                }}
              >
                {t.next}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
