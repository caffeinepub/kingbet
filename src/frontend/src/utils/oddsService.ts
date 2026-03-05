// TheOddsAPI integration for KINGBET
// API Key: a231ad9c198d20afdf0315d0eae4d7a2
// Docs: https://the-odds-api.com/

import type { Market, Selection, SportType } from "@/store/useStore";

const API_KEY = "a231ad9c198d20afdf0315d0eae4d7a2";
const BASE_URL = "https://api.the-odds-api.com/v4";

// Sport key mapping from TheOddsAPI to our internal SportType
const SPORT_MAP: Record<string, SportType> = {
  cricket_international: "cricket",
  cricket_ipl: "cricket",
  cricket_odi: "cricket",
  cricket_t20: "cricket",
  cricket_test_match: "cricket",
  soccer_epl: "football",
  soccer_spain_la_liga: "football",
  soccer_uefa_champs_league: "football",
  soccer_france_ligue_one: "football",
  soccer_germany_bundesliga: "football",
  soccer_italy_serie_a: "football",
  tennis_atp_french_open: "tennis",
  tennis_atp_wimbledon: "tennis",
  tennis_atp_us_open: "tennis",
  tennis_wta_french_open: "tennis",
  tennis_wta_wimbledon: "tennis",
  tennis_atp_dubai: "tennis",
  tennis_wta_dubai: "tennis",
};

// Priority sports to fetch (limited to save API credits)
// Cricket first, then football, then tennis
export const PRIORITY_SPORTS = [
  "cricket_ipl",
  "cricket_international",
  "cricket_t20",
  "cricket_test_match",
  "cricket_odi",
  "soccer_epl",
  "soccer_spain_la_liga",
  "soccer_uefa_champs_league",
  "tennis_atp_wimbledon",
  "tennis_atp_dubai",
  "tennis_atp_french_open",
];

export interface OddsEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

interface Bookmaker {
  key: string;
  title: string;
  markets: BookmakerMarket[];
}

interface BookmakerMarket {
  key: string;
  outcomes: Outcome[];
}

interface Outcome {
  name: string;
  price: number;
}

export interface SportInfo {
  key: string;
  active: boolean;
  group: string;
  title: string;
  description: string;
  has_outrights: boolean;
}

// Fetch available in-season sports
export async function fetchInSeasonSports(): Promise<SportInfo[]> {
  try {
    const res = await fetch(`${BASE_URL}/sports?apiKey=${API_KEY}&all=false`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: SportInfo[] = await res.json();
    return data.filter((s) => !s.has_outrights);
  } catch (err) {
    console.error("[OddsAPI] fetchInSeasonSports error:", err);
    return [];
  }
}

// Fetch odds for a specific sport — returns both live and upcoming
export async function fetchOddsForSport(
  sportKey: string,
  regions = "uk",
  markets = "h2h",
): Promise<OddsEvent[]> {
  try {
    const url = `${BASE_URL}/sports/${sportKey}/odds?apiKey=${API_KEY}&regions=${regions}&markets=${markets}&oddsFormat=decimal`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[OddsAPI] ${sportKey} returned ${res.status}`);
      return [];
    }
    const data: OddsEvent[] = await res.json();
    return data;
  } catch (err) {
    console.error(`[OddsAPI] fetchOddsForSport(${sportKey}) error:`, err);
    return [];
  }
}

// Get average back odds for a team from all bookmakers
function getAvgOdds(event: OddsEvent, teamName: string): number {
  const prices: number[] = [];
  for (const bm of event.bookmakers) {
    for (const market of bm.markets) {
      if (market.key !== "h2h") continue;
      for (const outcome of market.outcomes) {
        if (outcome.name.toLowerCase().includes(teamName.toLowerCase())) {
          prices.push(outcome.price);
        }
      }
    }
  }
  if (prices.length === 0) return 2.0;
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  return Number(avg.toFixed(2));
}

// Convert TheOddsAPI event to our Market format
export function convertEventToMarket(event: OddsEvent): Market {
  const sportType: SportType = SPORT_MAP[event.sport_key] ?? "football";
  const teams = [event.home_team, event.away_team];

  const selections: Selection[] = teams.map((team, i) => {
    const backOdds = getAvgOdds(event, team);
    // Lay is slightly higher than Back (exchange-style spread)
    const layOdds = Number((backOdds + 0.02).toFixed(2));
    return {
      id: `${event.id}-${i}`,
      name: team,
      backOdds,
      layOdds,
      backVolume: Math.floor(Math.random() * 400000 + 100000),
      layVolume: Math.floor(Math.random() * 300000 + 80000),
    };
  });

  // Add Draw for football
  if (sportType === "football") {
    const homeOdds = selections[0].backOdds;
    const awayOdds = selections[1].backOdds;
    const drawOdds = Number(
      Math.min(5.0, Math.max(2.5, (homeOdds + awayOdds) * 0.85)).toFixed(2),
    );
    selections.push({
      id: `${event.id}-draw`,
      name: "Draw",
      backOdds: drawOdds,
      layOdds: Number((drawOdds + 0.02).toFixed(2)),
      backVolume: Math.floor(Math.random() * 200000 + 50000),
      layVolume: Math.floor(Math.random() * 150000 + 40000),
    });
  }

  const commenceTime = new Date(event.commence_time);
  const now = new Date();
  const isLive = commenceTime <= now;

  return {
    id: event.id,
    sport: sportType,
    eventName: `${event.home_team} vs ${event.away_team}`,
    description: `${event.sport_title} — ${
      isLive
        ? "LIVE"
        : commenceTime.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Kolkata",
          })
    }`,
    selections,
    status: "open",
    createdAt: event.commence_time,
  };
}

// Fetch and convert all available in-season sports into Markets
// First checks which sports are actually in-season, then fetches those
export async function fetchAllLiveMarkets(): Promise<Market[]> {
  const allMarkets: Market[] = [];

  // Step 1: Get in-season sports from API
  const inSeasonSports = await fetchInSeasonSports();
  const inSeasonKeys = inSeasonSports.map((s) => s.key);

  // Step 2: Find which of our SPORT_MAP sports are currently in-season
  const availableSportKeys = Object.keys(SPORT_MAP).filter((key) =>
    inSeasonKeys.includes(key),
  );

  // Step 3: If nothing found in our map, use fallback football leagues
  const fetchList =
    availableSportKeys.length > 0
      ? availableSportKeys.slice(0, 6)
      : [
          "soccer_epl",
          "soccer_spain_la_liga",
          "soccer_uefa_champs_league",
          "soccer_germany_bundesliga",
        ];

  // Step 4: Fetch in parallel
  const results = await Promise.allSettled(
    fetchList.map((sportKey) => fetchOddsForSport(sportKey)),
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      const events = result.value;
      // Take top 5 events per sport (show live + upcoming)
      const top = events.slice(0, 5);
      for (const event of top) {
        if (event.bookmakers.length > 0) {
          allMarkets.push(convertEventToMarket(event));
        }
      }
    }
  }

  return allMarkets;
}

// Fetch just a few events for landing page preview (saves credits)
// Shows both live and upcoming events
export async function fetchPreviewEvents(count = 3): Promise<Market[]> {
  // Try cricket sports first (multiple keys since different seasons)
  const cricketKeys = [
    "cricket_ipl",
    "cricket_international",
    "cricket_t20",
    "cricket_test_match",
  ];

  for (const sportKey of cricketKeys) {
    try {
      const events = await fetchOddsForSport(sportKey, "uk", "h2h");
      const withOdds = events.filter((e) => e.bookmakers.length > 0);
      if (withOdds.length > 0) {
        return withOdds.slice(0, count).map(convertEventToMarket);
      }
    } catch {
      // try next
    }
  }

  // Fallback: try football EPL
  try {
    const events = await fetchOddsForSport("soccer_epl", "uk", "h2h");
    const withOdds = events.filter((e) => e.bookmakers.length > 0);
    if (withOdds.length > 0) {
      return withOdds.slice(0, count).map(convertEventToMarket);
    }
  } catch {
    // ignore
  }

  // Fallback: try La Liga
  try {
    const events = await fetchOddsForSport("soccer_spain_la_liga", "uk", "h2h");
    return events
      .slice(0, count)
      .filter((e) => e.bookmakers.length > 0)
      .map(convertEventToMarket);
  } catch {
    return [];
  }
}
