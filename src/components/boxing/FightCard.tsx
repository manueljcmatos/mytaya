export interface BoxingPrediction {
  id: string;
  slug: string;
  pick_label_tl: string;
  pick_label_en: string;
  analysis_tl: string | null;
  analysis_en: string | null;
  odds: number;
  confidence: string | null;
  match_date: string;
  fighter_1_record: string | null;
  fighter_2_record: string | null;
  weight_class: string | null;
  scheduled_rounds: number | null;
  home_team: { name: string } | null;
  away_team: { name: string } | null;
  result: string | null;
  status: string;
  card_image_url: string | null;
}

interface Props {
  prediction: BoxingPrediction;
  lang: 'tl' | 'en';
  expanded?: boolean;
}

const translations = {
  tl: {
    rounds: 'Rounds',
    record: 'Rekord',
    pick: 'Hula',
    odds: 'Odds',
    confidence: 'Kumpiyansa',
    win: 'PANALO',
    loss: 'TALO',
    push: 'PUSH',
    analysis: 'Pagsusuri',
    showAnalysis: 'Ipakita ang Pagsusuri',
    hideAnalysis: 'Itago ang Pagsusuri',
    vs: 'VS',
  },
  en: {
    rounds: 'Rounds',
    record: 'Record',
    pick: 'Pick',
    odds: 'Odds',
    confidence: 'Confidence',
    win: 'WIN',
    loss: 'LOSS',
    push: 'PUSH',
    analysis: 'Analysis',
    showAnalysis: 'Show Analysis',
    hideAnalysis: 'Hide Analysis',
    vs: 'VS',
  },
} as const;

const resultColors: Record<string, { bg: string; text: string }> = {
  win: { bg: 'rgba(16, 185, 129, 0.2)', text: '#34d399' },
  loss: { bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171' },
  push: { bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24' },
};

const confidenceColors: Record<string, { bg: string; text: string }> = {
  high: { bg: 'rgba(16, 185, 129, 0.12)', text: '#34d399' },
  medium: { bg: 'rgba(245, 158, 11, 0.12)', text: '#fbbf24' },
  low: { bg: 'rgba(156, 163, 175, 0.12)', text: '#9ca3af' },
};

function formatMatchDate(isoDate: string, lang: 'tl' | 'en'): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat(lang === 'tl' ? 'fil-PH' : 'en-PH', {
    timeZone: 'Asia/Manila',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

import { useState } from 'react';

export default function FightCard({ prediction, lang, expanded = false }: Props) {
  const t = translations[lang];
  const [showAnalysis, setShowAnalysis] = useState(expanded);

  const fighter1 = prediction.home_team?.name || 'Fighter 1';
  const fighter2 = prediction.away_team?.name || 'Fighter 2';
  const pickLabel = lang === 'tl' ? prediction.pick_label_tl : prediction.pick_label_en;
  const analysisText = lang === 'tl' ? prediction.analysis_tl : prediction.analysis_en;
  const matchDate = formatMatchDate(prediction.match_date, lang);

  const resultStyle = prediction.result ? resultColors[prediction.result] : null;
  const resultLabel = prediction.result
    ? t[prediction.result as keyof typeof t] || prediction.result.toUpperCase()
    : null;

  const confidenceStyle = prediction.confidence ? confidenceColors[prediction.confidence] : null;

  const detailUrl = lang === 'tl'
    ? `/tl/boksing/${prediction.slug}`
    : `/en/boxing/${prediction.slug}`;

  const cardContent = (
    <div
      className="rounded-xl overflow-hidden transition-shadow hover:shadow-lg"
      style={{
        backgroundColor: 'var(--t-bg-card, var(--t-surface, #1f2937))',
        border: '1px solid var(--t-border, #374151)',
        borderLeft: '4px solid #DC2626',
      }}
    >
      {/* Header: weight class + rounds + date */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{
          backgroundColor: 'rgba(220, 38, 38, 0.08)',
          borderBottom: '1px solid var(--t-border, #374151)',
        }}
      >
        <div className="flex items-center gap-2">
          {prediction.weight_class && (
            <span
              className="text-xs font-bold tracking-wider uppercase"
              style={{
                color: '#DC2626',
                fontFamily: "var(--font-display, 'Bebas Neue', sans-serif)",
              }}
            >
              {prediction.weight_class}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {prediction.scheduled_rounds && (
            <span
              className="text-xs font-semibold"
              style={{ color: 'var(--t-text-sec, #9ca3af)' }}
            >
              {prediction.scheduled_rounds} {t.rounds}
            </span>
          )}
          <span
            className="text-xs"
            style={{ color: 'var(--t-text-sec, #9ca3af)' }}
          >
            {matchDate}
          </span>
        </div>
      </div>

      {/* Fighters section */}
      <div className="px-4 py-5">
        <div className="flex items-center justify-between gap-3">
          {/* Fighter 1 */}
          <div className="flex-1 text-center">
            <p
              className="text-lg sm:text-xl font-bold leading-tight mb-1"
              style={{
                color: 'var(--t-text, #f9fafb)',
                fontFamily: "var(--font-display, 'Bebas Neue', sans-serif)",
                letterSpacing: '0.02em',
              }}
            >
              {fighter1}
            </p>
            {prediction.fighter_1_record && (
              <p className="text-xs" style={{ color: 'var(--t-text-sec, #9ca3af)' }}>
                {t.record}: {prediction.fighter_1_record}
              </p>
            )}
          </div>

          {/* VS divider */}
          <div
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(220, 38, 38, 0.15)',
            }}
          >
            <span
              className="text-xs font-bold"
              style={{
                color: '#DC2626',
                fontFamily: "var(--font-display, 'Bebas Neue', sans-serif)",
              }}
            >
              {t.vs}
            </span>
          </div>

          {/* Fighter 2 */}
          <div className="flex-1 text-center">
            <p
              className="text-lg sm:text-xl font-bold leading-tight mb-1"
              style={{
                color: 'var(--t-text, #f9fafb)',
                fontFamily: "var(--font-display, 'Bebas Neue', sans-serif)",
                letterSpacing: '0.02em',
              }}
            >
              {fighter2}
            </p>
            {prediction.fighter_2_record && (
              <p className="text-xs" style={{ color: 'var(--t-text-sec, #9ca3af)' }}>
                {t.record}: {prediction.fighter_2_record}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Prediction row */}
      <div
        className="px-4 py-3 flex items-center gap-2 flex-wrap"
        style={{ borderTop: '1px solid var(--t-border, #374151)' }}
      >
        <span className="text-xs" style={{ color: 'var(--t-text-sec, #9ca3af)' }}>
          {t.pick}:
        </span>
        <span
          className="text-sm font-semibold"
          style={{ color: 'var(--t-text, #f9fafb)' }}
        >
          {pickLabel}
        </span>

        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full ml-auto"
          style={{
            backgroundColor: 'rgba(220, 38, 38, 0.12)',
            color: '#DC2626',
            fontFamily: "var(--font-display, 'Bebas Neue', sans-serif)",
          }}
        >
          {t.odds} {Number(prediction.odds).toFixed(2)}
        </span>

        {confidenceStyle && prediction.confidence && (
          <span
            className="text-xs font-medium capitalize px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: confidenceStyle.bg,
              color: confidenceStyle.text,
            }}
          >
            {prediction.confidence}
          </span>
        )}

        {/* Result badge */}
        {prediction.status === 'settled' && resultStyle && resultLabel && (
          <span
            className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
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

      {/* Expandable analysis */}
      {analysisText && (
        <div style={{ borderTop: '1px solid var(--t-border, #374151)' }}>
          {!expanded && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowAnalysis(!showAnalysis);
              }}
              className="w-full px-4 py-2 text-xs font-medium text-left transition-colors"
              style={{ color: 'var(--brand-primary, #0F766E)' }}
            >
              {showAnalysis ? t.hideAnalysis : t.showAnalysis}
            </button>
          )}
          {showAnalysis && (
            <div
              className="px-4 pb-4 text-sm leading-relaxed"
              style={{ color: 'var(--t-text, #f9fafb)' }}
            >
              <h4
                className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{
                  color: 'var(--t-text-sec, #9ca3af)',
                  fontFamily: "var(--font-display, 'Bebas Neue', sans-serif)",
                }}
              >
                {t.analysis}
              </h4>
              {analysisText.split('\n\n').map((paragraph, i) => (
                <p key={i} className="mb-2 last:mb-0">{paragraph}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // If expanded (detail page), don't wrap in link
  if (expanded) {
    return cardContent;
  }

  return (
    <a href={detailUrl} className="block">
      {cardContent}
    </a>
  );
}
