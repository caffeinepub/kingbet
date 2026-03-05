import { Badge } from "@/components/ui/badge";
import { useStore } from "@/store/useStore";
import {
  Activity,
  Gamepad2,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface GameStat {
  game: string;
  icon: string;
  totalBets: number;
  totalVolume: number;
  housePnl: number;
}

// ─── Game display names and icons ─────────────────────────────────────────────
const GAME_META: Record<string, { icon: string; name: string }> = {
  roulette: { icon: "🎰", name: "European Roulette" },
  teenpatti: { icon: "🃏", name: "Teen Patti" },
  andarbhar: { icon: "🎴", name: "Andar Bahar" },
  aviator: { icon: "✈️", name: "Aviator" },
  plinko: { icon: "🎯", name: "Plinko" },
  dice: { icon: "🎲", name: "Classic Dice" },
  mines: { icon: "💣", name: "Mines" },
  tower: { icon: "🏗️", name: "Tower" },
  limbo: { icon: "📈", name: "Limbo" },
  coinflip: { icon: "🪙", name: "Coin Flip" },
  blackjack: { icon: "🃏", name: "Blackjack" },
  keno: { icon: "🎱", name: "Keno" },
  scratch: { icon: "🎟️", name: "Scratch Cards" },
  sattamatka: { icon: "🎯", name: "Satta Matka" },
  diamonds: { icon: "💎", name: "Diamonds" },
  hilo: { icon: "↕️", name: "Hi-Lo" },
  stairs: { icon: "🪜", name: "Stairs" },
  wheel: { icon: "🎡", name: "Wheel of Fortune" },
};

function getGameMeta(game: string) {
  return (
    GAME_META[game] ?? {
      icon: "🎮",
      name: game.charAt(0).toUpperCase() + game.slice(1),
    }
  );
}

// ─── Admin Games Monitor ──────────────────────────────────────────────────────
export function AdminGamesPage() {
  const casinoHistory = useStore((s) => s.casinoHistory);
  const crashHistory = useStore((s) => s.crashHistory);

  // Simulated live player count
  const [liveCount, setLiveCount] = useState(
    Math.floor(Math.random() * 150) + 50,
  );
  useEffect(() => {
    const id = setInterval(() => {
      setLiveCount(Math.floor(Math.random() * 150) + 50);
    }, 10000);
    return () => clearInterval(id);
  }, []);

  // Compute game stats from casino history
  const casinoStats = casinoHistory.reduce<Record<string, GameStat>>(
    (acc, entry) => {
      if (!acc[entry.game]) {
        const meta = getGameMeta(entry.game);
        acc[entry.game] = {
          game: entry.game,
          icon: meta.icon,
          totalBets: 0,
          totalVolume: 0,
          housePnl: 0,
        };
      }
      acc[entry.game].totalBets += 1;
      acc[entry.game].totalVolume += entry.stake;
      acc[entry.game].housePnl -= entry.pnl; // house profit = negative of user pnl
      return acc;
    },
    {},
  );

  // Compute crash game stats
  const crashStats = crashHistory.reduce<Record<string, GameStat>>(
    (acc, entry) => {
      if (!acc[entry.game]) {
        const meta = getGameMeta(entry.game);
        acc[entry.game] = {
          game: entry.game,
          icon: meta.icon,
          totalBets: 0,
          totalVolume: 0,
          housePnl: 0,
        };
      }
      acc[entry.game].totalBets += 1;
      acc[entry.game].totalVolume += entry.stake;
      acc[entry.game].housePnl -= entry.pnl;
      return acc;
    },
    {},
  );

  const allStats = Object.values({ ...casinoStats, ...crashStats }).sort(
    (a, b) => b.totalVolume - a.totalVolume,
  );

  // Recent activity feed (last 20 combined)
  type FeedEntry = {
    id: string;
    type: "casino" | "crash";
    game: string;
    stake: number;
    pnl: number;
    placedAt: string;
  };

  const casinoFeed: FeedEntry[] = casinoHistory.slice(0, 15).map((e) => ({
    id: e.id,
    type: "casino",
    game: e.game,
    stake: e.stake,
    pnl: e.pnl,
    placedAt: e.placedAt,
  }));
  const crashFeed: FeedEntry[] = crashHistory.slice(0, 15).map((e) => ({
    id: e.id,
    type: "crash",
    game: e.game,
    stake: e.stake,
    pnl: e.pnl,
    placedAt: e.placedAt,
  }));

  const activityFeed = [...casinoFeed, ...crashFeed]
    .sort(
      (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime(),
    )
    .slice(0, 20);

  const totalVolume = allStats.reduce((s, g) => s + g.totalVolume, 0);
  const totalHousePnl = allStats.reduce((s, g) => s + g.housePnl, 0);
  const totalBets = allStats.reduce((s, g) => s + g.totalBets, 0);

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Gamepad2 className="w-5 h-5 text-gold" />
        <h1 className="text-lg font-bold text-foreground">Games Monitor</h1>
        <Badge
          variant="outline"
          className="text-xs font-bold flex items-center gap-1"
          style={{
            background: "oklch(0.65 0.18 145 / 0.15)",
            color: "oklch(0.65 0.18 145)",
            borderColor: "oklch(0.65 0.18 145 / 0.3)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
          Live
        </Badge>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Live Players",
            value: liveCount,
            icon: Users,
            color: "oklch(var(--back))",
          },
          {
            label: "Total Bets",
            value: totalBets,
            icon: Activity,
            color: "oklch(var(--gold))",
          },
          {
            label: "Total Volume",
            value: `₹${(totalVolume / 1000).toFixed(1)}K`,
            icon: TrendingUp,
            color: "oklch(0.55 0.18 240)",
          },
          {
            label: "House P&L",
            value: `${totalHousePnl >= 0 ? "+" : ""}₹${totalHousePnl.toFixed(0)}`,
            icon: totalHousePnl >= 0 ? TrendingUp : TrendingDown,
            color:
              totalHousePnl >= 0 ? "oklch(0.65 0.18 145)" : "oklch(var(--lay))",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: `${stat.color}20` }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                </div>
                <span className="text-xs text-muted-foreground">
                  {stat.label}
                </span>
              </div>
              <p
                className="text-xl font-bold font-mono"
                style={{ color: stat.color }}
              >
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Game Volume Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/30">
          <h2 className="font-semibold text-foreground text-sm">
            Game Volume Stats
          </h2>
        </div>
        {allStats.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-12"
            data-ocid="admin.games.empty_state"
          >
            <Gamepad2 className="w-10 h-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">
              No game activity yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Stats will appear as users play games
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium">
                    Game
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs text-muted-foreground font-medium">
                    Bets
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs text-muted-foreground font-medium">
                    Volume
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs text-muted-foreground font-medium">
                    House P&L
                  </th>
                </tr>
              </thead>
              <tbody>
                {allStats.map((stat, i) => {
                  const meta = getGameMeta(stat.game);
                  return (
                    <tr
                      key={stat.game}
                      data-ocid={`admin.games.row.${i + 1}`}
                      className="border-b border-border/30 last:border-0 hover:bg-secondary/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{stat.icon}</span>
                          <span className="text-foreground font-medium text-sm">
                            {meta.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground font-mono text-xs">
                        {stat.totalBets}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-foreground">
                        ₹{stat.totalVolume.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs font-bold">
                        <span
                          style={{
                            color:
                              stat.housePnl >= 0
                                ? "oklch(0.65 0.18 145)"
                                : "oklch(var(--lay))",
                          }}
                        >
                          {stat.housePnl >= 0 ? "+" : ""}₹
                          {stat.housePnl.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Activity Feed */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/30 flex items-center gap-2">
          <h2 className="font-semibold text-foreground text-sm">
            Recent Activity
          </h2>
          <span className="text-xs text-muted-foreground">
            (last 20 rounds)
          </span>
        </div>
        {activityFeed.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            No recent activity
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {activityFeed.map((entry, i) => {
              const meta = getGameMeta(entry.game);
              const isWin = entry.pnl > 0;
              return (
                <div
                  key={entry.id}
                  data-ocid={`admin.games.activity.${i + 1}`}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-secondary/20 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{meta.icon}</span>
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {meta.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(entry.placedAt).toLocaleTimeString("en-IN")} ·{" "}
                        <span
                          className="font-bold uppercase text-[9px]"
                          style={{
                            color:
                              entry.type === "casino"
                                ? "oklch(var(--gold))"
                                : "oklch(0.62 0.22 20)",
                          }}
                        >
                          {entry.type}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-muted-foreground">
                      ₹{entry.stake}
                    </p>
                    <p
                      className="text-xs font-bold font-mono"
                      style={{
                        color: isWin
                          ? "oklch(0.65 0.18 145)"
                          : "oklch(0.62 0.22 20)",
                      }}
                    >
                      {isWin ? "+" : ""}₹{entry.pnl.toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
