import { SITE } from './constants';

// --- Type definitions ---

export interface SportsEventInput {
  title: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  startDate: string; // ISO 8601
  venue?: string;
  url: string;
  description?: string;
}

export interface BlogPostingInput {
  title: string;
  description: string;
  datePublished: string; // ISO 8601
  dateModified?: string;
  author?: string;
  image?: string;
  url: string;
  lang: 'tl' | 'en';
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

// --- Schema builder functions ---

/**
 * Builds a SportsEvent JSON-LD object for prediction pages.
 * Produces valid Schema.org markup with homeTeam, awayTeam, startDate, sport.
 */
export function buildSportsEventSchema(prediction: SportsEventInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: prediction.title,
    description: prediction.description,
    startDate: prediction.startDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/MixedEventAttendanceMode',
    sport: prediction.sport,
    homeTeam: {
      '@type': 'SportsTeam',
      name: prediction.homeTeam,
    },
    awayTeam: {
      '@type': 'SportsTeam',
      name: prediction.awayTeam,
    },
    ...(prediction.venue && {
      location: {
        '@type': 'Place',
        name: prediction.venue,
      },
    }),
    url: prediction.url,
  };
}

/**
 * Builds a BlogPosting JSON-LD object for blog/article pages.
 * Includes publisher as Organization (MyTaya), inLanguage, mainEntityOfPage.
 */
export function buildBlogPostingSchema(post: BlogPostingInput): Record<string, unknown> {
  const inLanguage = post.lang === 'tl' ? 'fil' : 'en';

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.datePublished,
    ...(post.dateModified && { dateModified: post.dateModified }),
    inLanguage,
    author: {
      '@type': 'Person',
      name: post.author || SITE.name,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.url,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE.url}/icon-512.png`,
      },
    },
    ...(post.image && {
      image: {
        '@type': 'ImageObject',
        url: post.image,
      },
    }),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': post.url,
    },
    url: post.url,
  };
}

/**
 * Builds a site-wide Organization JSON-LD for YMYL trust signals.
 */
export function buildOrganizationSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    url: SITE.url,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE.url}/icon-512.png`,
    },
  };
}

/**
 * Builds a BreadcrumbList JSON-LD for navigation structure.
 */
export function buildBreadcrumbSchema(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
