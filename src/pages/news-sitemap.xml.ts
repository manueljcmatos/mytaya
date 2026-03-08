import type { APIRoute } from 'astro';
import { supabase } from '../lib/supabase';
import { SITE } from '../lib/constants';

export const GET: APIRoute = async () => {
  let entries = '';

  if (supabase) {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const { data: posts } = await supabase
      .from('posts')
      .select('title_en, title_tl, slug, published_at')
      .eq('is_published', true)
      .gte('published_at', twoDaysAgo.toISOString())
      .order('published_at', { ascending: false });

    if (posts && posts.length > 0) {
      for (const post of posts) {
        const pubDate = new Date(post.published_at).toISOString();

        entries += `
  <url>
    <loc>${SITE.url}/en/blog/${post.slug}/</loc>
    <news:news>
      <news:publication>
        <news:name>${SITE.name}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapeXml(post.title_en)}</news:title>
    </news:news>
  </url>
  <url>
    <loc>${SITE.url}/tl/blog/${post.slug}/</loc>
    <news:news>
      <news:publication>
        <news:name>${SITE.name}</news:name>
        <news:language>fil</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapeXml(post.title_tl)}</news:title>
    </news:news>
  </url>`;
      }
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${entries}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
