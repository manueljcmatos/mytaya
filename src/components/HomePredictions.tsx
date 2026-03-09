import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Prediction {
  id: string;
  slug: string;
  pick: string;
  pick_label_tl: string;
  pick_label_en: string;
  odds: number;
  confidence: string | null;
  match_date: string;
  status: string;
  result: string | null;
  sport: string;
  home_team: { name: string } | null;
  away_team: { name: string } | null;
  league: { name: string } | null;
}

const pickTypeMap: Record<string, string> = {
  home: '1X2', away: '1X2', draw: '1X2',
  over: 'O/U', under: 'O/U',
  btts_yes: 'BTTS', btts_no: 'BTTS',
  moneyline_home: 'ML', moneyline_away: 'ML',
  spread_home: 'SPREAD', spread_away: 'SPREAD',
};

const translations = {
  tl: {
    noPicks: 'Wala pang mga hula. Babalik kami!',
    noResults: 'Wala pang mga resulta.',
    win: 'PANALO', loss: 'TALO', push: 'PUSH',
  },
  en: {
    noPicks: 'No picks yet. Check back soon!',
    noResults: 'No results yet.',
    win: 'WIN', loss: 'LOSS', push: 'PUSH',
  },
} as const;

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso));
}

const resultColors: Record<string, { bg: string; text: string }> = {
  win: { bg: 'rgba(16, 185, 129, 0.2)', text: '#34d399' },
  loss: { bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171' },
  push: { bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24' },
};

interface Props {
  lang: 'tl' | 'en';
  mode: 'today' | 'results';
}

export default function HomePredictions({ lang, mode }: Props) {
  const t = translations[lang];
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    if (!supabaseUrl || !supabaseAnonKey) { setLoading(false); return; }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const today = new Date().toISOString().split('T')[0];

    const fields = `
      id, slug, pick, pick_label_tl, pick_label_en,
      odds, confidence, match_date, status, result, sport,
      home_team:teams!home_team_id(name),
      away_team:teams!away_team_id(name),
      league:leagues!league_id(name)
    `;

    let query = supabase
      .from('predictions')
      .select(fields)
      .eq('published_site', true);

    if (mode === 'today') {
      query = query
        .eq('status', 'pending')
        .gte('match_date', `${today}T00:00:00`)
        .order('match_date', { ascending: true })
        .limit(5);
    } else {
      query = query
        .eq('status', 'settled')
        .order('match_date', { ascending: false })
        .limit(5);
    }

    query.then(({ data }) => {
      setPredictions(data || []);
      setLoading(false);
    });
  }, [supabaseUrl, supabaseAnonKey, mode]);

  const detailBase = lang === 'tl' ? '/tl/hula' : '/en/predictions';
  const emptyMsg = mode === 'today' ? t.noPicks : t.noResults;
  const emptyIcon = mode === 'today' ? '\u26BD' : '\uD83D\uDCCA';

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl p-5"
            style={{ backgroundColor: 'var(--t-surface, #1f2937)', height: '80px' }}
          />
        ))}
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <div
        className="text-center py-10 rounded-xl border border-dashed"
        style={{
          borderColor: 'var(--t-border, #374151)',
          backgroundColor: 'color-mix(in srgb, var(--t-bg-card, #111827) 50%, transparent)',
        }}
      >
        <div className="text-2xl mb-2" aria-hidden="true">{emptyIcon}</div>
        <p className="text-sm" style={{ color: 'var(--t-text-sec, #9ca3af)' }}>{emptyMsg}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {predictions.map((pred) => {
        const pickLabel = lang === 'tl' ? pred.pick_label_tl : pred.pick_label_en;
        const pickType = pickTypeMap[pred.pick] || pred.pick.toUpperCase();
        const matchTime = formatTime(pred.match_date);
        const rStyle = pred.result ? resultColors[pred.result] : null;
        const rLabel = pred.result ? t[pred.result as keyof typeof t] || pred.result.toUpperCase() : null;

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
            {/* Header: league + time + pick type */}
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
                <span className="text-xs" style={{ color: 'var(--t-text-sec, #9ca3af)' }}>
                  {matchTime} PHT
                </span>
              </div>
              <span
                className="text-xs font-bold tracking-wider uppercase px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'rgba(15, 118, 110, 0.15)',
                  color: 'var(--brand-primary, #0F766E)',
                  fontFamily: "var(--font-display, 'Bebas Neue', sans-serif)",
                }}
              >
                {pickType}
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

            {/* Pick */}
            <p className="text-sm mb-2" style={{ color: 'var(--brand-primary, #0F766E)' }}>
              {pickLabel}
            </p>

            {/* Footer: odds + result */}
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--t-text-sec, #9ca3af)' }}>Odds</span>
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
                      pred.confidence === 'high' ? 'rgba(16, 185, 129, 0.12)'
                        : pred.confidence === 'medium' ? 'rgba(245, 158, 11, 0.12)'
                          : 'rgba(156, 163, 175, 0.12)',
                    color:
                      pred.confidence === 'high' ? '#34d399'
                        : pred.confidence === 'medium' ? '#fbbf24'
                          : '#9ca3af',
                  }}
                >
                  {pred.confidence}
                </span>
              )}

              {pred.status === 'settled' && rStyle && rLabel && (
                <span
                  className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ml-auto"
                  style={{
                    backgroundColor: rStyle.bg,
                    color: rStyle.text,
                    fontFamily: "var(--font-display, 'Bebas Neue', sans-serif)",
                  }}
                >
                  {rLabel}
                </span>
              )}
            </div>
          </a>
        );
      })}
    </div>
  );
}
