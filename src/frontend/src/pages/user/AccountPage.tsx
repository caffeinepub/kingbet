import { useStore } from "@/store/useStore";
import {
  Award,
  BarChart3,
  TrendingDown,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";

export function AccountPage() {
  const currentUser = useStore((s) => s.currentUser);
  const allBets = useStore((s) => s.bets);
  const allCasino = useStore((s) => s.casinoHistory);
  const allCrash = useStore((s) => s.crashHistory);

  if (!currentUser) return null;

  const uid = currentUser.id;

  // Sports bets
  const userBets = allBets.filter((b) => b.userId === uid);
  const settledBets = userBets.filter((b) => b.status === "settled");
  const activeBets = userBets.filter(
    (b) => b.status === "matched" || b.status === "unmatched",
  );

  // Casino & crash
  const userCasino = allCasino.filter((e) => e.userId === uid);
  const userCrash = allCrash.filter((e) => e.userId === uid);

  // Combined stats
  const totalBets = userBets.length + userCasino.length + userCrash.length;

  const sportsPnl = settledBets.reduce((sum, b) => sum + b.pnl, 0);
  const casinoPnl = userCasino.reduce((sum, e) => sum + e.pnl, 0);
  const crashPnl = userCrash.reduce((sum, e) => sum + e.pnl, 0);
  const netPnl = sportsPnl + casinoPnl + crashPnl;

  const totalStaked =
    userBets.reduce((sum, b) => sum + b.stake, 0) +
    userCasino.reduce((sum, e) => sum + e.stake, 0) +
    userCrash.reduce((sum, e) => sum + e.stake, 0);

  // Win/loss across all categories
  const allSettledPnls = [
    ...settledBets.map((b) => b.pnl),
    ...userCasino.map((e) => e.pnl),
    ...userCrash.map((e) => e.pnl),
  ];
  const totalWon = allSettledPnls
    .filter((p) => p > 0)
    .reduce((sum, p) => sum + p, 0);
  const totalLost = allSettledPnls
    .filter((p) => p < 0)
    .reduce((sum, p) => sum + Math.abs(p), 0);
  const winRate =
    allSettledPnls.length > 0
      ? (allSettledPnls.filter((p) => p > 0).length / allSettledPnls.length) *
        100
      : 0;

  const stats = [
    {
      label: "Current Balance",
      value: `₹${currentUser.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      icon: Wallet,
      color: "oklch(var(--gold))",
      bg: "oklch(var(--gold) / 0.1)",
    },
    {
      label: "Credit Limit",
      value: `₹${currentUser.creditLimit.toLocaleString("en-IN")}`,
      icon: Award,
      color: "oklch(var(--accent))",
      bg: "oklch(var(--accent) / 0.1)",
    },
    {
      label: "Total Wagered",
      value: `₹${totalStaked.toLocaleString("en-IN")}`,
      icon: BarChart3,
      color: "oklch(var(--back))",
      bg: "oklch(var(--back) / 0.1)",
    },
    {
      label: "Net P&L",
      value: `${netPnl >= 0 ? "+" : ""}₹${netPnl.toFixed(2)}`,
      icon: netPnl >= 0 ? TrendingUp : TrendingDown,
      color: netPnl >= 0 ? "oklch(0.65 0.18 145)" : "oklch(var(--lay))",
      bg:
        netPnl >= 0 ? "oklch(0.65 0.18 145 / 0.1)" : "oklch(var(--lay) / 0.1)",
    },
  ];

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <User className="w-5 h-5 text-gold" />
        <h1 className="text-lg font-bold text-foreground">Account</h1>
      </div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card p-5 mb-5"
        style={{
          background:
            "linear-gradient(135deg, oklch(var(--card)), oklch(var(--secondary) / 0.3))",
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-background"
            style={{
              background:
                "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--accent)))",
            }}
          >
            {currentUser.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {currentUser.username}
            </h2>
            <p className="text-xs text-muted-foreground capitalize">
              {currentUser.role} Account
            </p>
            <div
              className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{
                background: "oklch(0.65 0.18 145 / 0.15)",
                color: "oklch(0.65 0.18 145)",
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {currentUser.status.toUpperCase()}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: stat.bg }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                </div>
                <span className="text-xs text-muted-foreground">
                  {stat.label}
                </span>
              </div>
              <p
                className="text-lg font-bold text-foreground"
                style={{ color: stat.color }}
              >
                {stat.value}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Betting Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border border-border bg-card p-4"
      >
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Betting Statistics
        </h3>
        <div className="space-y-3">
          {[
            { label: "Total Bets (All)", value: totalBets },
            { label: "Sports Bets", value: userBets.length },
            { label: "Casino Rounds", value: userCasino.length },
            { label: "Crash Games", value: userCrash.length },
            { label: "Active Sports Bets", value: activeBets.length },
            {
              label: "Total Won",
              value: `₹${totalWon.toFixed(2)}`,
              positive: true,
            },
            {
              label: "Total Lost",
              value: `₹${totalLost.toFixed(2)}`,
              negative: true,
            },
            { label: "Win Rate", value: `${winRate.toFixed(1)}%` },
          ].map(({ label, value, positive, negative }) => (
            <div
              key={label}
              className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0"
            >
              <span className="text-sm text-muted-foreground">{label}</span>
              <span
                className={`text-sm font-semibold font-mono ${
                  positive
                    ? "text-green-400"
                    : negative
                      ? "text-rose-400"
                      : "text-foreground"
                }`}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Win Rate Bar */}
      {allSettledPnls.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 rounded-xl border border-border bg-card p-4"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted-foreground">Win Rate</span>
            <span className="text-xs font-semibold text-foreground">
              {winRate.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${winRate}%` }}
              transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, oklch(var(--back)), oklch(0.65 0.18 145))",
              }}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
