const routeMap: Record<string, Record<string, string>> = {
  tl: {
    '/': '/',
    '/hula/': '/predictions/',
    '/resulta/': '/results/',
    '/blog/': '/blog/',
    '/mga-operator/': '/operators/',
  },
  en: {
    '/': '/',
    '/predictions/': '/hula/',
    '/results/': '/resulta/',
    '/blog/': '/blog/',
    '/operators/': '/mga-operator/',
  },
};

export function getAlternatePath(
  path: string,
  fromLang: string,
  toLang: string
): string {
  const map = routeMap[fromLang];
  if (!map) return path;

  // Normalize path to ensure trailing slash
  const normalizedPath = path.endsWith('/') ? path : path + '/';

  // Try exact match first
  if (map[normalizedPath]) return map[normalizedPath];

  // Then try prefix match for nested routes (e.g., /hula/some-slug/)
  for (const [from, to] of Object.entries(map)) {
    if (normalizedPath.startsWith(from) && from !== '/') {
      return normalizedPath.replace(from, to);
    }
  }

  return path; // Fallback: same path
}
