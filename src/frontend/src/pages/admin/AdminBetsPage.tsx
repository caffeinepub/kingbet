import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useStore } from "@/store/useStore";
import { Circle, ClipboardList, TrendingDown, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminBetsPage() {
  const bets = useStore((s) => s.bets);
  const users = useStore((s) => s.users);
  const [search, setSearch] = useState("");

  const getUserName = (userId: string) =>
    users.find((u) => u.id === userId)?.username ?? "Unknown";

  const filtered = bets.filter((b) => {
    const q = search.toLowerCase();
    return (
      getUserName(b.userId).toLowerCase().includes(q) ||
      b.marketName.toLowerCase().includes(q) ||
      b.selectionName.toLowerCase().includes(q)
    );
  });

  const totalVolume = bets.reduce((sum, b) => sum + b.stake, 0);
  const backBets = bets.filter((b) => b.type === "back").length;
  const layBets = bets.filter((b) => b.type === "lay").length;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <ClipboardList className="w-5 h-5 text-gold" />
        <h1 className="text-lg font-bold text-foreground">All Bets</h1>
        <Badge
          variant="outline"
          className="text-xs border-border text-muted-foreground"
        >
          {bets.length} total
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-lg bg-card border border-border p-3">
          <p className="text-xs text-muted-foreground">Total Volume</p>
          <p className="text-lg font-bold text-gold mt-0.5">
            ₹{totalVolume.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="rounded-lg bg-card border border-border p-3">
          <p className="text-xs text-muted-foreground">Back Bets</p>
          <p
            className="text-lg font-bold mt-0.5"
            style={{ color: "oklch(var(--back))" }}
          >
            {backBets}
          </p>
        </div>
        <div className="rounded-lg bg-card border border-border p-3">
          <p className="text-xs text-muted-foreground">Lay Bets</p>
          <p
            className="text-lg font-bold mt-0.5"
            style={{ color: "oklch(var(--lay))" }}
          >
            {layBets}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="Search by username, market, or selection..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-input border-border h-9 text-sm max-w-md"
          data-ocid="bets.search_input"
        />
      </div>

      {/* Bets Table */}
      {filtered.length === 0 ? (
        <div
          data-ocid="admin.bets.empty_state"
          className="flex flex-col items-center justify-center py-16"
        >
          <Circle className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No bets found</p>
        </div>
      ) : (
        <div
          data-ocid="bets.table"
          className="rounded-xl border border-border bg-card overflow-hidden"
        >
          {/* Headers (desktop) */}
          <div className="hidden lg:grid grid-cols-[120px_1fr_120px_80px_80px_80px_80px_80px] gap-3 px-4 py-2.5 bg-secondary/50 border-b border-border text-xs text-muted-foreground font-medium">
            <span>User</span>
            <span>Market / Selection</span>
            <span className="text-center">Type</span>
            <span className="text-right">Odds</span>
            <span className="text-right">Stake</span>
            <span className="text-right">Pot. Win</span>
            <span className="text-right">P&L</span>
            <span className="text-right">Status</span>
          </div>

          <div className="divide-y divide-border/50">
            {filtered.map((bet, i) => (
              <motion.div
                key={bet.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                data-ocid={`bets.row.${i + 1}`}
                className="grid grid-cols-1 lg:grid-cols-[120px_1fr_120px_80px_80px_80px_80px_80px] gap-2 lg:gap-3 px-4 py-3 hover:bg-secondary/20 transition-colors"
              >
                {/* User */}
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-background shrink-0"
                    style={{ background: "oklch(var(--back) / 0.6)" }}
                  >
                    {getUserName(bet.userId).charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-foreground truncate">
                    {getUserName(bet.userId)}
                  </span>
                </div>

                {/* Market / Selection */}
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">
                    {bet.marketName}
                  </p>
                  <p className="text-sm font-medium text-foreground truncate">
                    {bet.selectionName}
                  </p>
                  <p className="text-[10px] text-muted-foreground lg:hidden">
                    {formatDate(bet.placedAt)}
                  </p>
                </div>

                {/* Type */}
                <div className="flex items-center lg:justify-center">
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
                </div>

                {/* Odds */}
                <div className="flex items-center lg:justify-end">
                  <span className="text-sm font-bold font-mono text-foreground">
                    {bet.odds.toFixed(2)}
                  </span>
                </div>

                {/* Stake */}
                <div className="flex items-center lg:justify-end">
                  <span className="text-sm font-mono text-foreground">
                    ₹{bet.stake}
                  </span>
                </div>

                {/* Potential Win */}
                <div className="flex items-center lg:justify-end">
                  <span className="text-sm font-mono text-green-400">
                    +₹{bet.potentialWin.toFixed(0)}
                  </span>
                </div>

                {/* P&L */}
                <div className="flex items-center lg:justify-end">
                  {bet.status === "settled" ? (
                    <span
                      className={`text-sm font-mono font-semibold ${bet.pnl >= 0 ? "text-green-400" : "text-rose-400"}`}
                    >
                      {bet.pnl >= 0 ? "+" : ""}₹{bet.pnl.toFixed(0)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center lg:justify-end">
                  <Badge
                    className="text-[10px] capitalize"
                    variant="outline"
                    style={{
                      background:
                        bet.status === "matched"
                          ? "oklch(var(--back) / 0.15)"
                          : bet.status === "settled"
                            ? "oklch(0.65 0.18 145 / 0.15)"
                            : "oklch(var(--muted) / 0.3)",
                      color:
                        bet.status === "matched"
                          ? "oklch(var(--back))"
                          : bet.status === "settled"
                            ? "oklch(0.65 0.18 145)"
                            : "oklch(var(--muted-foreground))",
                    }}
                  >
                    {bet.status}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
