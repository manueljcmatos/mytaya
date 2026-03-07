import { supabase } from './supabase';

const POST_FIELDS = `
  id, title_en, title_tl, slug_en, slug_tl,
  excerpt_en, excerpt_tl, content_en, content_tl,
  sport, published_at, read_time_minutes, is_published,
  prediction_id
`;

export async function getBlogPosts(
  page = 1,
  perPage = 12,
  sport?: string
): Promise<{ data: any[]; count: number }> {
  if (!supabase) return { data: [], count: 0 };

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from('posts')
    .select(POST_FIELDS, { count: 'exact' })
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .range(from, to);

  if (sport && sport !== 'all') {
    query = query.eq('sport', sport);
  }

  const { data, count } = await query;
  return { data: data || [], count: count || 0 };
}

export async function getBlogPostBySlug(
  slug: string,
  lang: 'tl' | 'en'
): Promise<any | null> {
  if (!supabase) return null;

  const slugColumn = lang === 'tl' ? 'slug_tl' : 'slug_en';

  const { data } = await supabase
    .from('posts')
    .select(`
      ${POST_FIELDS},
      prediction:predictions!posts_prediction_id_fkey(slug, result, status)
    `)
    .eq(slugColumn, slug)
    .eq('is_published', true)
    .single();

  return data;
}

export async function getAllBlogSlugs(): Promise<
  { slug_en: string; slug_tl: string }[]
> {
  if (!supabase) return [];

  const { data } = await supabase
    .from('posts')
    .select('slug_en, slug_tl')
    .eq('is_published', true);

  return data || [];
}
