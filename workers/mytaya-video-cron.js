// mytaya-video-cron — Generates daily video reels (2 per day)
// Cron schedule (UTC → Philippines = UTC+8):
//   Mon/Wed/Fri: 13h Trivia + 21h Analysis
//   Tue/Thu:     13h Trivia + 15h Balita
//   Sat/Sun:     13h Analysis#1 + 21h Analysis#2

const REPO_OWNER = 'manueljcmatos';
const REPO_NAME = 'mytaya';

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function getCurrentHourUTC() {
  return new Date().getUTCHours();
}

// Sanitize AI-generated JSON before parsing
function sanitizeAndParseJSON(text) {
  // Extract JSON block
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in response');
  let json = jsonMatch[0];
  // Remove trailing commas before } or ]
  json = json.replace(/,\s*([}\]])/g, '$1');
  // Fix unescaped newlines inside strings
  json = json.replace(/(?<=:\s*"[^"]*)\n(?=[^"]*")/g, '\\n');
  return JSON.parse(json);
}

// Run AI with retry on parse failure
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
      console.error(`[video-cron] JSON parse attempt ${attempt + 1} failed: ${e.message}`);
      if (attempt === maxRetries) throw e;
    }
  }
}

// ===== HULA NG ARAW VIDEOS =====

async function fetchTodayPredictions(env, limit = 3) {
  const url = `${env.SUPABASE_URL}/rest/v1/predictions?select=id,pick,odds,stake,confidence,match_date,home_team:teams!home_team_id(name),away_team:teams!away_team_id(name),league:leagues!league_id(name)&match_date=gte.${getToday()}&status=eq.pending&published_site=eq.true&order=confidence.desc,stake.desc&limit=${limit}`;
  const res = await fetch(url, {
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) return [];
  return res.json();
}

async function generateVideoScript(env, prediction) {
  const prompt = `Ikaw ay isang sports analyst na Pilipino na gumagawa ng viral content para sa YouTube Shorts. Ang estilo mo ay polemiko, direkta, at may datos. HINDI ka nagbabanggit ng pustahan, odds, o taya — nagsasalita ka ng probabilidad, form, at historical data.

Partido: ${prediction.home_team.name} vs ${prediction.away_team.name}
Liga: ${prediction.league.name}
Market: ${prediction.pick}
Confidence level: ${prediction.confidence}

Gumawa ng JSON format (walang markdown):
{
  "hookText": "Polemikong pahayag na 5-8 salita na magdudulot ng debate, sa UPPERCASE",
  "hotTake": "Kontrobersyal pero may basehan na opinyon tungkol sa partido, 1-2 pangungusap. HUWAG gumamit ng salitang pustahan, odds, taya, bet",
  "analysis": ["Historical head-to-head statistic", "Recent form data ng team", "Key factor na hindi pinapansin ng karamihan"],
  "ctaText": "CTA phrase para i-follow ang account o tignan ang analysis"
}

Halimbawa ng hooks: "WALANG NAGSASABI NITO...", "ANG KATOTOHANAN TUNGKOL SA LARO NA ITO", "MATATALO SILA AT ALAM MO YAN", "ITONG DATOS ANG MAGBABAGO NG LAHAT"
IWASAN: "ITONG ODDS...", "SURE BET", "PICKS NGAYON", anumang reference sa gambling.
Gumamit ng natural na Filipino/Taglish.`;

  try {
    return await runAIWithRetry(env, [{ role: 'user', content: prompt }], 500, 0.9);
  } catch (e) {
    console.error('[video-cron] Failed to generate video script:', e.message);
    return {
      hookText: 'WALANG NAGSASABI NITO',
      hotTake: `Ang ${prediction.home_team.name} vs ${prediction.away_team.name} ay may market na hindi pinapansin ng karamihan`,
      analysis: [
        `Market: ${prediction.pick}`,
        `Confidence: ${prediction.confidence}`,
        'Tignan ang aming buong analysis sa mytaya.com',
      ],
      ctaText: 'I-follow para sa iba pang picks',
    };
  }
}

function formatMatchDate(fecha) {
  const d = new Date(fecha);
  return d.toLocaleDateString('fil-PH', { day: 'numeric', month: 'short', year: 'numeric' })
    + ' — ' + d.toLocaleTimeString('fil-PH', { hour: '2-digit', minute: '2-digit' });
}

// Dispatch a single prediction by index (0, 1, 2)
async function dispatchHulaByIndex(env, index) {
  const predictions = await fetchTodayPredictions(env, 3);
  if (predictions.length === 0) {
    console.log('[video-cron] No pending predictions for today');
    return 0;
  }
  if (index >= predictions.length) {
    console.log(`[video-cron] Only ${predictions.length} predictions available, skipping index ${index}`);
    return 0;
  }

  const prediction = predictions[index];
  const script = await generateVideoScript(env, prediction);
  console.log(`[video-cron] Prediction ${index + 1}: ${prediction.home_team.name} vs ${prediction.away_team.name} — ${script.hookText}`);

  const props = {
    hookText: script.hookText,
    homeTeam: prediction.home_team.name,
    awayTeam: prediction.away_team.name,
    league: prediction.league.name,
    matchDate: formatMatchDate(prediction.match_date),
    market: prediction.pick,
    odds: prediction.odds,
    stake: prediction.stake,
    confidence: prediction.confidence,
    hotTake: script.hotTake,
    analysis: script.analysis,
    ctaText: script.ctaText,
  };

  await triggerRender(env, 'HulaNgAraw', props);
  return 1;
}

// ===== BALITA SPORTS VIDEO (1 short video per headline) =====

async function generateNewsScript(env) {
  const date = new Date().toLocaleDateString('fil-PH', { day: 'numeric', month: 'short', year: 'numeric' });
  const prompt = `Ikaw ay isang polemikong sports journalist na Pilipino na gumagawa ng viral content para sa YouTube Shorts. Ang estilo mo ay direkta, may matapang na opinyon na nagdudulot ng debate.

Gumawa ng PINAKA-IMPORTANTENG at PINAKA-IMPACTFUL na balita sa sports ngayon (${getToday()}).

Gumawa ng JSON format (walang markdown):
{
  "date": "${date}",
  "headlines": [
    {"title": "Titulo na may gancho na polemiko (estilo: 'Ang katotohanan tungkol sa...' o 'Walang nagsasabi nito...')", "summary": "Mabilis na konteksto sa 2-3 pangungusap na may konkretong datos", "opinion": "Ang polemiko at direktang opinyon mo na magdudulot ng debate, 2 pangungusap"}
  ],
  "ctaTexts": ["CTA phrase para i-follow at makakita ng mas maraming analysis"]
}

MAHALAGA:
- Ang titulo ay dapat gumana bilang HOOK sa unang 2 segundo ng video
- Ang opinyon ay dapat provocative pero may basehan sa datos
- Unahin ang balita sa Pilipinas, sunod Southeast Asia, sunod international
- Gumamit ng natural na Filipino/Taglish
- IWASAN ang generic na titulo tulad ng "Balita sa sports" — maging specific at polemiko
- SAKLAWIN ang lahat ng sports: basketball (PBA/NBA/UAAP), boxing, billiards, volleyball (PVL), Olympics, football, at iba pa`;

  try {
    return await runAIWithRetry(env, [{ role: 'user', content: prompt }], 1000, 0.7);
  } catch (e) {
    console.error('[video-cron] Failed to parse news script:', e.message);
    return null;
  }
}

// Dispatch a single balita by index
async function dispatchBalitaByIndex(env, index) {
  const script = await generateNewsScript(env);
  if (!script) {
    console.log('[video-cron] Could not generate news script');
    return 0;
  }
  if (index >= script.headlines.length) {
    console.log(`[video-cron] Only ${script.headlines.length} headlines, skipping index ${index}`);
    return 0;
  }

  const headline = script.headlines[index];
  const props = {
    date: script.date,
    headlineNumber: 1,
    headline: { title: headline.title, summary: headline.summary },
    opinion: headline.opinion,
    ctaText: (script.ctaTexts && script.ctaTexts[index]) || 'Mas maraming analysis sa aming channel',
  };

  console.log(`[video-cron] Balita: ${headline.title}`);
  await triggerRender(env, 'BalitaSports', props);
  return 1;
}

// ===== ALAMIN MO VIDEO =====

async function generateAlaminScript(env) {
  const prompt = `Ikaw ay isang eksperto sa mga trivia at datos sa sports. Gumawa ng isang nakakagulat na dato o trivia tungkol sa sports na hindi alam ng karamihan.

Gumawa ng JSON format (walang markdown):
{
  "hookText": "Alam mo ba...",
  "stat": "92%",
  "factTitle": "ng mga penalty sa Champions League ay nagiging gol",
  "factContext": "Maikling paliwanag kung bakit ito kawili-wili o importante, 1-2 pangungusap",
  "bullets": ["Karagdagang dato 1", "Karagdagang dato 2", "Karagdagang dato 3"],
  "ctaText": "CTA phrase para i-follow",
  "imageSubject": "Pangalan ng tao o paksa para sa background image (hal: 'Manny Pacquiao', 'FIFA World Cup Trophy')"
}

Ang stat ay pwedeng percentage, malaking numero, taon, atbp. Dapat impactful visually.

UNAHIN ANG MGA ITO NA PAKSA (pumili ng random):
- Pilipinong atleta: Manny Pacquiao (boxing), Efren "Bata" Reyes (billiards), Django Bustamante (billiards), Carlos Yulo (gymnastics/Olympics), Hidilyn Diaz (weightlifting/Olympics), June Mar Fajardo (PBA), Robert Jaworski (PBA), Tim Cone (PBA coach)
- Boxing: Pacquiao records, Filipino world champions (Nonito Donaire, Mark Magsayo, Jerwin Ancajas), Muhammad Ali, Floyd Mayweather
- Billiards/Pool: Efren Reyes achievements, Django Bustamante, world 9-ball, Filipino dominance sa billiards
- Olympics: Carlos Yulo gold medals, Hidilyn Diaz first PH Olympic gold, EJ Obiena (pole vault)
- Basketball: PBA legends, NBA records, UAAP rivalries
- Football: FIFA World Cup, Champions League, Philippine Azkals
- Volleyball: UAAP volleyball stars, PVL

Iba-ibahin ang mga paksa. HUWAG paulit-ulit ang parehong paksa.
Gumamit ng natural na Filipino/Taglish.`;

  try {
    return await runAIWithRetry(env, [{ role: 'user', content: prompt }], 600, 0.9);
  } catch (e) {
    console.error('[video-cron] Failed to parse alamin script:', e.message);
    return null;
  }
}

async function dispatchAlaminVideo(env) {
  const script = await generateAlaminScript(env);
  if (!script) {
    console.log('[video-cron] Could not generate alamin script');
    return 0;
  }

  console.log(`[video-cron] Alamin Mo: ${script.stat} ${script.factTitle}`);
  await triggerRender(env, 'AlaminMo', script);
  return 1;
}

// ===== QUIZ SPORTS VIDEO =====

async function generateQuizScript(env) {
  const prompt = `Ikaw ay isang eksperto sa sports trivia. Gumawa ng isang quiz question tungkol sa sports na may 3 options at isang tamang sagot.

Gumawa ng JSON format (walang markdown):
{
  "question": "Kawili-wiling tanong tungkol sa sports, malinaw at direkta",
  "options": ["Mali na opsyon 1", "Tamang sagot", "Mali na opsyon 2"],
  "correctIndex": 1,
  "explanation": "Maikling paliwanag kung bakit iyan ang tamang sagot, may datos",
  "ctaText": "CTA phrase para i-follow",
  "imageSubject": "Pangalan ng tao o paksa para sa background image (hal: 'Manny Pacquiao', 'NBA basketball')"
}

MAHALAGA:
- correctIndex ay ang posisyon ng tamang sagot (0, 1, o 2). Iba-ibahin ang posisyon.
- Ang mga maling opsyon ay dapat kapani-paniwala, hindi obvious.
- Ang tanong ay dapat kawili-wili at hindi masyadong madali o imposible.
- Gumamit ng natural na Filipino/Taglish.

UNAHIN ANG MGA ITO NA PAKSA (pumili ng random):
- Manny Pacquiao: records, fights, achievements
- Efren "Bata" Reyes: billiards world championships, "The Magician"
- Carlos Yulo: Olympic gold medals, gymnastics achievements
- Hidilyn Diaz: first PH Olympic gold medalist
- PBA: legends (Jaworski, Caidic, Fajardo), records, Grand Slams
- Boxing: Filipino world champions, weight divisions, historic fights
- Billiards/Pool: Filipino players, world championships
- Olympics: PH medalists, memorable moments
- NBA, FIFA World Cup, Champions League, UAAP, volleyball/PVL`;

  try {
    const parsed = await runAIWithRetry(env, [{ role: 'user', content: prompt }], 500, 0.9);
    if (typeof parsed.correctIndex !== 'number' || parsed.correctIndex < 0 || parsed.correctIndex > 2) {
      parsed.correctIndex = 0;
    }
    return parsed;
  } catch (e) {
    console.error('[video-cron] Failed to parse quiz script:', e.message);
    return null;
  }
}

async function dispatchQuizVideo(env) {
  const script = await generateQuizScript(env);
  if (!script) {
    console.log('[video-cron] Could not generate quiz script');
    return 0;
  }

  console.log(`[video-cron] Quiz: ${script.question}`);
  await triggerRender(env, 'QuizSports', script);
  return 1;
}

// ===== SHARED =====

async function triggerRender(env, composition, props) {
  const res = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `token ${env.GITHUB_TOKEN}`,
        'User-Agent': 'mytaya-video-cron',
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: 'render-video',
        client_payload: {
          composition,
          props: JSON.stringify(props),
          today: getToday(),
        },
      }),
    }
  );

  if (res.ok) {
    console.log(`[video-cron] Triggered render: ${composition}`);
  } else {
    console.error(`[video-cron] Failed to trigger ${composition}:`, await res.text());
  }
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
    const hour = getCurrentHourUTC();
    const today = getToday();
    const dow = new Date().getUTCDay(); // 0=Sun,1=Mon,...6=Sat
    const dayOfMonth = new Date().getUTCDate();
    console.log(`[video-cron] Starting for ${today} (dow=${dow}) at ${hour}:00 UTC`);

    // Weekly schedule (PHT = UTC+8):
    //   Mon/Wed/Fri: 05:00 UTC (13h PHT) AlaminMo/QuizSports + 13:00 UTC (21h PHT) HulaNgAraw
    //   Tue/Thu:     05:00 UTC (13h PHT) AlaminMo/QuizSports + 07:00 UTC (15h PHT) BalitaSports
    //   Sat/Sun:     05:00 UTC (13h PHT) HulaNgAraw + 13:00 UTC (21h PHT) HulaNgAraw

    if (dow === 1 || dow === 3 || dow === 5) {
      // Mon / Wed / Fri — Trivia + Analysis
      if (hour === 5) {
        const count = dayOfMonth % 2 === 1
          ? await dispatchAlaminVideo(env)
          : await dispatchQuizVideo(env);
        console.log(`[video-cron] Dispatched ${count} trivia video`);
      } else if (hour === 13) {
        const count = await dispatchHulaByIndex(env, 0);
        console.log(`[video-cron] Dispatched ${count} analysis video`);
      }
    } else if (dow === 2 || dow === 4) {
      // Tue / Thu — Trivia + Balita
      if (hour === 5) {
        const count = dayOfMonth % 2 === 1
          ? await dispatchAlaminVideo(env)
          : await dispatchQuizVideo(env);
        console.log(`[video-cron] Dispatched ${count} trivia video`);
      } else if (hour === 7) {
        const count = await dispatchBalitaByIndex(env, 0);
        console.log(`[video-cron] Dispatched ${count} balita video`);
      }
    } else {
      // Sat / Sun — 2x Analysis
      if (hour === 5) {
        const count = await dispatchHulaByIndex(env, 0);
        console.log(`[video-cron] Dispatched ${count} analysis video (1/2)`);
      } else if (hour === 13) {
        const count = await dispatchHulaByIndex(env, 1);
        console.log(`[video-cron] Dispatched ${count} analysis video (2/2)`);
      }
    }
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const index = parseInt(url.searchParams.get('i') || '0', 10);

    if (url.pathname === '/run' || url.pathname === '/run/hula') {
      return runAndCapture(() => dispatchHulaByIndex(env, index));
    }
    if (url.pathname === '/run/balita') {
      return runAndCapture(() => dispatchBalitaByIndex(env, index));
    }
    if (url.pathname === '/run/alamin') {
      return runAndCapture(() => dispatchAlaminVideo(env));
    }
    if (url.pathname === '/run/quiz') {
      return runAndCapture(() => dispatchQuizVideo(env));
    }
    if (url.pathname === '/run/all') {
      return runAndCapture(async () => {
        let total = 0;
        for (let i = 0; i < 3; i++) total += await dispatchHulaByIndex(env, i);
        for (let i = 0; i < 3; i++) total += await dispatchBalitaByIndex(env, i);
        total += await dispatchAlaminVideo(env);
        total += await dispatchQuizVideo(env);
        console.log(`[video-cron] Total: ${total} videos`);
      });
    }

    return new Response(
      'mytaya-video-cron worker\n\nEndpoints:\n  /run/hula?i=0    — hula ng araw by index\n  /run/balita?i=0  — balita sports by index\n  /run/alamin      — alamin mo trivia\n  /run/quiz        — quiz sports\n  /run/all         — all videos',
      { headers: { 'Content-Type': 'text/plain' } }
    );
  },
};
