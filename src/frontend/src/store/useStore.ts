import { create } from "zustand";
import { persist } from "zustand/middleware";

// Types
export type UserRole = "superadmin" | "admin" | "user";
export type UserStatus = "active" | "suspended";
export type MarketStatus = "open" | "suspended" | "closed" | "settled";
export type BetType = "back" | "lay";
export type BetStatus = "matched" | "unmatched" | "settled" | "voided";
export type SportType = "cricket" | "football" | "tennis";

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  balance: number;
  creditLimit: number;
  status: UserStatus;
  createdAt: string;
}

export interface Selection {
  id: string;
  name: string;
  backOdds: number;
  layOdds: number;
  backVolume: number;
  layVolume: number;
}

// Fancy / Session betting types
export interface FancyMarket {
  id: string;
  matchId: string;
  type: "fancy" | "session";
  title: string; // e.g. "Virat Kohli Runs" or "1-6 Over Runs"
  yesOdds: number; // paise / 100 → actual back odds for YES
  noOdds: number;
  yesRuns: number; // run line for YES
  noRuns: number; // run line for NO
  minBet: number;
  maxBet: number;
  status: "open" | "suspended" | "settled";
  result?: number; // actual runs scored
}

export interface FancyBet {
  id: string;
  userId: string;
  fancyId: string;
  fancyTitle: string;
  matchName: string;
  side: "yes" | "no";
  runs: number;
  odds: number; // stored in paise (e.g. 95 = 0.95x profit)
  stake: number;
  payout: number;
  status: "open" | "won" | "lost" | "void";
  placedAt: string;
}

export interface Market {
  id: string;
  sport: SportType;
  eventName: string;
  description: string;
  selections: Selection[];
  status: MarketStatus;
  result?: string;
  createdAt: string;
  settledAt?: string;
}

export interface Bet {
  id: string;
  userId: string;
  marketId: string;
  marketName: string;
  selectionId: string;
  selectionName: string;
  type: BetType;
  odds: number;
  stake: number;
  liability: number;
  potentialWin: number;
  status: BetStatus;
  pnl: number;
  placedAt: string;
}

export type Page =
  | "landing"
  | "login"
  | "user-markets"
  | "user-bets"
  | "user-account"
  | "user-casino"
  | "user-crash"
  | "admin-markets"
  | "admin-users"
  | "admin-bets"
  | "admin-casino"
  | "admin-crash"
  | "superadmin-dashboard"
  | "superadmin-admins";

interface BetSlipState {
  isOpen: boolean;
  marketId: string;
  marketName: string;
  selectionId: string;
  selectionName: string;
  type: BetType;
  odds: number;
  stake: number;
}

interface AppState {
  // Auth
  currentUser: User | null;
  currentPage: Page;

  // Data
  users: User[];
  markets: Market[];
  bets: Bet[];
  fancyMarkets: FancyMarket[];
  fancyBets: FancyBet[];

  // BetSlip
  betSlip: BetSlipState | null;

  // Actions - Auth
  login: (username: string, password: string) => boolean;
  logout: () => void;
  setPage: (page: Page) => void;

  // Actions - Bet Slip
  openBetSlip: (state: Omit<BetSlipState, "isOpen" | "stake">) => void;
  closeBetSlip: () => void;
  updateBetSlip: (
    updates: Partial<Pick<BetSlipState, "odds" | "stake">>,
  ) => void;

  // Actions - Betting
  placeBet: () => { success: boolean; message: string };

  // Actions - Fancy
  placeFancyBet: (params: {
    fancyId: string;
    side: "yes" | "no";
    stake: number;
  }) => { success: boolean; message: string };
  updateFancyOdds: () => void;

  // Actions - Admin
  createMarket: (market: Omit<Market, "id" | "createdAt" | "status">) => void;
  updateMarketStatus: (
    marketId: string,
    status: MarketStatus,
    result?: string,
  ) => void;
  creditUserBalance: (userId: string, amount: number) => void;
  debitUserBalance: (userId: string, amount: number) => void;
  setCreditLimit: (userId: string, limit: number) => void;
  toggleUserStatus: (userId: string) => void;

  // Actions - SuperAdmin
  createAdmin: (username: string, password: string) => void;
  deleteAdmin: (userId: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

const now = () => new Date().toISOString();

const initialUsers: User[] = [
  {
    id: "1",
    username: "superadmin",
    password: "admin123",
    role: "superadmin",
    balance: 0,
    creditLimit: 0,
    status: "active",
    createdAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "2",
    username: "admin1",
    password: "admin123",
    role: "admin",
    balance: 0,
    creditLimit: 0,
    status: "active",
    createdAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "3",
    username: "user1",
    password: "pass123",
    role: "user",
    balance: 5000,
    creditLimit: 10000,
    status: "active",
    createdAt: "2025-01-15T00:00:00.000Z",
  },
  {
    id: "4",
    username: "user2",
    password: "pass123",
    role: "user",
    balance: 2500,
    creditLimit: 5000,
    status: "active",
    createdAt: "2025-01-20T00:00:00.000Z",
  },
];

const initialMarkets: Market[] = [
  {
    id: "m1",
    sport: "cricket",
    eventName: "IND vs AUS - 1st Test",
    description: "Match Odds - 1st Test at Melbourne Cricket Ground",
    selections: [
      {
        id: "s1",
        name: "India",
        backOdds: 1.85,
        layOdds: 1.87,
        backVolume: 245000,
        layVolume: 198000,
      },
      {
        id: "s2",
        name: "Australia",
        backOdds: 2.1,
        layOdds: 2.12,
        backVolume: 187000,
        layVolume: 165000,
      },
      {
        id: "s3",
        name: "Draw",
        backOdds: 3.5,
        layOdds: 3.55,
        backVolume: 89000,
        layVolume: 76000,
      },
    ],
    status: "open",
    createdAt: "2025-02-01T00:00:00.000Z",
  },
  {
    id: "m2",
    sport: "football",
    eventName: "Man City vs Arsenal - EPL",
    description: "Match Odds - Premier League Matchday 28",
    selections: [
      {
        id: "s4",
        name: "Man City",
        backOdds: 1.65,
        layOdds: 1.67,
        backVolume: 312000,
        layVolume: 289000,
      },
      {
        id: "s5",
        name: "Arsenal",
        backOdds: 2.4,
        layOdds: 2.42,
        backVolume: 198000,
        layVolume: 175000,
      },
      {
        id: "s6",
        name: "Draw",
        backOdds: 3.2,
        layOdds: 3.25,
        backVolume: 98000,
        layVolume: 87000,
      },
    ],
    status: "open",
    createdAt: "2025-02-05T00:00:00.000Z",
  },
  {
    id: "m3",
    sport: "tennis",
    eventName: "Djokovic vs Alcaraz - Wimbledon",
    description: "Match Winner - Wimbledon Gentlemen's Singles Final",
    selections: [
      {
        id: "s7",
        name: "Djokovic",
        backOdds: 1.75,
        layOdds: 1.77,
        backVolume: 425000,
        layVolume: 398000,
      },
      {
        id: "s8",
        name: "Alcaraz",
        backOdds: 2.05,
        layOdds: 2.07,
        backVolume: 356000,
        layVolume: 334000,
      },
    ],
    status: "open",
    createdAt: "2025-02-10T00:00:00.000Z",
  },
  {
    id: "m4",
    sport: "football",
    eventName: "Barcelona vs Real Madrid - La Liga",
    description: "El Clásico - La Liga Matchday 30",
    selections: [
      {
        id: "s9",
        name: "Barcelona",
        backOdds: 1.9,
        layOdds: 1.92,
        backVolume: 567000,
        layVolume: 523000,
      },
      {
        id: "s10",
        name: "Real Madrid",
        backOdds: 1.95,
        layOdds: 1.97,
        backVolume: 543000,
        layVolume: 498000,
      },
      {
        id: "s11",
        name: "Draw",
        backOdds: 3.3,
        layOdds: 3.35,
        backVolume: 134000,
        layVolume: 118000,
      },
    ],
    status: "open",
    createdAt: "2025-02-12T00:00:00.000Z",
  },
];

const initialFancyMarkets: FancyMarket[] = [
  // IND vs AUS fancy markets
  {
    id: "f1",
    matchId: "m1",
    type: "fancy",
    title: "India Total Runs",
    yesOdds: 95,
    noOdds: 97,
    yesRuns: 320,
    noRuns: 320,
    minBet: 100,
    maxBet: 50000,
    status: "open",
  },
  {
    id: "f2",
    matchId: "m1",
    type: "fancy",
    title: "Virat Kohli Runs",
    yesOdds: 92,
    noOdds: 95,
    yesRuns: 65,
    noRuns: 65,
    minBet: 100,
    maxBet: 25000,
    status: "open",
  },
  {
    id: "f3",
    matchId: "m1",
    type: "fancy",
    title: "Rohit Sharma Runs",
    yesOdds: 90,
    noOdds: 93,
    yesRuns: 45,
    noRuns: 45,
    minBet: 100,
    maxBet: 25000,
    status: "open",
  },
  {
    id: "f4",
    matchId: "m1",
    type: "fancy",
    title: "India 1st Innings Wkts",
    yesOdds: 88,
    noOdds: 92,
    yesRuns: 6,
    noRuns: 6,
    minBet: 100,
    maxBet: 10000,
    status: "open",
  },
  // Session markets for IND vs AUS
  {
    id: "s_f1",
    matchId: "m1",
    type: "session",
    title: "1-6 Over Runs (IND)",
    yesOdds: 94,
    noOdds: 96,
    yesRuns: 48,
    noRuns: 48,
    minBet: 100,
    maxBet: 30000,
    status: "open",
  },
  {
    id: "s_f2",
    matchId: "m1",
    type: "session",
    title: "7-15 Over Runs (IND)",
    yesOdds: 93,
    noOdds: 96,
    yesRuns: 62,
    noRuns: 62,
    minBet: 100,
    maxBet: 30000,
    status: "open",
  },
  {
    id: "s_f3",
    matchId: "m1",
    type: "session",
    title: "16-20 Over Runs (IND)",
    yesOdds: 91,
    noOdds: 94,
    yesRuns: 54,
    noRuns: 54,
    minBet: 100,
    maxBet: 30000,
    status: "open",
  },
  {
    id: "s_f4",
    matchId: "m1",
    type: "session",
    title: "Fall of 1st Wkt (IND)",
    yesOdds: 90,
    noOdds: 93,
    yesRuns: 42,
    noRuns: 42,
    minBet: 100,
    maxBet: 20000,
    status: "suspended",
  },
];

const initialBets: Bet[] = [
  {
    id: "b1",
    userId: "3",
    marketId: "m1",
    marketName: "IND vs AUS - 1st Test",
    selectionId: "s1",
    selectionName: "India",
    type: "back",
    odds: 1.85,
    stake: 500,
    liability: 500,
    potentialWin: 425,
    status: "matched",
    pnl: 0,
    placedAt: "2025-02-15T10:30:00.000Z",
  },
  {
    id: "b2",
    userId: "3",
    marketId: "m2",
    marketName: "Man City vs Arsenal - EPL",
    selectionId: "s4",
    selectionName: "Man City",
    type: "back",
    odds: 1.65,
    stake: 1000,
    liability: 1000,
    potentialWin: 650,
    status: "matched",
    pnl: 0,
    placedAt: "2025-02-16T14:20:00.000Z",
  },
  {
    id: "b3",
    userId: "4",
    marketId: "m3",
    marketName: "Djokovic vs Alcaraz - Wimbledon",
    selectionId: "s8",
    selectionName: "Alcaraz",
    type: "lay",
    odds: 2.07,
    stake: 300,
    liability: 321,
    potentialWin: 300,
    status: "matched",
    pnl: 0,
    placedAt: "2025-02-17T09:15:00.000Z",
  },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      currentPage: "landing",
      users: initialUsers,
      markets: initialMarkets,
      bets: initialBets,
      fancyMarkets: initialFancyMarkets,
      fancyBets: [],
      betSlip: null,

      login: (username, password) => {
        const user = get().users.find(
          (u) =>
            u.username === username &&
            u.password === password &&
            u.status === "active",
        );
        if (!user) return false;

        let page: Page = "landing";
        if (user.role === "user") page = "user-markets";
        else if (user.role === "admin") page = "admin-markets";
        else if (user.role === "superadmin") page = "superadmin-dashboard";

        set({ currentUser: user, currentPage: page, betSlip: null });
        return true;
      },

      logout: () => {
        set({ currentUser: null, currentPage: "landing", betSlip: null });
      },

      setPage: (page) => set({ currentPage: page }),

      openBetSlip: (state) => {
        set({
          betSlip: {
            ...state,
            isOpen: true,
            stake: 100,
          },
        });
      },

      closeBetSlip: () => set({ betSlip: null }),

      updateBetSlip: (updates) => {
        const { betSlip } = get();
        if (!betSlip) return;
        set({ betSlip: { ...betSlip, ...updates } });
      },

      placeBet: () => {
        const { betSlip, currentUser, users, bets, markets } = get();
        if (!betSlip || !currentUser)
          return { success: false, message: "No bet slip open" };

        const odds = betSlip.odds;
        const stake = betSlip.stake;

        if (stake <= 0)
          return { success: false, message: "Stake must be greater than 0" };
        if (odds < 1.01)
          return { success: false, message: "Odds must be at least 1.01" };

        const market = markets.find((m) => m.id === betSlip.marketId);
        if (market && market.status !== "open") {
          return {
            success: false,
            message: "This market is not open for betting",
          };
        }

        let deduction = 0;
        let liability = 0;
        let potentialWin = 0;

        if (betSlip.type === "back") {
          deduction = stake;
          liability = stake;
          potentialWin = stake * (odds - 1);
        } else {
          // Lay bet: liability = stake * (odds - 1)
          liability = stake * (odds - 1);
          deduction = liability;
          potentialWin = stake;
        }

        const userBalance = currentUser.balance;
        if (userBalance < deduction) {
          return {
            success: false,
            message: `Insufficient balance. Required: ₹${deduction.toFixed(2)}`,
          };
        }

        const newBet: Bet = {
          id: generateId(),
          userId: currentUser.id,
          marketId: betSlip.marketId,
          marketName: betSlip.marketName,
          selectionId: betSlip.selectionId,
          selectionName: betSlip.selectionName,
          type: betSlip.type,
          odds,
          stake,
          liability,
          potentialWin,
          status: "matched",
          pnl: 0,
          placedAt: now(),
        };

        const updatedUsers = users.map((u) =>
          u.id === currentUser.id
            ? { ...u, balance: u.balance - deduction }
            : u,
        );

        const updatedCurrentUser = {
          ...currentUser,
          balance: currentUser.balance - deduction,
        };

        set({
          bets: [newBet, ...bets],
          users: updatedUsers,
          currentUser: updatedCurrentUser,
          betSlip: null,
        });

        return { success: true, message: "Bet placed successfully!" };
      },

      placeFancyBet: ({ fancyId, side, stake }) => {
        const { currentUser, fancyMarkets, fancyBets, users } = get();
        if (!currentUser) return { success: false, message: "Not logged in" };

        const fm = fancyMarkets.find((f) => f.id === fancyId);
        if (!fm) return { success: false, message: "Market not found" };
        if (fm.status !== "open")
          return { success: false, message: "Market is suspended" };
        if (stake < fm.minBet)
          return { success: false, message: `Minimum bet is ₹${fm.minBet}` };
        if (stake > fm.maxBet)
          return { success: false, message: `Maximum bet is ₹${fm.maxBet}` };
        if (currentUser.balance < stake)
          return {
            success: false,
            message: `Insufficient balance. You have ₹${currentUser.balance.toFixed(2)}`,
          };

        const odds = side === "yes" ? fm.yesOdds : fm.noOdds;
        const runs = side === "yes" ? fm.yesRuns : fm.noRuns;
        // payout = stake * (odds / 100) profit + stake back
        const payout = Number.parseFloat((stake * (odds / 100)).toFixed(2));

        const newFancyBet: FancyBet = {
          id: generateId(),
          userId: currentUser.id,
          fancyId,
          fancyTitle: fm.title,
          matchName: fm.matchId,
          side,
          runs,
          odds,
          stake,
          payout,
          status: "open",
          placedAt: now(),
        };

        const updatedUsers = users.map((u) =>
          u.id === currentUser.id ? { ...u, balance: u.balance - stake } : u,
        );
        const updatedCurrentUser = {
          ...currentUser,
          balance: currentUser.balance - stake,
        };

        set({
          fancyBets: [newFancyBet, ...fancyBets],
          users: updatedUsers,
          currentUser: updatedCurrentUser,
        });
        return { success: true, message: "Fancy bet placed!" };
      },

      updateFancyOdds: () => {
        set((state) => ({
          fancyMarkets: state.fancyMarkets.map((fm) => {
            if (fm.status !== "open") return fm;
            // Simulate small odds drift
            const drift = () => Math.floor((Math.random() - 0.5) * 4);
            return {
              ...fm,
              yesOdds: Math.min(98, Math.max(70, fm.yesOdds + drift())),
              noOdds: Math.min(99, Math.max(72, fm.noOdds + drift())),
              yesRuns:
                fm.yesRuns +
                (Math.random() < 0.15 ? (Math.random() < 0.5 ? 1 : -1) : 0),
              noRuns:
                fm.noRuns +
                (Math.random() < 0.15 ? (Math.random() < 0.5 ? 1 : -1) : 0),
            };
          }),
        }));
      },

      createMarket: (marketData) => {
        const newMarket: Market = {
          ...marketData,
          id: generateId(),
          status: "open",
          createdAt: now(),
        };
        set((state) => ({ markets: [newMarket, ...state.markets] }));
      },

      updateMarketStatus: (marketId, status, result) => {
        set((state) => {
          const updatedMarkets = state.markets.map((m) => {
            if (m.id !== marketId) return m;
            return {
              ...m,
              status,
              result: result ?? m.result,
              settledAt: status === "settled" ? now() : m.settledAt,
            };
          });

          // Settle bets if market settled
          let updatedBets = state.bets;
          let updatedUsers = state.users;

          if (status === "settled" && result) {
            updatedBets = state.bets.map((bet) => {
              if (bet.marketId !== marketId || bet.status !== "matched")
                return bet;

              const won =
                (bet.type === "back" && bet.selectionName === result) ||
                (bet.type === "lay" && bet.selectionName !== result);

              const pnl = won ? bet.potentialWin : -bet.liability;

              if (won) {
                updatedUsers = updatedUsers.map((u) =>
                  u.id === bet.userId
                    ? {
                        ...u,
                        balance: u.balance + bet.stake + bet.potentialWin,
                      }
                    : u,
                );
              }

              return { ...bet, status: "settled" as BetStatus, pnl };
            });
          }

          return {
            markets: updatedMarkets,
            bets: updatedBets,
            users: updatedUsers,
          };
        });
      },

      creditUserBalance: (userId, amount) => {
        set((state) => {
          const updatedUsers = state.users.map((u) =>
            u.id === userId ? { ...u, balance: u.balance + amount } : u,
          );
          const updatedCurrentUser =
            state.currentUser?.id === userId
              ? {
                  ...state.currentUser,
                  balance: state.currentUser.balance + amount,
                }
              : state.currentUser;
          return { users: updatedUsers, currentUser: updatedCurrentUser };
        });
      },

      debitUserBalance: (userId, amount) => {
        set((state) => {
          const updatedUsers = state.users.map((u) =>
            u.id === userId
              ? { ...u, balance: Math.max(0, u.balance - amount) }
              : u,
          );
          const updatedCurrentUser =
            state.currentUser?.id === userId
              ? {
                  ...state.currentUser,
                  balance: Math.max(0, state.currentUser.balance - amount),
                }
              : state.currentUser;
          return { users: updatedUsers, currentUser: updatedCurrentUser };
        });
      },

      setCreditLimit: (userId, limit) => {
        set((state) => ({
          users: state.users.map((u) =>
            u.id === userId ? { ...u, creditLimit: limit } : u,
          ),
        }));
      },

      toggleUserStatus: (userId) => {
        set((state) => ({
          users: state.users.map((u) =>
            u.id === userId
              ? { ...u, status: u.status === "active" ? "suspended" : "active" }
              : u,
          ),
        }));
      },

      createAdmin: (username, password) => {
        const newAdmin: User = {
          id: generateId(),
          username,
          password,
          role: "admin",
          balance: 0,
          creditLimit: 0,
          status: "active",
          createdAt: now(),
        };
        set((state) => ({ users: [...state.users, newAdmin] }));
      },

      deleteAdmin: (userId) => {
        set((state) => ({
          users: state.users.filter((u) => u.id !== userId),
        }));
      },
    }),
    {
      name: "kingbet-storage",
      partialize: (state) => ({
        users: state.users,
        markets: state.markets,
        bets: state.bets,
        fancyBets: state.fancyBets,
        currentUser: state.currentUser,
      }),
    },
  ),
);
