/**
 * Seed script: processes fixtures-seed.json, creates teams and predictions in Supabase.
 * Picks are generated to be realistic (not always correct) — ~65% win rate.
 *
 * Usage: npx tsx scripts/seed-predictions.ts
 */

const SUPABASE_URL = 'https://mnjiwzsiaqfpwdlayczo.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uaml3enNpYXFmcHdkbGF5Y3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk2MDQwNywiZXhwIjoyMDg4NTM2NDA3fQ.fTuZ2LxfNnsv7Fg4pmt75aHzi3XutvG1SFJdinHW3VI';

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

// League mapping: api_league_id -> { slug, supabaseId }
const LEAGUE_MAP: Record<number, { slug: string; id: string }> = {
  39: { slug: 'premier-league', id: '4cfa4b53-8e05-46ee-8944-551e5d056689' },
  140: { slug: 'la-liga', id: 'dfdb5444-727f-4b4b-98e7-37fcdc57e7c0' },
  78: { slug: 'bundesliga', id: 'dcf4919b-1db4-4a73-b14c-c9d6180daf62' },
  135: { slug: 'serie-a', id: '9a122db4-2018-4cff-9229-738fa1d10e65' },
  61: { slug: 'ligue-1', id: '0fdd4ac8-d22d-4c1d-9cde-9a65170d2cd6' },
};

interface Fixture {
  fixture: { id: number; date: string; status: { short: string } };
  league: { id: number; name: string; round: string };
  teams: {
    home: { id: number; name: string; winner: boolean | null };
    away: { id: number; name: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
}

type Pick =
  | 'home'
  | 'away'
  | 'draw'
  | 'over'
  | 'under'
  | 'btts_yes'
  | 'btts_no';

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function buildSlug(leagueSlug: string, home: string, away: string, date: string): string {
  return `${leagueSlug}-${slugify(home)}-vs-${slugify(away)}-${date}`;
}

/** Generate a realistic pick for a fixture. ~65% win rate overall. */
function generatePick(
  f: Fixture,
  index: number
): { pick: Pick; odds: number; confidence: 'high' | 'medium' | 'low'; stake: number; shouldWin: boolean } {
  const homeGoals = f.goals.home ?? 0;
  const awayGoals = f.goals.away ?? 0;
  const totalGoals = homeGoals + awayGoals;
  const isDraw = homeGoals === awayGoals;
  const homeWon = homeGoals > awayGoals;

  // Mix of pick types for variety
  const pickTypes: Pick[] = ['home', 'away', 'draw', 'over', 'under', 'btts_yes', 'btts_no'];

  // Deterministic "randomness" based on fixture id
  const seed = f.fixture.id % 100;

  // ~65% of picks should be correct, ~35% wrong
  const shouldWin = seed % 100 < 65;

  let pick: Pick;
  let odds: number;
  let confidence: 'high' | 'medium' | 'low';

  if (index % 7 === 0) {
    // Over/under pick
    if (shouldWin) {
      pick = totalGoals > 2 ? 'over' : 'under';
    } else {
      pick = totalGoals > 2 ? 'under' : 'over';
    }
    odds = 1.85;
    confidence = 'medium';
  } else if (index % 7 === 1) {
    // BTTS pick
    const bttsHappened = homeGoals > 0 && awayGoals > 0;
    if (shouldWin) {
      pick = bttsHappened ? 'btts_yes' : 'btts_no';
    } else {
      pick = bttsHappened ? 'btts_no' : 'btts_yes';
    }
    odds = 1.9;
    confidence = 'medium';
  } else {
    // 1X2 pick
    if (shouldWin) {
      if (homeWon) pick = 'home';
      else if (isDraw) pick = 'draw';
      else pick = 'away';
    } else {
      // Wrong pick
      if (homeWon) pick = seed % 2 === 0 ? 'away' : 'draw';
      else if (isDraw) pick = seed % 2 === 0 ? 'home' : 'away';
      else pick = seed % 2 === 0 ? 'home' : 'draw';
    }

    if (pick === 'home') odds = 1.6 + (seed % 10) * 0.1;
    else if (pick === 'away') odds = 2.2 + (seed % 8) * 0.15;
    else odds = 3.0 + (seed % 5) * 0.2;

    confidence = odds < 2.0 ? 'high' : odds < 3.0 ? 'medium' : 'low';
  }

  const stake = confidence === 'high' ? 3 : confidence === 'medium' ? 2 : 1;

  return { pick, odds: Math.round(odds * 100) / 100, confidence, stake, shouldWin };
}

/** Determine actual result of a pick against match outcome */
function resolveResult(
  pick: Pick,
  homeGoals: number,
  awayGoals: number
): 'win' | 'loss' | 'push' {
  const totalGoals = homeGoals + awayGoals;
  const homeWon = homeGoals > awayGoals;
  const isDraw = homeGoals === awayGoals;

  switch (pick) {
    case 'home':
      return homeWon ? 'win' : 'loss';
    case 'away':
      return awayGoals > homeGoals ? 'win' : 'loss';
    case 'draw':
      return isDraw ? 'win' : 'loss';
    case 'over':
      return totalGoals > 2 ? 'win' : totalGoals === 2 ? 'push' : 'loss';
    case 'under':
      return totalGoals < 3 ? 'win' : totalGoals === 3 ? 'push' : 'loss';
    case 'btts_yes':
      return homeGoals > 0 && awayGoals > 0 ? 'win' : 'loss';
    case 'btts_no':
      return homeGoals === 0 || awayGoals === 0 ? 'win' : 'loss';
  }
}

const PICK_LABELS: Record<Pick, { en: string; tl: string }> = {
  home: { en: 'Home Win', tl: 'Panalo ng Home' },
  away: { en: 'Away Win', tl: 'Panalo ng Away' },
  draw: { en: 'Draw', tl: 'Tabla' },
  over: { en: 'Over 2.5 Goals', tl: 'Mahigit 2.5 Gol' },
  under: { en: 'Under 2.5 Goals', tl: 'Mas Mababa sa 2.5 Gol' },
  btts_yes: { en: 'Both Teams to Score', tl: 'Parehong Team Maggo-Gol' },
  btts_no: { en: 'Clean Sheet Expected', tl: 'Clean Sheet Inaasahan' },
};

function generateAnalysis(
  f: Fixture,
  pick: Pick,
  leagueSlug: string
): { en: string; tl: string } {
  const home = f.teams.home.name;
  const away = f.teams.away.name;
  const league = f.league.name;
  const round = f.league.round;

  const analyses: Record<string, { en: string; tl: string }> = {
    home: {
      en: `**${home} vs ${away}** — ${league} ${round}\n\n${home} have the home advantage and have been performing well in recent fixtures. Their defensive organization and attacking options make them the stronger side in this encounter. We expect them to control the game and secure all three points.\n\n**Pick: ${home} to win** at odds of`,
      tl: `**${home} vs ${away}** — ${league} ${round}\n\n${home} ay may home advantage at maganda ang kanilang performance sa mga nakaraang laro. Ang kanilang depensa at atake ay mas magaling kaysa sa kalaban. Inaasahan namin na kontrolin nila ang laro at kunin ang tatlong puntos.\n\n**Pick: Panalo ng ${home}** sa odds na`,
    },
    away: {
      en: `**${home} vs ${away}** — ${league} ${round}\n\n${away} are in excellent form coming into this match and we believe they have enough quality to get a result on the road. Their recent performances suggest they can exploit the spaces ${home} tend to leave in transition.\n\n**Pick: ${away} to win** at odds of`,
      tl: `**${home} vs ${away}** — ${league} ${round}\n\n${away} ay nasa mahusay na form papasok sa larong ito at naniniwala kami na may sapat silang kalidad upang makakuha ng resulta sa away. Ang kanilang mga kamakailang performance ay nagpapakita na maaari nilang pagsamantalahan ang mga espasyo.\n\n**Pick: Panalo ng ${away}** sa odds na`,
    },
    draw: {
      en: `**${home} vs ${away}** — ${league} ${round}\n\nBoth teams are evenly matched in this encounter. ${home} have been solid at home but ${away} have the quality to frustrate them. We see this as a tight affair with neither side able to find a breakthrough.\n\n**Pick: Draw** at odds of`,
      tl: `**${home} vs ${away}** — ${league} ${round}\n\nParehong teams ay pantay-pantay sa labanang ito. ${home} ay malakas sa bahay pero ${away} ay may kalidad upang pigilan sila. Nakikita namin ito bilang isang masikip na laro kung saan walang makakakuha ng panalo.\n\n**Pick: Tabla** sa odds na`,
    },
    over: {
      en: `**${home} vs ${away}** — ${league} ${round}\n\nBoth sides have been involved in high-scoring matches recently. ${home} and ${away} both prefer an attacking style of play, which should lead to an open game with chances at both ends.\n\n**Pick: Over 2.5 Goals** at odds of`,
      tl: `**${home} vs ${away}** — ${league} ${round}\n\nParehong teams ay kasali sa mga mataas na score na laro kamakailan. ${home} at ${away} ay parehong gumagamit ng attacking style, na dapat mag-result sa isang bukas na laro na may mga pagkakataon sa magkabilang panig.\n\n**Pick: Mahigit 2.5 Gol** sa odds na`,
    },
    under: {
      en: `**${home} vs ${away}** — ${league} ${round}\n\nThis match is likely to be a cagey affair. Both teams have strong defensive records and tend to play cautiously. Low-scoring encounters have been the norm when these sides meet.\n\n**Pick: Under 2.5 Goals** at odds of`,
      tl: `**${home} vs ${away}** — ${league} ${round}\n\nAng larong ito ay malamang na magiging maingat. Parehong teams ay may matibay na depensa at madalas na maingat na naglalaro. Mababang score ang karaniwan kapag naghaharap ang mga teams na ito.\n\n**Pick: Mas Mababa sa 2.5 Gol** sa odds na`,
    },
    btts_yes: {
      en: `**${home} vs ${away}** — ${league} ${round}\n\nBoth teams have found the net consistently this season. ${home} are dangerous at home while ${away} always carry a threat going forward. We expect both sides to score at least once.\n\n**Pick: Both Teams to Score** at odds of`,
      tl: `**${home} vs ${away}** — ${league} ${round}\n\nParehong teams ay consistent na nakaka-score sa season na ito. ${home} ay delikado sa bahay habang ${away} ay laging may banta sa atake. Inaasahan namin na parehong teams ay makakapag-score ng kahit isang beses.\n\n**Pick: Parehong Team Maggo-Gol** sa odds na`,
    },
    btts_no: {
      en: `**${home} vs ${away}** — ${league} ${round}\n\nDefensive solidity is the hallmark of this matchup. At least one side is likely to keep a clean sheet based on recent form and the tactical approach we expect both managers to take.\n\n**Pick: Clean Sheet Expected** at odds of`,
      tl: `**${home} vs ${away}** — ${league} ${round}\n\nMatibay na depensa ang tampok ng labanang ito. Hindi bababa sa isang team ang malamang na mag-maintain ng clean sheet batay sa kamakailang form at ang tactical na approach na inaasahan namin mula sa magkabilang manager.\n\n**Pick: Clean Sheet Inaasahan** sa odds na`,
    },
  };

  return analyses[pick] || analyses['home'];
}

async function supabaseFetch(path: string, options: RequestInit = {}) {
  const mergedHeaders = { ...headers, ...(options.headers || {}) };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: mergedHeaders,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error ${res.status}: ${text}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function upsertTeam(
  apiTeamId: number,
  teamName: string,
  leagueId: string
): Promise<string> {
  // Check if exists
  const existing = await supabaseFetch(
    `teams?api_team_id=eq.${apiTeamId}&select=id&limit=1`
  );
  if (existing.length > 0) return existing[0].id;

  // Try insert
  const slug = slugify(teamName);
  try {
    const inserted = await supabaseFetch('teams', {
      method: 'POST',
      headers: { Prefer: 'return=representation,resolution=merge-duplicates' },
      body: JSON.stringify({
        name: teamName,
        slug,
        league_id: leagueId,
        api_team_id: apiTeamId,
      }),
    });
    return inserted[0].id;
  } catch {
    // Slug conflict — try with suffix
    const inserted = await supabaseFetch('teams', {
      method: 'POST',
      headers: { Prefer: 'return=representation,resolution=merge-duplicates' },
      body: JSON.stringify({
        name: teamName,
        slug: `${slug}-${apiTeamId}`,
        league_id: leagueId,
        api_team_id: apiTeamId,
      }),
    });
    return inserted[0].id;
  }
}

async function main() {
  const fs = await import('fs');
  const fixtures: Fixture[] = JSON.parse(
    fs.readFileSync('./scripts/fixtures-seed.json', 'utf-8')
  );

  console.log(`Processing ${fixtures.length} fixtures...\n`);

  // Select best fixtures: spread across leagues and dates, pick ~20
  const byDate = new Map<string, Fixture[]>();
  for (const f of fixtures) {
    const date = f.fixture.date.split('T')[0];
    byDate.set(date, [...(byDate.get(date) || []), f]);
  }

  // Pick 3-5 per day across leagues
  const selected: Fixture[] = [];
  for (const [date, dayFixtures] of [...byDate.entries()].sort()) {
    const byLeague = new Map<number, Fixture[]>();
    for (const f of dayFixtures) {
      byLeague.set(f.league.id, [...(byLeague.get(f.league.id) || []), f]);
    }
    // 1 per league, max 5 per day
    let dayCount = 0;
    for (const [, leagueFixtures] of byLeague) {
      if (dayCount >= 5) break;
      selected.push(leagueFixtures[0]);
      dayCount++;
    }
  }

  console.log(`Selected ${selected.length} fixtures for predictions\n`);

  let wins = 0;
  let losses = 0;
  let pushes = 0;

  for (let i = 0; i < selected.length; i++) {
    const f = selected[i];
    const league = LEAGUE_MAP[f.league.id];
    if (!league) {
      console.log(`Skipping fixture ${f.fixture.id} — unknown league ${f.league.id}`);
      continue;
    }

    const date = f.fixture.date.split('T')[0];
    const slug = buildSlug(league.slug, f.teams.home.name, f.teams.away.name, date);

    console.log(`[${i + 1}/${selected.length}] ${f.teams.home.name} vs ${f.teams.away.name} (${league.slug})`);

    // Upsert teams
    const homeTeamId = await upsertTeam(f.teams.home.id, f.teams.home.name, league.id);
    const awayTeamId = await upsertTeam(f.teams.away.id, f.teams.away.name, league.id);
    console.log(`  Teams: ${homeTeamId.slice(0, 8)}... / ${awayTeamId.slice(0, 8)}...`);

    // Generate pick
    const { pick, odds, confidence, stake } = generatePick(f, i);
    const labels = PICK_LABELS[pick];
    const analysis = generateAnalysis(f, pick, league.slug);

    // Resolve result
    const homeGoals = f.goals.home ?? 0;
    const awayGoals = f.goals.away ?? 0;
    const result = resolveResult(pick, homeGoals, awayGoals);

    if (result === 'win') wins++;
    else if (result === 'loss') losses++;
    else pushes++;

    console.log(`  Pick: ${pick} @ ${odds} | Result: ${homeGoals}-${awayGoals} → ${result}`);

    // Insert prediction
    const prediction = {
      slug,
      league_id: league.id,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      match_date: f.fixture.date,
      sport: 'football',
      pick,
      pick_label_tl: labels.tl,
      pick_label_en: labels.en,
      analysis_tl: analysis.tl,
      analysis_en: analysis.en,
      odds,
      odds_source: 'api-football',
      confidence,
      stake,
      published_site: true,
      api_fixture_id: f.fixture.id,
      result,
      status: 'settled',
      settled_at: new Date().toISOString(),
    };

    try {
      await supabaseFetch('predictions?on_conflict=slug', {
        method: 'POST',
        headers: { Prefer: 'return=minimal,resolution=merge-duplicates' },
        body: JSON.stringify(prediction),
      });
      console.log(`  ✓ Inserted`);
    } catch (err: any) {
      console.error(`  ✗ Error: ${err.message}`);
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Total: ${selected.length} predictions`);
  console.log(`Wins: ${wins} | Losses: ${losses} | Pushes: ${pushes}`);
  console.log(`Win rate: ${((wins / (wins + losses)) * 100).toFixed(1)}%`);
}

main().catch(console.error);
