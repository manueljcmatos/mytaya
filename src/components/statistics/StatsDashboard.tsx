import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { getStatistics, defaultStats } from '../../lib/statistics';
import type { StatsResult } from '../../lib/statistics';
import StatCard from './StatCard';
import ProfitChart from './ProfitChart';
import RecentPicks from './RecentPicks';

const translations = {
  tl: {
    allSports: 'Lahat ng Isports',
    football: 'Football',
    basketball: 'Basketball',
    winRate: 'Win Rate',
    roi: 'ROI',
    streak: 'Streak',
    recentPicks: 'Mga Kamakailang Hula',
    profitChart: 'Tsart ng Kita',
    noData: 'Wala pang datos',
    allTime: 'Lahat ng Oras',
    last7d: 'Huling 7 Araw',
    last30d: 'Huling 30 Araw',
    units: 'yunit',
    winsLabel: 'P',
    lossesLabel: 'T',
    loading: 'Naglo-load...',
  },
  en: {
    allSports: 'All Sports',
    football: 'Football',
    basketball: 'Basketball',
    winRate: 'Win Rate',
    roi: 'ROI',
    streak: 'Streak',
    recentPicks: 'Recent Picks',
    profitChart: 'Profit Chart',
    noData: 'No data yet',
    allTime: 'All Time',
    last7d: 'Last 7 Days',
    last30d: 'Last 30 Days',
    units: 'units',
    winsLabel: 'W',
    lossesLabel: 'L',
    loading: 'Loading...',
  },
} as const;

interface Props {
  lang: 'tl' | 'en';
}

const sportOptions = [
  { value: 'all', labelKey: 'allSports' as const },
  { value: 'football', labelKey: 'football' as const },
  { value: 'basketball', labelKey: 'basketball' as const },
];

const periodOptions = [
  { value: 7, labelKey: 'last7d' as const },
  { value: 30, labelKey: 'last30d' as const },
  { value: null, labelKey: 'allTime' as const },
];

export default function StatsDashboard({ lang }: Props) {
  const t = translations[lang];
  const [sport, setSport] = useState<string>('all');
  const [period, setPeriod] = useState<number | null>(null);
  const [stats, setStats] = useState<StatsResult>(defaultStats());
  const [loading, setLoading] = useState(true);

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  const hasSupabase = Boolean(supabaseUrl && supabaseAnonKey);

  const fetchStats = useCallback(async () => {
    if (!hasSupabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
      const result = await getStatistics(supabase, sport, period ?? undefined);
      setStats(result);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    } finally {
      setLoading(false);
    }
  }, [hasSupabase, supabaseUrl, supabaseAnonKey, sport, period]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const streakValue =
    stats.currentStreak.count > 0
      ? `${stats.currentStreak.type === 'win' ? 'W' : 'L'}${stats.currentStreak.count}`
      : '-';
  const streakColor = stats.currentStreak.type === 'win' ? '#22c55e' : '#ef4444';

  const totalProfit =
    stats.profitHistory.length > 0
      ? stats.profitHistory[stats.profitHistory.length - 1].cumProfit
      : 0;
  const profitDisplay = `${totalProfit > 0 ? '+' : ''}${totalProfit.toFixed(1)}`;

  const pillBase: React.CSSProperties = {
    padding: '0.5rem 1rem',
    borderRadius: '9999px',
    border: '1px solid var(--t-border, #374151)',
    backgroundColor: 'transparent',
    color: 'var(--t-text-sec, #9ca3af)',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500,
    transition: 'all 0.2s',
  };

  const pillActive: React.CSSProperties = {
    ...pillBase,
    backgroundColor: 'var(--brand-primary, #0F766E)',
    color: '#fff',
    borderColor: 'var(--brand-primary, #0F766E)',
  };

  const chipBase: React.CSSProperties = {
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    border: '1px solid var(--t-border, #374151)',
    backgroundColor: 'transparent',
    color: 'var(--t-text-sec, #9ca3af)',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: 500,
    transition: 'all 0.2s',
  };

  const chipActive: React.CSSProperties = {
    ...chipBase,
    backgroundColor: 'var(--brand-primary, #0F766E)',
    color: '#fff',
    borderColor: 'var(--brand-primary, #0F766E)',
  };

  const sectionTitle: React.CSSProperties = {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '1.5rem',
    color: 'var(--t-text, #f9fafb)',
    marginBottom: '1rem',
  };

  // Skeleton loader
  if (loading) {
    return (
      <div>
        {/* Sport tabs skeleton */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                ...pillBase,
                width: '100px',
                height: '36px',
                backgroundColor: 'var(--t-bg-card, #1f2937)',
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
          ))}
        </div>
        {/* Period chips skeleton */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                ...chipBase,
                width: '80px',
                height: '28px',
                backgroundColor: 'var(--t-bg-card, #1f2937)',
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
          ))}
        </div>
        {/* Stat cards skeleton */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                backgroundColor: 'var(--t-bg-card, #1f2937)',
                border: '1px solid var(--t-border, #374151)',
                borderRadius: '12px',
                padding: '1.25rem',
                height: '110px',
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
          ))}
        </div>
        {/* Chart skeleton */}
        <div
          style={{
            backgroundColor: 'var(--t-bg-card, #1f2937)',
            border: '1px solid var(--t-border, #374151)',
            borderRadius: '12px',
            height: '340px',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
      </div>
    );
  }

  // Empty state
  if (stats.totalPicks === 0 && stats.recentPicks.length === 0) {
    return (
      <div>
        {/* Sport tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          {sportOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSport(opt.value)}
              style={sport === opt.value ? pillActive : pillBase}
            >
              {t[opt.labelKey]}
            </button>
          ))}
        </div>
        {/* Period chips */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {periodOptions.map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => setPeriod(opt.value)}
              style={period === opt.value ? chipActive : chipBase}
            >
              {t[opt.labelKey]}
            </button>
          ))}
        </div>
        {/* Empty message */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4rem 2rem',
            color: 'var(--t-text-sec, #9ca3af)',
            gap: '1rem',
          }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <p style={{ fontSize: '1.125rem' }}>{t.noData}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Sport filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        {sportOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSport(opt.value)}
            style={sport === opt.value ? pillActive : pillBase}
          >
            {t[opt.labelKey]}
          </button>
        ))}
      </div>

      {/* Time period chips */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {periodOptions.map((opt) => (
          <button
            key={String(opt.value)}
            onClick={() => setPeriod(opt.value)}
            style={period === opt.value ? chipActive : chipBase}
          >
            {t[opt.labelKey]}
          </button>
        ))}
      </div>

      {/* Hero stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <StatCard
          title={t.winRate}
          value={`${stats.winRate.toFixed(1)}%`}
          subtitle={`${stats.wins}${t.winsLabel} - ${stats.losses}${t.lossesLabel}`}
        />
        <StatCard
          title={t.roi}
          value={`${stats.roi > 0 ? '+' : ''}${stats.roi.toFixed(1)}%`}
          subtitle={`${profitDisplay} ${t.units}`}
          valueColor={stats.roi >= 0 ? '#22c55e' : '#ef4444'}
        />
        <StatCard
          title={t.streak}
          value={streakValue}
          valueColor={stats.currentStreak.count > 0 ? streakColor : undefined}
        />
      </div>

      {/* Profit chart */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={sectionTitle}>{t.profitChart}</h3>
        <div
          style={{
            backgroundColor: 'var(--t-bg-card, #1f2937)',
            border: '1px solid var(--t-border, #374151)',
            borderRadius: '12px',
            padding: '1rem',
          }}
        >
          <ProfitChart data={stats.profitHistory} emptyMessage={t.noData} />
        </div>
      </div>

      {/* Recent picks table */}
      <div>
        <h3 style={sectionTitle}>{t.recentPicks}</h3>
        <div
          style={{
            backgroundColor: 'var(--t-bg-card, #1f2937)',
            border: '1px solid var(--t-border, #374151)',
            borderRadius: '12px',
            padding: '1rem',
          }}
        >
          <RecentPicks picks={stats.recentPicks} lang={lang} />
        </div>
      </div>
    </div>
  );
}
