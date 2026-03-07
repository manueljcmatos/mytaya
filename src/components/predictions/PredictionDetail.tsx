import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const translations = {
  tl: {
    matchWinner: 'Panalo sa Laro',
    overUnder: 'Over/Under',
    btts: 'Parehong Maggo-gol',
    moneyline: 'Moneyline',
    spread: 'Spread',
    totalPoints: 'Kabuuang Puntos',
    pick: 'Hula',
    odds: 'Odds',
    confidence: 'Kumpiyansa',
    stake: 'Taya',
    analysis: 'Pagsusuri',
    backToPredictions: 'Bumalik sa Mga Hula',
    notFound: 'Hindi nahanap ang hula',
    notFoundDesc: 'Maaaring na-delete o mali ang link.',
    result: 'Resulta',
    resolved: 'Na-resolve',
    win: 'PANALO',
    loss: 'TALO',
    push: 'PUSH',
    high: 'Mataas',
    medium: 'Katamtaman',
    low: 'Mababa',
    loading: 'Naglo-load...',
    vs: 'vs',
    conference: 'Kumperensya',
  },
  en: {
    matchWinner: 'Match Winner',
    overUnder: 'Over/Under',
    btts: 'Both Teams to Score',
    moneyline: 'Moneyline',
    spread: 'Spread',
    totalPoints: 'Total Points',
    pick: 'Pick',
    odds: 'Odds',
    confidence: 'Confidence',
    stake: 'Stake',
    analysis: 'Analysis',
    backToPredictions: 'Back to Predictions',
    notFound: 'Prediction not found',
    notFoundDesc: 'This prediction may have been removed or the link is incorrect.',
    result: 'Result',
    resolved: 'Resolved',
    win: 'WIN',
    loss: 'LOSS',
    push: 'PUSH',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    loading: 'Loading...',
    vs: 'vs',
    conference: 'Conference',
  },
} as const;

interface Prediction {
  id: string;
  slug: string;
  pick: string;
  pick_label_tl: string;
  pick_label_en: string;
  analysis_tl: string | null;
  analysis_en: string | null;
  odds: number;
  confidence: string | null;
  stake: number | null;
  match_date: string;
  status: string;
  result: string | null;
  settled_at: string | null;
  league_id: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
  home_team_name: string | null;
  away_team_name: string | null;
  league_name: string | null;
  sport: string;
  spread_line: number | null;
  total_line: number | null;
}

interface Props {
  slug: string;
  lang: 'tl' | 'en';
}

const pickTypeMap: Record<string, { key: 'matchWinner' | 'overUnder' | 'btts' | 'moneyline' | 'spread' | 'totalPoints'; label: string }> = {
  home: { key: 'matchWinner', label: '1X2' },
  away: { key: 'matchWinner', label: '1X2' },
  draw: { key: 'matchWinner', label: '1X2' },
  over: { key: 'overUnder', label: 'O/U' },
  under: { key: 'overUnder', label: 'O/U' },
  btts_yes: { key: 'btts', label: 'BTTS' },
  btts_no: { key: 'btts', label: 'BTTS' },
  moneyline_home: { key: 'moneyline', label: 'ML' },
  moneyline_away: { key: 'moneyline', label: 'ML' },
  spread_home: { key: 'spread', label: 'SPREAD' },
  spread_away: { key: 'spread', label: 'SPREAD' },
};

const sportIcons: Record<string, string> = {
  football: '\u26BD',
  basketball: '\uD83C\uDFC0',
};

const confidenceColors: Record<string, { bg: string; text: string }> = {
  high: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399' },
  medium: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24' },
  low: { bg: 'rgba(156, 163, 175, 0.15)', text: '#9ca3af' },
};

const resultColors: Record<string, { bg: string; text: string; border: string }> = {
  win: { bg: 'rgba(16, 185, 129, 0.2)', text: '#34d399', border: 'rgba(16, 185, 129, 0.4)' },
  loss: { bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171', border: 'rgba(239, 68, 68, 0.4)' },
  push: { bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.4)' },
};

function formatMatchDateTime(isoDate: string, lang: 'tl' | 'en'): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat(lang === 'tl' ? 'fil-PH' : 'en-PH', {
    timeZone: 'Asia/Manila',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

function formatSettledDate(isoDate: string, lang: 'tl' | 'en'): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat(lang === 'tl' ? 'fil-PH' : 'en-PH', {
    timeZone: 'Asia/Manila',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

function extractTeams(pickLabel: string): { home: string; away: string } | null {
  // Try to extract "Home vs Away" from pick labels like "Home to win vs Away"
  const vsMatch = pickLabel.match(/(.+?)\s+vs\.?\s+(.+)/i);
  if (vsMatch) return { home: vsMatch[1].trim(), away: vsMatch[2].trim() };
  return null;
}

export default function PredictionDetail({ slug, lang }: Props) {
  const t = translations[lang];
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  const hasSupabase = Boolean(supabaseUrl && supabaseAnonKey);

  useEffect(() => {
    async function fetchPrediction() {
      if (!hasSupabase) {
        setLoading(false);
        setNotFound(true);
        return;
      }

      const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

      // Fetch prediction with joined team and league names
      const { data, error } = await supabase
        .from('predictions')
        .select(`
          *,
          home_team:teams!predictions_home_team_id_fkey(name),
          away_team:teams!predictions_away_team_id_fkey(name),
          league:leagues!predictions_league_id_fkey(name)
        `)
        .eq('slug', slug)
        .single();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Flatten joined data
      const pred: Prediction = {
        ...data,
        home_team_name: data.home_team?.name || null,
        away_team_name: data.away_team?.name || null,
        league_name: data.league?.name || null,
        sport: data.sport || 'football',
        spread_line: data.spread_line ?? null,
        total_line: data.total_line ?? null,
      };

      setPrediction(pred);
      setLoading(false);
    }

    fetchPrediction();
  }, [slug, hasSupabase, supabaseUrl, supabaseAnonKey]);

  // Inject SportsEvent JSON-LD into head
  useEffect(() => {
    if (!prediction) return;

    const homeTeam = prediction.home_team_name || 'Home';
    const awayTeam = prediction.away_team_name || 'Away';

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      name: `${homeTeam} vs ${awayTeam}`,
      startDate: prediction.match_date,
      sport: prediction.sport === 'basketball' ? 'Basketball' : 'Football',
      homeTeam: { '@type': 'SportsTeam', name: homeTeam },
      awayTeam: { '@type': 'SportsTeam', name: awayTeam },
      url: window.location.href,
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    script.setAttribute('data-prediction-schema', 'true');
    document.head.appendChild(script);

    return () => {
      const existing = document.querySelector('script[data-prediction-schema]');
      if (existing) existing.remove();
    };
  }, [prediction]);

  const backUrl = lang === 'tl' ? '/tl/hula/' : '/en/predictions/';

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-4 rounded w-24" style={{ backgroundColor: 'var(--t-surface, #1f2937)' }} />
          <div className="h-8 rounded w-3/4" style={{ backgroundColor: 'var(--t-surface, #1f2937)' }} />
          <div className="h-40 rounded-xl" style={{ backgroundColor: 'var(--t-surface, #1f2937)' }} />
          <div className="space-y-3">
            <div className="h-4 rounded w-full" style={{ backgroundColor: 'var(--t-surface, #1f2937)' }} />
            <div className="h-4 rounded w-5/6" style={{ backgroundColor: 'var(--t-surface, #1f2937)' }} />
            <div className="h-4 rounded w-4/6" style={{ backgroundColor: 'var(--t-surface, #1f2937)' }} />
          </div>
        </div>
      </div>
    );
  }

  // Not found
  if (notFound || !prediction) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="text-5xl mb-4" aria-hidden="true">&#9918;</div>
        <h2
          className="text-2xl font-bold mb-2"
          style={{ color: 'var(--t-text, #f9fafb)' }}
        >
          {t.notFound}
        </h2>
        <p
          className="mb-6 text-sm"
          style={{ color: 'var(--t-text-sec, #9ca3af)' }}
        >
          {t.notFoundDesc}
        </p>
        <a
          href={backUrl}
          className="inline-block px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          style={{
            backgroundColor: 'var(--brand-primary, #0F766E)',
            color: '#ffffff',
          }}
        >
          {t.backToPredictions}
        </a>
      </div>
    );
  }

  const pickLabel = lang === 'tl' ? prediction.pick_label_tl : prediction.pick_label_en;
  const analysisText = lang === 'tl' ? prediction.analysis_tl : prediction.analysis_en;
  const pickInfo = pickTypeMap[prediction.pick] || { key: 'matchWinner' as const, label: prediction.pick.toUpperCase() };
  const pickTypeName = t[pickInfo.key];
  const matchDateTime = formatMatchDateTime(prediction.match_date, lang);
  const confidenceStyle = prediction.confidence ? confidenceColors[prediction.confidence] : null;
  const confidenceLabel = prediction.confidence ? t[prediction.confidence as keyof typeof t] || prediction.confidence : null;

  // Team names from joined data or extraction from pick label
  const homeTeam = prediction.home_team_name;
  const awayTeam = prediction.away_team_name;
  const leagueName = prediction.league_name;

  // Result info
  const isSettled = prediction.status === 'settled';
  const resultStyle = prediction.result ? resultColors[prediction.result] : null;
  const resultLabel = prediction.result ? t[prediction.result as keyof typeof t] || prediction.result.toUpperCase() : null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back link */}
      <a
        href={backUrl}
        className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors"
        style={{ color: 'var(--brand-primary, #0F766E)' }}
      >
        <span aria-hidden="true">&larr;</span>
        {t.backToPredictions}
      </a>

      {/* Header: Sport badge + League badge + date */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {prediction.sport && (
          <span
            className="text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full"
            style={{
              backgroundColor: prediction.sport === 'basketball'
                ? 'rgba(249, 115, 22, 0.15)'
                : 'rgba(15, 118, 110, 0.15)',
              color: prediction.sport === 'basketball'
                ? '#f97316'
                : 'var(--brand-primary, #0F766E)',
              fontFamily: "var(--font-display, 'Bebas Neue', sans-serif)",
            }}
          >
            {sportIcons[prediction.sport] || ''} {prediction.sport === 'basketball' ? 'NBA' : prediction.sport.toUpperCase()}
          </span>
        )}
        {leagueName && (
          <span
            className="text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full"
            style={{
              backgroundColor: 'rgba(15, 118, 110, 0.15)',
              color: 'var(--brand-primary, #0F766E)',
              fontFamily: "var(--font-display, 'Bebas Neue', sans-serif)",
            }}
          >
            {leagueName}
          </span>
        )}
        <span className="text-sm" style={{ color: 'var(--t-text-sec, #9ca3af)' }}>
          {matchDateTime} PHT
        </span>
      </div>

      {/* Match info: Home vs Away */}
      {homeTeam && awayTeam && (
        <h2
          className="text-2xl sm:text-3xl font-bold mb-6 leading-tight"
          style={{
            color: 'var(--t-text, #f9fafb)',
            fontFamily: "var(--font-display, 'Bebas Neue', sans-serif)",
            letterSpacing: '0.02em',
          }}
        >
          {homeTeam} <span style={{ color: 'var(--t-text-sec, #9ca3af)' }}>{t.vs}</span> {awayTeam}
        </h2>
      )}

      {/* Result section (settled predictions) */}
      {isSettled && resultStyle && resultLabel && (
        <div
          className="rounded-xl p-5 mb-6 text-center"
          style={{
            backgroundColor: resultStyle.bg,
            border: `2px solid ${resultStyle.border}`,
          }}
        >
          <span
            className="text-3xl sm:text-4xl font-bold tracking-widest"
            style={{
              color: resultStyle.text,
              fontFamily: "var(--font-display, 'Bebas Neue', sans-serif)",
            }}
          >
            {resultLabel}
          </span>
          {prediction.settled_at && (
            <p className="text-xs mt-2" style={{ color: 'var(--t-text-sec, #9ca3af)' }}>
              {t.resolved}: {formatSettledDate(prediction.settled_at, lang)}
            </p>
          )}
        </div>
      )}

      {/* Prediction box */}
      <div
        className="rounded-xl p-5 mb-6"
        style={{
          backgroundColor: 'var(--t-bg-card, var(--t-surface, #1f2937))',
          border: '1px solid var(--t-border, #374151)',
        }}
      >
        {/* Pick type label */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className="text-xs font-bold tracking-wider uppercase px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: 'rgba(15, 118, 110, 0.15)',
              color: 'var(--brand-primary, #0F766E)',
              fontFamily: "var(--font-display, 'Bebas Neue', sans-serif)",
            }}
          >
            {pickInfo.label}
          </span>
          <span className="text-xs" style={{ color: 'var(--t-text-sec, #9ca3af)' }}>
            {pickTypeName}
          </span>
        </div>

        {/* NBA spread/total line info */}
        {prediction.sport === 'basketball' && (prediction.spread_line != null || prediction.total_line != null) && (
          <div className="flex items-center gap-4 mb-3 flex-wrap">
            {prediction.spread_line != null && (prediction.pick === 'spread_home' || prediction.pick === 'spread_away') && (
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                style={{
                  backgroundColor: 'rgba(249, 115, 22, 0.1)',
                  color: '#f97316',
                }}
              >
                {t.spread}: {prediction.spread_line > 0 ? '+' : ''}{prediction.spread_line}
              </span>
            )}
            {prediction.total_line != null && (prediction.pick === 'over' || prediction.pick === 'under') && (
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                style={{
                  backgroundColor: 'rgba(249, 115, 22, 0.1)',
                  color: '#f97316',
                }}
              >
                {t.totalPoints}: {prediction.pick === 'over' ? 'Over' : 'Under'} {prediction.total_line}
              </span>
            )}
          </div>
        )}

        {/* Pick label */}
        <p
          className="text-lg font-semibold mb-4 leading-snug"
          style={{ color: 'var(--t-text, #f9fafb)' }}
        >
          {pickLabel}
        </p>

        {/* Odds, confidence, stake row */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Odds */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs" style={{ color: 'var(--t-text-sec, #9ca3af)' }}>
              {t.odds}
            </span>
            <span
              className="text-xl font-bold"
              style={{
                color: 'var(--t-text, #f9fafb)',
                fontFamily: "var(--font-display, 'Bebas Neue', sans-serif)",
              }}
            >
              {Number(prediction.odds).toFixed(2)}
            </span>
          </div>

          {/* Confidence */}
          {confidenceStyle && confidenceLabel && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: 'var(--t-text-sec, #9ca3af)' }}>
                {t.confidence}
              </span>
              <span
                className="text-xs font-semibold capitalize px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: confidenceStyle.bg,
                  color: confidenceStyle.text,
                }}
              >
                {confidenceLabel}
              </span>
            </div>
          )}

          {/* Stake */}
          {prediction.stake && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: 'var(--t-text-sec, #9ca3af)' }}>
                {t.stake}
              </span>
              <div className="flex gap-0.5">
                {Array.from({ length: 10 }, (_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-3 rounded-sm"
                    style={{
                      backgroundColor:
                        i < prediction.stake!
                          ? 'var(--brand-primary, #0F766E)'
                          : 'var(--t-border, #374151)',
                    }}
                  />
                ))}
              </div>
              <span
                className="text-xs font-bold"
                style={{ color: 'var(--t-text, #f9fafb)' }}
              >
                {prediction.stake}/10
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Analysis section */}
      {analysisText && (
        <div className="mb-8">
          <h3
            className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{
              color: 'var(--t-text-sec, #9ca3af)',
              fontFamily: "var(--font-display, 'Bebas Neue', sans-serif)",
            }}
          >
            {t.analysis}
          </h3>
          <div
            className="space-y-4 text-sm leading-relaxed"
            style={{ color: 'var(--t-text, #f9fafb)' }}
          >
            {analysisText.split('\n\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </div>
      )}

      {/* Bottom back link */}
      <div className="pt-4" style={{ borderTop: '1px solid var(--t-border, #374151)' }}>
        <a
          href={backUrl}
          className="inline-flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: 'var(--brand-primary, #0F766E)' }}
        >
          <span aria-hidden="true">&larr;</span>
          {t.backToPredictions}
        </a>
      </div>
    </div>
  );
}
