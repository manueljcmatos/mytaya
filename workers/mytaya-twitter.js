// mytaya-twitter — Posts to Twitter/X when videos are published or blog posts created
// Triggered by cron (posts daily highlights) and HTTP (called from other workers)
// Uses Twitter API v2 OAuth 1.0a (Free tier: 1,500 tweets/month)

function getToday() {
  return new Date().toISOString().split('T')[0];
}

// ===== TWITTER OAUTH 1.0a SIGNATURE =====

async function hmacSha1(key, data) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    typeof key === 'string' ? new TextEncoder().encode(key) : key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

function percentEncode(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

async function generateOAuthHeader(method, url, params, env) {
  const oauthParams = {
    oauth_consumer_key: env.TWITTER_API_KEY,
    oauth_nonce: crypto.randomUUID().replace(/-/g, ''),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: env.TWITTER_ACCESS_TOKEN,
    oauth_version: '1.0',
  };

  // Combine all params for signature base
  const allParams = { ...oauthParams, ...params };
  const paramString = Object.keys(allParams)
    .sort()
    .map(k => `${percentEncode(k)}=${percentEncode(allParams[k])}`)
    .join('&');

  const signatureBase = `${method}&${percentEncode(url)}&${percentEncode(paramString)}`;
  const signingKey = `${percentEncode(env.TWITTER_API_SECRET)}&${percentEncode(env.TWITTER_ACCESS_SECRET)}`;
  oauthParams.oauth_signature = await hmacSha1(signingKey, signatureBase);

  const header = Object.keys(oauthParams)
    .sort()
    .map(k => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(', ');

  return `OAuth ${header}`;
}

// ===== POST TWEET =====

async function postTweet(env, text) {
  const url = 'https://api.twitter.com/2/tweets';
  const body = JSON.stringify({ text });

  const authHeader = await generateOAuthHeader('POST', url, {}, env);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
      'User-Agent': 'MyTaya-Bot/1.0',
    },
    body,
  });

  const data = await res.json();
  if (!res.ok) {
    console.error(`[twitter] Failed to post (${res.status}):`, JSON.stringify(data));
    return null;
  }

  console.log(`[twitter] Posted tweet: ${data.data?.id}`);
  return data.data;
}

// ===== TWEET GENERATORS =====

function buildVideoTweet(composition, props) {
  const hashtags = '#MyTaya #SportsPH #Shorts';

  if (composition === 'HulaNgAraw') {
    return `🔥 ${props.hookText}\n\n${props.homeTeam} vs ${props.awayTeam}\n${props.league}\n\n"${props.hotTake}"\n\n📊 Full analysis: mytaya.com/tl/hula/\n\n${hashtags} #${props.homeTeam?.replace(/\s/g, '')} #${props.awayTeam?.replace(/\s/g, '')}`;
  }
  if (composition === 'BalitaSports') {
    return `🗞️ ${props.headline?.title || 'Balita sa Sports'}\n\n${props.headline?.summary || ''}\n\n📰 Mas marami: mytaya.com/tl/blog/\n\n${hashtags}`;
  }
  if (composition === 'AlaminMo') {
    return `🤯 Alam mo ba?\n\n${props.stat} ${props.factTitle}\n\n${props.factContext || ''}\n\n📊 mytaya.com\n\n${hashtags} #AlamMoBa`;
  }
  if (composition === 'QuizSports') {
    const options = (props.options || []).map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join('\n');
    return `🧠 QUIZ: ${props.question}\n\n${options}\n\n👇 Sagot sa replies!\n\n${hashtags} #SportsQuiz`;
  }
  return `🏆 Bagong video! mytaya.com\n\n${hashtags}`;
}

function buildQuizAnswer(props) {
  if (!props.options || props.correctIndex === undefined) return null;
  const correct = props.options[props.correctIndex];
  return `✅ Sagot: ${correct}\n\n${props.explanation || ''}\n\nI-follow para sa bagong quiz araw-araw! 🏀`;
}

function buildBlogTweet(post) {
  const title = post.title_en || post.title_tl;
  const excerpt = post.excerpt_en || post.excerpt_tl || '';
  const slug = post.slug_en || post.slug;
  const sport = post.sport || 'sports';
  const sportEmoji = sport === 'basketball' ? '🏀' : sport === 'boxing' ? '🥊' : sport === 'football' ? '⚽' : '🏆';

  return `${sportEmoji} ${title}\n\n${excerpt.substring(0, 120)}...\n\n📖 Read: mytaya.com/en/blog/${slug}/\n\n#MyTaya #SportsPH #${sport}`;
}

// ===== DAILY PREDICTIONS TWEET =====

async function postDailyPredictions(env) {
  const url = `${env.SUPABASE_URL}/rest/v1/predictions?select=pick,confidence,match_date,home_team:teams!home_team_id(name),away_team:teams!away_team_id(name),league:leagues!league_id(name)&match_date=gte.${getToday()}&status=eq.pending&published_site=eq.true&order=confidence.desc&limit=5`;

  const res = await fetch(url, {
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
    },
  });

  if (!res.ok) {
    console.log('[twitter] Failed to fetch predictions');
    return;
  }

  const predictions = await res.json();
  if (!predictions.length) {
    console.log('[twitter] No predictions for today');
    return;
  }

  let tweet = `📊 PREDICTIONS NGAYON ${getToday()}\n\n`;

  for (const p of predictions) {
    const conf = p.confidence === 'high' ? '🟢' : p.confidence === 'medium' ? '🟡' : '🔴';
    tweet += `${conf} ${p.home_team.name} vs ${p.away_team.name}\n   Pick: ${p.pick}\n\n`;
  }

  tweet += `🔗 Full analysis: mytaya.com/tl/hula/\n\n#MyTaya #SportsPH #Predictions`;

  // Truncate to 280 chars
  if (tweet.length > 280) {
    tweet = tweet.substring(0, 277) + '...';
  }

  await postTweet(env, tweet);
}

// ===== MAIN =====

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
  // Cron: post daily predictions summary
  async scheduled(event, env, ctx) {
    console.log(`[twitter] Cron triggered at ${new Date().toISOString()}`);
    await postDailyPredictions(env);
  },

  async fetch(request, env) {
    const url = new URL(request.url);

    // POST /tweet/video — called after video upload
    if (url.pathname === '/tweet/video' && request.method === 'POST') {
      return runAndCapture(async () => {
        const { composition, props } = await request.json();
        const text = buildVideoTweet(composition, props);
        if (text.length > 280) {
          await postTweet(env, text.substring(0, 277) + '...');
        } else {
          const result = await postTweet(env, text);
          // If quiz, reply with the answer
          if (composition === 'QuizSports' && result) {
            const answer = buildQuizAnswer(props);
            if (answer) {
              await postTweet(env, answer);
            }
          }
        }
      });
    }

    // POST /tweet/blog — called after blog post
    if (url.pathname === '/tweet/blog' && request.method === 'POST') {
      return runAndCapture(async () => {
        const post = await request.json();
        const text = buildBlogTweet(post);
        if (text.length > 280) {
          await postTweet(env, text.substring(0, 277) + '...');
        } else {
          await postTweet(env, text);
        }
      });
    }

    // GET /run/predictions — manual trigger
    if (url.pathname === '/run/predictions') {
      return runAndCapture(() => postDailyPredictions(env));
    }

    // GET /test — post a test tweet
    if (url.pathname === '/test') {
      return runAndCapture(() => postTweet(env, `🏆 MyTaya test tweet ${new Date().toISOString()}\n\nmytaya.com\n\n#MyTaya #SportsPH`));
    }

    return new Response(
      'mytaya-twitter worker\n\nEndpoints:\n  POST /tweet/video  — tweet about new video\n  POST /tweet/blog   — tweet about new blog post\n  GET  /run/predictions — tweet daily predictions\n  GET  /test         — send test tweet',
      { headers: { 'Content-Type': 'text/plain' } }
    );
  },
};
