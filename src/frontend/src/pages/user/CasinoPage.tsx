import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/store/useStore";
import { Circle, Clock } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Payout calculation ──────────────────────────────────────────────────────

function calculateCasinoPnl(
  game: string,
  selectedBet: string,
  result: string,
  stake: number,
): number {
  const redNums = new Set([
    1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
  ]);

  if (game === "roulette") {
    const resultNum = Number.parseInt(result, 10);
    if (/^\d+$/.test(selectedBet)) {
      if (selectedBet === result) return stake * 35;
      return -stake;
    }
    const isRed = !Number.isNaN(resultNum) && redNums.has(resultNum);
    const isEven =
      !Number.isNaN(resultNum) && resultNum !== 0 && resultNum % 2 === 0;
    if (selectedBet === "red" && isRed) return stake;
    if (selectedBet === "black" && !isRed && resultNum !== 0) return stake;
    if (selectedBet === "even" && isEven) return stake;
    if (selectedBet === "odd" && !isEven && resultNum !== 0) return stake;
    return -stake;
  }

  if (game === "teenpatti") {
    if (selectedBet === result) return stake * 1.8;
    return -stake;
  }

  if (game === "andarbhar" || game === "andarbahar") {
    if (selectedBet === result && selectedBet === "andar") return stake * 0.9;
    if (selectedBet === result && selectedBet === "bahar") return stake;
    return -stake;
  }

  return -stake;
}

// Generate random result for a game
function generateResult(game: string): string {
  if (game === "roulette") {
    return String(Math.floor(Math.random() * 37)); // 0-36
  }
  if (game === "teenpatti") {
    const outcomes = ["player_a", "tie", "player_b"];
    return outcomes[Math.floor(Math.random() * outcomes.length)];
  }
  if (game === "andarbhar") {
    return Math.random() < 0.5 ? "andar" : "bahar";
  }
  return "";
}

// ─── Phase constants ─────────────────────────────────────────────────────────

type RoundPhase = "betting" | "closed" | "result" | "wait";

const PHASE_DURATIONS: Record<RoundPhase, number> = {
  betting: 15, // seconds — user can bet
  closed: 1, // seconds — bets locked, generating result
  result: 4, // seconds — show result
  wait: 2, // seconds — pause before next round
};

// ─── Local auto-loop hook ────────────────────────────────────────────────────

interface LocalRoundState {
  phase: RoundPhase;
  countdown: number; // seconds remaining in current phase
  result: string | null; // set during result phase
  roundId: number;
}

function useLocalCasinoLoop(game: string) {
  const [state, setState] = useState<LocalRoundState>({
    phase: "betting",
    countdown: PHASE_DURATIONS.betting,
    result: null,
    roundId: 1,
  });

  // Store pending bet so we can settle it when result arrives
  const pendingBetRef = useRef<{ bet: string; stake: number } | null>(null);
  const roundResultRef = useRef<string | null>(null);

  const { currentUser, creditUserBalance, debitUserBalance, addCasinoHistory } =
    useStore();

  // Tick every second
  useEffect(() => {
    const id = setInterval(() => {
      setState((prev) => {
        const newCountdown = prev.countdown - 1;

        if (newCountdown > 0) {
          return { ...prev, countdown: newCountdown };
        }

        // Phase ended — advance to next phase
        const phases: RoundPhase[] = ["betting", "closed", "result", "wait"];
        const currentIdx = phases.indexOf(prev.phase);
        const nextPhase = phases[(currentIdx + 1) % phases.length];

        let newResult = prev.result;
        let newRoundId = prev.roundId;

        if (prev.phase === "closed") {
          // Generate result now (transition from closed → result)
          newResult = generateResult(game);
          roundResultRef.current = newResult;
        }

        if (nextPhase === "betting") {
          // New round starting
          newResult = null;
          roundResultRef.current = null;
          pendingBetRef.current = null;
          newRoundId = prev.roundId + 1;
        }

        return {
          phase: nextPhase,
          countdown: PHASE_DURATIONS[nextPhase],
          result: newResult,
          roundId: newRoundId,
        };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [game]);

  // Settle bets when result phase starts
  useEffect(() => {
    if (
      state.phase === "result" &&
      state.result &&
      pendingBetRef.current &&
      currentUser
    ) {
      const { bet, stake } = pendingBetRef.current;
      const pnl = calculateCasinoPnl(game, bet, state.result, stake);

      if (pnl > 0) {
        creditUserBalance(currentUser.id, pnl);
        toast.success(`🎉 You won ₹${pnl.toFixed(2)}!`, {
          description: `Result: ${state.result}`,
        });
      } else {
        debitUserBalance(currentUser.id, Math.abs(pnl));
        toast.error(`Lost ₹${Math.abs(pnl).toFixed(2)}`, {
          description: `Result: ${state.result}`,
        });
      }

      addCasinoHistory({
        userId: currentUser.id,
        game,
        roundId: String(state.roundId),
        bet,
        stake,
        result: state.result,
        pnl,
        placedAt: new Date().toISOString(),
      });

      // Clear pending bet after settlement
      pendingBetRef.current = null;
    }
  }, [
    state.phase,
    state.result,
    state.roundId,
    game,
    currentUser,
    creditUserBalance,
    debitUserBalance,
    addCasinoHistory,
  ]);

  const placeBet = useCallback(
    (bet: string, stake: number) => {
      if (state.phase !== "betting") {
        toast.error("Betting is closed for this round");
        return false;
      }
      if (!currentUser) {
        toast.error("Please login first");
        return false;
      }
      if (currentUser.balance < stake) {
        toast.error("Insufficient balance");
        return false;
      }
      // Debit stake immediately (will be credited back + winnings on settlement)
      debitUserBalance(currentUser.id, stake);
      pendingBetRef.current = { bet, stake };
      toast.success(`Bet placed: ${bet} @ ₹${stake}`, {
        description: "Waiting for round to close...",
      });
      return true;
    },
    [state.phase, currentUser, debitUserBalance],
  );

  const hasPendingBet = !!pendingBetRef.current;

  return { state, placeBet, hasPendingBet };
}

// ─── Status badge ────────────────────────────────────────────────────────────

function PhaseBadge({ phase }: { phase: RoundPhase }) {
  const map: Record<
    RoundPhase,
    { color: string; bg: string; label: string; dot: boolean }
  > = {
    betting: {
      color: "oklch(var(--saffron))",
      bg: "oklch(var(--saffron) / 0.15)",
      label: "BETTING OPEN",
      dot: true,
    },
    closed: {
      color: "oklch(0.55 0.01 265)",
      bg: "oklch(0.55 0.01 265 / 0.15)",
      label: "CLOSED",
      dot: false,
    },
    result: {
      color: "oklch(var(--gold))",
      bg: "oklch(var(--gold) / 0.15)",
      label: "RESULT",
      dot: false,
    },
    wait: {
      color: "oklch(0.55 0.01 265)",
      bg: "oklch(0.55 0.01 265 / 0.15)",
      label: "NEXT ROUND",
      dot: false,
    },
  };
  const info = map[phase];
  return (
    <Badge
      variant="outline"
      className="text-xs font-bold flex items-center gap-1.5"
      style={{
        background: info.bg,
        color: info.color,
        borderColor: `${info.color}55`,
      }}
    >
      {info.dot && (
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse inline-block"
          style={{ background: info.color }}
        />
      )}
      {info.label}
    </Badge>
  );
}

// ─── Countdown ring ──────────────────────────────────────────────────────────

function CountdownRing({ seconds, total }: { seconds: number; total: number }) {
  const r = 16;
  const circumference = 2 * Math.PI * r;
  const progress = seconds / total;
  const strokeDashoffset = circumference * (1 - progress);
  return (
    <svg
      width="44"
      height="44"
      className="rotate-[-90deg]"
      aria-label={`${seconds} seconds remaining`}
      role="img"
    >
      <title>{seconds} seconds remaining</title>
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke="oklch(var(--border))"
        strokeWidth="3"
      />
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke="oklch(var(--saffron))"
        strokeWidth="3"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.9s linear" }}
      />
      <text
        x="22"
        y="22"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="10"
        fontWeight="bold"
        fill="oklch(var(--saffron))"
        style={{ transform: "rotate(90deg)", transformOrigin: "22px 22px" }}
      >
        {seconds}
      </text>
    </svg>
  );
}

// ─── Countdown display ───────────────────────────────────────────────────────

function PhaseCountdown({
  phase,
  countdown,
}: {
  phase: RoundPhase;
  countdown: number;
}) {
  if (phase === "betting") {
    return (
      <CountdownRing seconds={countdown} total={PHASE_DURATIONS.betting} />
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
      <Clock className="w-3.5 h-3.5" />
      <span>{countdown}s</span>
    </div>
  );
}

// ─── Round locked overlay ────────────────────────────────────────────────────

function LockedOverlay({
  phase,
  countdown,
  result,
}: {
  phase: RoundPhase;
  countdown: number;
  result: string | null;
}) {
  if (phase === "betting") return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 rounded-xl flex flex-col items-center justify-center z-10"
      style={{
        background: "oklch(var(--card) / 0.95)",
        backdropFilter: "blur(4px)",
      }}
    >
      {phase === "closed" && (
        <div className="text-center">
          <div className="text-4xl mb-3 animate-spin">⏳</div>
          <p className="text-lg font-bold text-foreground">Round Closed</p>
          <p className="text-sm text-muted-foreground mt-1">
            Generating result…
          </p>
        </div>
      )}

      {phase === "result" && result && (
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.4 }}
            className="text-5xl mb-3"
          >
            🎯
          </motion.div>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Result
          </p>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-2xl font-black"
            style={{ color: "oklch(var(--gold))" }}
          >
            {result}
          </motion.p>
          <p className="text-xs text-muted-foreground mt-3">
            Next round in {countdown}s
          </p>
        </div>
      )}

      {phase === "wait" && (
        <div className="text-center">
          <div className="text-4xl mb-3">🔄</div>
          <p className="text-lg font-bold text-foreground">Next Round</p>
          <p
            className="text-sm font-mono font-bold mt-1"
            style={{ color: "oklch(var(--saffron))" }}
          >
            Starting in {countdown}s
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ─── Roulette betting board ──────────────────────────────────────────────────

function RouletteBetting({
  onBet,
  disabled,
}: {
  onBet: (choice: string) => void;
  disabled: boolean;
}) {
  const numbers = Array.from({ length: 37 }, (_, i) => i);
  const redNums = new Set([
    1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
  ]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { label: "Red", value: "red", color: "oklch(0.60 0.22 20)" },
          { label: "Black", value: "black", color: "oklch(0.25 0.01 265)" },
          { label: "Even", value: "even", color: "oklch(0.55 0.18 240)" },
          { label: "Odd", value: "odd", color: "oklch(var(--gold))" },
        ].map((btn) => (
          <button
            key={btn.value}
            type="button"
            disabled={disabled}
            onClick={() => onBet(btn.value)}
            className="py-2 rounded-lg text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:brightness-110 active:scale-95"
            style={{ background: btn.color }}
            data-ocid={`casino.roulette.${btn.value}_button`}
          >
            {btn.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-[40px_repeat(12,_1fr)] gap-0.5 text-[10px]">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onBet("0")}
          className="col-span-1 row-span-3 rounded flex items-center justify-center font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:brightness-110"
          style={{ background: "oklch(0.45 0.18 145)" }}
        >
          0
        </button>
        {numbers.slice(1).map((n) => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onBet(String(n))}
            className="rounded py-1 font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:brightness-110"
            style={{
              background: redNums.has(n)
                ? "oklch(0.58 0.22 20)"
                : "oklch(0.20 0.01 265)",
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Teen Patti betting ──────────────────────────────────────────────────────

function TeenPattiBetting({
  onBet,
  disabled,
}: {
  onBet: (choice: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        {
          label: "Player A",
          value: "player_a",
          icon: "🅰️",
          color: "oklch(var(--back))",
        },
        { label: "Tie", value: "tie", icon: "🤝", color: "oklch(var(--gold))" },
        {
          label: "Player B",
          value: "player_b",
          icon: "🅱️",
          color: "oklch(var(--lay))",
        },
      ].map((btn) => (
        <button
          key={btn.value}
          type="button"
          disabled={disabled}
          onClick={() => onBet(btn.value)}
          className="p-4 rounded-xl border-2 text-center font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:brightness-110 active:scale-95"
          style={{
            borderColor: btn.color,
            background: `${btn.color}15`,
            color: btn.color,
          }}
          data-ocid={`casino.teenpatti.${btn.value}_button`}
        >
          <div className="text-2xl mb-1">{btn.icon}</div>
          {btn.label}
        </button>
      ))}
    </div>
  );
}

// ─── Andar Bahar betting ─────────────────────────────────────────────────────

function AndarBaharBetting({
  onBet,
  disabled,
}: {
  onBet: (choice: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[
        {
          label: "Andar (Inside)",
          value: "andar",
          icon: "⬅️",
          color: "oklch(var(--back))",
          desc: "Pays 1.9x",
        },
        {
          label: "Bahar (Outside)",
          value: "bahar",
          icon: "➡️",
          color: "oklch(var(--saffron))",
          desc: "Pays 2x",
        },
      ].map((btn) => (
        <button
          key={btn.value}
          type="button"
          disabled={disabled}
          onClick={() => onBet(btn.value)}
          className="p-5 rounded-xl border-2 text-center font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:brightness-110 active:scale-95"
          style={{
            borderColor: btn.color,
            background: `${btn.color}15`,
            color: btn.color,
          }}
          data-ocid={`casino.andarbahar.${btn.value}_button`}
        >
          <div className="text-3xl mb-2">{btn.icon}</div>
          <div className="text-sm">{btn.label}</div>
          <div className="text-xs mt-1 opacity-70">{btn.desc}</div>
        </button>
      ))}
    </div>
  );
}

// ─── Round history (local) ───────────────────────────────────────────────────

interface LocalHistoryEntry {
  roundId: number;
  result: string;
}

// ─── Game Panel ──────────────────────────────────────────────────────────────

interface GamePanelProps {
  game: string;
  displayName: string;
  icon: string;
}

function GamePanel({ game, displayName, icon }: GamePanelProps) {
  const { state, placeBet, hasPendingBet } = useLocalCasinoLoop(game);
  const [stake, setStake] = useState(100);
  const [selectedBet, setSelectedBet] = useState<string | null>(null);
  const [localHistory, setLocalHistory] = useState<LocalHistoryEntry[]>([]);

  // Collect results into local history when result phase starts
  useEffect(() => {
    if (state.phase === "result" && state.result) {
      setLocalHistory((prev) => [
        { roundId: state.roundId, result: state.result! },
        ...prev.slice(0, 9),
      ]);
    }
  }, [state.phase, state.result, state.roundId]);

  // Clear selected bet when round closes
  useEffect(() => {
    if (state.phase !== "betting") {
      setSelectedBet(null);
    }
  }, [state.phase]);

  const handleBetChoice = (choice: string) => {
    if (state.phase !== "betting") return;
    setSelectedBet(choice);
  };

  const handlePlaceBet = () => {
    if (!selectedBet) return;
    const success = placeBet(selectedBet, stake);
    if (success) setSelectedBet(null);
  };

  const canBet = state.phase === "betting" && !hasPendingBet;
  const bettingDisabled = !canBet;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Round Status header */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <div>
              <h3 className="font-bold text-foreground">{displayName}</h3>
              <p className="text-xs text-muted-foreground">
                Round #{state.roundId}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PhaseCountdown phase={state.phase} countdown={state.countdown} />
            <PhaseBadge phase={state.phase} />
          </div>
        </div>

        {/* Betting window progress bar */}
        {state.phase === "betting" && (
          <div className="mt-3">
            <div className="h-1.5 rounded-full overflow-hidden bg-secondary">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, oklch(var(--saffron)), oklch(var(--gold)))",
                }}
                initial={{ width: "100%" }}
                animate={{
                  width: `${(state.countdown / PHASE_DURATIONS.betting) * 100}%`,
                }}
                transition={{ duration: 0.9, ease: "linear" }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {hasPendingBet
                ? "✅ Bet placed — waiting for result"
                : "Betting window open"}
            </p>
          </div>
        )}
      </div>

      {/* Betting board — with locked overlay during closed/result/wait */}
      <div
        className="relative rounded-xl border border-border bg-card p-4"
        data-ocid={`casino.${game}.panel`}
      >
        <AnimatePresence>
          <LockedOverlay
            phase={state.phase}
            countdown={state.countdown}
            result={state.result}
          />
        </AnimatePresence>

        <h4 className="font-semibold text-foreground mb-4 text-sm">
          Place Your Bet
        </h4>

        {game === "roulette" && (
          <RouletteBetting onBet={handleBetChoice} disabled={bettingDisabled} />
        )}
        {game === "teenpatti" && (
          <TeenPattiBetting
            onBet={handleBetChoice}
            disabled={bettingDisabled}
          />
        )}
        {game === "andarbhar" && (
          <AndarBaharBetting
            onBet={handleBetChoice}
            disabled={bettingDisabled}
          />
        )}

        {selectedBet && state.phase === "betting" && (
          <div className="mt-4 p-3 rounded-lg border border-gold/30 bg-gold/10">
            <p className="text-xs text-muted-foreground">
              Selected:{" "}
              <span className="text-gold font-bold">{selectedBet}</span>
            </p>
          </div>
        )}

        {/* Stake input */}
        <div className="mt-4 space-y-2">
          <Label className="text-xs text-muted-foreground">Stake (₹)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min={1}
              value={stake}
              onChange={(e) => setStake(Number(e.target.value) || 0)}
              disabled={bettingDisabled || hasPendingBet}
              className="bg-input border-border h-9 font-mono text-sm flex-1"
              data-ocid={`casino.${game}.stake_input`}
            />
            <Button
              onClick={handlePlaceBet}
              disabled={
                !selectedBet || bettingDisabled || hasPendingBet || stake <= 0
              }
              className="font-bold text-background h-9 px-4 shrink-0"
              style={{
                background:
                  selectedBet && canBet && !hasPendingBet
                    ? "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))"
                    : undefined,
              }}
              data-ocid={`casino.${game}.place_bet_button`}
            >
              {hasPendingBet ? "Bet Placed ✓" : "Place Bet"}
            </Button>
          </div>
          <div className="flex gap-1.5">
            {[100, 500, 1000, 5000].map((amt) => (
              <button
                key={amt}
                type="button"
                disabled={bettingDisabled || hasPendingBet}
                onClick={() => setStake(amt)}
                className="flex-1 text-xs py-1 rounded border border-border text-muted-foreground hover:text-foreground hover:border-gold/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ₹{amt >= 1000 ? `${amt / 1000}k` : amt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Round History */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h4 className="font-semibold text-foreground mb-3 text-sm">
          Recent Results
        </h4>
        {localHistory.length === 0 ? (
          <div
            className="text-center py-6 text-muted-foreground text-sm"
            data-ocid={`casino.${game}.history_empty_state`}
          >
            <Circle className="w-6 h-6 mx-auto mb-2 opacity-30" />
            No results yet — first round in progress
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {localHistory.map((entry, i) => (
              <div
                key={entry.roundId}
                data-ocid={`casino.${game}.history_item.${i + 1}`}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border"
                style={{
                  background: "oklch(var(--gold) / 0.1)",
                  borderColor: "oklch(var(--gold) / 0.3)",
                  color: "oklch(var(--gold))",
                }}
              >
                #{entry.roundId} · {entry.result}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Casino Page ─────────────────────────────────────────────────────────────

export function CasinoPage() {
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-2xl">🎰</span>
        <h1 className="text-lg font-bold text-foreground">Live Casino</h1>
        <Badge
          variant="outline"
          className="text-xs"
          style={{
            background: "oklch(var(--saffron) / 0.15)",
            color: "oklch(var(--saffron))",
            borderColor: "oklch(var(--saffron) / 0.3)",
          }}
        >
          Auto-Live
        </Badge>
      </div>

      <Tabs defaultValue="roulette">
        <TabsList className="bg-secondary border border-border mb-5 h-10">
          <TabsTrigger
            value="roulette"
            className="text-sm"
            data-ocid="casino.roulette.tab"
          >
            🎰 Roulette
          </TabsTrigger>
          <TabsTrigger
            value="teenpatti"
            className="text-sm"
            data-ocid="casino.teenpatti.tab"
          >
            🃏 Teen Patti
          </TabsTrigger>
          <TabsTrigger
            value="andarbhar"
            className="text-sm"
            data-ocid="casino.andarbhar.tab"
          >
            🎴 Andar Bahar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roulette">
          <GamePanel
            game="roulette"
            displayName="European Roulette"
            icon="🎰"
          />
        </TabsContent>
        <TabsContent value="teenpatti">
          <GamePanel game="teenpatti" displayName="Teen Patti" icon="🃏" />
        </TabsContent>
        <TabsContent value="andarbhar">
          <GamePanel game="andarbhar" displayName="Andar Bahar" icon="🎴" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
