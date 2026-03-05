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
export const PRIORITY_SPORTS = [
  "cricket_ipl",
  "cricket_international",
  "cricket_t20",
  "soccer_epl",
  "soccer_spain_la_liga",
  "tennis_atp_wimbledon",
  "tennis_atp_dubai",
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

// Fetch odds for a specific sport
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
    description: `${event.sport_title} — ${isLive ? "LIVE" : commenceTime.toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })}`,
    selections,
    status: isLive ? "open" : "open",
    createdAt: event.commence_time,
  };
}

// Fetch and convert all priority sports into Markets
export async function fetchAllLiveMarkets(): Promise<Market[]> {
  const allMarkets: Market[] = [];

  // Check which sports are in-season first
  const inSeasonSports = await fetchInSeasonSports();
  const inSeasonKeys = new Set(inSeasonSports.map((s) => s.key));

  // Filter priority sports to only in-season ones
  const sportsToFetch = PRIORITY_SPORTS.filter((s) => inSeasonKeys.has(s));

  // If none of priority sports are in season, try fetching them anyway
  const fetchList =
    sportsToFetch.length > 0
      ? sportsToFetch.slice(0, 3)
      : PRIORITY_SPORTS.slice(0, 2);

  // Fetch in parallel (limited to save API credits)
  const results = await Promise.allSettled(
    fetchList.map((sportKey) => fetchOddsForSport(sportKey)),
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      const events = result.value;
      // Take top 3 events per sport to save credits
      const top = events.slice(0, 3);
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
export async function fetchPreviewEvents(count = 3): Promise<Market[]> {
  // Use only 1 cricket sport for preview to save credits
  const sportKey = "cricket_ipl";
  try {
    const events = await fetchOddsForSport(sportKey, "uk", "h2h");
    if (events.length > 0) {
      return events
        .slice(0, count)
        .filter((e) => e.bookmakers.length > 0)
        .map(convertEventToMarket);
    }
  } catch {
    // fallback
  }

  // Fallback: try soccer
  try {
    const events = await fetchOddsForSport("soccer_epl", "uk", "h2h");
    return events
      .slice(0, count)
      .filter((e) => e.bookmakers.length > 0)
      .map(convertEventToMarket);
  } catch {
    return [];
  }
}
