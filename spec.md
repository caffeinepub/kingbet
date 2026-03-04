# KINGBET

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Full-stack betting exchange platform
- Role-based access: Super Admin, Admin, User
- Betting engine with Back/Lay order matching
- Markets for Cricket, Football, Tennis
- Login page with WhatsApp "Get ID" flow
- Role-based dashboards for each user type

### Modify
- N/A

### Remove
- N/A

## Implementation Plan

### Backend (Motoko)
- User management: register, login (username/password), roles (superadmin, admin, user)
- Market management: create/update/suspend/close markets with sport type, event name, odds
- Betting engine: place Back/Lay bets, order matching logic, bet settlement
- Wallet: user balance, deposit/withdraw (admin-controlled), P&L tracking
- Admin controls: manage users, set credit limits, suspend accounts

### Frontend (React)
- Login page with username/password form and WhatsApp "Get ID" CTA button
- Super Admin dashboard: manage admins, view all bets, system stats
- Admin dashboard: manage users, view user bets, set credit limits
- User dashboard: browse open markets, place Back/Lay bets, view bet history, wallet balance
- Market listing: Cricket / Football / Tennis tabs with live odds display
- Bet slip: order entry for Back (blue) and Lay (pink) with stake/odds inputs
- Dark premium UI theme throughout
