import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActor } from "@/hooks/useActor";
import { Circle, Dices, Play, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface CasinoRound {
  id: bigint;
  game: string;
  status: string;
  startTime: bigint;
  result: string;
  totalPool: bigint;
}

const GAME_OPTIONS = [
  { value: "roulette", label: "European Roulette", icon: "🎰" },
  { value: "teenpatti", label: "Teen Patti", icon: "🃏" },
  { value: "andarbhar", label: "Andar Bahar", icon: "🎴" },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    open: { color: "oklch(0.65 0.18 145)", bg: "oklch(0.65 0.18 145 / 0.15)" },
    betting: {
      color: "oklch(var(--saffron))",
      bg: "oklch(var(--saffron) / 0.15)",
    },
    closed: {
      color: "oklch(0.55 0.01 265)",
      bg: "oklch(0.55 0.01 265 / 0.15)",
    },
    settled: { color: "oklch(var(--back))", bg: "oklch(var(--back) / 0.15)" },
  };
  const info = map[status] ?? map.open;
  return (
    <Badge
      variant="outline"
      className="text-xs capitalize"
      style={{
        background: info.bg,
        color: info.color,
        borderColor: `${info.color}44`,
      }}
    >
      {status}
    </Badge>
  );
}

export function AdminCasinoPage() {
  const { actor } = useActor();
  const [rounds, setRounds] = useState<CasinoRound[]>([]);
  const [selectedGame, setSelectedGame] = useState("roulette");
  const [settleResult, setSettleResult] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval>>(null);

  const fetchRounds = useCallback(async () => {
    if (!actor) return;
    try {
      const data = await (
        actor as unknown as {
          getActiveCasinoRounds: () => Promise<CasinoRound[]>;
        }
      ).getActiveCasinoRounds();
      setRounds(data);
    } catch {
      // not connected
    }
  }, [actor]);

  useEffect(() => {
    fetchRounds();
    pollRef.current = setInterval(fetchRounds, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchRounds]);

  const handleStartRound = async () => {
    if (!actor) return toast.error("Backend not connected");
    setLoading(true);
    try {
      const roundId = await (
        actor as unknown as { startCasinoRound: (g: string) => Promise<bigint> }
      ).startCasinoRound(selectedGame);
      toast.success(`Round #${roundId} created for ${selectedGame}`);
      // Open betting
      await (
        actor as unknown as { openCasinoBetting: (id: bigint) => Promise<void> }
      ).openCasinoBetting(roundId);
      toast.success(`Betting opened for Round #${roundId}`);
      await fetchRounds();
    } catch {
      toast.error("Failed to start round. Backend may not be connected.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseBetting = async (roundId: bigint) => {
    if (!actor) return toast.error("Backend not connected");
    try {
      await (
        actor as unknown as {
          closeCasinoBetting: (id: bigint) => Promise<void>;
        }
      ).closeCasinoBetting(roundId);
      toast.success(`Betting closed for Round #${roundId}`);
      await fetchRounds();
    } catch {
      toast.error("Failed to close betting.");
    }
  };

  const handleSettleRound = async (roundId: bigint) => {
    if (!actor) return toast.error("Backend not connected");
    const result = settleResult[String(roundId)];
    if (!result?.trim()) return toast.error("Enter a result first");
    try {
      await (
        actor as unknown as {
          settleCasinoRound: (id: bigint, result: string) => Promise<void>;
        }
      ).settleCasinoRound(roundId, result);
      toast.success(`Round #${roundId} settled with result: ${result}`);
      setSettleResult((prev) => ({ ...prev, [String(roundId)]: "" }));
      await fetchRounds();
    } catch {
      toast.error("Failed to settle round.");
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <Dices className="w-5 h-5 text-gold" />
        <h1 className="text-lg font-bold text-foreground">Casino Control</h1>
      </div>

      {/* Start New Round */}
      <div className="rounded-xl border border-border bg-card p-5 mb-5">
        <h2 className="font-semibold text-foreground mb-4 text-sm">
          Start New Round
        </h2>
        <div className="flex gap-3 items-end">
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Game</Label>
            <Select value={selectedGame} onValueChange={setSelectedGame}>
              <SelectTrigger className="bg-input border-border h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {GAME_OPTIONS.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.icon} {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleStartRound}
            disabled={loading}
            className="font-bold text-background h-9 px-5"
            style={{
              background:
                "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
            }}
            data-ocid="admin.casino.start_round_button"
          >
            <Play className="w-4 h-4 mr-1.5" />
            {loading ? "Starting..." : "Start Round"}
          </Button>
        </div>
      </div>

      {/* Active Rounds */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/30">
          <h2 className="font-semibold text-foreground text-sm">
            Active Rounds ({rounds.length})
          </h2>
        </div>

        {rounds.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-12"
            data-ocid="admin.casino.empty_state"
          >
            <Circle className="w-10 h-10 text-muted-foreground/30 mb-2" />
            <p className="text-muted-foreground text-sm">No active rounds</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {rounds.map((round, i) => (
              <div
                key={String(round.id)}
                data-ocid={`admin.casino.round_item.${i + 1}`}
                className="p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      {GAME_OPTIONS.find((g) => g.value === round.game)?.icon}{" "}
                      {GAME_OPTIONS.find((g) => g.value === round.game)?.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Round #{String(round.id)} · Pool: ₹
                      {(Number(round.totalPool) / 100).toFixed(2)}
                    </p>
                  </div>
                  <StatusBadge status={round.status} />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {round.status === "open" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCloseBetting(round.id)}
                      className="h-7 text-xs border-border text-muted-foreground hover:text-foreground"
                      data-ocid={`admin.casino.close_betting_button.${i + 1}`}
                    >
                      <Square className="w-3 h-3 mr-1" />
                      Close Betting
                    </Button>
                  )}

                  {(round.status === "closed" || round.status === "open") && (
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Enter result..."
                        value={settleResult[String(round.id)] ?? ""}
                        onChange={(e) =>
                          setSettleResult((prev) => ({
                            ...prev,
                            [String(round.id)]: e.target.value,
                          }))
                        }
                        className="bg-input border-border h-7 text-xs w-36"
                        data-ocid={`admin.casino.result_input.${i + 1}`}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSettleRound(round.id)}
                        className="h-7 text-xs font-bold text-background"
                        style={{ background: "oklch(0.65 0.18 145)" }}
                        data-ocid={`admin.casino.settle_button.${i + 1}`}
                      >
                        Settle
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
