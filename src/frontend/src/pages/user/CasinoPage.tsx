import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActor } from "@/hooks/useActor";
import { useStore } from "@/store/useStore";
import { Circle, Clock, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// Payout multiplier calculation for casino games
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
    // Number bet
    if (/^\d+$/.test(selectedBet)) {
      if (selectedBet === result) return stake * 35;
      return -stake;
    }
    // Color/even-odd bets
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

interface CasinoRound {
  id: bigint;
  game: string;
  status: string;
  startTime: bigint;
  result: string;
  totalPool: bigint;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string; label: string }> = {
    open: {
      color: "oklch(0.65 0.18 145)",
      bg: "oklch(0.65 0.18 145 / 0.15)",
      label: "Open",
    },
    betting: {
      color: "oklch(var(--saffron))",
      bg: "oklch(var(--saffron) / 0.15)",
      label: "Betting Open",
    },
    closed: {
      color: "oklch(0.55 0.01 265)",
      bg: "oklch(0.55 0.01 265 / 0.15)",
      label: "Closed",
    },
    settled: {
      color: "oklch(var(--back))",
      bg: "oklch(var(--back) / 0.15)",
      label: "Settled",
    },
  };
  const info = map[status] ?? map.open;
  return (
    <Badge
      variant="outline"
      className="text-xs font-semibold"
      style={{
        background: info.bg,
        color: info.color,
        borderColor: `${info.color}44`,
      }}
    >
      {info.label}
    </Badge>
  );
}

function CountdownTimer({
  startTime,
  status,
}: { startTime: bigint; status: string }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (status !== "betting") return;
    const startMs = Number(startTime) / 1_000_000;
    const endMs = startMs + 30_000;

    const tick = () => {
      const now = Date.now();
      const rem = Math.max(0, Math.ceil((endMs - now) / 1000));
      setRemaining(rem);
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [startTime, status]);

  if (status !== "betting") return null;

  return (
    <div className="flex items-center gap-1.5 text-saffron text-sm font-bold">
      <Clock className="w-4 h-4" />
      {remaining}s
    </div>
  );
}

// Roulette betting board
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
      {/* Outside bets */}
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
      {/* Number grid (0-36) */}
      <div className="grid grid-cols-[40px_repeat(12,_1fr)] gap-0.5 text-[10px]">
        {/* Zero */}
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

// Teen Patti betting
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

// Andar Bahar betting
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

interface GamePanelProps {
  game: string;
  displayName: string;
  icon: string;
}

function GamePanel({ game, displayName, icon }: GamePanelProps) {
  const { actor } = useActor();
  const currentUser = useStore((s) => s.currentUser);
  const addCasinoHistory = useStore((s) => s.addCasinoHistory);

  const [activeRound, setActiveRound] = useState<CasinoRound | null>(null);
  const [history, setHistory] = useState<CasinoRound[]>([]);
  const [stake, setStake] = useState(100);
  const [selectedBet, setSelectedBet] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval>>(null);
  // Track which round IDs we've already recorded history for
  const recordedRoundsRef = useRef<Set<string>>(new Set());
  // Track the bet for the current round before settlement
  const pendingBetRef = useRef<{ bet: string; stake: number } | null>(null);

  const fetchData = useCallback(async () => {
    if (!actor) return;
    try {
      const [rounds, hist] = await Promise.all([
        (
          actor as unknown as {
            getActiveCasinoRounds: () => Promise<CasinoRound[]>;
          }
        ).getActiveCasinoRounds(),
        (
          actor as unknown as {
            getCasinoRoundHistory: (g: string) => Promise<CasinoRound[]>;
          }
        ).getCasinoRoundHistory(game),
      ]);
      const forThisGame = rounds.filter((r) => r.game === game);
      const round = forThisGame[0] ?? null;

      // Check if a settled round has a pending bet to record
      if (
        round &&
        round.status === "settled" &&
        round.result &&
        pendingBetRef.current &&
        currentUser &&
        !recordedRoundsRef.current.has(String(round.id))
      ) {
        recordedRoundsRef.current.add(String(round.id));
        const { bet, stake: betStake } = pendingBetRef.current;
        const pnl = calculateCasinoPnl(game, bet, round.result, betStake);
        addCasinoHistory({
          userId: currentUser.id,
          game,
          roundId: String(round.id),
          bet,
          stake: betStake,
          result: round.result,
          pnl,
          placedAt: new Date().toISOString(),
        });
        pendingBetRef.current = null;
      }

      setActiveRound(round);
      setHistory(hist.slice(0, 10));
    } catch {
      // backend not connected yet — keep mock state
    } finally {
      setLoading(false);
    }
  }, [actor, game, currentUser, addCasinoHistory]);

  useEffect(() => {
    fetchData();
    pollRef.current = setInterval(fetchData, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchData]);

  const handleBetChoice = (choice: string) => {
    setSelectedBet(choice);
  };

  const handlePlaceBet = async () => {
    if (!actor || !activeRound || !selectedBet) return;
    if (!currentUser) return;
    if (stake <= 0) return toast.error("Enter a valid stake");

    setPlacing(true);
    try {
      const betData = selectedBet;
      await (
        actor as unknown as {
          placeCasinoBet: (
            id: bigint,
            amt: bigint,
            data: string,
          ) => Promise<bigint>;
        }
      ).placeCasinoBet(
        activeRound.id,
        BigInt(Math.round(stake * 100)),
        betData,
      );
      // Store pending bet so we can record history when round settles
      pendingBetRef.current = { bet: selectedBet, stake };
      toast.success(`Bet placed: ${selectedBet} @ ₹${stake}`, {
        description: `${displayName} — Round #${activeRound.id}`,
      });
      setSelectedBet(null);
      await fetchData();
    } catch {
      toast.error("Failed to place bet. Try again.");
    } finally {
      setPlacing(false);
    }
  };

  const canBet =
    activeRound &&
    (activeRound.status === "open" || activeRound.status === "betting");

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Round Status */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <div>
              <h3 className="font-bold text-foreground">{displayName}</h3>
              {activeRound ? (
                <p className="text-xs text-muted-foreground">
                  Round #{String(activeRound.id)}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">No active round</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeRound && (
              <CountdownTimer
                startTime={activeRound.startTime}
                status={activeRound.status}
              />
            )}
            {activeRound ? (
              <StatusBadge status={activeRound.status} />
            ) : (
              <Badge
                variant="outline"
                className="text-xs text-muted-foreground border-border"
              >
                Waiting
              </Badge>
            )}
          </div>
        </div>

        {!activeRound && !loading && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <RefreshCw className="w-6 h-6 mx-auto mb-2 opacity-40 animate-spin" />
            Next round starting soon...
          </div>
        )}

        {activeRound?.result && activeRound.status === "settled" && (
          <div
            className="mt-2 rounded-lg p-2 text-center text-sm font-bold"
            style={{
              background: "oklch(var(--gold) / 0.15)",
              color: "oklch(var(--gold))",
            }}
          >
            Result: {activeRound.result}
          </div>
        )}
      </div>

      {/* Betting Board */}
      {canBet && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-4"
          data-ocid={`casino.${game}.panel`}
        >
          <h4 className="font-semibold text-foreground mb-4 text-sm">
            Place Your Bet
          </h4>

          {game === "roulette" && (
            <RouletteBetting
              onBet={handleBetChoice}
              disabled={!canBet || placing}
            />
          )}
          {game === "teenpatti" && (
            <TeenPattiBetting
              onBet={handleBetChoice}
              disabled={!canBet || placing}
            />
          )}
          {game === "andarbhar" && (
            <AndarBaharBetting
              onBet={handleBetChoice}
              disabled={!canBet || placing}
            />
          )}

          {selectedBet && (
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
                className="bg-input border-border h-9 font-mono text-sm flex-1"
                data-ocid={`casino.${game}.stake_input`}
              />
              <Button
                onClick={handlePlaceBet}
                disabled={!selectedBet || placing || stake <= 0}
                className="font-bold text-background h-9 px-4 shrink-0"
                style={{
                  background:
                    selectedBet && !placing
                      ? "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))"
                      : undefined,
                }}
                data-ocid={`casino.${game}.place_bet_button`}
              >
                {placing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Place Bet"
                )}
              </Button>
            </div>
            {/* Quick stakes */}
            <div className="flex gap-1.5">
              {[100, 500, 1000, 5000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setStake(amt)}
                  className="flex-1 text-xs py-1 rounded border border-border text-muted-foreground hover:text-foreground hover:border-gold/50 transition-all"
                >
                  ₹{amt >= 1000 ? `${amt / 1000}k` : amt}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Round History */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h4 className="font-semibold text-foreground mb-3 text-sm">
          Recent Results
        </h4>
        {history.length === 0 ? (
          <div
            className="text-center py-6 text-muted-foreground text-sm"
            data-ocid={`casino.${game}.history_empty_state`}
          >
            <Circle className="w-6 h-6 mx-auto mb-2 opacity-30" />
            No results yet
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((round, i) => (
              <div
                key={String(round.id)}
                data-ocid={`casino.${game}.history_item.${i + 1}`}
                className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 text-sm"
              >
                <span className="text-muted-foreground">
                  Round #{String(round.id)}
                </span>
                <span className="font-bold text-gold">
                  {round.result || "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

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
          Live
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
