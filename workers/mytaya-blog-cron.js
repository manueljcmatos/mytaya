// mytaya-blog-cron — Generates 3 blog posts daily
// Cron schedule: 04:00, 08:00, 12:00 UTC (12h, 16h, 20h PHT)
// Topics rotate: prediction analysis, sports trivia, sports news

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

// Sanitize AI-generated JSON before parsing
function sanitizeAndParseJSON(text) {
  const start = text.indexOf('{');
  if (start === -1) throw new Error('No JSON found in response');
  let depth = 0;
  let inString = false;
  let escaped = false;
  let end = -1;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    if (ch === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) throw new Error('Unbalanced JSON braces');
  let json = text.substring(start, end + 1);
  json = json.replace(/,\s*([}\]])/g, '$1');
  json = json.replace(/(?<=:\s*"[^"]*)\n(?=[^"]*")/g, '\\n');
  return JSON.parse(json);
}

async function runAIWithRetry(env, messages, maxTokens, temperature, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages,
      max_tokens: maxTokens,
      temperature: attempt === 0 ? temperature : Math.max(0.3, temperature - 0.2),
    });
    const text = response.response || '';
    try {
      return sanitizeAndParseJSON(text);
    } catch (e) {
      console.error(`[blog-cron] JSON parse attempt ${attempt + 1} failed: ${e.message}`);
      if (attempt === maxRetries) throw e;
    }
  }
}

// Fetch a free sports image from Unsplash
async function fetchBlogImage(subject) {
  try {
    // Use Unsplash source for a direct image URL (no API key needed)
    const query = encodeURIComponent(subject.replace(/[^a-zA-Z0-9\s]/g, ''));
    // Unsplash source gives a redirect to a random matching image
    const url = `https://source.unsplash.com/800x450/?${query},sports`;
    const res = await fetch(url, { redirect: 'follow' });
    if (res.ok && res.url) {
      console.log(`[blog-cron] Image found: ${res.url}`);
      return res.url;
    }
  } catch (e) {
    console.error(`[blog-cron] Image fetch failed: ${e.message}`);
  }
  return null;
}

// ===== BLOG POST TYPES =====

async function generateSportsTrivia(env) {
  const prompt = `Ikaw ay isang sports writer na Pilipino. Gumawa ng BLOG POST tungkol sa isang kawili-wiling trivia o fact sa sports para sa mga Filipino readers.

Gumawa ng JSON format (walang markdown):
{
  "title_tl": "Catchy na titulo sa Taglish (max 15 salita)",
  "title_en": "Catchy English title (max 15 words)",
  "content_tl": "Buong blog post sa Taglish, 3-4 na paragrapho. Gumamit ng ## para sa headings. May datos at statistics. Minimum 200 salita.",
  "content_en": "Full blog post in English, 3-4 paragraphs. Use ## for headings. Include stats and data. Minimum 200 words.",
  "excerpt_tl": "Maikli na summary sa Taglish (1-2 pangungusap)",
  "excerpt_en": "Short English summary (1-2 sentences)",
  "sport": "basketball",
  "category": "tips",
  "imageSubject": "Short English description for image"
}

PAKSA (pumili ng random):
- Pacquiao records at achievements
- Efren Reyes billiards legacy
- Carlos Yulo Olympic glory
- Hidilyn Diaz weightlifting history
- PBA all-time records
- UAAP basketball legends
- Filipino boxing champions
- Gilas Pilipinas FIBA journey
- PVL volleyball stars
- June Mar Fajardo stats

MAHALAGA:
- sport field: pumili ng basketball, football, boxing, o general
- Gumamit ng Taglish sa TL version, natural na Filipino
- Content ay INFORMATIVE at may DATOS
- Isama ang 1xBet mention: "Para sa mga gustong sumubaybay sa mga laro, i-check ang 1xBet para sa live streaming at updates."`;

  return await runAIWithRetry(env, [{ role: 'user', content: prompt }], 2000, 0.8);
}

async function generateSportsNews(env) {
  const date = new Date().toLocaleDateString('fil-PH', { day: 'numeric', month: 'short', year: 'numeric' });
  const prompt = `Ikaw ay isang sports journalist na Pilipino. Gumawa ng BLOG POST tungkol sa pinakabagong balita sa sports ngayon (${getToday()}).

Gumawa ng JSON format (walang markdown):
{
  "title_tl": "Maikling titulo na catchy sa Taglish (max 12 salita)",
  "title_en": "Catchy English headline (max 12 words)",
  "content_tl": "Buong blog post sa Taglish. 3-4 paragrapho na may ## headings. May analysis, opinyon, at datos. Min 200 salita.",
  "content_en": "Full blog post in English. 3-4 paragraphs with ## headings. Include analysis, opinion, data. Min 200 words.",
  "excerpt_tl": "Maikli na summary sa Taglish (1-2 pangungusap)",
  "excerpt_en": "Short English summary (1-2 sentences)",
  "sport": "basketball",
  "category": "news",
  "imageSubject": "Short English description for image"
}

SAKLAWIN: PBA, NBA, UAAP, boxing, volleyball (PVL), billiards, Olympics, football
MAHALAGA:
- sport field: basketball, football, boxing, o general
- May opinyon na matapang pero may basehan
- Taglish sa TL version
- Isama ang link mention sa dulo: "Sumubaybay sa mga laro sa 1xBet — may live streaming at bet builder features."`;

  return await runAIWithRetry(env, [{ role: 'user', content: prompt }], 2000, 0.7);
}

async function generatePredictionAnalysis(env) {
  // Fetch today's predictions from Supabase
  const url = `${env.SUPABASE_URL}/rest/v1/predictions?select=id,pick,odds,stake,confidence,match_date,home_team:teams!home_team_id(name),away_team:teams!away_team_id(name),league:leagues!league_id(name)&match_date=gte.${getToday()}&status=eq.pending&published_site=eq.true&order=confidence.desc&limit=3`;
  const res = await fetch(url, {
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
    },
  });
  const predictions = res.ok ? await res.json() : [];

  if (predictions.length === 0) {
    // No predictions — write general analysis
    return generateSportsTrivia(env);
  }

  const matchesText = predictions
    .map(p => `${p.home_team.name} vs ${p.away_team.name} (${p.league.name}) — Pick: ${p.pick}, Confidence: ${p.confidence}`)
    .join('\n');

  const prompt = `Ikaw ay isang sports analyst na Pilipino. Gumawa ng BLOG POST na nag-aanalyze ng mga laro ngayon.

Mga laro ngayon:
${matchesText}

Gumawa ng JSON format (walang markdown):
{
  "title_tl": "Catchy na titulo sa Taglish tungkol sa analysis (max 12 salita)",
  "title_en": "Catchy English title about analysis (max 12 words)",
  "content_tl": "Buong blog post sa Taglish. 4-5 paragrapho na may ## headings para sa bawat laro. May historical data, form analysis, at prediction. Min 250 salita.",
  "content_en": "Full English blog post. 4-5 paragraphs with ## headings per match. Include historical data, form analysis, prediction. Min 250 words.",
  "excerpt_tl": "Maikli na summary ng analysis (1-2 pangungusap)",
  "excerpt_en": "Short analysis summary (1-2 sentences)",
  "sport": "football",
  "category": "analysis",
  "imageSubject": "football match stadium atmosphere"
}

MAHALAGA:
- HUWAG banggitin ang odds, taya, o betting amounts
- Gumamit ng "probabilidad" at "analysis" hindi "bet" o "taya"
- Taglish sa TL version
- Isama sa dulo: "Para sa kumpletong analysis at live updates, i-check ang 1xBet."`;

  return await runAIWithRetry(env, [{ role: 'user', content: prompt }], 2500, 0.7);
}

// ===== INSERT INTO SUPABASE =====

async function insertBlogPost(env, post, imageUrl) {
  const today = getToday();
  const timestamp = Date.now();
  const slugBase = slugify(post.title_en);

  const body = {
    slug: `${slugBase}-${timestamp}`,
    slug_en: `${slugBase}-${timestamp}`,
    slug_tl: `${slugify(post.title_tl)}-${timestamp}`,
    title_en: post.title_en,
    title_tl: post.title_tl,
    content_en: post.content_en,
    content_tl: post.content_tl,
    excerpt_en: post.excerpt_en || post.content_en.substring(0, 150),
    excerpt_tl: post.excerpt_tl || post.content_tl.substring(0, 150),
    sport: ['basketball', 'football', 'boxing', 'general'].includes(post.sport) ? post.sport : 'general',
    category: ['news', 'analysis', 'tips', 'boxing'].includes(post.category) ? post.category : 'news',
    featured_image_url: imageUrl,
    is_published: true,
    published_at: new Date().toISOString(),
    read_time_minutes: Math.max(2, Math.ceil((post.content_en || '').split(/\s+/).length / 200)),
  };

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/posts`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase insert failed (${res.status}): ${err}`);
  }

  console.log(`[blog-cron] Published: "${post.title_en}" (${body.sport}/${body.category})`);
  return body.slug_en;
}

// ===== MAIN =====

async function generateAndPublish(env, type) {
  let post;
  if (type === 'trivia') {
    post = await generateSportsTrivia(env);
  } else if (type === 'news') {
    post = await generateSportsNews(env);
  } else {
    post = await generatePredictionAnalysis(env);
  }

  if (!post || !post.title_en || !post.content_en) {
    console.error(`[blog-cron] AI returned incomplete post for type: ${type}`);
    return;
  }

  // Fetch image
  const imageUrl = post.imageSubject
    ? await fetchBlogImage(post.imageSubject)
    : null;

  await insertBlogPost(env, post, imageUrl);
}

async function runAndCapture(fn) {
  const logs = [];
  const origLog = console.log;
  const origErr = console.error;
  console.log = (...args) => { logs.push('[LOG] ' + args.join(' ')); origLog(...args); };
  console.error = (...args) => { logs.push('[ERR] ' + args.join(' ')); origErr(...args); };
  try {
    await fn();
    logs.push('[DONE] Complete.');
  } catch (e) {
    logs.push('[FATAL] ' + e.message + '\n' + e.stack);
  }
  console.log = origLog;
  console.error = origErr;
  return new Response(logs.join('\n'), { headers: { 'Content-Type': 'text/plain' } });
}

export default {
  async scheduled(event, env, ctx) {
    const hour = new Date().getUTCHours();
    console.log(`[blog-cron] Starting at ${hour}:00 UTC on ${getToday()}`);

    // 3 posts per day, rotating types:
    //   04:00 UTC (12h PHT): Sports trivia / fun facts
    //   08:00 UTC (16h PHT): Sports news / current events
    //   12:00 UTC (20h PHT): Prediction analysis (if available) or trivia
    if (hour === 4) {
      await generateAndPublish(env, 'trivia');
    } else if (hour === 8) {
      await generateAndPublish(env, 'news');
    } else if (hour === 12) {
      await generateAndPublish(env, 'analysis');
    }
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/run/trivia') {
      return runAndCapture(() => generateAndPublish(env, 'trivia'));
    }
    if (url.pathname === '/run/news') {
      return runAndCapture(() => generateAndPublish(env, 'news'));
    }
    if (url.pathname === '/run/analysis') {
      return runAndCapture(() => generateAndPublish(env, 'analysis'));
    }
    if (url.pathname === '/run/all') {
      return runAndCapture(async () => {
        await generateAndPublish(env, 'trivia');
        await generateAndPublish(env, 'news');
        await generateAndPublish(env, 'analysis');
      });
    }

    return new Response(
      'mytaya-blog-cron worker\n\nEndpoints:\n  /run/trivia    — sports trivia post\n  /run/news      — sports news post\n  /run/analysis  — prediction analysis post\n  /run/all       — all 3 types',
      { headers: { 'Content-Type': 'text/plain' } }
    );
  },
};
