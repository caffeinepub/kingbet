# KINGBET

## Current State
- 50 games exist in GamesLobby.tsx with full implementations for Mines, Limbo, CoinFlip, Diamonds, Tower, Stairs, HiLo, Blackjack, Keno, ScratchCards, SattaMatka, WheelOfFortune
- Remaining ~35 games use SimpleGame template (no animations, direct result show)
- CasinoPage.tsx already has proper auto-loop with betting window (15s bet → 1s closed → 4s result → 2s wait)
- Crash/Aviator already auto-loops
- Plinko and Dice are in CrashPage.tsx

## Requested Changes (Diff)

### Add
- Animations to ALL SimpleGame template games: result reveal animation (spinning/pulsing/morphing icon + scale effect), result card flip animation, "rolling" state visual feedback with animated spinner/icon
- Auto-loop system for ALL games in GamesLobby (instant/cards/table/arcade/advanced) — each game should run on a round timer (15s betting window, auto-result, 2s wait, repeat) — user places bet during window, if they miss it they wait for next round
- For card games (Baccarat, Dragon Tiger, Teen Patti, etc.): card deal animation using Framer Motion slide-in
- For dice games (Craps, Sic Bo, Hash Dice): dice roll shake animation
- For crash-style games in arcade (SpaceXY, JetX, Kamikaze): multiplier counter animation
- For Ball & Cup: cup shuffle animation
- Result outcome visual: WIN = green glow pulse, LOSS = red shake

### Modify
- SimpleGame component: upgrade from basic "Rolling..." text to animated result reveal with game-specific icon animations
- All simple game option buttons: add hover scale, active press effect
- GamesLobby: wrap game content in auto-loop hook so rounds cycle automatically
- WinOverlay: make confetti more dramatic (more particles, longer duration)

### Remove
- Nothing removed

## Implementation Plan
1. Create enhanced auto-loop hook `useGameLoop` that works for all simple games (15s betting → result → 2s next round auto-cycle)
2. Upgrade SimpleGame component with:
   - Animated result display (icon spin/bounce + scale reveal)
   - Win glow / Loss shake effects using Framer Motion
   - Game-specific result icons for each game type
   - Auto-loop integration
3. Add animations to individual complex games that were missing them (WheelOfFortune result spin, Stairs climb bounce already exists)
4. Enhance WinOverlay with more confetti particles and longer animation
5. Make all GamesLobby games show live "Round in progress" status indicator on lobby cards
