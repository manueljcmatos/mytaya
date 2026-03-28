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
  const prompt = `Ikaw ay isang EXPERT sports writer na Pilipino na gumagawa ng in-depth, well-researched articles. Gumawa ng MAHABANG blog post tungkol sa isang kawili-wiling trivia o fact sa sports para sa Filipino readers.

Gumawa ng JSON format (walang markdown):
{
  "title_tl": "SEO-optimized na titulo sa Taglish na may keyword (max 15 salita). Halimbawa: '10 Records ni Manny Pacquiao na Hindi Mo Alam' o 'Ang Kasaysayan ng PBA: 5 Pinakamagaling na Player ng Lahat ng Panahon'",
  "title_en": "SEO-optimized English title with target keyword (max 15 words). Example: '10 Manny Pacquiao Records You Didn't Know About' or 'PBA History: Top 5 Greatest Players of All Time'",
  "content_tl": "MAHABANG blog post sa Taglish na may MINIMUM 800 salita. KAILANGAN: 5-7 sections na may ## headings. Bawat section ay may 2-3 paragrapho. Isama ang: specific statistics, dates, names, records, comparisons. Gumamit ng numbered lists o bullet points. Magdagdag ng FAQ section sa dulo na may 2-3 tanong at sagot. Ang bawat paragrapho ay MAHABA at DETALYADO.",
  "content_en": "LONG blog post in English with MINIMUM 800 words. MUST HAVE: 5-7 sections with ## headings. Each section has 2-3 paragraphs. Include: specific statistics, dates, names, records, comparisons. Use numbered lists or bullet points. Add FAQ section at the end with 2-3 questions and answers. Each paragraph must be DETAILED and INFORMATIVE.",
  "excerpt_tl": "Compelling summary sa Taglish na may keyword (2-3 pangungusap, max 160 characters)",
  "excerpt_en": "Compelling English summary with target keyword (2-3 sentences, max 160 characters)",
  "sport": "basketball",
  "category": "tips",
  "imageSubject": "Short English description for image",
  "metaKeyword": "main target keyword for this article in English (e.g. 'Manny Pacquiao records', 'PBA greatest players')"
}

PAKSA (pumili ng random):
- Pacquiao records at achievements (boxing records, world titles, weight classes)
- Efren Reyes billiards legacy (world championships, notable matches)
- Carlos Yulo Olympic glory (gymnastics medals, training journey)
- Hidilyn Diaz weightlifting history (Olympic gold, records)
- PBA all-time records (scoring, assists, championships)
- UAAP basketball legends (dynasties, records, notable players)
- Filipino boxing champions (world champions list, history)
- Gilas Pilipinas FIBA journey (World Cup, Asian Games)
- PVL volleyball stars (Alas Pilipinas, top players)
- June Mar Fajardo stats (MVP awards, career milestones)

MAHALAGA:
- sport field: pumili ng basketball, football, boxing, o general
- Gumamit ng natural na Taglish sa TL version
- Content ay DEEPLY INFORMATIVE — may SPECIFIC dates, numbers, records
- MINIMUM 800 words bawat version — mas mahaba mas maganda
- May FAQ section sa dulo
- Isama ang 1xBet mention sa isang natural na paraan: "Para sa mga gustong sumubaybay sa mga laro, i-check ang 1xBet para sa live streaming at updates."`;

  return await runAIWithRetry(env, [{ role: 'user', content: prompt }], 4000, 0.8);
}

async function generateSportsNews(env) {
  const date = new Date().toLocaleDateString('fil-PH', { day: 'numeric', month: 'short', year: 'numeric' });
  const prompt = `Ikaw ay isang SENIOR sports journalist na Pilipino na kilala sa malalim na analysis. Gumawa ng MAHABANG BLOG POST tungkol sa pinakabagong balita sa sports ngayon (${getToday()}).

Gumawa ng JSON format (walang markdown):
{
  "title_tl": "SEO-optimized na titulo sa Taglish na may keyword at petsa (max 15 salita). Halimbawa: 'PBA Philippine Cup 2026: Sino ang Paborito sa Finals?' o 'NBA Playoffs Update: Pinoy Fans Abangan ang Lakers vs Celtics'",
  "title_en": "SEO-optimized English headline with keyword and date reference (max 15 words)",
  "content_tl": "MAHABANG blog post sa Taglish na may MINIMUM 800 salita. KAILANGAN: ## Introduction (background at context), ## Ano ang Nangyari (detailed account ng balita), ## Analysis (bakit ito importante, epekto sa liga/sport), ## Reaksyon (quotes o opinyon ng mga eksperto/fans), ## Ano ang Susunod (predictions at expectations), ## FAQ (2-3 tanong at sagot). Bawat section ay may 2-3 paragrapho na DETALYADO.",
  "content_en": "LONG blog post in English with MINIMUM 800 words. MUST HAVE: ## Introduction (background and context), ## What Happened (detailed account), ## Analysis (why it matters, impact), ## Reactions (expert opinions, fan perspectives), ## What's Next (predictions, expectations), ## FAQ (2-3 questions and answers). Each section has 2-3 DETAILED paragraphs.",
  "excerpt_tl": "Compelling summary sa Taglish na may keyword (2-3 pangungusap, max 160 characters)",
  "excerpt_en": "Compelling English summary with target keyword (2-3 sentences, max 160 characters)",
  "sport": "basketball",
  "category": "news",
  "imageSubject": "Short English description for image",
  "metaKeyword": "main target keyword (e.g. 'PBA Philippine Cup 2026', 'NBA playoffs update March 2026')"
}

SAKLAWIN: PBA, NBA, UAAP, boxing, volleyball (PVL), billiards, Olympics, football
MAHALAGA:
- sport field: basketball, football, boxing, o general
- May opinyon na matapang pero may basehan sa datos
- MINIMUM 800 words bawat version
- Natural na Taglish sa TL version
- Isama ang specific dates, scores, statistics, player names
- May FAQ section sa dulo
- Isama ang link mention sa natural na paraan: "Sumubaybay sa mga laro sa 1xBet — may live streaming at bet builder features."`;

  return await runAIWithRetry(env, [{ role: 'user', content: prompt }], 4000, 0.7);
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

  const prompt = `Ikaw ay isang EXPERT sports analyst na Pilipino na kilala sa data-driven analysis. Gumawa ng MAHABANG BLOG POST na nag-aanalyze ng mga laro ngayon.

Mga laro ngayon:
${matchesText}

Gumawa ng JSON format (walang markdown):
{
  "title_tl": "SEO-optimized na titulo sa Taglish na may team names at petsa (max 15 salita). Halimbawa: 'Analysis: Lakers vs Celtics March 2026 — Sino ang Panalo?' o 'Preview ng PBA Finals 2026: San Miguel vs Ginebra'",
  "title_en": "SEO-optimized English title with team names and date (max 15 words)",
  "content_tl": "MAHABANG blog post sa Taglish na may MINIMUM 800 salita. KAILANGAN para sa BAWAT LARO: ## Match Preview (teams, standings, context), ## Head-to-Head Record (historical data, previous meetings, win/loss record), ## Key Players to Watch (stats, form, injuries), ## Form Analysis (last 5 games, home/away record), ## Prediction at Takeaway (analysis-based opinion). Sa dulo: ## FAQ (2-3 tanong at sagot tungkol sa mga laro).",
  "content_en": "LONG English blog post with MINIMUM 800 words. MUST HAVE per match: ## Match Preview, ## Head-to-Head Record, ## Key Players to Watch, ## Form Analysis (last 5 games), ## Prediction and Takeaway. At end: ## FAQ (2-3 questions and answers about the matches).",
  "excerpt_tl": "Compelling summary na may team names (2-3 pangungusap, max 160 characters)",
  "excerpt_en": "Compelling summary with team names (2-3 sentences, max 160 characters)",
  "sport": "football",
  "category": "analysis",
  "imageSubject": "football match stadium atmosphere",
  "metaKeyword": "main target keyword (e.g. 'Lakers vs Celtics prediction March 2026')"
}

MAHALAGA:
- HUWAG banggitin ang odds, taya, o betting amounts
- Gumamit ng "probabilidad" at "analysis" hindi "bet" o "taya"
- MINIMUM 800 words bawat version — detalyadong analysis
- Natural na Taglish sa TL version
- Isama ang SPECIFIC statistics — scores, percentages, records
- May FAQ section sa dulo
- Isama sa natural na paraan: "Para sa kumpletong analysis at live updates, i-check ang 1xBet."`;

  return await runAIWithRetry(env, [{ role: 'user', content: prompt }], 4000, 0.7);
}

// ===== INSERT INTO SUPABASE =====

async function insertBlogPost(env, post, imageUrl) {
  const today = getToday();
  const slugBase = slugify(post.title_en);
  const slugTl = slugify(post.title_tl);

  const body = {
    slug: `${slugBase}-${today}`,
    slug_en: `${slugBase}-${today}`,
    slug_tl: `${slugTl}-${today}`,
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
