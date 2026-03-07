import type { RecentPick } from '../../lib/statistics';

const translations = {
  tl: {
    match: 'Laro',
    pick: 'Hula',
    result: 'Resulta',
    profit: 'Kita',
    win: 'PANALO',
    loss: 'TALO',
    push: 'PUSH',
    noData: 'Wala pang datos',
  },
  en: {
    match: 'Match',
    pick: 'Pick',
    result: 'Result',
    profit: 'Profit',
    win: 'WIN',
    loss: 'LOSS',
    push: 'PUSH',
    noData: 'No data yet',
  },
} as const;

interface Props {
  picks: RecentPick[];
  lang: 'tl' | 'en';
}

function getProfit(pick: RecentPick): number {
  if (pick.result === 'win') return Math.round((pick.odds - 1) * 100) / 100;
  if (pick.result === 'loss') return -1;
  return 0;
}

function formatProfit(profit: number): string {
  if (profit > 0) return `+${profit.toFixed(2)}`;
  return profit.toFixed(2);
}

export default function RecentPicks({ picks, lang }: Props) {
  const t = translations[lang];

  if (!picks || picks.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--t-text-sec, #9ca3af)' }}>
        {t.noData}
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.875rem',
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: '1px solid var(--t-border, #374151)',
              color: 'var(--t-text-sec, #9ca3af)',
              textTransform: 'uppercase',
              fontSize: '0.75rem',
              letterSpacing: '0.05em',
            }}
          >
            <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left' }}>{t.match}</th>
            <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left' }}>{t.pick}</th>
            <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>{t.result}</th>
            <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>{t.profit}</th>
          </tr>
        </thead>
        <tbody>
          {picks.map((pick, i) => {
            const profit = getProfit(pick);
            const label = lang === 'tl' ? pick.pick_label_tl : pick.pick_label_en;
            const resultLabel =
              pick.result === 'win' ? t.win : pick.result === 'loss' ? t.loss : t.push;
            const resultColor =
              pick.result === 'win'
                ? '#22c55e'
                : pick.result === 'loss'
                  ? '#ef4444'
                  : 'var(--t-text-sec, #9ca3af)';
            const profitColor = profit > 0 ? '#22c55e' : profit < 0 ? '#ef4444' : 'var(--t-text-sec, #9ca3af)';
            const detailPath =
              lang === 'tl' ? `/tl/hula/${pick.slug}/` : `/en/predictions/${pick.slug}/`;

            return (
              <tr
                key={pick.slug + i}
                style={{
                  borderBottom: '1px solid var(--t-border, #374151)',
                  color: 'var(--t-text, #f9fafb)',
                }}
              >
                <td style={{ padding: '0.75rem 0.5rem' }}>
                  <a
                    href={detailPath}
                    style={{
                      color: 'var(--brand-primary, #0F766E)',
                      textDecoration: 'none',
                    }}
                  >
                    {label || pick.pick}
                  </a>
                </td>
                <td style={{ padding: '0.75rem 0.5rem', color: 'var(--t-text-sec, #9ca3af)' }}>
                  {pick.pick}
                </td>
                <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#fff',
                      backgroundColor: resultColor,
                    }}
                  >
                    {resultLabel}
                  </span>
                </td>
                <td
                  style={{
                    padding: '0.75rem 0.5rem',
                    textAlign: 'right',
                    fontWeight: 600,
                    color: profitColor,
                  }}
                >
                  {formatProfit(profit)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
