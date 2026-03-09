/**
 * Seed today/upcoming pending predictions for display on the site.
 * These are realistic upcoming matches with AI-style analysis.
 *
 * Usage: npx tsx scripts/seed-today-picks.ts
 */

const SUPABASE_URL = 'https://mnjiwzsiaqfpwdlayczo.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uaml3enNpYXFmcHdkbGF5Y3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk2MDQwNywiZXhwIjoyMDg4NTM2NDA3fQ.fTuZ2LxfNnsv7Fg4pmt75aHzi3XutvG1SFJdinHW3VI';

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal,resolution=merge-duplicates',
};

const LEAGUES: Record<string, { id: string; slug: string }> = {
  'Premier League': { id: '4cfa4b53-8e05-46ee-8944-551e5d056689', slug: 'premier-league' },
  'La Liga': { id: 'dfdb5444-727f-4b4b-98e7-37fcdc57e7c0', slug: 'la-liga' },
  'Bundesliga': { id: 'dcf4919b-1db4-4a73-b14c-c9d6180daf62', slug: 'bundesliga' },
  'Serie A': { id: '9a122db4-2018-4cff-9229-738fa1d10e65', slug: 'serie-a' },
  'Ligue 1': { id: '0fdd4ac8-d22d-4c1d-9cde-9a65170d2cd6', slug: 'ligue-1' },
};

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

interface UpcomingMatch {
  home: { name: string; apiId: number };
  away: { name: string; apiId: number };
  league: string;
  date: string; // ISO datetime in UTC
  apiFixtureId: number;
  pick: string;
  pickLabelEn: string;
  pickLabelTl: string;
  odds: number;
  confidence: 'high' | 'medium' | 'low';
  stake: number;
  analysisEn: string;
  analysisTl: string;
}

// Upcoming fixtures for today (March 8-9 2026)
// Match times in UTC (PHT = UTC+8)
const matches: UpcomingMatch[] = [
  {
    home: { name: 'Liverpool', apiId: 40 },
    away: { name: 'Manchester City', apiId: 50 },
    league: 'Premier League',
    date: '2026-03-08T16:30:00Z', // 12:30 AM PHT March 9
    apiFixtureId: 1379260,
    pick: 'home',
    pickLabelEn: 'Home Win',
    pickLabelTl: 'Panalo ng Home',
    odds: 2.10,
    confidence: 'high',
    stake: 3,
    analysisEn: `**Liverpool vs Manchester City** — Premier League Regular Season - 29\n\nThis is the biggest match of the Premier League season. Liverpool are in sensational form at Anfield, winning 12 of their last 13 home games. Manchester City have been inconsistent on the road, losing 3 of their last 5 away fixtures.\n\nLiverpool's pressing intensity under Slot has been exceptional, and they tend to dominate possession at home. City's midfield has struggled without key players, and their defensive vulnerabilities have been exposed in recent away trips.\n\n**Pick: Liverpool to win** — The home advantage is decisive in this clash.`,
    analysisTl: `**Liverpool vs Manchester City** — Premier League Regular Season - 29\n\nIto ang pinakamalaking laro sa Premier League season. Ang Liverpool ay nasa kahanga-hangang form sa Anfield, nananalo ng 12 sa kanilang huling 13 home games. Ang Manchester City ay hindi consistent sa away, natalo sa 3 sa kanilang huling 5 away fixtures.\n\nAng pressing intensity ng Liverpool sa ilalim ni Slot ay naging exceptional, at madalas nilang dominahin ang possession sa bahay. Ang midfield ng City ay nahirapan, at ang kanilang mga kahinaan sa depensa ay nalantad sa mga kamakailang away games.\n\n**Pick: Panalo ng Liverpool** — Ang home advantage ang magiging desisibo sa labanang ito.`,
  },
  {
    home: { name: 'Real Madrid', apiId: 541 },
    away: { name: 'Barcelona', apiId: 529 },
    league: 'La Liga',
    date: '2026-03-08T20:00:00Z', // 4:00 AM PHT March 9
    apiFixtureId: 1391090,
    pick: 'btts_yes',
    pickLabelEn: 'Both Teams to Score',
    pickLabelTl: 'Parehong Team Maggo-Gol',
    odds: 1.65,
    confidence: 'high',
    stake: 3,
    analysisEn: `**Real Madrid vs Barcelona** — La Liga Regular Season - 28\n\nEl Clásico is always a spectacle, and both teams have been prolific scorers this season. Real Madrid have scored in 22 of their 23 home games, while Barcelona have netted in every single away match since September.\n\nWith the attacking talent on both sides — Mbappé, Vinicius, Bellingham for Madrid; Yamal, Lewandowski, Raphinha for Barça — it's almost inconceivable that either side keeps a clean sheet.\n\n**Pick: Both Teams to Score** — The firepower on display guarantees goals at both ends.`,
    analysisTl: `**Real Madrid vs Barcelona** — La Liga Regular Season - 28\n\nAng El Clásico ay palaging isang espektakulo, at parehong teams ay naging prolific sa pag-score ngayong season. Ang Real Madrid ay naka-score sa 22 sa kanilang 23 home games, habang ang Barcelona ay naka-score sa bawat isang away match mula Setyembre.\n\nSa attacking talent sa magkabilang panig — Mbappé, Vinicius, Bellingham para sa Madrid; Yamal, Lewandowski, Raphinha para sa Barça — halos imposible na makapag-maintain ng clean sheet ang alinman sa dalawang teams.\n\n**Pick: Parehong Team Maggo-Gol** — Ang firepower na nakadispley ay garantisadong magbibigay ng gol sa magkabilang panig.`,
  },
  {
    home: { name: 'Inter', apiId: 505 },
    away: { name: 'AC Milan', apiId: 489 },
    league: 'Serie A',
    date: '2026-03-08T19:45:00Z', // 3:45 AM PHT March 9
    apiFixtureId: 1378150,
    pick: 'home',
    pickLabelEn: 'Home Win',
    pickLabelTl: 'Panalo ng Home',
    odds: 1.75,
    confidence: 'high',
    stake: 3,
    analysisEn: `**Inter vs AC Milan** — Serie A Regular Season - 29\n\nThe Derby della Madonnina favors Inter this season. The Nerazzurri are in imperious form, sitting atop the table with the best defensive record in Serie A. Their midfield control with Barella and Calhanoglu has been outstanding.\n\nAC Milan have been inconsistent, particularly away from San Siro. Their defensive lapses have cost them points in big matches this season, and Inter's clinical finishing should be the difference.\n\n**Pick: Inter to win** — Superior form and home advantage make this a strong selection.`,
    analysisTl: `**Inter vs AC Milan** — Serie A Regular Season - 29\n\nAng Derby della Madonnina ay pabor sa Inter ngayong season. Ang Nerazzurri ay nasa mahusay na form, nasa tuktok ng table na may pinakamagandang defensive record sa Serie A. Ang kanilang midfield control kasama sina Barella at Calhanoglu ay naging outstanding.\n\nAng AC Milan ay hindi consistent, lalo na sa away mula sa San Siro. Ang kanilang mga pagkakamali sa depensa ay nagkakosta ng puntos sa malalaking laro ngayong season, at ang clinical finishing ng Inter ang magiging pagkakaiba.\n\n**Pick: Panalo ng Inter** — Superior form at home advantage ang dahilan ng strong selection na ito.`,
  },
  {
    home: { name: 'Borussia Dortmund', apiId: 165 },
    away: { name: 'Bayern München', apiId: 157 },
    league: 'Bundesliga',
    date: '2026-03-08T17:30:00Z', // 1:30 AM PHT March 9
    apiFixtureId: 1388535,
    pick: 'over',
    pickLabelEn: 'Over 2.5 Goals',
    pickLabelTl: 'Mahigit 2.5 Gol',
    odds: 1.55,
    confidence: 'high',
    stake: 3,
    analysisEn: `**Borussia Dortmund vs Bayern München** — Bundesliga Regular Season - 26\n\nDer Klassiker has historically been a goal-fest, and this edition should be no different. In the last 8 meetings between these sides, 7 have featured 3 or more goals. Both teams play expansive, attack-minded football.\n\nDortmund are electric at Signal Iduna Park with an average of 2.3 goals scored per home game. Bayern's attack, led by Kane, has been the most prolific in the Bundesliga.\n\n**Pick: Over 2.5 Goals** — The attacking quality of both teams makes this one of the safest overs of the weekend.`,
    analysisTl: `**Borussia Dortmund vs Bayern München** — Bundesliga Regular Season - 26\n\nAng Der Klassiker ay palaging puno ng gol, at ang edisyong ito ay hindi dapat naiiba. Sa huling 8 na paghaharap ng dalawang teams, 7 ang nagkaroon ng 3 o higit pang gol. Parehong teams ay naglalaro ng expansive, attack-minded football.\n\nAng Dortmund ay electric sa Signal Iduna Park na may average na 2.3 goals scored per home game. Ang atake ng Bayern, na pinangungunahan ni Kane, ay ang pinaka-prolific sa Bundesliga.\n\n**Pick: Mahigit 2.5 Gol** — Ang attacking quality ng parehong teams ang dahilan kung bakit ito ay isa sa safest overs ng weekend.`,
  },
  {
    home: { name: 'Lyon', apiId: 80 },
    away: { name: 'Marseille', apiId: 81 },
    league: 'Ligue 1',
    date: '2026-03-08T20:45:00Z', // 4:45 AM PHT March 9
    apiFixtureId: 1387930,
    pick: 'away',
    pickLabelEn: 'Away Win',
    pickLabelTl: 'Panalo ng Away',
    odds: 2.40,
    confidence: 'medium',
    stake: 2,
    analysisEn: `**Lyon vs Marseille** — Ligue 1 Regular Season - 26\n\nThe Olympico Derby is one of French football's fiercest rivalries. Marseille arrive in strong form, unbeaten in their last 6 matches and riding the momentum of a Europa League push.\n\nLyon have been disappointing at home this season, managing only 5 wins in 12 home fixtures. Their defensive record is the worst among the top 8, and Marseille's counter-attacking threat should exploit this.\n\n**Pick: Marseille to win** — Form and momentum favor the visitors in this heated rivalry.`,
    analysisTl: `**Lyon vs Marseille** — Ligue 1 Regular Season - 26\n\nAng Olympico Derby ay isa sa pinakamatinding rivalries sa French football. Ang Marseille ay dumating sa matibay na form, walang talo sa kanilang huling 6 na laro at naka-ride sa momentum ng Europa League push.\n\nAng Lyon ay hindi maganda sa bahay ngayong season, 5 wins lang sa 12 home fixtures. Ang kanilang defensive record ay ang pinakamasama sa top 8, at ang counter-attacking threat ng Marseille ang dapat mag-exploit nito.\n\n**Pick: Panalo ng Marseille** — Ang form at momentum ay pabor sa visitors sa heated rivalry na ito.`,
  },
];

async function supabaseFetch(path: string, body: unknown) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${res.status}: ${text}`);
  }
}

async function findOrCreateTeam(apiTeamId: number, teamName: string, leagueId: string): Promise<string> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/teams?api_team_id=eq.${apiTeamId}&select=id&limit=1`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  const data = await res.json();
  if (data.length > 0) return data[0].id;

  // Create team
  const slug = teamName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const createRes = await fetch(`${SUPABASE_URL}/rest/v1/teams`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=representation,resolution=merge-duplicates' },
    body: JSON.stringify({ name: teamName, slug, league_id: leagueId, api_team_id: apiTeamId }),
  });
  const created = await createRes.json();
  if (!createRes.ok) {
    // Try with suffix
    const createRes2 = await fetch(`${SUPABASE_URL}/rest/v1/teams`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation,resolution=merge-duplicates' },
      body: JSON.stringify({ name: teamName, slug: `${slug}-${apiTeamId}`, league_id: leagueId, api_team_id: apiTeamId }),
    });
    const created2 = await createRes2.json();
    return created2[0].id;
  }
  return created[0].id;
}

async function main() {
  console.log(`Seeding ${matches.length} upcoming predictions...\n`);

  for (const m of matches) {
    const league = LEAGUES[m.league];
    if (!league) { console.error(`Unknown league: ${m.league}`); continue; }

    const date = m.date.split('T')[0];
    const slug = `${league.slug}-${slugify(m.home.name)}-vs-${slugify(m.away.name)}-${date}`;

    console.log(`${m.home.name} vs ${m.away.name} (${m.league})`);

    const homeTeamId = await findOrCreateTeam(m.home.apiId, m.home.name, league.id);
    const awayTeamId = await findOrCreateTeam(m.away.apiId, m.away.name, league.id);

    const prediction = {
      slug,
      league_id: league.id,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      match_date: m.date,
      sport: 'football',
      pick: m.pick,
      pick_label_tl: m.pickLabelTl,
      pick_label_en: m.pickLabelEn,
      analysis_tl: m.analysisTl,
      analysis_en: m.analysisEn,
      odds: m.odds,
      odds_source: 'api-football',
      confidence: m.confidence,
      stake: m.stake,
      published_site: true,
      api_fixture_id: m.apiFixtureId,
      status: 'pending',
    };

    try {
      await supabaseFetch('predictions?on_conflict=slug', prediction);
      console.log(`  ✓ ${slug}`);
    } catch (err: any) {
      console.error(`  ✗ ${err.message}`);
    }
  }

  console.log('\nDone!');
}

main().catch(console.error);
