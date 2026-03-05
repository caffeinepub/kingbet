# KINGBET

## Current State
- Landing page exists with hero, sports preview, casino, crash games, FAQ, footer sections
- Sports preview uses card-based layout with Back/Lay buttons
- Markets page has 1xBet-style exchange layout with IN-PLAY/UPCOMING sections
- Back/Lay buttons use blue/pink colors without "Lagao/Khai" Indian labels
- Landing page "Live Markets" section shows generic card grid, not a compact Diamond Exchange table format

## Requested Changes (Diff)

### Add
- Diamond Exchange / 1xBet-style compact table in landing page "Live Sports" section (replacing card grid):
  - Table headers: Event | 1 | X | 2 with Back=blue, Lay=pink column backgrounds
  - Each row: sport emoji, match name, competition, LIVE/Soon badge, odds buttons, animated dot for live
  - "Lagao" label on Back buttons, "Khai" label on Lay buttons (compact Indian exchange terminology)
- Sports categories grid on landing page (Cricket, Football, Tennis, Basketball, Horse Racing, Kabaddi with event counts)
- "Lagao / Khai" column headers in Markets page exchange table (replacing "← Back" / "Lay →")
- "Lagao" / "Khai" labels on OddsCell buttons in Markets page

### Modify
- Landing page LiveSportsPreview section: replace 3-column card grid with compact horizontal table format matching Diamond Exchange / 1xBet India style
- MarketCard exchange table header: change "← Back" to "← Lagao (Back)" and "Lay →" to "Khai (Lay) →"
- OddsCell: no visual change needed, just header labels update
- Landing page hero CTA buttons: "Start Trading" and "Get Your ID" style consistent with new layout

### Remove
- Nothing removed, only enhancing existing sections

## Implementation Plan
1. Replace `LiveSportsPreview` component in LandingPage.tsx with Diamond Exchange compact table format
2. Add Sports Categories section to landing page (between live markets and casino)
3. Update `MarketCard` exchange table headers in MarketsPage.tsx to show "Lagao (Back)" and "Khai (Lay)"
4. Update fancy/session column headers in FancySection to show "KHAI" and "LGAO" instead of "NO" and "YES"
5. Ensure btn-back and btn-lay CSS classes are available in global CSS or inline styled consistently
