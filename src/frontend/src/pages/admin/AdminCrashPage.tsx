import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActor } from "@/hooks/useActor";
import { Circle, Play, Rocket, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface CrashRound {
  id: bigint;
  crashPoint: bigint;
  status: string;
  startTime: bigint;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    waiting: { color: "oklch(var(--gold))", bg: "oklch(var(--gold) / 0.15)" },
    running: {
      color: "oklch(0.65 0.18 145)",
      bg: "oklch(0.65 0.18 145 / 0.15)",
    },
    crashed: { color: "oklch(var(--lay))", bg: "oklch(var(--lay) / 0.15)" },
  };
  const info = map[status] ?? map.waiting;
  return (
    <Badge
      variant="outline"
      className="text-xs capitalize font-semibold"
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

export function AdminCrashPage() {
  const { actor } = useActor();
  const [currentRound, setCurrentRound] = useState<CrashRound | null>(null);
  const [history, setHistory] = useState<CrashRound[]>([]);
  const [crashPointInput, setCrashPointInput] = useState("2.00");
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval>>(null);

  const fetchData = useCallback(async () => {
    if (!actor) return;
    try {
      const result = await (
        actor as unknown as {
          getActiveCrashRound: () => Promise<[] | [CrashRound]>;
        }
      ).getActiveCrashRound();
      const round =
        Array.isArray(result) && result.length > 0 ? result[0] : null;
      setCurrentRound(round ?? null);

      const hist = await (
        actor as unknown as {
          getCrashRoundHistory: () => Promise<CrashRound[]>;
        }
      ).getCrashRoundHistory();
      setHistory(hist.slice(0, 20));
    } catch {
      // not connected
    }
  }, [actor]);

  useEffect(() => {
    fetchData();
    pollRef.current = setInterval(fetchData, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchData]);

  const handleStartRound = async () => {
    if (!actor) return toast.error("Backend not connected");
    setLoading(true);
    try {
      const roundId = await (
        actor as unknown as { startCrashRound: () => Promise<bigint> }
      ).startCrashRound();
      toast.success(`Crash round #${roundId} created`);
      await fetchData();
    } catch {
      toast.error("Failed to start round. Backend may not be connected.");
    } finally {
      setLoading(false);
    }
  };

  const handleRunRound = async () => {
    if (!actor || !currentRound) return;
    setLoading(true);
    try {
      await (
        actor as unknown as { runCrashRound: (id: bigint) => Promise<void> }
      ).runCrashRound(currentRound.id);
      toast.success(`Round #${currentRound.id} is now running!`);
      await fetchData();
    } catch {
      toast.error("Failed to run round.");
    } finally {
      setLoading(false);
    }
  };

  const handleCrashRound = async () => {
    if (!actor || !currentRound) return;
    const crashPoint = Number.parseFloat(crashPointInput);
    if (Number.isNaN(crashPoint) || crashPoint < 1.01) {
      return toast.error("Enter a valid crash point (≥ 1.01)");
    }
    setLoading(true);
    try {
      await (
        actor as unknown as {
          crashRound: (id: bigint, point: bigint) => Promise<void>;
        }
      ).crashRound(currentRound.id, BigInt(Math.round(crashPoint * 100)));
      toast.success(`Round crashed at ${crashPoint}x`);
      await fetchData();
    } catch {
      toast.error("Failed to crash round.");
    } finally {
      setLoading(false);
    }
  };

  const getHistoryColor = (crashPoint: bigint) => {
    const val = Number(crashPoint) / 100;
    if (val < 2)
      return { color: "oklch(0.60 0.22 20)", bg: "oklch(0.60 0.22 20 / 0.15)" };
    if (val < 5)
      return { color: "oklch(var(--gold))", bg: "oklch(var(--gold) / 0.15)" };
    return { color: "oklch(0.65 0.18 145)", bg: "oklch(0.65 0.18 145 / 0.15)" };
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <Rocket className="w-5 h-5 text-gold" />
        <h1 className="text-lg font-bold text-foreground">Crash Control</h1>
      </div>

      {/* Current Round Status */}
      <div className="rounded-xl border border-border bg-card p-5 mb-4">
        <h2 className="font-semibold text-foreground mb-4 text-sm">
          Current Round
        </h2>

        {currentRound ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Round #{String(currentRound.id)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Crash Point:{" "}
                  {currentRound.status === "crashed"
                    ? `${(Number(currentRound.crashPoint) / 100).toFixed(2)}x`
                    : "TBD"}
                </p>
              </div>
              <StatusBadge status={currentRound.status} />
            </div>

            <div className="flex flex-wrap gap-2">
              {currentRound.status === "waiting" && (
                <Button
                  onClick={handleRunRound}
                  disabled={loading}
                  className="font-bold text-background h-9 px-4"
                  style={{ background: "oklch(0.65 0.18 145)" }}
                  data-ocid="admin.crash.run_round_button"
                >
                  <Zap className="w-4 h-4 mr-1.5" />
                  {loading ? "Running..." : "Run Round"}
                </Button>
              )}

              {currentRound.status === "running" && (
                <div className="flex items-center gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Crash Point (x)
                    </Label>
                    <Input
                      type="number"
                      min={1.01}
                      step={0.1}
                      value={crashPointInput}
                      onChange={(e) => setCrashPointInput(e.target.value)}
                      className="bg-input border-border h-8 text-xs w-28 font-mono"
                      data-ocid="admin.crash.crash_point_input"
                    />
                  </div>
                  <Button
                    onClick={handleCrashRound}
                    disabled={loading}
                    className="font-bold text-white h-9 px-4 mt-5"
                    style={{ background: "oklch(var(--destructive))" }}
                    data-ocid="admin.crash.crash_button"
                  >
                    💥 {loading ? "Crashing..." : "Crash Now"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground text-sm mb-4">
              No active round
            </p>
            <Button
              onClick={handleStartRound}
              disabled={loading}
              className="font-bold text-background"
              style={{
                background:
                  "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
              }}
              data-ocid="admin.crash.start_round_button"
            >
              <Play className="w-4 h-4 mr-1.5" />
              {loading ? "Starting..." : "Start New Round"}
            </Button>
          </div>
        )}
      </div>

      {/* Start New Round (when current round is settled/crashed) */}
      {currentRound && currentRound.status === "crashed" && (
        <div className="rounded-xl border border-border bg-card p-4 mb-4">
          <Button
            onClick={handleStartRound}
            disabled={loading}
            className="font-bold text-background"
            style={{
              background:
                "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
            }}
            data-ocid="admin.crash.new_round_button"
          >
            <Play className="w-4 h-4 mr-1.5" />
            Start Next Round
          </Button>
        </div>
      )}

      {/* Round History */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/30">
          <h2 className="font-semibold text-foreground text-sm">
            Round History ({history.length})
          </h2>
        </div>

        {history.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-12"
            data-ocid="admin.crash.history_empty_state"
          >
            <Circle className="w-10 h-10 text-muted-foreground/30 mb-2" />
            <p className="text-muted-foreground text-sm">No rounds yet</p>
          </div>
        ) : (
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {history.map((round, i) => {
                const { color, bg } = getHistoryColor(round.crashPoint);
                return (
                  <div
                    key={String(round.id)}
                    data-ocid={`admin.crash.history_item.${i + 1}`}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold font-mono"
                    style={{ background: bg, color }}
                  >
                    {(Number(round.crashPoint) / 100).toFixed(2)}x
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
