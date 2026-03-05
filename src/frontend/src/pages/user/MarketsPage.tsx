import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@/hooks/useActor";
import {
  type FancyMarket,
  type Market,
  type SportType,
  useStore,
} from "@/store/useStore";
import { fetchAllLiveMarkets } from "@/utils/oddsService";
import { Circle, Lock, Radio, Trophy, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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

// ─── Fancy / Session Bet Row ───────────────────────────────────────────────────
interface FancyBetRowProps {
  fm: FancyMarket;
  index: number;
}

function FancyBetRow({ fm, index }: FancyBetRowProps) {
  const { currentUser, placeFancyBet } = useStore();
  const [stakeYes, setStakeYes] = useState(500);
  const [stakeNo, setStakeNo] = useState(500);
  const [openSide, setOpenSide] = useState<"yes" | "no" | null>(null);

  const isSuspended = fm.status === "suspended";

  const handleBet = (side: "yes" | "no") => {
    if (!currentUser) return toast.error("Please login to bet");
    const stake = side === "yes" ? stakeYes : stakeNo;
    const result = placeFancyBet({ fancyId: fm.id, side, stake });
    if (result.success) {
      toast.success(
        `✅ ${fm.title} — ${side.toUpperCase()} ₹${stake} @ ${side === "yes" ? fm.yesOdds : fm.noOdds}`,
      );
      setOpenSide(null);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      data-ocid={`fancy.item.${index + 1}`}
      className="border-b border-border/40 last:border-0"
    >
      <div className="flex items-center px-3 py-2.5 gap-2">
        {/* Title */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground truncate">
            {fm.title}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Min ₹{fm.minBet} – Max ₹{fm.maxBet.toLocaleString()}
          </p>
        </div>

        {isSuspended ? (
          <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-secondary/50 border border-border">
            <Lock className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Suspended</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            {/* NO button */}
            <button
              type="button"
              data-ocid={`fancy.no_button.${index + 1}`}
              onClick={() => setOpenSide(openSide === "no" ? null : "no")}
              className="flex flex-col items-center w-16 h-12 rounded-lg justify-center transition-all hover:brightness-110 active:scale-95"
              style={{
                background: "oklch(var(--lay) / 0.15)",
                border: "1px solid oklch(var(--lay) / 0.35)",
              }}
            >
              <span
                className="text-[10px] font-bold font-mono"
                style={{ color: "oklch(var(--lay))" }}
              >
                {fm.noOdds}
              </span>
              <span
                className="text-[9px]"
                style={{ color: "oklch(var(--lay) / 0.7)" }}
              >
                {fm.noRuns} NO
              </span>
            </button>

            {/* YES button */}
            <button
              type="button"
              data-ocid={`fancy.yes_button.${index + 1}`}
              onClick={() => setOpenSide(openSide === "yes" ? null : "yes")}
              className="flex flex-col items-center w-16 h-12 rounded-lg justify-center transition-all hover:brightness-110 active:scale-95"
              style={{
                background: "oklch(var(--back) / 0.15)",
                border: "1px solid oklch(var(--back) / 0.35)",
              }}
            >
              <span
                className="text-[10px] font-bold font-mono"
                style={{ color: "oklch(var(--back))" }}
              >
                {fm.yesOdds}
              </span>
              <span
                className="text-[9px]"
                style={{ color: "oklch(var(--back) / 0.7)" }}
              >
                {fm.yesRuns} YES
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Inline stake input */}
      <AnimatePresence>
        {openSide && !isSuspended && (
          <motion.div
            key={openSide}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="px-3 py-2.5 flex items-center gap-2 border-t border-border/40"
              style={{
                background:
                  openSide === "yes"
                    ? "oklch(var(--back) / 0.06)"
                    : "oklch(var(--lay) / 0.06)",
              }}
            >
              <div className="flex-1 space-y-1">
                <p
                  className="text-[10px] font-semibold"
                  style={{
                    color:
                      openSide === "yes"
                        ? "oklch(var(--back))"
                        : "oklch(var(--lay))",
                  }}
                >
                  {openSide.toUpperCase()} @{" "}
                  {openSide === "yes"
                    ? `${fm.yesOdds} runs: ${fm.yesRuns}`
                    : `${fm.noOdds} runs: ${fm.noRuns}`}
                </p>
                <Input
                  type="number"
                  min={fm.minBet}
                  max={fm.maxBet}
                  value={openSide === "yes" ? stakeYes : stakeNo}
                  onChange={(e) =>
                    openSide === "yes"
                      ? setStakeYes(Number(e.target.value) || fm.minBet)
                      : setStakeNo(Number(e.target.value) || fm.minBet)
                  }
                  className="h-8 text-xs font-mono bg-input border-border"
                  data-ocid={`fancy.stake_input.${index + 1}`}
                />
                <div className="flex gap-1">
                  {[500, 1000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() =>
                        openSide === "yes" ? setStakeYes(amt) : setStakeNo(amt)
                      }
                      className="flex-1 text-[9px] py-0.5 rounded border border-border text-muted-foreground hover:text-foreground transition-all"
                    >
                      ₹{amt >= 1000 ? `${amt / 1000}K` : amt}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Button
                  size="sm"
                  onClick={() => handleBet(openSide)}
                  className="h-8 px-3 text-xs font-bold text-background"
                  style={{
                    background:
                      openSide === "yes"
                        ? "oklch(var(--back))"
                        : "oklch(var(--lay))",
                  }}
                  data-ocid={`fancy.confirm_button.${index + 1}`}
                >
                  Place
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setOpenSide(null)}
                  className="h-8 px-3 text-xs"
                  data-ocid={`fancy.cancel_button.${index + 1}`}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Fancy & Session Section inside a cricket market card ─────────────────────
function FancySection({ matchId }: { matchId: string }) {
  const fancyMarkets = useStore((s) => s.fancyMarkets);
  const updateFancyOdds = useStore((s) => s.updateFancyOdds);
  const [activeTab, setActiveTab] = useState<"fancy" | "session">("fancy");

  const relevant = fancyMarkets.filter((f) => f.matchId === matchId);
  const fancy = relevant.filter((f) => f.type === "fancy");
  const session = relevant.filter((f) => f.type === "session");
  const displayed = activeTab === "fancy" ? fancy : session;

  // Simulate live odds drift
  useEffect(() => {
    const t = setInterval(() => {
      updateFancyOdds();
    }, 3000);
    return () => clearInterval(t);
  }, [updateFancyOdds]);

  if (relevant.length === 0) return null;

  return (
    <div className="border-t border-border/60 mt-0">
      {/* Tabs */}
      <div className="flex items-center px-3 pt-2 pb-1 gap-1 bg-secondary/20">
        {(["fancy", "session"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            data-ocid={`fancy.${tab}_tab`}
            onClick={() => setActiveTab(tab)}
            className="px-3 py-1 text-[11px] font-bold rounded-md capitalize transition-all"
            style={
              activeTab === tab
                ? {
                    background: "oklch(var(--gold) / 0.2)",
                    color: "oklch(var(--gold))",
                    border: "1px solid oklch(var(--gold) / 0.4)",
                  }
                : {
                    background: "transparent",
                    color: "oklch(var(--muted-foreground))",
                    border: "1px solid transparent",
                  }
            }
          >
            {tab === "fancy" ? "🏏 Fancy" : "📊 Session"}
          </button>
        ))}
        <span className="ml-auto text-[9px] text-muted-foreground/50 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
          Live
        </span>
      </div>

      {/* Column headers */}
      <div className="flex items-center px-3 py-1 bg-secondary/10">
        <div className="flex-1 text-[9px] text-muted-foreground font-medium uppercase">
          Market
        </div>
        <div
          className="w-16 text-center text-[9px] font-bold uppercase mr-1.5"
          style={{ color: "oklch(var(--lay))" }}
        >
          NO
        </div>
        <div
          className="w-16 text-center text-[9px] font-bold uppercase"
          style={{ color: "oklch(var(--back))" }}
        >
          YES
        </div>
      </div>

      {/* Rows */}
      <div>
        {displayed.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No {activeTab} markets available
          </p>
        ) : (
          displayed.map((fm, i) => (
            <FancyBetRow key={fm.id} fm={fm} index={i} />
          ))
        )}
      </div>
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

      {/* Fancy & Session — cricket only */}
      {market.sport === "cricket" && <FancySection matchId={market.id} />}
    </motion.div>
  );
}

function MarketSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-secondary/50">
        <div className="flex items-center gap-2">
          <Skeleton className="w-6 h-6 rounded" />
          <div className="space-y-1.5">
            <Skeleton className="w-16 h-3" />
            <Skeleton className="w-40 h-4" />
          </div>
        </div>
      </div>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between px-4 py-3 border-b border-border/50"
        >
          <Skeleton className="w-24 h-4" />
          <div className="flex gap-2">
            <Skeleton className="w-16 h-12 rounded-lg" />
            <Skeleton className="w-16 h-12 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MarketsPage() {
  const storeMarkets = useStore((s) => s.markets);
  // actor kept in scope to satisfy lint; not used for market fetching
  const { actor: _actor } = useActor();
  const [markets, setMarkets] = useState<Market[]>(storeMarkets);
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [firstLoad, setFirstLoad] = useState(true);
  const [isApiData, setIsApiData] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval>>(null);
  // Use a ref so the effect closure always reads the latest storeMarkets
  // without needing it as an effect dependency (avoids infinite re-subscribe)
  const storeMarketsRef = useRef(storeMarkets);
  storeMarketsRef.current = storeMarkets;

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const apiMarkets = await fetchAllLiveMarkets();
        if (apiMarkets.length > 0) {
          setMarkets(apiMarkets);
          setIsApiData(true);
        } else {
          // Fall back to Zustand store markets
          setMarkets(storeMarketsRef.current);
          setIsApiData(false);
        }
      } catch {
        // Fall back to Zustand store markets on error
        setMarkets(storeMarketsRef.current);
        setIsApiData(false);
      } finally {
        setFirstLoad(false);
      }
    };

    fetchMarkets();
    // Poll every 10 seconds to conserve API credits (500/month on Starter plan)
    pollRef.current = setInterval(fetchMarkets, 10000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const filteredMarkets = markets.filter(
    (m) => sportFilter === "all" || m.sport === sportFilter,
  );

  const openMarketsCount = markets.filter((m) => m.status === "open").length;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 flex-wrap">
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
          {isApiData && (
            <Badge
              className="text-[10px] px-1.5 animate-pulse"
              style={{
                background: "oklch(0.55 0.18 240 / 0.15)",
                color: "oklch(0.55 0.18 240)",
                borderColor: "oklch(0.55 0.18 240 / 0.3)",
              }}
              variant="outline"
              data-ocid="markets.api_badge"
            >
              <Radio className="w-2.5 h-2.5 mr-1" />
              LIVE · TheOddsAPI
            </Badge>
          )}
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
      {firstLoad ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <MarketSkeleton key={i} />
          ))}
        </div>
      ) : filteredMarkets.length === 0 ? (
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
