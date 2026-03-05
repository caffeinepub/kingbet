import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActor } from "@/hooks/useActor";
import { useStore } from "@/store/useStore";
import { Circle } from "lucide-react";
import { AnimatePresence, motion, useAnimate } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface CrashRound {
  id: bigint;
  crashPoint: bigint;
  status: string;
  startTime: bigint;
}

interface CrashBet {
  id: bigint;
  roundId: bigint;
  userId: bigint;
  stake: bigint;
  autoCashout: bigint;
  cashedOut: boolean;
  cashoutMultiplier: bigint;
  payout: bigint;
  status: string;
}

// ─── Multiplier Display (Aviator) ─────────────────────────────────────────────
function MultiplierDisplay({
  multiplier,
  status,
}: {
  multiplier: number;
  status: string;
}) {
  const isCrashed = status === "crashed";
  const isRunning = status === "running";

  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl p-8 relative overflow-hidden"
      style={{
        background: isCrashed
          ? "oklch(0.15 0.03 20)"
          : isRunning
            ? "oklch(0.12 0.02 145)"
            : "oklch(var(--secondary))",
        border: `2px solid ${isCrashed ? "oklch(var(--lay) / 0.4)" : isRunning ? "oklch(0.65 0.18 145 / 0.4)" : "oklch(var(--border))"}`,
        minHeight: "180px",
      }}
    >
      {isRunning && (
        <motion.div
          className="absolute text-5xl"
          animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
          transition={{
            duration: 1.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          style={{ top: "20px", right: "30px", opacity: 0.3 }}
        >
          ✈️
        </motion.div>
      )}

      {isCrashed && (
        <div
          className="absolute text-5xl"
          style={{ top: "20px", right: "30px", opacity: 0.3 }}
        >
          💥
        </div>
      )}

      <motion.div
        key={`${status}-${isCrashed}`}
        initial={{ scale: isCrashed ? 1.2 : 1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
        className="text-center"
      >
        <div
          className={`text-6xl font-bold font-mono leading-none ${
            isCrashed
              ? "text-rose-400"
              : isRunning
                ? "text-green-400"
                : "text-muted-foreground"
          }`}
        >
          {multiplier.toFixed(2)}x
        </div>
        <div
          className={`text-sm font-semibold mt-2 ${
            isCrashed
              ? "text-rose-400"
              : isRunning
                ? "text-green-400"
                : "text-muted-foreground"
          }`}
        >
          {isCrashed ? "CRASHED!" : isRunning ? "FLYING..." : "WAITING"}
        </div>
        {status === "waiting" && (
          <div className="text-xs text-muted-foreground/60 mt-1">
            Place your bets now
          </div>
        )}
      </motion.div>
    </div>
  );
}

function RoundHistory({ rounds }: { rounds: CrashRound[] }) {
  const getColor = (crashPoint: bigint) => {
    const val = Number(crashPoint) / 100;
    if (val < 2)
      return { color: "oklch(0.60 0.22 20)", bg: "oklch(0.60 0.22 20 / 0.15)" };
    if (val < 5)
      return { color: "oklch(var(--gold))", bg: "oklch(var(--gold) / 0.15)" };
    return { color: "oklch(0.65 0.18 145)", bg: "oklch(0.65 0.18 145 / 0.15)" };
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h4 className="font-semibold text-foreground mb-3 text-sm">
        Round History
      </h4>
      {rounds.length === 0 ? (
        <div
          className="text-center py-4 text-muted-foreground text-sm"
          data-ocid="crash.history_empty_state"
        >
          <Circle className="w-5 h-5 mx-auto mb-1 opacity-30" />
          No history yet
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {rounds.map((round, i) => {
            const { color, bg } = getColor(round.crashPoint);
            return (
              <div
                key={String(round.id)}
                data-ocid={`crash.history_item.${i + 1}`}
                className="px-2.5 py-1 rounded-full text-xs font-bold font-mono"
                style={{ background: bg, color }}
              >
                {(Number(round.crashPoint) / 100).toFixed(2)}x
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BetList({ bets }: { bets: CrashBet[] }) {
  if (bets.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-2.5 bg-secondary/50 border-b border-border text-xs font-medium text-muted-foreground grid grid-cols-4">
        <span>Player</span>
        <span className="text-right">Stake</span>
        <span className="text-right">Auto</span>
        <span className="text-right">Status</span>
      </div>
      <div className="divide-y divide-border/50 max-h-48 overflow-y-auto">
        {bets.map((bet, i) => (
          <div
            key={String(bet.id)}
            data-ocid={`crash.bet_item.${i + 1}`}
            className="px-4 py-2 text-xs grid grid-cols-4"
          >
            <span className="text-muted-foreground">
              Player {String(bet.userId).slice(-4)}
            </span>
            <span className="text-right font-mono text-foreground">
              ₹{(Number(bet.stake) / 100).toFixed(0)}
            </span>
            <span className="text-right font-mono text-muted-foreground">
              {bet.autoCashout > 0n
                ? `${(Number(bet.autoCashout) / 100).toFixed(2)}x`
                : "—"}
            </span>
            <span
              className={`text-right font-semibold ${bet.cashedOut ? "text-green-400" : "text-muted-foreground"}`}
            >
              {bet.cashedOut ? "✓ Out" : bet.status === "lost" ? "✗ Lost" : "…"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Local Aviator simulation (auto-loop when backend not connected) ───────────
type LocalRoundStatus = "waiting" | "running" | "crashed";

interface LocalRound {
  id: number;
  status: LocalRoundStatus;
  crashPoint: number; // actual multiplier e.g. 2.34
  startTime: number; // Date.now() ms
}

function generateCrashPoint(): number {
  // Provably-fair-style: house edge ~4%, min 1.00
  const r = Math.random();
  if (r < 0.04) return 1.0; // instant crash
  return Math.max(1.0, Math.floor(100 / (1 - r * 0.96)) / 100);
}

// ─── Aviator Game ──────────────────────────────────────────────────────────────
function AviatorGame() {
  const { actor } = useActor();
  const { currentUser, debitUserBalance, creditUserBalance } = useStore();

  // Local simulation state (used when backend not available)
  const [localRound, setLocalRound] = useState<LocalRound>(() => ({
    id: 1,
    status: "waiting",
    crashPoint: generateCrashPoint(),
    startTime: 0,
  }));
  const [_countdown, setCountdown] = useState(5); // seconds before round starts
  const localBetRef = useRef<{ stake: number; autoCashout: number } | null>(
    null,
  );
  const roundLoopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeRound, setActiveRound] = useState<CrashRound | null>(null);
  const [bets, setBets] = useState<CrashBet[]>([]);
  const [history, setHistory] = useState<CrashRound[]>([]);
  const [multiplier, setMultiplier] = useState(1.0);
  const [stake, setStake] = useState(100);
  const [autoCashout, setAutoCashout] = useState(2.0);
  const [hasPlacedBet, setHasPlacedBet] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [cashingOut, setCashingOut] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const multRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRoundData = useCallback(async () => {
    if (!actor) return;
    try {
      const result = await (
        actor as unknown as {
          getActiveCrashRound: () => Promise<[] | [CrashRound]>;
        }
      ).getActiveCrashRound();
      const round =
        Array.isArray(result) && result.length > 0 ? result[0] : null;
      setActiveRound(round ?? null);
      setBackendConnected(true);

      if (round) {
        const roundBets = await (
          actor as unknown as {
            getCrashBetsByRound: (id: bigint) => Promise<CrashBet[]>;
          }
        ).getCrashBetsByRound(round.id);
        setBets(roundBets);
      } else {
        setBets([]);
      }

      const hist = await (
        actor as unknown as {
          getCrashRoundHistory: () => Promise<CrashRound[]>;
        }
      ).getCrashRoundHistory();
      setHistory(hist.slice(0, 15));
    } catch {
      // backend not connected — use local simulation
      setBackendConnected(false);
    }
  }, [actor]);

  // ── Local round loop ────────────────────────────────────────────────────────
  const startLocalLoop = useCallback(() => {
    const BETTING_WINDOW = 5000; // 5s betting phase
    const TICK = 100;

    setLocalRound((prev) => ({
      ...prev,
      status: "waiting",
      crashPoint: generateCrashPoint(),
      startTime: 0,
    }));
    setMultiplier(1.0);
    setCountdown(Math.ceil(BETTING_WINDOW / 1000));
    setHasPlacedBet(false);
    localBetRef.current = null;

    // Countdown ticks
    let remaining = BETTING_WINDOW;
    const countdownTick = setInterval(() => {
      remaining -= 500;
      setCountdown(Math.max(0, Math.ceil(remaining / 1000)));
      if (remaining <= 0) clearInterval(countdownTick);
    }, 500);

    // After betting window, start flying
    roundLoopRef.current = setTimeout(() => {
      clearInterval(countdownTick);
      const startTime = Date.now();

      setLocalRound((prev) => ({ ...prev, status: "running", startTime }));

      let crashed = false;
      const flyTick = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const m = Math.exp(0.00006 * Math.max(0, elapsed));
        setMultiplier(m);

        setLocalRound((prev) => {
          if (crashed) return prev;
          // Check auto-cashout for local bet
          const bet = localBetRef.current;
          if (bet && bet.autoCashout > 0 && m >= bet.autoCashout) {
            const payout = Number.parseFloat(
              (bet.stake * bet.autoCashout).toFixed(2),
            );
            creditUserBalance(currentUser?.id ?? "", payout);
            localBetRef.current = null;
            toast.success(
              `Auto cash out at ${bet.autoCashout.toFixed(2)}x! +₹${payout}`,
            );
          }
          // Check crash
          if (m >= prev.crashPoint) {
            crashed = true;
            clearInterval(flyTick);
            const finalM = prev.crashPoint;
            setMultiplier(finalM);
            // settle any remaining local bet as lost
            localBetRef.current = null;
            const newRound = { ...prev, status: "crashed" as LocalRoundStatus };
            setHistory((h) => [
              {
                id: BigInt(prev.id),
                crashPoint: BigInt(Math.round(finalM * 100)),
                status: "crashed",
                startTime: BigInt(startTime * 1_000_000),
              },
              ...h.slice(0, 14),
            ]);
            // schedule next round after 3s pause
            roundLoopRef.current = setTimeout(startLocalLoop, 3000);
            return newRound;
          }
          return prev;
        });
      }, TICK);
    }, BETTING_WINDOW);
  }, [creditUserBalance, currentUser?.id]);

  // Start local loop on mount (always, as fallback shown before backend check)
  // biome-ignore lint/correctness/useExhaustiveDependencies: startLocalLoop is stable on mount; re-running on change would restart the loop unexpectedly
  useEffect(() => {
    startLocalLoop();
    return () => {
      if (roundLoopRef.current) clearTimeout(roundLoopRef.current);
      if (multRef.current) clearInterval(multRef.current);
    };
  }, []);

  useEffect(() => {
    fetchRoundData();
    pollRef.current = setInterval(fetchRoundData, 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchRoundData]);

  // Backend round multiplier animation
  useEffect(() => {
    if (!backendConnected) return;
    if (multRef.current) clearInterval(multRef.current);

    if (activeRound?.status === "running") {
      const startMs = Number(activeRound.startTime) / 1_000_000;
      multRef.current = setInterval(() => {
        const elapsed = Date.now() - startMs;
        const m = Math.exp(0.00006 * Math.max(0, elapsed));
        setMultiplier(m);
      }, 100);
    } else if (activeRound?.status === "crashed") {
      setMultiplier(Number(activeRound.crashPoint) / 100);
    } else {
      setMultiplier(1.0);
    }

    return () => {
      if (multRef.current) clearInterval(multRef.current);
    };
  }, [activeRound, backendConnected]);

  const prevRoundId = useRef<bigint | null>(null);
  useEffect(() => {
    if (activeRound && activeRound.id !== prevRoundId.current) {
      prevRoundId.current = activeRound.id;
      setHasPlacedBet(false);
    }
  }, [activeRound]);

  const handlePlaceBet = async () => {
    // Local simulation path
    if (!backendConnected) {
      if (!currentUser) return toast.error("Please login to play");
      if (stake <= 0) return toast.error("Enter a valid stake");
      if (currentUser.balance < stake)
        return toast.error(
          `Insufficient balance. You have ₹${currentUser.balance.toFixed(2)}`,
        );
      if (localRound.status !== "waiting")
        return toast.error("Betting phase is over for this round");
      debitUserBalance(currentUser.id, stake);
      localBetRef.current = { stake, autoCashout };
      setHasPlacedBet(true);
      toast.success(`Bet placed: ₹${stake}`, {
        description: `Auto cashout: ${autoCashout}x`,
      });
      return;
    }

    if (!actor || !activeRound) return;
    if (stake <= 0) return toast.error("Enter a valid stake");

    setPlacing(true);
    try {
      await (
        actor as unknown as {
          placeCrashBet: (
            id: bigint,
            stake: bigint,
            auto: bigint,
          ) => Promise<bigint>;
        }
      ).placeCrashBet(
        activeRound.id,
        BigInt(Math.round(stake * 100)),
        BigInt(Math.round(autoCashout * 100)),
      );
      toast.success(`Bet placed: ₹${stake}`, {
        description: `Auto cashout: ${autoCashout}x`,
      });
      setHasPlacedBet(true);
      await fetchRoundData();
    } catch {
      toast.error("Failed to place bet.");
    } finally {
      setPlacing(false);
    }
  };

  const handleCashOut = async () => {
    // Local simulation path
    if (!backendConnected) {
      if (!localBetRef.current) return;
      const payout = Number.parseFloat(
        (localBetRef.current.stake * multiplier).toFixed(2),
      );
      creditUserBalance(currentUser?.id ?? "", payout);
      localBetRef.current = null;
      setHasPlacedBet(false);
      toast.success(`Cashed out at ${multiplier.toFixed(2)}x! +₹${payout}`);
      return;
    }

    if (!actor || !activeRound) return;
    setCashingOut(true);
    try {
      await (
        actor as unknown as {
          cashOutCrash: (id: bigint, mult: bigint) => Promise<void>;
        }
      ).cashOutCrash(activeRound.id, BigInt(Math.round(multiplier * 100)));
      toast.success(`Cashed out at ${multiplier.toFixed(2)}x!`);
      setHasPlacedBet(false);
      await fetchRoundData();
    } catch {
      toast.error("Cash out failed.");
    } finally {
      setCashingOut(false);
    }
  };

  // Determine effective status from local or backend
  const effectiveRound = backendConnected ? activeRound : localRound;
  const status: string = effectiveRound?.status ?? "waiting";
  const canPlaceBet = status === "waiting" && !hasPlacedBet;
  const canCashOut = status === "running" && hasPlacedBet;

  return (
    <div className="space-y-4">
      <MultiplierDisplay multiplier={multiplier} status={status} />

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Stake (₹)</Label>
            <Input
              type="number"
              min={1}
              value={stake}
              onChange={(e) => setStake(Number(e.target.value) || 0)}
              disabled={!canPlaceBet || placing}
              className="bg-input border-border h-9 font-mono text-sm"
              data-ocid="crash.stake_input"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Auto Cashout (x)
            </Label>
            <Input
              type="number"
              min={1.01}
              step={0.1}
              value={autoCashout}
              onChange={(e) => setAutoCashout(Number(e.target.value) || 1.01)}
              disabled={!canPlaceBet || placing}
              className="bg-input border-border h-9 font-mono text-sm"
              data-ocid="crash.auto_cashout_input"
            />
          </div>
        </div>

        <div className="flex gap-1.5 mb-4">
          {[50, 100, 500, 1000].map((amt) => (
            <button
              key={amt}
              type="button"
              disabled={!canPlaceBet}
              onClick={() => setStake(amt)}
              className="flex-1 text-xs py-1 rounded border border-border text-muted-foreground hover:text-foreground hover:border-gold/50 disabled:opacity-40 transition-all"
            >
              ₹{amt}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handlePlaceBet}
            disabled={!canPlaceBet || placing}
            className="font-bold text-background h-10"
            style={{
              background:
                canPlaceBet && !placing
                  ? "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))"
                  : undefined,
            }}
            data-ocid="crash.place_bet_button"
          >
            {placing ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Bet"
            )}
          </Button>

          <Button
            onClick={handleCashOut}
            disabled={!canCashOut || cashingOut}
            className="font-bold text-background h-10"
            style={{
              background:
                canCashOut && !cashingOut ? "oklch(0.65 0.18 145)" : undefined,
            }}
            data-ocid="crash.cashout_button"
          >
            {cashingOut ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              `Cash Out ${canCashOut ? `${multiplier.toFixed(2)}x` : ""}`
            )}
          </Button>
        </div>

        {status === "waiting" && !hasPlacedBet && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Place your bet before the round starts
          </p>
        )}
        {hasPlacedBet && status === "running" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-green-400 text-center mt-2 font-semibold"
          >
            ✈️ Flying! Cash out before crash!
          </motion.p>
        )}
      </div>

      {bets.length > 0 && <BetList bets={bets} />}
      <RoundHistory rounds={history} />
    </div>
  );
}

// ─── Plinko Game ───────────────────────────────────────────────────────────────

type PlinkoRows = 8 | 12 | 16;
type RiskLevel = "low" | "medium" | "high";

const PLINKO_MULTIPLIERS: Record<PlinkoRows, Record<RiskLevel, number[]>> = {
  8: {
    low: [5.6, 2.1, 1.1, 1.0, 1.0, 1.1, 2.1, 5.6],
    medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
  },
  12: {
    low: [8.9, 3, 1.4, 1.1, 1.0, 0.5, 0.5, 1.0, 1.1, 1.4, 3, 8.9],
    medium: [33, 7, 2, 1, 0.5, 0.3, 0.3, 0.5, 1, 2, 7, 33],
    high: [100, 13, 4, 1, 0.3, 0.2, 0.2, 0.3, 1, 4, 13, 100],
  },
  16: {
    low: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1.0, 1.0, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
    medium: [62, 14, 4, 2, 1, 0.7, 0.4, 0.2, 0.2, 0.4, 0.7, 1, 2, 4, 14, 62],
    high: [
      1000, 26, 9, 2, 0.5, 0.2, 0.1, 0.1, 0.1, 0.1, 0.2, 0.5, 2, 9, 26, 1000,
    ],
  },
};

function getBucketColor(multiplier: number): string {
  if (multiplier >= 10) return "oklch(0.65 0.18 145)"; // green
  if (multiplier >= 3) return "oklch(0.72 0.20 120)"; // yellow-green
  if (multiplier >= 1.5) return "oklch(0.78 0.15 85)"; // gold
  if (multiplier >= 1) return "oklch(0.72 0.18 60)"; // saffron
  return "oklch(0.62 0.22 20)"; // red
}

interface PlinkoResult {
  bucketIndex: number;
  multiplier: number;
  payout: number;
  stake: number;
  path: number[]; // 0 = left, 1 = right at each row
}

interface PlinkoHistoryItem {
  id: string;
  multiplier: number;
  payout: number;
  stake: number;
  won: boolean;
}

// SVG Plinko board component
function PlinkoBoardSVG({
  rows,
  ballPath,
  landedBucket,
  multipliers,
  isAnimating,
}: {
  rows: PlinkoRows;
  ballPath: number[] | null;
  landedBucket: number | null;
  multipliers: number[];
  isAnimating: boolean;
}) {
  const [scope, animate] = useAnimate();
  const boardWidth = 320;
  const boardHeight = rows === 8 ? 260 : rows === 12 ? 340 : 420;
  const topPad = 30;
  const bottomPad = 50;
  const usableH = boardHeight - topPad - bottomPad;
  const rowSpacing = usableH / rows;

  // Peg positions: row r has (r+1) pegs, spread evenly
  const pegPositions: Array<{ cx: number; cy: number }> = [];
  for (let r = 0; r < rows; r++) {
    const numPegs = r + 2;
    for (let p = 0; p < numPegs; p++) {
      const cx = (boardWidth / (numPegs + 1)) * (p + 1);
      const cy = topPad + rowSpacing * (r + 0.5);
      pegPositions.push({ cx, cy });
    }
  }

  // Compute ball waypoints from path (left/right choices)
  const ballWaypoints: Array<{ x: number; y: number }> = [];
  if (ballPath) {
    // Start at center top
    ballWaypoints.push({ x: boardWidth / 2, y: topPad - 16 });
    let col = 0; // 0-indexed offset from left
    for (let r = 0; r < rows; r++) {
      const direction = ballPath[r]; // 0 = left, 1 = right
      col = col + direction;
      const numPegs = r + 2;
      const cx = (boardWidth / (numPegs + 1)) * (col + 1);
      const cy = topPad + rowSpacing * (r + 0.5) + rowSpacing * 0.4;
      ballWaypoints.push({ x: cx, y: cy });
    }
    // Final bucket position
    const buckets = rows + 1;
    const bucketW = boardWidth / buckets;
    const finalX = bucketW * (col + 0.5);
    ballWaypoints.push({ x: finalX, y: boardHeight - bottomPad + 20 });
  }

  // Animate ball when path changes and isAnimating
  // biome-ignore lint/correctness/useExhaustiveDependencies: animate is stable ref from useAnimate
  useEffect(() => {
    if (!isAnimating || !ballPath || ballWaypoints.length < 2) return;
    const totalDuration = 1.8;

    const keyframes = ballWaypoints.map((pt) => ({ x: pt.x, y: pt.y }));
    animate(
      "#plinko-ball",
      {
        x: keyframes.map((k) => k.x),
        y: keyframes.map((k) => k.y),
      },
      {
        duration: totalDuration,
        ease: "easeIn",
        times: ballWaypoints.map((_, i) => i / (ballWaypoints.length - 1)),
      },
    );
  }, [isAnimating, ballPath]);

  const buckets = rows + 1;
  const bucketW = boardWidth / buckets;

  return (
    <div
      ref={scope}
      className="relative mx-auto select-none"
      style={{ width: boardWidth, height: boardHeight }}
    >
      <svg
        role="img"
        aria-label="Plinko board"
        width={boardWidth}
        height={boardHeight}
        className="absolute inset-0"
        style={{ overflow: "visible" }}
      >
        {/* Pegs */}
        {pegPositions.map((p, i) => (
          <circle
            // biome-ignore lint/suspicious/noArrayIndexKey: peg positions are stable geometry
            key={i}
            cx={p.cx}
            cy={p.cy}
            r={4}
            fill="oklch(var(--border))"
            stroke="oklch(var(--muted-foreground) / 0.4)"
            strokeWidth={1}
          />
        ))}

        {/* Bucket labels */}
        {multipliers.map((m, i) => {
          const bx = bucketW * i;
          const color = getBucketColor(m);
          const isLanded = landedBucket === i;
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: bucket positions are stable geometry
            <g key={i}>
              <rect
                x={bx + 2}
                y={boardHeight - bottomPad + 6}
                width={bucketW - 4}
                height={bottomPad - 10}
                rx={4}
                fill={isLanded ? color : `${color.slice(0, -1)} / 0.15)`}
                stroke={color}
                strokeWidth={isLanded ? 2 : 0.5}
                style={{
                  filter: isLanded
                    ? `drop-shadow(0 0 8px ${color})`
                    : undefined,
                  transition: "all 0.3s",
                }}
              />
              <text
                x={bx + bucketW / 2}
                y={boardHeight - bottomPad + 6 + (bottomPad - 10) / 2 + 4}
                textAnchor="middle"
                fill={isLanded ? "#fff" : color}
                fontSize={m >= 100 ? 7 : m >= 10 ? 8 : 9}
                fontWeight="bold"
                fontFamily="monospace"
              >
                {m >= 1 ? `${m}x` : `${m}x`}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Animated ball */}
      {ballPath && (
        <motion.div
          id="plinko-ball"
          initial={{
            x: ballWaypoints[0]?.x ?? boardWidth / 2,
            y: ballWaypoints[0]?.y ?? topPad - 16,
          }}
          className="absolute w-4 h-4 rounded-full pointer-events-none z-10"
          style={{
            marginLeft: -8,
            marginTop: -8,
            background:
              "radial-gradient(circle at 35% 35%, oklch(0.95 0.15 85), oklch(0.65 0.18 75))",
            boxShadow: "0 0 8px oklch(var(--gold) / 0.8)",
            top: 0,
            left: 0,
          }}
        />
      )}
    </div>
  );
}

function PlinkoGame() {
  const { currentUser, debitUserBalance, creditUserBalance } = useStore();

  const [stake, setStake] = useState(100);
  const [rows, setRows] = useState<PlinkoRows>(8);
  const [risk, setRisk] = useState<RiskLevel>("medium");
  const [isDropping, setIsDropping] = useState(false);
  const [lastResult, setLastResult] = useState<PlinkoResult | null>(null);
  const [history, setHistory] = useState<PlinkoHistoryItem[]>([]);
  const [activePath, setActivePath] = useState<number[] | null>(null);
  const [landedBucket, setLandedBucket] = useState<number | null>(null);

  const multipliers = PLINKO_MULTIPLIERS[rows][risk];

  const handleDrop = async () => {
    if (!currentUser) {
      toast.error("Please login to play");
      return;
    }
    if (stake <= 0) {
      toast.error("Enter a valid stake amount");
      return;
    }
    if (currentUser.balance < stake) {
      toast.error(
        `Insufficient balance. You have ₹${currentUser.balance.toFixed(2)}`,
      );
      return;
    }

    // Compute random path
    const path: number[] = Array.from({ length: rows }, () =>
      Math.random() < 0.5 ? 0 : 1,
    );
    const bucketIndex = path.reduce((acc, v) => acc + v, 0);
    const multiplier = multipliers[bucketIndex];
    const payout = Number.parseFloat((stake * multiplier).toFixed(2));

    // Deduct stake immediately
    debitUserBalance(currentUser.id, stake);

    setIsDropping(true);
    setActivePath(path);
    setLandedBucket(null);
    setLastResult(null);

    // Wait for animation (~1.8s + 0.3s settle)
    await new Promise((res) => setTimeout(res, 2200));

    // Credit payout
    creditUserBalance(currentUser.id, payout);

    const result: PlinkoResult = {
      bucketIndex,
      multiplier,
      payout,
      stake,
      path,
    };
    setLastResult(result);
    setLandedBucket(bucketIndex);
    setIsDropping(false);

    setHistory((prev) => [
      {
        id: `${Date.now()}-${bucketIndex}`,
        multiplier,
        payout,
        stake,
        won: multiplier >= 1,
      },
      ...prev.slice(0, 9),
    ]);

    if (multiplier >= 5) {
      toast.success(`🎯 Big Win! ${multiplier}x — ₹${payout.toFixed(2)}`, {
        duration: 4000,
      });
    } else if (multiplier >= 1) {
      toast.success(`Won ₹${payout.toFixed(2)} (${multiplier}x)`);
    } else {
      toast.error(`Lost ₹${(stake - payout).toFixed(2)}`);
    }
  };

  const getHistoryChipStyle = (item: PlinkoHistoryItem) => {
    if (item.multiplier >= 5)
      return {
        bg: "oklch(0.65 0.18 145 / 0.2)",
        color: "oklch(0.65 0.18 145)",
      };
    if (item.multiplier >= 1)
      return { bg: "oklch(var(--gold) / 0.2)", color: "oklch(var(--gold))" };
    return { bg: "oklch(0.62 0.22 20 / 0.2)", color: "oklch(0.62 0.22 20)" };
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        {/* Balance */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Balance</span>
          <span
            className="font-bold font-mono"
            style={{ color: "oklch(var(--gold))" }}
          >
            ₹{(currentUser?.balance ?? 0).toFixed(2)}
          </span>
        </div>

        {/* Stake */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Stake (₹)</Label>
          <Input
            type="number"
            min={1}
            value={stake}
            onChange={(e) => setStake(Number(e.target.value) || 0)}
            disabled={isDropping}
            className="bg-input border-border h-9 font-mono text-sm"
            data-ocid="plinko.stake_input"
          />
          <div className="flex gap-1.5">
            {[50, 100, 500, 1000].map((amt) => (
              <button
                key={amt}
                type="button"
                disabled={isDropping}
                onClick={() => setStake(amt)}
                className="flex-1 text-xs py-1 rounded border border-border text-muted-foreground hover:text-foreground hover:border-gold/50 disabled:opacity-40 transition-all"
              >
                ₹{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Rows */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Rows</Label>
          <div className="flex gap-2">
            {([8, 12, 16] as PlinkoRows[]).map((r) => (
              <button
                key={r}
                type="button"
                disabled={isDropping}
                onClick={() => setRows(r)}
                data-ocid={`plinko.rows_${r}_button`}
                className="flex-1 py-1.5 text-sm font-semibold rounded-lg border transition-all disabled:opacity-40"
                style={
                  rows === r
                    ? {
                        background: "oklch(var(--gold) / 0.2)",
                        borderColor: "oklch(var(--gold) / 0.6)",
                        color: "oklch(var(--gold))",
                      }
                    : {
                        background: "transparent",
                        borderColor: "oklch(var(--border))",
                        color: "oklch(var(--muted-foreground))",
                      }
                }
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Risk */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Risk Level</Label>
          <div className="flex gap-2">
            {(["low", "medium", "high"] as RiskLevel[]).map((level) => {
              const colors: Record<RiskLevel, string> = {
                low: "oklch(0.65 0.18 145)",
                medium: "oklch(var(--gold))",
                high: "oklch(0.62 0.22 20)",
              };
              const isActive = risk === level;
              return (
                <button
                  key={level}
                  type="button"
                  disabled={isDropping}
                  onClick={() => setRisk(level)}
                  data-ocid={`plinko.risk_${level}_button`}
                  className="flex-1 py-1.5 text-sm font-semibold rounded-lg border capitalize transition-all disabled:opacity-40"
                  style={
                    isActive
                      ? {
                          background: `${colors[level].slice(0, -1)} / 0.2)`,
                          borderColor: `${colors[level].slice(0, -1)} / 0.6)`,
                          color: colors[level],
                        }
                      : {
                          background: "transparent",
                          borderColor: "oklch(var(--border))",
                          color: "oklch(var(--muted-foreground))",
                        }
                  }
                >
                  {level}
                </button>
              );
            })}
          </div>
        </div>

        {/* Drop button */}
        <Button
          onClick={handleDrop}
          disabled={isDropping}
          className="w-full h-11 font-bold text-sm"
          style={{
            background: isDropping
              ? undefined
              : "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
            color: "oklch(0.1 0.01 265)",
          }}
          data-ocid="plinko.drop_ball_button"
        >
          {isDropping ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Dropping…
            </span>
          ) : (
            "🎯 Drop Ball"
          )}
        </Button>
      </div>

      {/* Plinko Board */}
      <div
        className="rounded-xl border border-border bg-card p-4 overflow-hidden"
        style={{ background: "oklch(0.10 0.015 265)" }}
      >
        <PlinkoBoardSVG
          rows={rows}
          ballPath={activePath}
          landedBucket={landedBucket}
          multipliers={multipliers}
          isAnimating={isDropping}
        />
      </div>

      {/* Result */}
      <AnimatePresence mode="wait">
        {lastResult && (
          <motion.div
            key={`${lastResult.bucketIndex}-${lastResult.stake}`}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl border p-4 text-center"
            style={{
              background:
                lastResult.multiplier >= 1
                  ? "oklch(0.65 0.18 145 / 0.08)"
                  : "oklch(0.62 0.22 20 / 0.08)",
              borderColor:
                lastResult.multiplier >= 1
                  ? "oklch(0.65 0.18 145 / 0.3)"
                  : "oklch(0.62 0.22 20 / 0.3)",
            }}
          >
            <div
              className="text-3xl font-bold font-mono mb-1"
              style={{ color: getBucketColor(lastResult.multiplier) }}
            >
              {lastResult.multiplier}x
            </div>
            <div className="text-sm text-muted-foreground">
              {lastResult.multiplier >= 1 ? (
                <span className="text-green-400 font-semibold">
                  Won ₹{lastResult.payout.toFixed(2)}
                </span>
              ) : (
                <span className="text-rose-400 font-semibold">
                  Lost ₹{(lastResult.stake - lastResult.payout).toFixed(2)}
                </span>
              )}{" "}
              on ₹{lastResult.stake} stake
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {history.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="font-semibold text-foreground mb-3 text-sm">
            Round History
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {history.map((item, i) => {
              const { bg, color } = getHistoryChipStyle(item);
              return (
                <div
                  key={item.id}
                  data-ocid={`plinko.history_item.${i + 1}`}
                  className="px-2.5 py-1 rounded-full text-xs font-bold font-mono"
                  style={{ background: bg, color }}
                >
                  {item.multiplier}x
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Dice Game ─────────────────────────────────────────────────────────────────

interface DiceResult {
  id: string;
  roll: number;
  target: number;
  mode: "over" | "under";
  multiplier: number;
  stake: number;
  payout: number;
  won: boolean;
}

// Dot layout for dice faces 1-6
const DICE_DOTS: Record<number, Array<{ row: number; col: number }>> = {
  1: [{ row: 1, col: 1 }],
  2: [
    { row: 0, col: 2 },
    { row: 2, col: 0 },
  ],
  3: [
    { row: 0, col: 2 },
    { row: 1, col: 1 },
    { row: 2, col: 0 },
  ],
  4: [
    { row: 0, col: 0 },
    { row: 0, col: 2 },
    { row: 2, col: 0 },
    { row: 2, col: 2 },
  ],
  5: [
    { row: 0, col: 0 },
    { row: 0, col: 2 },
    { row: 1, col: 1 },
    { row: 2, col: 0 },
    { row: 2, col: 2 },
  ],
  6: [
    { row: 0, col: 0 },
    { row: 0, col: 2 },
    { row: 1, col: 0 },
    { row: 1, col: 2 },
    { row: 2, col: 0 },
    { row: 2, col: 2 },
  ],
};

function DiceFace({
  value,
  size = 80,
  won,
}: { value: number; size?: number; won: boolean }) {
  const face = Math.min(6, Math.max(1, Math.round((value / 100) * 6)));
  const dots = DICE_DOTS[face] ?? DICE_DOTS[1];
  const pad = size * 0.12;
  const cellSize = (size - pad * 2) / 3;
  const dotR = size * 0.09;

  return (
    <svg
      role="img"
      aria-label={`Dice showing ${face}`}
      width={size}
      height={size}
    >
      <rect
        x={1}
        y={1}
        width={size - 2}
        height={size - 2}
        rx={size * 0.12}
        fill={won ? "oklch(0.18 0.04 145)" : "oklch(0.18 0.03 20)"}
        stroke={
          won ? "oklch(0.65 0.18 145 / 0.7)" : "oklch(0.62 0.22 20 / 0.7)"
        }
        strokeWidth={2}
      />
      {dots.map((d) => (
        <circle
          key={`dot-r${d.row}-c${d.col}`}
          cx={pad + d.col * cellSize + cellSize / 2}
          cy={pad + d.row * cellSize + cellSize / 2}
          r={dotR}
          fill={won ? "oklch(0.65 0.18 145)" : "oklch(0.62 0.22 20)"}
        />
      ))}
    </svg>
  );
}

function DiceGame() {
  const { currentUser, debitUserBalance, creditUserBalance } = useStore();

  const [stake, setStake] = useState(100);
  const [target, setTarget] = useState(50);
  const [mode, setMode] = useState<"over" | "under">("over");
  const [isRolling, setIsRolling] = useState(false);
  const [displayNumber, setDisplayNumber] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<DiceResult | null>(null);
  const [history, setHistory] = useState<DiceResult[]>([]);

  const winChance =
    mode === "over" ? ((100 - target) / 100) * 100 : (target / 100) * 100;
  const multiplier = Number.parseFloat((0.99 / (winChance / 100)).toFixed(4));
  const potentialPayout = Number.parseFloat((stake * multiplier).toFixed(2));

  const handleRoll = async () => {
    if (!currentUser) {
      toast.error("Please login to play");
      return;
    }
    if (stake <= 0) {
      toast.error("Enter a valid stake amount");
      return;
    }
    if (currentUser.balance < stake) {
      toast.error(
        `Insufficient balance. You have ₹${currentUser.balance.toFixed(2)}`,
      );
      return;
    }

    const roll = Math.floor(Math.random() * 100) + 1;
    const won = mode === "over" ? roll > target : roll < target;
    const payout = won ? potentialPayout : 0;

    // Deduct stake
    debitUserBalance(currentUser.id, stake);

    setIsRolling(true);
    setLastResult(null);
    setDisplayNumber(null);

    // Roll animation: count up rapidly then settle
    const animDuration = 1200;
    const interval = 60;
    const steps = animDuration / interval;
    let step = 0;

    await new Promise<void>((resolve) => {
      const ticker = setInterval(() => {
        step++;
        const randomNum = Math.floor(Math.random() * 100) + 1;
        setDisplayNumber(randomNum);
        if (step >= steps) {
          clearInterval(ticker);
          setDisplayNumber(roll);
          resolve();
        }
      }, interval);
    });

    // Credit payout if won
    if (won) {
      creditUserBalance(currentUser.id, payout);
    }

    const result: DiceResult = {
      id: `${Date.now()}-${roll}`,
      roll,
      target,
      mode,
      multiplier,
      stake,
      payout,
      won,
    };
    setLastResult(result);
    setIsRolling(false);
    setHistory((prev) => [result, ...prev.slice(0, 9)]);

    if (won) {
      toast.success(
        `🎲 WIN! +₹${payout.toFixed(2)} (${multiplier.toFixed(2)}x)`,
      );
    } else {
      toast.error(`🎲 Lost ₹${stake}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        {/* Balance */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Balance</span>
          <span
            className="font-bold font-mono"
            style={{ color: "oklch(var(--gold))" }}
          >
            ₹{(currentUser?.balance ?? 0).toFixed(2)}
          </span>
        </div>

        {/* Stake */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Stake (₹)</Label>
          <Input
            type="number"
            min={1}
            value={stake}
            onChange={(e) => setStake(Number(e.target.value) || 0)}
            disabled={isRolling}
            className="bg-input border-border h-9 font-mono text-sm"
            data-ocid="dice.stake_input"
          />
          <div className="flex gap-1.5">
            {[50, 100, 500, 1000].map((amt) => (
              <button
                key={amt}
                type="button"
                disabled={isRolling}
                onClick={() => setStake(amt)}
                className="flex-1 text-xs py-1 rounded border border-border text-muted-foreground hover:text-foreground hover:border-gold/50 disabled:opacity-40 transition-all"
              >
                ₹{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Over / Under toggle */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Direction</Label>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isRolling}
              onClick={() => setMode("over")}
              data-ocid="dice.roll_over_button"
              className="flex-1 py-2 text-sm font-semibold rounded-lg border transition-all disabled:opacity-40"
              style={
                mode === "over"
                  ? {
                      background: "oklch(0.65 0.18 145 / 0.2)",
                      borderColor: "oklch(0.65 0.18 145 / 0.6)",
                      color: "oklch(0.65 0.18 145)",
                    }
                  : {
                      background: "transparent",
                      borderColor: "oklch(var(--border))",
                      color: "oklch(var(--muted-foreground))",
                    }
              }
            >
              ↑ Roll Over
            </button>
            <button
              type="button"
              disabled={isRolling}
              onClick={() => setMode("under")}
              data-ocid="dice.roll_under_button"
              className="flex-1 py-2 text-sm font-semibold rounded-lg border transition-all disabled:opacity-40"
              style={
                mode === "under"
                  ? {
                      background: "oklch(0.62 0.22 20 / 0.2)",
                      borderColor: "oklch(0.62 0.22 20 / 0.6)",
                      color: "oklch(0.62 0.22 20)",
                    }
                  : {
                      background: "transparent",
                      borderColor: "oklch(var(--border))",
                      color: "oklch(var(--muted-foreground))",
                    }
              }
            >
              ↓ Roll Under
            </button>
          </div>
        </div>

        {/* Target Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs text-muted-foreground">
              Target:{" "}
              <span className="font-bold text-foreground">{target}</span>
            </Label>
            <Input
              type="number"
              min={2}
              max={98}
              value={target}
              onChange={(e) => {
                const v = Math.min(
                  98,
                  Math.max(2, Number(e.target.value) || 50),
                );
                setTarget(v);
              }}
              disabled={isRolling}
              className="w-20 h-7 text-xs text-center bg-input border-border font-mono"
              data-ocid="dice.target_input"
            />
          </div>
          <Slider
            min={2}
            max={98}
            step={1}
            value={[target]}
            onValueChange={([v]) => setTarget(v)}
            disabled={isRolling}
            className="w-full"
          />
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div
              className="rounded-lg p-2 text-center"
              style={{ background: "oklch(0.16 0.02 265)" }}
            >
              <div className="text-xs text-muted-foreground">Win Chance</div>
              <div
                className="font-bold text-sm font-mono"
                style={{ color: "oklch(var(--gold))" }}
              >
                {winChance.toFixed(2)}%
              </div>
            </div>
            <div
              className="rounded-lg p-2 text-center"
              style={{ background: "oklch(0.16 0.02 265)" }}
            >
              <div className="text-xs text-muted-foreground">Multiplier</div>
              <div
                className="font-bold text-sm font-mono"
                style={{ color: "oklch(var(--saffron))" }}
              >
                {multiplier.toFixed(2)}x
              </div>
            </div>
            <div
              className="rounded-lg p-2 text-center"
              style={{ background: "oklch(0.16 0.02 265)" }}
            >
              <div className="text-xs text-muted-foreground">Payout</div>
              <div className="font-bold text-sm font-mono text-green-400">
                ₹{potentialPayout.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Roll button */}
        <Button
          onClick={handleRoll}
          disabled={isRolling}
          className="w-full h-11 font-bold text-sm"
          style={{
            background: isRolling
              ? undefined
              : "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
            color: "oklch(0.1 0.01 265)",
          }}
          data-ocid="dice.roll_button"
        >
          {isRolling ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Rolling…
            </span>
          ) : (
            "🎲 Roll Dice"
          )}
        </Button>
      </div>

      {/* Dice Result Display */}
      <div
        className="rounded-xl border border-border p-6 flex flex-col items-center gap-4 min-h-[180px] justify-center"
        style={{ background: "oklch(0.10 0.015 265)" }}
      >
        {displayNumber !== null ? (
          <>
            {/* Dice face for 1-6 range */}
            <motion.div
              key={displayNumber}
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.05 }}
            >
              <DiceFace
                value={displayNumber}
                size={80}
                won={lastResult?.won ?? false}
              />
            </motion.div>

            {/* Large number */}
            <motion.div
              key={`num-${displayNumber}`}
              initial={{ opacity: 0.6, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.05 }}
              className="text-5xl font-black font-mono"
              style={{
                color: lastResult
                  ? lastResult.won
                    ? "oklch(0.65 0.18 145)"
                    : "oklch(0.62 0.22 20)"
                  : "oklch(var(--muted-foreground))",
              }}
            >
              {displayNumber}
            </motion.div>

            {/* Win/Loss label */}
            <AnimatePresence>
              {lastResult && !isRolling && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  {lastResult.won ? (
                    <div className="font-bold text-green-400 text-lg">
                      WIN! +₹{lastResult.payout.toFixed(2)}
                    </div>
                  ) : (
                    <div className="font-bold text-rose-400 text-lg">
                      LOSS −₹{lastResult.stake.toFixed(2)}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    Rolled {lastResult.roll} —{" "}
                    {lastResult.mode === "over"
                      ? `needed > ${lastResult.target}`
                      : `needed < ${lastResult.target}`}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="text-center text-muted-foreground">
            <div className="text-5xl mb-3 opacity-20">🎲</div>
            <div className="text-sm">Set your bet and roll</div>
          </div>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="font-semibold text-foreground mb-3 text-sm">
            Round History
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {history.map((item, i) => (
              <div
                key={item.id}
                data-ocid={`dice.history_item.${i + 1}`}
                className="px-2.5 py-1 rounded-full text-xs font-bold font-mono flex items-center gap-1"
                style={{
                  background: item.won
                    ? "oklch(0.65 0.18 145 / 0.15)"
                    : "oklch(0.62 0.22 20 / 0.15)",
                  color: item.won
                    ? "oklch(0.65 0.18 145)"
                    : "oklch(0.62 0.22 20)",
                }}
              >
                <span>{item.roll}</span>
                <span className="opacity-60">{item.won ? "✓" : "✗"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CrashPage ─────────────────────────────────────────────────────────────────
export function CrashPage() {
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-2xl">✈️</span>
        <h1 className="text-lg font-bold text-foreground">Crash Games</h1>
        <Badge
          variant="outline"
          className="text-xs"
          style={{
            background: "oklch(var(--saffron) / 0.15)",
            color: "oklch(var(--saffron))",
            borderColor: "oklch(var(--saffron) / 0.3)",
          }}
        >
          Live
        </Badge>
      </div>

      <Tabs defaultValue="aviator">
        <TabsList className="bg-secondary border border-border mb-5 h-10">
          <TabsTrigger
            value="aviator"
            className="text-sm"
            data-ocid="crash.aviator.tab"
          >
            ✈️ Aviator
          </TabsTrigger>
          <TabsTrigger
            value="plinko"
            className="text-sm"
            data-ocid="crash.plinko.tab"
          >
            🎯 Plinko
          </TabsTrigger>
          <TabsTrigger
            value="dice"
            className="text-sm"
            data-ocid="crash.dice.tab"
          >
            🎲 Dice
          </TabsTrigger>
        </TabsList>

        <TabsContent value="aviator">
          <AviatorGame />
        </TabsContent>

        <TabsContent value="plinko">
          <PlinkoGame />
        </TabsContent>

        <TabsContent value="dice">
          <DiceGame />
        </TabsContent>
      </Tabs>
    </div>
  );
}
