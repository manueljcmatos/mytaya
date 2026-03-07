import type { APIRoute } from 'astro';

/**
 * Google News Sitemap endpoint.
 *
 * Currently generates a valid but empty news sitemap.
 * Blog posts will be added here when created in Phase 5.
 *
 * @see https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
 */
export const GET: APIRoute = () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  <!-- Blog post entries will be populated in Phase 5 when content pages are created -->
</urlset>`;

  return new Response(xml.trim(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
