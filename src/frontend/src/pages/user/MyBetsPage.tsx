import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type BetStatus,
  type CasinoHistoryEntry,
  type CrashHistoryEntry,
  useStore,
} from "@/store/useStore";
import {
  Circle,
  ClipboardList,
  Dices,
  Rocket,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";

const STATUS_COLORS: Record<BetStatus, string> = {
  matched: "oklch(0.55 0.18 240)",
  unmatched: "oklch(0.72 0.18 60)",
  settled: "oklch(0.65 0.18 145)",
  voided: "oklch(0.55 0.01 265)",
};

const STATUS_BG: Record<BetStatus, string> = {
  matched: "oklch(0.55 0.18 240 / 0.15)",
  unmatched: "oklch(0.72 0.18 60 / 0.15)",
  settled: "oklch(0.65 0.18 145 / 0.15)",
  voided: "oklch(0.55 0.01 265 / 0.15)",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const GAME_ICONS: Record<string, string> = {
  roulette: "🎰",
  teenpatti: "🃏",
  andarbahar: "🎴",
  andarbhar: "🎴",
  aviator: "✈️",
  plinko: "🎯",
  dice: "🎲",
};

const GAME_LABELS: Record<string, string> = {
  roulette: "Roulette",
  teenpatti: "Teen Patti",
  andarbahar: "Andar Bahar",
  andarbhar: "Andar Bahar",
  aviator: "Aviator",
  plinko: "Plinko",
  dice: "Dice",
};

// ── Sports Bets Tab ────────────────────────────────────────────────────────────
function SportsBetsTab({ userId }: { userId: string }) {
  const allBets = useStore((s) => s.bets);
  const userBets = allBets.filter((b) => b.userId === userId);

  if (userBets.length === 0) {
    return (
      <div
        data-ocid="bets.sports.empty_state"
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <Circle className="w-12 h-12 text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground font-medium">No sports bets yet</p>
        <p className="text-muted-foreground/60 text-sm mt-1">
          Place your first bet on the Markets page
        </p>
      </div>
    );
  }

  return (
    <div data-ocid="bets.sports.table" className="space-y-2">
      {userBets.map((bet, i) => (
        <motion.div
          key={bet.id}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
          data-ocid={`bets.sports.row.${i + 1}`}
          className="rounded-lg border border-border bg-card p-3 hover:border-border/80 transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {/* Back/Lay badge */}
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase"
                  style={{
                    background:
                      bet.type === "back"
                        ? "oklch(var(--back) / 0.2)"
                        : "oklch(var(--lay) / 0.2)",
                    color:
                      bet.type === "back"
                        ? "oklch(var(--back))"
                        : "oklch(var(--lay))",
                  }}
                >
                  {bet.type === "back" ? (
                    <TrendingUp className="w-2.5 h-2.5" />
                  ) : (
                    <TrendingDown className="w-2.5 h-2.5" />
                  )}
                  {bet.type}
                </span>

                {/* Status */}
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded uppercase"
                  style={{
                    background: STATUS_BG[bet.status],
                    color: STATUS_COLORS[bet.status],
                  }}
                >
                  {bet.status}
                </span>
              </div>

              <p className="text-xs text-muted-foreground truncate">
                {bet.marketName}
              </p>
              <p className="text-sm font-semibold text-foreground truncate">
                {bet.selectionName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDate(bet.placedAt)}
              </p>
            </div>

            {/* Numbers */}
            <div className="text-right shrink-0 space-y-1">
              <div className="flex items-center justify-end gap-3">
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">Odds</p>
                  <p className="text-sm font-bold font-mono text-foreground">
                    {bet.odds.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">Stake</p>
                  <p className="text-sm font-bold font-mono text-foreground">
                    ₹{bet.stake}
                  </p>
                </div>
              </div>

              {bet.status === "settled" ? (
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">P&L</p>
                  <p
                    className={`text-sm font-bold font-mono ${bet.pnl >= 0 ? "text-green-400" : "text-rose-400"}`}
                  >
                    {bet.pnl >= 0 ? "+" : ""}₹{bet.pnl.toFixed(2)}
                  </p>
                </div>
              ) : (
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">
                    Potential Win
                  </p>
                  <p className="text-sm font-bold font-mono text-green-400">
                    +₹{bet.potentialWin.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Casino History Tab ─────────────────────────────────────────────────────────
function CasinoHistoryTab({ userId }: { userId: string }) {
  const allCasino = useStore((s) => s.casinoHistory);
  const userCasino = allCasino.filter((e) => e.userId === userId);

  if (userCasino.length === 0) {
    return (
      <div
        data-ocid="bets.casino.empty_state"
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <Dices className="w-12 h-12 text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground font-medium">
          No casino history yet
        </p>
        <p className="text-muted-foreground/60 text-sm mt-1">
          Play Live Casino to see your history here
        </p>
      </div>
    );
  }

  return (
    <div data-ocid="bets.casino.table" className="space-y-2">
      {userCasino.map((entry: CasinoHistoryEntry, i) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
          data-ocid={`bets.casino.row.${i + 1}`}
          className="rounded-lg border border-border bg-card p-3 hover:border-border/80 transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {/* Game badge */}
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{
                    background: "oklch(var(--saffron) / 0.15)",
                    color: "oklch(var(--saffron))",
                  }}
                >
                  {GAME_ICONS[entry.game] ?? "🎰"}{" "}
                  {GAME_LABELS[entry.game] ?? entry.game}
                </span>

                {/* P&L badge */}
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{
                    background:
                      entry.pnl >= 0
                        ? "oklch(0.65 0.18 145 / 0.15)"
                        : "oklch(var(--lay) / 0.15)",
                    color:
                      entry.pnl >= 0
                        ? "oklch(0.65 0.18 145)"
                        : "oklch(var(--lay))",
                  }}
                >
                  {entry.pnl >= 0 ? "WIN" : "LOSS"}
                </span>
              </div>

              <p className="text-sm font-semibold text-foreground">
                Bet: <span className="capitalize">{entry.bet}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Result: <span className="font-medium">{entry.result}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDate(entry.placedAt)}
              </p>
            </div>

            <div className="text-right shrink-0 space-y-1">
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Stake</p>
                <p className="text-sm font-bold font-mono text-foreground">
                  ₹{entry.stake.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">P&L</p>
                <p
                  className={`text-sm font-bold font-mono ${entry.pnl >= 0 ? "text-green-400" : "text-rose-400"}`}
                >
                  {entry.pnl >= 0 ? "+" : ""}₹{entry.pnl.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Crash History Tab ──────────────────────────────────────────────────────────
function CrashHistoryTab({ userId }: { userId: string }) {
  const allCrash = useStore((s) => s.crashHistory);
  const userCrash = allCrash.filter((e) => e.userId === userId);

  if (userCrash.length === 0) {
    return (
      <div
        data-ocid="bets.crash.empty_state"
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <Rocket className="w-12 h-12 text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground font-medium">
          No crash game history yet
        </p>
        <p className="text-muted-foreground/60 text-sm mt-1">
          Play Aviator, Plinko, or Dice to see your history here
        </p>
      </div>
    );
  }

  return (
    <div data-ocid="bets.crash.table" className="space-y-2">
      {userCrash.map((entry: CrashHistoryEntry, i) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
          data-ocid={`bets.crash.row.${i + 1}`}
          className="rounded-lg border border-border bg-card p-3 hover:border-border/80 transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {/* Game badge */}
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{
                    background: "oklch(var(--back) / 0.15)",
                    color: "oklch(var(--back))",
                  }}
                >
                  {GAME_ICONS[entry.game] ?? "🎮"}{" "}
                  {GAME_LABELS[entry.game] ?? entry.game}
                </span>

                {/* Win/Loss badge */}
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{
                    background:
                      entry.pnl >= 0
                        ? "oklch(0.65 0.18 145 / 0.15)"
                        : "oklch(var(--lay) / 0.15)",
                    color:
                      entry.pnl >= 0
                        ? "oklch(0.65 0.18 145)"
                        : "oklch(var(--lay))",
                  }}
                >
                  {entry.cashoutMultiplier > 0
                    ? `${entry.cashoutMultiplier.toFixed(2)}x`
                    : "CRASHED"}
                </span>
              </div>

              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDate(entry.placedAt)}
              </p>
            </div>

            <div className="text-right shrink-0 space-y-1">
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Stake</p>
                <p className="text-sm font-bold font-mono text-foreground">
                  ₹{entry.stake.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">P&L</p>
                <p
                  className={`text-sm font-bold font-mono ${entry.pnl >= 0 ? "text-green-400" : "text-rose-400"}`}
                >
                  {entry.pnl >= 0 ? "+" : ""}₹{entry.pnl.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Main MyBetsPage ────────────────────────────────────────────────────────────
export function MyBetsPage() {
  const currentUser = useStore((s) => s.currentUser);
  const allBets = useStore((s) => s.bets);
  const casinoHistory = useStore((s) => s.casinoHistory);
  const crashHistory = useStore((s) => s.crashHistory);

  const userId = currentUser?.id ?? "";
  const userSportsBets = allBets.filter((b) => b.userId === userId);
  const userCasino = casinoHistory.filter((e) => e.userId === userId);
  const userCrash = crashHistory.filter((e) => e.userId === userId);

  // Combined summary
  const totalEntries =
    userSportsBets.length + userCasino.length + userCrash.length;
  const totalStake =
    userSportsBets.reduce((s, b) => s + b.stake, 0) +
    userCasino.reduce((s, e) => s + e.stake, 0) +
    userCrash.reduce((s, e) => s + e.stake, 0);
  const netPnl =
    userSportsBets
      .filter((b) => b.status === "settled")
      .reduce((s, b) => s + b.pnl, 0) +
    userCasino.reduce((s, e) => s + e.pnl, 0) +
    userCrash.reduce((s, e) => s + e.pnl, 0);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <ClipboardList className="w-5 h-5 text-gold" />
        <h1 className="text-lg font-bold text-foreground">My Bets</h1>
        <Badge
          variant="outline"
          className="text-xs border-border text-muted-foreground"
        >
          {totalEntries} total
        </Badge>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-lg bg-card border border-border p-3">
          <p className="text-xs text-muted-foreground">Total Entries</p>
          <p className="text-lg font-bold text-foreground mt-0.5">
            {totalEntries}
          </p>
        </div>
        <div className="rounded-lg bg-card border border-border p-3">
          <p className="text-xs text-muted-foreground">Total Staked</p>
          <p className="text-lg font-bold text-foreground mt-0.5">
            ₹{totalStake.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="rounded-lg bg-card border border-border p-3">
          <p className="text-xs text-muted-foreground">Net P&L</p>
          <p
            className={`text-lg font-bold mt-0.5 ${netPnl >= 0 ? "text-green-400" : "text-rose-400"}`}
          >
            {netPnl >= 0 ? "+" : ""}₹{netPnl.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sports" className="w-full">
        <TabsList
          className="bg-secondary border border-border mb-4 h-9 w-full"
          data-ocid="bets.filter.tab"
        >
          <TabsTrigger
            value="sports"
            className="flex-1 text-xs"
            data-ocid="bets.sports.tab"
          >
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            Sports ({userSportsBets.length})
          </TabsTrigger>
          <TabsTrigger
            value="casino"
            className="flex-1 text-xs"
            data-ocid="bets.casino.tab"
          >
            <Dices className="w-3.5 h-3.5 mr-1" />
            Casino ({userCasino.length})
          </TabsTrigger>
          <TabsTrigger
            value="crash"
            className="flex-1 text-xs"
            data-ocid="bets.crash.tab"
          >
            <Rocket className="w-3.5 h-3.5 mr-1" />
            Crash ({userCrash.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sports">
          <SportsBetsTab userId={userId} />
        </TabsContent>

        <TabsContent value="casino">
          <CasinoHistoryTab userId={userId} />
        </TabsContent>

        <TabsContent value="crash">
          <CrashHistoryTab userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
