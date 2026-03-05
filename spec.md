# KINGBET

## Current State
- Frontend-only app with React + Zustand store
- Markets page shows hardcoded static cricket/football/tennis markets with mock odds
- Odds drift is simulated locally via `updateFancyOdds` interval
- LandingPage sports preview uses hardcoded mock data
- No external API integration exists

## Requested Changes (Diff)

### Add
- `oddsService.ts` utility that calls TheOddsAPI (key: `a231ad9c198d20afdf0315d0eae4d7a2`) to fetch:
  - In-season sports list (cricket, soccer, tennis)
  - Upcoming + live events with Back/Lay-style odds (h2h markets)
- Auto-polling every 2 seconds on MarketsPage for live odds refresh
- Live sports preview on LandingPage using real API data

### Modify
- `MarketsPage.tsx` — replace static store markets with live API data; keep fallback to store data if API fails or rate-limited
- `LandingPage.tsx` — live sports preview section now fetches real upcoming matches from TheOddsAPI

### Remove
- Nothing removed; mock data kept as fallback

## Implementation Plan
1. Create `src/frontend/src/utils/oddsService.ts`:
   - `fetchSports()` — GET /v4/sports with apiKey
   - `fetchOdds(sport, markets, regions)` — GET /v4/sports/{sport}/odds
   - Map API response to internal `Market` type with Back (bestBack) and Lay (bestBack + 0.02) odds derived from bookmaker data
2. Update `MarketsPage.tsx`:
   - On mount, call `oddsService.fetchOdds` for cricket_international, soccer_epl, tennis_atp
   - Poll every 2 seconds using setInterval
   - Map API `Event` objects to `Market[]` format
   - Show API data when available; fall back to store markets on error
3. Update `LandingPage.tsx`:
   - Fetch top 3 upcoming events from API on mount
   - Show match name, teams, and live back odds in the preview cards
