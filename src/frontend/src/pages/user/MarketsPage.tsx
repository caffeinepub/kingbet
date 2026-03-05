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
import {
  Activity,
  Circle,
  Clock,
  Lock,
  Radio,
  Trophy,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const SPORT_TABS = [
  { label: "ALL", value: "all", icon: "🏆" },
  { label: "Cricket", value: "cricket", icon: "🏏" },
  { label: "Football", value: "football", icon: "⚽" },
  { label: "Tennis", value: "tennis", icon: "🎾" },
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

const SPORT_LABELS: Record<SportType, string> = {
  cricket: "Cricket",
  football: "Football",
  tennis: "Tennis",
};

function formatVolume(n: number) {
  if (n >= 1000000) return `₹${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

function formatMatchTime(createdAt: string): {
  isLive: boolean;
  label: string;
} {
  const commence = new Date(createdAt);
  const now = new Date();
  const isLive = commence <= now;

  if (isLive) {
    return { isLive: true, label: "In-Play" };
  }

  // Show time in IST
  const istLabel = commence.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
    hour12: true,
  });
  return { isLive: false, label: istLabel };
}

function getTeamInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function getLeagueName(market: Market): string {
  // Extract league/competition from description or derive from sport
  if (market.description) {
    // Try to extract from description like "Premier League Matchday 28"
    const descParts = market.description.split("—");
    if (descParts.length > 0) {
      const part = descParts[0].trim();
      if (part && part !== "LIVE") return part;
    }
  }
  return SPORT_LABELS[market.sport];
}

// ─── Exchange Odds Cell ────────────────────────────────────────────────────────
function OddsCell({
  odds,
  volume,
  type,
  onClick,
  disabled,
  ocid,
}: {
  odds: number;
  volume: number;
  type: "back" | "lay";
  onClick: () => void;
  disabled: boolean;
  ocid: string;
}) {
  const isBack = type === "back";
  return (
    <button
      type="button"
      data-ocid={ocid}
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center justify-center h-11 min-w-[52px] w-full rounded transition-all duration-100 active:scale-95 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        background: isBack
          ? "oklch(0.55 0.18 240 / 0.18)"
          : "oklch(0.62 0.22 20 / 0.18)",
        border: `1px solid ${isBack ? "oklch(0.55 0.18 240 / 0.35)" : "oklch(0.62 0.22 20 / 0.35)"}`,
      }}
    >
      <span
        className="text-sm font-bold font-mono leading-none"
        style={{
          color: isBack ? "oklch(0.75 0.18 240)" : "oklch(0.75 0.22 20)",
        }}
      >
        {odds.toFixed(2)}
      </span>
      <span className="text-[9px] text-muted-foreground mt-0.5 font-mono">
        {formatVolume(volume)}
      </span>
    </button>
  );
}

// ─── Exchange Row (1xBet-style 3-col) ─────────────────────────────────────────
interface ExchangeRowProps {
  selection: Market["selections"][0];
  market: Market;
  rowIndex: number;
}

function ExchangeRow({ selection, market, rowIndex }: ExchangeRowProps) {
  const openBetSlip = useStore((s) => s.openBetSlip);
  const disabled = market.status !== "open";

  return (
    <div className="flex items-center gap-0 border-b border-border/30 last:border-0 hover:bg-white/[0.02] transition-colors group">
      {/* Selection name */}
      <div className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2.5">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
          style={{
            background: `${SPORT_COLORS[market.sport]}22`,
            color: SPORT_COLORS[market.sport],
            border: `1px solid ${SPORT_COLORS[market.sport]}44`,
          }}
        >
          {getTeamInitials(selection.name)}
        </div>
        <span className="text-sm font-medium text-foreground truncate">
          {selection.name}
        </span>
      </div>

      {/* Back column (blue) */}
      <div
        className="flex items-center gap-0.5 px-1 py-1.5"
        style={{ background: "oklch(0.55 0.18 240 / 0.06)" }}
      >
        {/* 3rd best (faded) */}
        <div className="hidden lg:block opacity-50">
          <OddsCell
            odds={Number((selection.backOdds - 0.04).toFixed(2))}
            volume={Math.floor(selection.backVolume * 0.4)}
            type="back"
            onClick={() =>
              openBetSlip({
                marketId: market.id,
                marketName: market.eventName,
                selectionId: selection.id,
                selectionName: selection.name,
                type: "back",
                odds: Number((selection.backOdds - 0.04).toFixed(2)),
              })
            }
            disabled={disabled}
            ocid={`market.back_button.${rowIndex + 1}`}
          />
        </div>
        {/* 2nd best (semi-faded) */}
        <div className="hidden sm:block opacity-75">
          <OddsCell
            odds={Number((selection.backOdds - 0.02).toFixed(2))}
            volume={Math.floor(selection.backVolume * 0.65)}
            type="back"
            onClick={() =>
              openBetSlip({
                marketId: market.id,
                marketName: market.eventName,
                selectionId: selection.id,
                selectionName: selection.name,
                type: "back",
                odds: Number((selection.backOdds - 0.02).toFixed(2)),
              })
            }
            disabled={disabled}
            ocid={`market.back_button.${rowIndex + 1}`}
          />
        </div>
        {/* Best back */}
        <OddsCell
          odds={selection.backOdds}
          volume={selection.backVolume}
          type="back"
          onClick={() =>
            openBetSlip({
              marketId: market.id,
              marketName: market.eventName,
              selectionId: selection.id,
              selectionName: selection.name,
              type: "back",
              odds: selection.backOdds,
            })
          }
          disabled={disabled}
          ocid={`market.back_button.${rowIndex + 1}`}
        />
      </div>

      {/* Lay column (pink) */}
      <div
        className="flex items-center gap-0.5 px-1 py-1.5"
        style={{ background: "oklch(0.62 0.22 20 / 0.06)" }}
      >
        {/* Best lay */}
        <OddsCell
          odds={selection.layOdds}
          volume={selection.layVolume}
          type="lay"
          onClick={() =>
            openBetSlip({
              marketId: market.id,
              marketName: market.eventName,
              selectionId: selection.id,
              selectionName: selection.name,
              type: "lay",
              odds: selection.layOdds,
            })
          }
          disabled={disabled}
          ocid={`market.lay_button.${rowIndex + 1}`}
        />
        {/* 2nd lay (semi-faded) */}
        <div className="hidden sm:block opacity-75">
          <OddsCell
            odds={Number((selection.layOdds + 0.02).toFixed(2))}
            volume={Math.floor(selection.layVolume * 0.65)}
            type="lay"
            onClick={() =>
              openBetSlip({
                marketId: market.id,
                marketName: market.eventName,
                selectionId: selection.id,
                selectionName: selection.name,
                type: "lay",
                odds: Number((selection.layOdds + 0.02).toFixed(2)),
              })
            }
            disabled={disabled}
            ocid={`market.lay_button.${rowIndex + 1}`}
          />
        </div>
        {/* 3rd lay (faded) */}
        <div className="hidden lg:block opacity-50">
          <OddsCell
            odds={Number((selection.layOdds + 0.04).toFixed(2))}
            volume={Math.floor(selection.layVolume * 0.4)}
            type="lay"
            onClick={() =>
              openBetSlip({
                marketId: market.id,
                marketName: market.eventName,
                selectionId: selection.id,
                selectionName: selection.name,
                type: "lay",
                odds: Number((selection.layOdds + 0.04).toFixed(2)),
              })
            }
            disabled={disabled}
            ocid={`market.lay_button.${rowIndex + 1}`}
          />
        </div>
      </div>
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
                background: "oklch(0.62 0.22 20 / 0.15)",
                border: "1px solid oklch(0.62 0.22 20 / 0.35)",
              }}
            >
              <span
                className="text-[10px] font-bold font-mono"
                style={{ color: "oklch(0.75 0.22 20)" }}
              >
                {fm.noOdds}
              </span>
              <span
                className="text-[9px]"
                style={{ color: "oklch(0.75 0.22 20 / 0.7)" }}
              >
                {fm.noRuns} Khai
              </span>
            </button>

            {/* YES button */}
            <button
              type="button"
              data-ocid={`fancy.yes_button.${index + 1}`}
              onClick={() => setOpenSide(openSide === "yes" ? null : "yes")}
              className="flex flex-col items-center w-16 h-12 rounded-lg justify-center transition-all hover:brightness-110 active:scale-95"
              style={{
                background: "oklch(0.55 0.18 240 / 0.15)",
                border: "1px solid oklch(0.55 0.18 240 / 0.35)",
              }}
            >
              <span
                className="text-[10px] font-bold font-mono"
                style={{ color: "oklch(0.75 0.18 240)" }}
              >
                {fm.yesOdds}
              </span>
              <span
                className="text-[9px]"
                style={{ color: "oklch(0.75 0.18 240 / 0.7)" }}
              >
                {fm.yesRuns} Lgao
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
                    ? "oklch(0.55 0.18 240 / 0.06)"
                    : "oklch(0.62 0.22 20 / 0.06)",
              }}
            >
              <div className="flex-1 space-y-1">
                <p
                  className="text-[10px] font-semibold"
                  style={{
                    color:
                      openSide === "yes"
                        ? "oklch(0.75 0.18 240)"
                        : "oklch(0.75 0.22 20)",
                  }}
                >
                  {openSide === "yes" ? "LGAO" : "KHAI"} @{" "}
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
                        ? "oklch(0.55 0.18 240)"
                        : "oklch(0.62 0.22 20)",
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
          style={{ color: "oklch(0.75 0.22 20)" }}
        >
          Khai
        </div>
        <div
          className="w-16 text-center text-[9px] font-bold uppercase"
          style={{ color: "oklch(0.75 0.18 240)" }}
        >
          Lgao
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

// ─── 1xBet-Style Market Card ───────────────────────────────────────────────────
interface MarketCardProps {
  market: Market;
  index: number;
}

function MarketCard({ market, index }: MarketCardProps) {
  const { isLive, label: timeLabel } = formatMatchTime(market.createdAt);
  const leagueName = getLeagueName(market);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      data-ocid={`market.item.${index + 1}`}
      className="rounded-lg border border-border bg-card overflow-hidden hover:border-border/70 transition-colors duration-200"
      style={{ background: "oklch(0.11 0.015 265)" }}
    >
      {/* Compact Match Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b border-border/50"
        style={{ background: "oklch(0.13 0.018 265)" }}
      >
        {/* Sport icon + league */}
        <span className="text-sm shrink-0">{SPORT_ICONS[market.sport]}</span>
        <span
          className="text-[11px] font-semibold truncate flex-1"
          style={{ color: SPORT_COLORS[market.sport] }}
        >
          {leagueName}
        </span>

        {/* In-Play / Time badge */}
        {isLive ? (
          <div className="flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[10px] font-bold text-rose-400">IN-PLAY</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 shrink-0 text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span className="text-[10px]">{timeLabel}</span>
          </div>
        )}

        {/* Suspended/Settled overlay indicator */}
        {market.status !== "open" && (
          <Badge
            className="text-[9px] px-1 py-0 h-4 uppercase font-bold shrink-0"
            style={{
              background:
                market.status === "suspended"
                  ? "oklch(0.62 0.22 20 / 0.2)"
                  : "oklch(0.5 0.01 265 / 0.2)",
              color:
                market.status === "suspended"
                  ? "oklch(0.75 0.22 20)"
                  : "oklch(0.65 0.01 265)",
              borderColor: "transparent",
            }}
            variant="outline"
          >
            {market.status}
          </Badge>
        )}
      </div>

      {/* Match name row */}
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className="text-sm font-bold text-foreground truncate flex-1">
          {market.eventName}
        </h3>
        <span className="text-[10px] text-muted-foreground ml-2 shrink-0">
          {market.selections.length} runners
        </span>
      </div>

      {/* Exchange Table Header */}
      <div
        className="flex items-center border-t border-b border-border/30"
        style={{ background: "oklch(0.09 0.01 265)" }}
      >
        <div className="flex-1 px-3 py-1 text-[10px] text-muted-foreground font-medium uppercase">
          Selection
        </div>
        {/* Back / Lagao column header */}
        <div
          data-ocid="markets.back_header"
          className="px-3 py-1 text-[10px] font-bold uppercase text-center"
          style={{
            background: "oklch(0.55 0.18 240 / 0.12)",
            color: "oklch(0.75 0.18 240)",
            minWidth: "120px",
          }}
        >
          ← Lagao
        </div>
        {/* Lay / Khai column header */}
        <div
          data-ocid="markets.lay_header"
          className="px-3 py-1 text-[10px] font-bold uppercase text-center"
          style={{
            background: "oklch(0.62 0.22 20 / 0.12)",
            color: "oklch(0.75 0.22 20)",
            minWidth: "120px",
          }}
        >
          Khai →
        </div>
      </div>

      {/* Selection Rows */}
      <div>
        {market.selections.map((selection, i) => (
          <ExchangeRow
            key={selection.id}
            selection={selection}
            market={market}
            rowIndex={i}
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
    <div
      className="rounded-lg border border-border bg-card overflow-hidden"
      style={{ background: "oklch(0.11 0.015 265)" }}
    >
      <div
        className="px-3 py-2 border-b border-border/50 flex items-center gap-2"
        style={{ background: "oklch(0.13 0.018 265)" }}
      >
        <Skeleton className="w-4 h-4 rounded" />
        <Skeleton className="w-32 h-3" />
        <Skeleton className="w-14 h-3 ml-auto" />
      </div>
      <div className="px-3 py-2">
        <Skeleton className="w-48 h-4" />
      </div>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex items-center gap-2 px-3 py-2.5 border-t border-border/30"
        >
          <div className="flex items-center gap-2 flex-1">
            <Skeleton className="w-6 h-6 rounded-full" />
            <Skeleton className="w-28 h-4" />
          </div>
          <div className="flex gap-0.5">
            <Skeleton className="w-[52px] h-11 rounded" />
            <Skeleton className="w-[52px] h-11 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Section Header (In-Play / Upcoming) ──────────────────────────────────────
function SectionHeader({
  type,
  count,
}: {
  type: "inplay" | "upcoming";
  count: number;
}) {
  if (type === "inplay") {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{
          background: "oklch(0.62 0.22 20 / 0.08)",
          border: "1px solid oklch(0.62 0.22 20 / 0.2)",
        }}
        data-ocid="markets.inplay_section"
      >
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
        <Activity className="w-3.5 h-3.5 text-rose-400" />
        <span className="text-xs font-bold text-rose-400">IN-PLAY</span>
        <span className="text-xs text-muted-foreground ml-1">
          {count} event{count !== 1 ? "s" : ""}
        </span>
      </div>
    );
  }
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg"
      style={{
        background: "oklch(0.55 0.18 240 / 0.08)",
        border: "1px solid oklch(0.55 0.18 240 / 0.2)",
      }}
      data-ocid="markets.upcoming_section"
    >
      <Clock
        className="w-3.5 h-3.5"
        style={{ color: "oklch(0.75 0.18 240)" }}
      />
      <span
        className="text-xs font-bold"
        style={{ color: "oklch(0.75 0.18 240)" }}
      >
        UPCOMING
      </span>
      <span className="text-xs text-muted-foreground ml-1">
        {count} event{count !== 1 ? "s" : ""}
      </span>
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

  // Split into live and upcoming
  const now = new Date();
  const liveMarkets = filteredMarkets.filter(
    (m) => new Date(m.createdAt) <= now,
  );
  const upcomingMarkets = filteredMarkets.filter(
    (m) => new Date(m.createdAt) > now,
  );

  // Count stats per sport for tabs
  const sportCounts: Record<string, { live: number; upcoming: number }> = {
    all: { live: liveMarkets.length, upcoming: upcomingMarkets.length },
  };
  for (const sport of ["cricket", "football", "tennis"] as SportType[]) {
    const sportLive = liveMarkets.filter((m) => m.sport === sport).length;
    const sportUpcoming = upcomingMarkets.filter(
      (m) => m.sport === sport,
    ).length;
    sportCounts[sport] = { live: sportLive, upcoming: sportUpcoming };
  }

  const totalEvents = filteredMarkets.length;

  return (
    <div className="p-3 max-w-4xl mx-auto">
      {/* Page Header — compact 1xBet style */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-gold" />
          <h1 className="text-base font-bold text-foreground">Sports</h1>
          {isApiData && (
            <Badge
              className="text-[10px] px-1.5 gap-1 animate-pulse"
              style={{
                background: "oklch(0.55 0.18 240 / 0.15)",
                color: "oklch(0.75 0.18 240)",
                borderColor: "oklch(0.55 0.18 240 / 0.3)",
              }}
              variant="outline"
              data-ocid="markets.api_badge"
            >
              <Radio className="w-2.5 h-2.5" />
              LIVE · TheOddsAPI
            </Badge>
          )}
        </div>

        {/* Summary stats */}
        <div className="flex items-center gap-2 text-[11px]">
          {liveMarkets.length > 0 && (
            <span className="flex items-center gap-1 text-rose-400">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              {liveMarkets.length} In-Play
            </span>
          )}
          {upcomingMarkets.length > 0 && (
            <span className="text-muted-foreground">
              {upcomingMarkets.length} Upcoming
            </span>
          )}
        </div>
      </div>

      {/* Sport Filter Tabs — 1xBet style with counts */}
      <div className="flex gap-0.5 mb-3 border-b border-border/50 overflow-x-auto pb-0">
        {SPORT_TABS.map((tab) => {
          const counts = sportCounts[tab.value] ?? { live: 0, upcoming: 0 };
          const total = counts.live + counts.upcoming;
          const isActive = sportFilter === tab.value;
          return (
            <button
              type="button"
              key={tab.value}
              data-ocid="markets.tab"
              onClick={() => setSportFilter(tab.value)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all duration-150 border-b-2 rounded-none"
              style={{
                borderBottomColor: isActive
                  ? "oklch(var(--gold))"
                  : "transparent",
                color: isActive
                  ? "oklch(var(--gold))"
                  : "oklch(var(--muted-foreground))",
                background: "transparent",
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {total > 0 && (
                <span
                  className="px-1 py-0.5 rounded text-[9px] font-bold"
                  style={{
                    background: isActive
                      ? "oklch(var(--gold) / 0.2)"
                      : "oklch(var(--border))",
                    color: isActive
                      ? "oklch(var(--gold))"
                      : "oklch(var(--muted-foreground))",
                  }}
                >
                  {total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Market List */}
      {firstLoad ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <MarketSkeleton key={i} />
          ))}
        </div>
      ) : totalEvents === 0 ? (
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
        <div className="space-y-2">
          {/* IN-PLAY section */}
          {liveMarkets.length > 0 && (
            <div className="space-y-2">
              <SectionHeader type="inplay" count={liveMarkets.length} />
              {liveMarkets.map((market, i) => (
                <MarketCard key={market.id} market={market} index={i} />
              ))}
            </div>
          )}

          {/* UPCOMING section */}
          {upcomingMarkets.length > 0 && (
            <div className="space-y-2 mt-3">
              <SectionHeader type="upcoming" count={upcomingMarkets.length} />
              {upcomingMarkets.map((market, i) => (
                <MarketCard
                  key={market.id}
                  market={market}
                  index={liveMarkets.length + i}
                />
              ))}
            </div>
          )}

          {/* If no live/upcoming split (e.g. store data with no createdAt times) */}
          {liveMarkets.length === 0 &&
            upcomingMarkets.length === 0 &&
            filteredMarkets.length > 0 && (
              <div className="space-y-2">
                {filteredMarkets.map((market, i) => (
                  <MarketCard key={market.id} market={market} index={i} />
                ))}
              </div>
            )}
        </div>
      )}
    </div>
  );
}
