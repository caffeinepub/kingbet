import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type BetStatus, useStore } from "@/store/useStore";
import { Circle, ClipboardList, TrendingDown, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

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

export function MyBetsPage() {
  const currentUser = useStore((s) => s.currentUser);
  const allBets = useStore((s) => s.bets);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const userBets = allBets.filter((b) => b.userId === currentUser?.id);
  const filteredBets = userBets.filter(
    (b) => statusFilter === "all" || b.status === statusFilter,
  );

  const totalStake = userBets.reduce((sum, b) => sum + b.stake, 0);
  const totalPnl = userBets
    .filter((b) => b.status === "settled")
    .reduce((sum, b) => sum + b.pnl, 0);

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
          {userBets.length} total
        </Badge>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-lg bg-card border border-border p-3">
          <p className="text-xs text-muted-foreground">Total Bets</p>
          <p className="text-lg font-bold text-foreground mt-0.5">
            {userBets.length}
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
            className={`text-lg font-bold mt-0.5 ${totalPnl >= 0 ? "text-green-400" : "text-rose-400"}`}
          >
            {totalPnl >= 0 ? "+" : ""}₹{totalPnl.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs
        value={statusFilter}
        onValueChange={setStatusFilter}
        className="mb-4"
      >
        <TabsList className="bg-secondary border border-border h-8">
          {["all", "matched", "unmatched", "settled", "voided"].map((s) => (
            <TabsTrigger
              key={s}
              value={s}
              data-ocid="bets.row"
              className="text-xs capitalize h-6 px-3"
            >
              {s}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Bets Table/Cards */}
      {filteredBets.length === 0 ? (
        <div
          data-ocid="bets.empty_state"
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <Circle className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-medium">No bets found</p>
          <p className="text-muted-foreground/60 text-sm mt-1">
            {statusFilter === "all"
              ? "Place your first bet on the Markets page"
              : `No ${statusFilter} bets`}
          </p>
        </div>
      ) : (
        <div data-ocid="bets.table" className="space-y-2">
          {filteredBets.map((bet, i) => (
            <motion.div
              key={bet.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              data-ocid={`bets.row.${i + 1}`}
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
      )}
    </div>
  );
}
