import { Badge } from "@/components/ui/badge";
import { type Market, type SportType, useStore } from "@/store/useStore";
import { Circle, Trophy, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

const SPORT_TABS = [
  { label: "ALL", value: "all" },
  { label: "Cricket", value: "cricket" },
  { label: "Football", value: "football" },
  { label: "Tennis", value: "tennis" },
];

const SPORT_ICONS: Record<SportType, string> = {
  cricket: "🏏",
  football: "⚽",
  tennis: "🎾",
};

const SPORT_COLORS: Record<SportType, string> = {
  cricket: "oklch(0.65 0.18 145)",
  football: "oklch(0.55 0.18 240)",
  tennis: "oklch(0.72 0.18 60)",
};

function formatVolume(n: number) {
  if (n >= 1000000) return `₹${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

interface SelectionRowProps {
  selection: Market["selections"][0];
  market: Market;
  index: number;
}

function SelectionRow({ selection, market, index }: SelectionRowProps) {
  const openBetSlip = useStore((s) => s.openBetSlip);

  const handleBack = () => {
    openBetSlip({
      marketId: market.id,
      marketName: market.eventName,
      selectionId: selection.id,
      selectionName: selection.name,
      type: "back",
      odds: selection.backOdds,
    });
  };

  const handleLay = () => {
    openBetSlip({
      marketId: market.id,
      marketName: market.eventName,
      selectionId: selection.id,
      selectionName: selection.name,
      type: "lay",
      odds: selection.layOdds,
    });
  };

  const disabled = market.status !== "open";

  return (
    <div className="flex items-center justify-between py-2 px-4 hover:bg-secondary/30 transition-colors group">
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-foreground truncate">
          {selection.name}
        </span>
      </div>

      {/* Volume */}
      <div className="hidden md:flex flex-col items-end mr-4 min-w-0">
        <span className="text-[10px] text-muted-foreground">
          {formatVolume(selection.backVolume)}
        </span>
      </div>

      {/* Back Button */}
      <button
        type="button"
        data-ocid={`market.back_button.${index + 1}`}
        onClick={handleBack}
        disabled={disabled}
        className="flex flex-col items-center justify-center w-16 h-12 rounded-lg mx-1 transition-all duration-150 hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: "oklch(var(--back) / 0.15)",
          border: "1px solid oklch(var(--back) / 0.3)",
        }}
        title="Back"
      >
        <span
          className="text-sm font-bold font-mono leading-none"
          style={{ color: "oklch(var(--back))" }}
        >
          {selection.backOdds.toFixed(2)}
        </span>
        <span className="text-[9px] text-muted-foreground mt-0.5">BACK</span>
      </button>

      {/* Lay Button */}
      <button
        type="button"
        data-ocid={`market.lay_button.${index + 1}`}
        onClick={handleLay}
        disabled={disabled}
        className="flex flex-col items-center justify-center w-16 h-12 rounded-lg mx-1 transition-all duration-150 hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: "oklch(var(--lay) / 0.15)",
          border: "1px solid oklch(var(--lay) / 0.3)",
        }}
        title="Lay"
      >
        <span
          className="text-sm font-bold font-mono leading-none"
          style={{ color: "oklch(var(--lay))" }}
        >
          {selection.layOdds.toFixed(2)}
        </span>
        <span className="text-[9px] text-muted-foreground mt-0.5">LAY</span>
      </button>
    </div>
  );
}

interface MarketCardProps {
  market: Market;
  index: number;
}

function MarketCard({ market, index }: MarketCardProps) {
  const statusColors = {
    open: "oklch(var(--status-open))",
    suspended: "oklch(var(--status-suspended))",
    closed: "oklch(var(--status-closed))",
    settled: "oklch(var(--status-settled))",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      data-ocid={`market.item.${index + 1}`}
      className="rounded-xl border border-border bg-card overflow-hidden hover:border-gold/20 transition-all duration-200"
      style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.25)" }}
    >
      {/* Market Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-border"
        style={{ background: "oklch(var(--secondary) / 0.5)" }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">{SPORT_ICONS[market.sport]}</span>
          <div className="min-w-0">
            <p
              className="text-xs font-medium truncate"
              style={{ color: SPORT_COLORS[market.sport] }}
            >
              {market.sport.charAt(0).toUpperCase() + market.sport.slice(1)}
            </p>
            <h3 className="text-sm font-semibold text-foreground truncate">
              {market.eventName}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {market.status === "open" && (
            <div className="flex items-center gap-1">
              <div
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: statusColors.open }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: statusColors.open }}
              >
                LIVE
              </span>
            </div>
          )}
          <Badge
            className="text-[10px] px-1.5 uppercase font-bold"
            style={{
              background: `${statusColors[market.status]}22`,
              color: statusColors[market.status],
              borderColor: `${statusColors[market.status]}44`,
            }}
            variant="outline"
          >
            {market.status}
          </Badge>
        </div>
      </div>

      {/* Column Headers */}
      <div className="flex items-center px-4 py-1.5 bg-secondary/20">
        <div className="flex-1 text-[10px] text-muted-foreground font-medium">
          SELECTION
        </div>
        <div className="hidden md:block w-20 text-right text-[10px] text-muted-foreground mr-1">
          VOLUME
        </div>
        <div
          className="w-16 mx-1 text-center text-[10px] font-bold"
          style={{ color: "oklch(var(--back))" }}
        >
          BACK
        </div>
        <div
          className="w-16 mx-1 text-center text-[10px] font-bold"
          style={{ color: "oklch(var(--lay))" }}
        >
          LAY
        </div>
      </div>

      {/* Selections */}
      <div className="divide-y divide-border/50">
        {market.selections.map((selection, i) => (
          <SelectionRow
            key={selection.id}
            selection={selection}
            market={market}
            index={i}
          />
        ))}
      </div>
    </motion.div>
  );
}

export function MarketsPage() {
  const markets = useStore((s) => s.markets);
  const [sportFilter, setSportFilter] = useState<string>("all");

  const filteredMarkets = markets.filter(
    (m) => sportFilter === "all" || m.sport === sportFilter,
  );

  const openMarketsCount = markets.filter((m) => m.status === "open").length;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-gold" />
          <h1 className="text-lg font-bold text-foreground">Markets</h1>
          <Badge
            className="text-[10px] px-1.5"
            style={{
              background: "oklch(var(--status-open) / 0.15)",
              color: "oklch(var(--status-open))",
              borderColor: "oklch(var(--status-open) / 0.3)",
            }}
            variant="outline"
          >
            <Zap className="w-2.5 h-2.5 mr-1" />
            {openMarketsCount} Live
          </Badge>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded"
              style={{
                background: "oklch(var(--back) / 0.4)",
                border: "1px solid oklch(var(--back) / 0.6)",
              }}
            />
            <span>Back</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded"
              style={{
                background: "oklch(var(--lay) / 0.4)",
                border: "1px solid oklch(var(--lay) / 0.6)",
              }}
            />
            <span>Lay</span>
          </div>
        </div>
      </div>

      {/* Sport Filter Tabs */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
        {SPORT_TABS.map((tab) => (
          <button
            type="button"
            key={tab.value}
            data-ocid="markets.tab"
            onClick={() => setSportFilter(tab.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              sportFilter === tab.value
                ? "bg-gold text-background"
                : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
            }`}
          >
            {tab.value !== "all" && (
              <span className="mr-1">
                {SPORT_ICONS[tab.value as SportType]}
              </span>
            )}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Market Cards */}
      {filteredMarkets.length === 0 ? (
        <div
          data-ocid="markets.empty_state"
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <Circle className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-medium">
            No markets available
          </p>
          <p className="text-muted-foreground/60 text-sm mt-1">
            Check back later for upcoming events
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMarkets.map((market, i) => (
            <MarketCard key={market.id} market={market} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
