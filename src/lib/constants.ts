// Supported sports
export const SPORTS = ['basketball', 'football', 'boxing'] as const;
export type Sport = (typeof SPORTS)[number];

// Navigation items (used by Header component)
export const NAV_ITEMS = [
  { key: 'nav.predictions' as const, path: { tl: '/tl/hula/', en: '/en/predictions/' } },
  { key: 'nav.boxing' as const, path: { tl: '/tl/boksing/', en: '/en/boxing/' } },
  { key: 'nav.results' as const, path: { tl: '/tl/resulta/', en: '/en/results/' } },
  { key: 'nav.blog' as const, path: { tl: '/tl/blog/', en: '/en/blog/' } },
  { key: 'nav.operators' as const, path: { tl: '/tl/mga-operator/', en: '/en/operators/' } },
] as const;

// Social links
export const SOCIAL_LINKS = {
  telegram: 'https://t.me/mytaya',
} as const;

// Site metadata
export const SITE = {
  name: 'MyTaya',
  domain: 'mytaya.com',
  url: 'https://mytaya.com',
  defaultLocale: 'tl' as const,
  locales: ['tl', 'en'] as const,
} as const;

// Confidence levels
export const CONFIDENCE_LEVELS = ['high', 'medium', 'low'] as const;
export type Confidence = (typeof CONFIDENCE_LEVELS)[number];

// Prediction result types
export const RESULT_TYPES = ['win', 'loss', 'push', 'void'] as const;
export type ResultType = (typeof RESULT_TYPES)[number];

// Prediction status types
export const STATUS_TYPES = ['pending', 'settled', 'cancelled'] as const;
export type StatusType = (typeof STATUS_TYPES)[number];
