import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const translations = {
  tl: {
    featured: 'Tampok na Artikulo',
    readMore: 'Basahin pa',
    readTime: 'min basahin',
    filterAll: 'Lahat',
    football: 'Football',
    basketball: 'Basketball',
    noArticles: 'Wala pang mga artikulo.',
    loading: 'Naglo-load...',
    prev: 'Nakaraan',
    next: 'Susunod',
    win: 'PANALO',
    loss: 'TALO',
    push: 'PUSH',
  },
  en: {
    featured: 'Featured Article',
    readMore: 'Read more',
    readTime: 'min read',
    filterAll: 'All',
    football: 'Football',
    basketball: 'Basketball',
    noArticles: 'No articles yet.',
    loading: 'Loading...',
    prev: 'Previous',
    next: 'Next',
    win: 'WIN',
    loss: 'LOSS',
    push: 'PUSH',
  },
} as const;

interface BlogPost {
  id: string;
  title_en: string;
  title_tl: string;
  slug_en: string;
  slug_tl: string;
  excerpt_en: string | null;
  excerpt_tl: string | null;
  sport: string;
  published_at: string;
  read_time_minutes: number | null;
  prediction_id: string | null;
  prediction?: {
    slug: string;
    result: string | null;
    status: string;
  } | null;
}

interface Props {
  lang: 'tl' | 'en';
}

const PER_PAGE = 12;

const sportIcons: Record<string, string> = {
  football: '\u26BD',
  basketball: '\uD83C\uDFC0',
};

function formatDate(isoDate: string, lang: 'tl' | 'en'): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat(lang === 'tl' ? 'fil-PH' : 'en-PH', {
    timeZone: 'Asia/Manila',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function getSportBadgeColor(sport: string): { bg: string; text: string } {
  if (sport === 'basketball') {
    return { bg: 'rgba(249, 115, 22, 0.15)', text: '#f97316' };
  }
  // football (teal)
  return { bg: 'rgba(15, 118, 110, 0.15)', text: 'var(--brand-primary, #0F766E)' };
}

function getResultBadge(
  result: string | null,
  t: { win: string; loss: string; push: string }
): { label: string; bg: string; text: string } | null {
  if (!result) return null;
  const map: Record<string, { label: string; bg: string; text: string }> = {
    win: { label: t.win, bg: 'rgba(16, 185, 129, 0.2)', text: '#34d399' },
    loss: { label: t.loss, bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171' },
    push: { label: t.push, bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24' },
  };
  return map[result] || null;
}

export default function BlogList({ lang }: Props) {
  const t = translations[lang];
  const [sport, setSport] = useState<string>('all');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  const hasSupabase = Boolean(supabaseUrl && supabaseAnonKey);

  const fetchPosts = useCallback(async () => {
    if (!hasSupabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
    const from = (page - 1) * PER_PAGE;
    const to = from + PER_PAGE - 1;

    const fields = `
      id, title_en, title_tl, slug_en, slug_tl,
      excerpt_en, excerpt_tl, sport, published_at,
      read_time_minutes, prediction_id,
      prediction:predictions!posts_prediction_id_fkey(slug, result, status)
    `;

    let query = supabase
      .from('posts')
      .select(fields, { count: 'exact' })
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .range(from, to);

    if (sport !== 'all') {
      query = query.eq('sport', sport);
    }

    const { data, count } = await query;
    setPosts((data as unknown as BlogPost[]) || []);
    setTotalCount(count || 0);
    setLoading(false);
  }, [hasSupabase, supabaseUrl, supabaseAnonKey, page, sport]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSportChange = (newSport: string) => {
    setSport(newSport);
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / PER_PAGE);
  const blogBase = `/${lang}/blog`;

  const sportTabs = [
    { key: 'all', label: t.filterAll },
    { key: 'football', label: t.football },
    { key: 'basketball', label: t.basketball },
  ];

  const featuredPost = posts.length > 0 ? posts[0] : null;
  const gridPosts = posts.length > 1 ? posts.slice(1) : [];

  const getTitle = (post: BlogPost) =>
    lang === 'tl' ? post.title_tl : post.title_en;
  const getExcerpt = (post: BlogPost) =>
    lang === 'tl' ? post.excerpt_tl : post.excerpt_en;
  const getSlug = (post: BlogPost) =>
    lang === 'tl' ? post.slug_tl : post.slug_en;

  return (
    <div>
      {/* Sport tabs */}
      <div className="flex gap-2 mb-6">
        {sportTabs.map((s) => (
          <button
            key={s.key}
            onClick={() => handleSportChange(s.key)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
            style={{
              backgroundColor:
                sport === s.key
                  ? 'var(--brand-primary, #0F766E)'
                  : 'var(--t-surface, #1f2937)',
              color: sport === s.key ? '#ffffff' : 'var(--t-text-sec, #9ca3af)',
              border:
                sport === s.key
                  ? 'none'
                  : '1px solid var(--t-border, #374151)',
            }}
          >
            {s.key !== 'all' && (
              <span className="mr-1.5" aria-hidden="true">
                {sportIcons[s.key] || ''}
              </span>
            )}
            {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl p-5"
              style={{
                backgroundColor: 'var(--t-surface, #1f2937)',
                height: i === 1 ? '200px' : '120px',
              }}
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div
          className="text-center py-12 rounded-xl border border-dashed"
          style={{
            borderColor: 'var(--t-border, #374151)',
            backgroundColor:
              'color-mix(in srgb, var(--t-bg-card, #111827) 50%, transparent)',
          }}
        >
          <div className="text-3xl mb-3" aria-hidden="true">
            {'\uD83D\uDCDD'}
          </div>
          <p
            className="text-sm"
            style={{ color: 'var(--t-text-sec, #9ca3af)' }}
          >
            {t.noArticles}
          </p>
        </div>
      ) : (
        <div>
          {/* Featured article hero */}
          {featuredPost && (
            <a
              href={`${blogBase}/${getSlug(featuredPost)}/`}
              className="block rounded-xl p-6 mb-8 transition-shadow hover:shadow-lg"
              style={{
                backgroundColor:
                  'var(--t-bg-card, var(--t-surface, #1f2937))',
                border: '1px solid var(--t-border, #374151)',
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: 'rgba(15, 118, 110, 0.15)',
                    color: 'var(--brand-primary, #0F766E)',
                  }}
                >
                  {t.featured}
                </span>
                {(() => {
                  const badge = getSportBadgeColor(featuredPost.sport);
                  return (
                    <span
                      className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: badge.bg, color: badge.text }}
                    >
                      {sportIcons[featuredPost.sport] || ''}{' '}
                      {featuredPost.sport}
                    </span>
                  );
                })()}
                {featuredPost.prediction?.result && (() => {
                  const rb = getResultBadge(featuredPost.prediction.result, t);
                  if (!rb) return null;
                  return (
                    <span
                      className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: rb.bg, color: rb.text }}
                    >
                      {rb.label}
                    </span>
                  );
                })()}
              </div>
              <h2
                className="text-2xl sm:text-3xl font-bold mb-3 leading-tight"
                style={{
                  color: 'var(--t-text, #f9fafb)',
                  fontFamily:
                    "var(--font-display, 'Bebas Neue', sans-serif)",
                }}
              >
                {getTitle(featuredPost)}
              </h2>
              {getExcerpt(featuredPost) && (
                <p
                  className="text-sm sm:text-base mb-4 leading-relaxed"
                  style={{ color: 'var(--t-text-sec, #9ca3af)' }}
                >
                  {getExcerpt(featuredPost)}
                </p>
              )}
              <div
                className="flex items-center gap-3 text-xs"
                style={{ color: 'var(--t-text-sec, #9ca3af)' }}
              >
                <span>{formatDate(featuredPost.published_at, lang)}</span>
                {featuredPost.read_time_minutes && (
                  <>
                    <span aria-hidden="true">&middot;</span>
                    <span>
                      {featuredPost.read_time_minutes} {t.readTime}
                    </span>
                  </>
                )}
              </div>
            </a>
          )}

          {/* Grid of remaining articles */}
          {gridPosts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gridPosts.map((post) => {
                const sportBadge = getSportBadgeColor(post.sport);
                const resultBadge = post.prediction?.result
                  ? getResultBadge(post.prediction.result, t)
                  : null;

                return (
                  <a
                    key={post.id}
                    href={`${blogBase}/${getSlug(post)}/`}
                    className="block rounded-xl p-4 transition-shadow hover:shadow-lg"
                    style={{
                      backgroundColor:
                        'var(--t-bg-card, var(--t-surface, #1f2937))',
                      border: '1px solid var(--t-border, #374151)',
                    }}
                  >
                    {/* Sport badge + result badge */}
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: sportBadge.bg,
                          color: sportBadge.text,
                        }}
                      >
                        {sportIcons[post.sport] || ''} {post.sport}
                      </span>
                      {resultBadge && (
                        <span
                          className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: resultBadge.bg,
                            color: resultBadge.text,
                          }}
                        >
                          {resultBadge.label}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3
                      className="text-base font-bold mb-2 leading-snug line-clamp-2"
                      style={{
                        color: 'var(--t-text, #f9fafb)',
                        fontFamily:
                          "var(--font-display, 'Bebas Neue', sans-serif)",
                      }}
                    >
                      {getTitle(post)}
                    </h3>

                    {/* Excerpt */}
                    {getExcerpt(post) && (
                      <p
                        className="text-xs mb-3 leading-relaxed line-clamp-2"
                        style={{ color: 'var(--t-text-sec, #9ca3af)' }}
                      >
                        {getExcerpt(post)}
                      </p>
                    )}

                    {/* Date + read time */}
                    <div
                      className="flex items-center gap-2 text-xs"
                      style={{ color: 'var(--t-text-sec, #9ca3af)' }}
                    >
                      <span>{formatDate(post.published_at, lang)}</span>
                      {post.read_time_minutes && (
                        <>
                          <span aria-hidden="true">&middot;</span>
                          <span>
                            {post.read_time_minutes} {t.readTime}
                          </span>
                        </>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className="w-9 h-9 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      backgroundColor:
                        page === pageNum
                          ? 'var(--brand-primary, #0F766E)'
                          : 'var(--t-surface, #1f2937)',
                      color:
                        page === pageNum
                          ? '#ffffff'
                          : 'var(--t-text-sec, #9ca3af)',
                      border:
                        page === pageNum
                          ? 'none'
                          : '1px solid var(--t-border, #374151)',
                    }}
                  >
                    {pageNum}
                  </button>
                )
              )}
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
