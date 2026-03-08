import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import FightCard from './FightCard';
import type { BoxingPrediction } from './FightCard';

const translations = {
  tl: {
    upcoming: 'Mga Paparating na Laban',
    past: 'Mga Nakaraang Laban',
    noUpcoming: 'Walang paparating na laban',
    noPast: 'Wala pang mga nakaraang laban',
    loadMore: 'Mag-load Pa',
    loading: 'Naglo-load...',
  },
  en: {
    upcoming: 'Upcoming Fights',
    past: 'Past Fights',
    noUpcoming: 'No upcoming fights',
    noPast: 'No past fights yet',
    loadMore: 'Load More',
    loading: 'Loading...',
  },
} as const;

const PER_PAGE = 10;

interface Props {
  lang: 'tl' | 'en';
  publicUrl: string;
  publicKey: string;
}

export default function BoxingList({ lang, publicUrl, publicKey }: Props) {
  const t = translations[lang];
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [predictions, setPredictions] = useState<BoxingPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);

  const hasSupabase = Boolean(publicUrl && publicKey);

  const fetchPredictions = useCallback(async (pageNum: number, append: boolean = false) => {
    if (!hasSupabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const supabase = createClient(publicUrl, publicKey);
    const now = new Date().toISOString();

    const fields = `
      id, slug, pick_label_tl, pick_label_en, analysis_tl, analysis_en,
      odds, confidence, match_date, fighter_1_record, fighter_2_record,
      weight_class, scheduled_rounds, result, status, card_image_url,
      home_team:teams!predictions_home_team_id_fkey(name),
      away_team:teams!predictions_away_team_id_fkey(name)
    `;

    let query = supabase
      .from('predictions')
      .select(fields)
      .eq('published_site', true)
      .eq('sport', 'boxing');

    if (tab === 'upcoming') {
      query = query
        .eq('status', 'pending')
        .gte('match_date', now)
        .order('match_date', { ascending: true });
    } else {
      query = query
        .eq('status', 'settled')
        .order('match_date', { ascending: false });
    }

    const from = pageNum * PER_PAGE;
    const to = from + PER_PAGE;
    query = query.range(from, to);

    const { data } = await query;
    // Supabase returns joins as arrays; flatten to single objects
    const items: BoxingPrediction[] = (data || []).map((row: Record<string, unknown>) => ({
      ...row,
      home_team: Array.isArray(row.home_team) ? row.home_team[0] || null : row.home_team || null,
      away_team: Array.isArray(row.away_team) ? row.away_team[0] || null : row.away_team || null,
    })) as BoxingPrediction[];

    // If we got PER_PAGE+1 items, there are more
    if (items.length > PER_PAGE) {
      setHasMore(true);
      items.pop();
    } else {
      setHasMore(false);
    }

    if (append) {
      setPredictions(prev => [...prev, ...items]);
    } else {
      setPredictions(items);
    }
    setLoading(false);
  }, [hasSupabase, publicUrl, publicKey, tab]);

  useEffect(() => {
    setPage(0);
    fetchPredictions(0);
  }, [fetchPredictions]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPredictions(nextPage, true);
  };

  const handleTabChange = (newTab: 'upcoming' | 'past') => {
    setTab(newTab);
    setPage(0);
  };

  return (
    <div>
      {/* Tab buttons */}
      <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ backgroundColor: 'var(--t-surface, #1f2937)' }}>
        <button
          onClick={() => handleTabChange('upcoming')}
          className="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors"
          style={{
            backgroundColor: tab === 'upcoming' ? '#DC2626' : 'transparent',
            color: tab === 'upcoming' ? '#ffffff' : 'var(--t-text-sec, #9ca3af)',
          }}
        >
          {t.upcoming}
        </button>
        <button
          onClick={() => handleTabChange('past')}
          className="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors"
          style={{
            backgroundColor: tab === 'past' ? '#DC2626' : 'transparent',
            color: tab === 'past' ? '#ffffff' : 'var(--t-text-sec, #9ca3af)',
          }}
        >
          {t.past}
        </button>
      </div>

      {/* Content */}
      {loading && predictions.length === 0 ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl p-5"
              style={{ backgroundColor: 'var(--t-surface, #1f2937)', height: '140px' }}
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
          <div className="text-3xl mb-3" aria-hidden="true">&#x1F94A;</div>
          <p className="text-sm" style={{ color: 'var(--t-text-sec, #9ca3af)' }}>
            {tab === 'upcoming' ? t.noUpcoming : t.noPast}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {predictions.map((pred) => (
            <FightCard key={pred.id} prediction={pred} lang={lang} />
          ))}

          {/* Load More */}
          {hasMore && (
            <div className="text-center mt-4">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: 'rgba(220, 38, 38, 0.1)',
                  color: '#DC2626',
                  border: '1px solid rgba(220, 38, 38, 0.3)',
                }}
              >
                {loading ? t.loading : t.loadMore}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
