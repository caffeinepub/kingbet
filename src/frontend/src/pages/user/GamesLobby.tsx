import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useStore } from "@/store/useStore";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";

// ─── Shared helpers ──────────────────────────────────────────────────────────
const genId = () => Math.random().toString(36).slice(2, 9);

function WinOverlay({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
    >
      <div className="text-center">
        {Array.from({ length: 30 }, (_, i) => (
          <motion.div
            key={`confetti-${i}`}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background:
                i % 3 === 0
                  ? "oklch(0.80 0.18 85)"
                  : i % 3 === 1
                    ? "oklch(0.72 0.18 60)"
                    : "oklch(0.65 0.18 145)",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            initial={{ scale: 0, y: 0 }}
            animate={{ scale: [0, 1, 0], y: [-100, -200, -300] }}
            transition={{ duration: 1.5, delay: Math.random() * 0.5 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ─── GameShell ───────────────────────────────────────────────────────────────
function GameShell({
  children,
  title,
  icon,
  onBack,
}: { children: ReactNode; title: string; icon: string; onBack: () => void }) {
  const currentUser = useStore((s) => s.currentUser);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground text-sm px-2 py-1 rounded border border-border hover:border-gold/50 transition-all"
            data-ocid="games.back_button"
          >
            ← Back
          </button>
          <span className="font-bold text-foreground text-sm">
            {icon} {title}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-gold font-mono font-semibold text-sm">
          <span>₹</span>
          <span>
            {(currentUser?.balance ?? 0).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Stake Presets ───────────────────────────────────────────────────────────
function StakeInput({
  stake,
  setStake,
  disabled,
}: { stake: number; setStake: (v: number) => void; disabled?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">Stake (₹)</Label>
      <Input
        type="number"
        min={1}
        value={stake}
        onChange={(e) => setStake(Number(e.target.value) || 0)}
        disabled={disabled}
        className="bg-input border-border h-9 font-mono text-sm"
        data-ocid="game.stake_input"
      />
      <div className="flex gap-1.5">
        {[50, 100, 500, 1000].map((amt) => (
          <button
            key={amt}
            type="button"
            disabled={disabled}
            onClick={() => setStake(amt)}
            className="flex-1 text-xs py-1 rounded border border-border text-muted-foreground hover:text-foreground hover:border-gold/50 disabled:opacity-40 transition-all"
          >
            ₹{amt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── GAME: Mines ─────────────────────────────────────────────────────────────
function MinesGame({ onBack }: { onBack: () => void }) {
  const { currentUser, debitUserBalance, creditUserBalance, addCasinoHistory } =
    useStore();
  const [mineCount, setMineCount] = useState(3);
  const [stake, setStake] = useState(100);
  const [gameActive, setGameActive] = useState(false);
  const [grid, setGrid] = useState<Array<"hidden" | "gem" | "mine">>([]);
  const [minePositions, setMinePositions] = useState<Set<number>>(new Set());
  const [revealedCount, setRevealedCount] = useState(0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [showWin, setShowWin] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const calcMultiplier = (revealed: number, mines: number) => {
    const _safe = 25 - mines;
    if (revealed === 0) return 1;
    let mult = 1;
    for (let i = 0; i < revealed; i++) {
      mult *= (25 - mines - i) / (25 - i);
    }
    return Number.parseFloat((0.97 / mult).toFixed(2));
  };

  const startGame = () => {
    if (!currentUser) return toast.error("Please login");
    if (currentUser.balance < stake) return toast.error("Insufficient balance");
    if (stake <= 0) return toast.error("Enter valid stake");
    debitUserBalance(currentUser.id, stake);
    const mines = new Set<number>();
    while (mines.size < mineCount) mines.add(Math.floor(Math.random() * 25));
    setMinePositions(mines);
    setGrid(Array(25).fill("hidden"));
    setRevealedCount(0);
    setCurrentMultiplier(1);
    setGameActive(true);
    setGameOver(false);
    setShowWin(false);
  };

  const revealTile = (idx: number) => {
    if (!gameActive || grid[idx] !== "hidden") return;
    if (minePositions.has(idx)) {
      const newGrid = grid.map((v, i) =>
        minePositions.has(i) ? "mine" : v === "hidden" ? "hidden" : v,
      ) as typeof grid;
      newGrid[idx] = "mine";
      setGrid(newGrid);
      setGameActive(false);
      setGameOver(true);
      addCasinoHistory({
        userId: currentUser!.id,
        game: "mines",
        roundId: genId(),
        bet: `mines-${mineCount}`,
        stake,
        result: "mine",
        pnl: -stake,
        placedAt: new Date().toISOString(),
      });
      toast.error(`💣 Mine hit! Lost ₹${stake}`);
    } else {
      const newGrid = [...grid] as typeof grid;
      newGrid[idx] = "gem";
      const newRevealed = revealedCount + 1;
      const mult = calcMultiplier(newRevealed, mineCount);
      setGrid(newGrid);
      setRevealedCount(newRevealed);
      setCurrentMultiplier(mult);
    }
  };

  const cashOut = () => {
    if (!gameActive || !currentUser) return;
    const payout = Number.parseFloat((stake * currentMultiplier).toFixed(2));
    creditUserBalance(currentUser.id, payout);
    addCasinoHistory({
      userId: currentUser.id,
      game: "mines",
      roundId: genId(),
      bet: `${revealedCount}-gems`,
      stake,
      result: `${currentMultiplier}x`,
      pnl: payout - stake,
      placedAt: new Date().toISOString(),
    });
    setGameActive(false);
    setShowWin(true);
    setTimeout(() => setShowWin(false), 2000);
    toast.success(
      `💎 Cashed out ${currentMultiplier}x! +₹${(payout - stake).toFixed(2)}`,
    );
  };

  return (
    <GameShell title="Mines" icon="💣" onBack={onBack}>
      <AnimatePresence>
        {showWin && <WinOverlay show={showWin} />}
      </AnimatePresence>
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        {!gameActive && !gameOver && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Mines:{" "}
                <span className="text-foreground font-bold">{mineCount}</span>
              </Label>
              <Slider
                min={1}
                max={24}
                step={1}
                value={[mineCount]}
                onValueChange={([v]) => setMineCount(v)}
              />
            </div>
            <StakeInput stake={stake} setStake={setStake} />
            <Button
              onClick={startGame}
              className="w-full h-11 font-bold text-background"
              style={{
                background:
                  "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
              }}
              data-ocid="mines.start_button"
            >
              💣 Start Game
            </Button>
          </>
        )}
        {(gameActive || gameOver) && (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Multiplier</span>
              <span className="font-bold font-mono text-gold text-lg">
                {currentMultiplier}x
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {grid.map((tile, i) => (
                <motion.button
                  key={`minesweeper-${i}`}
                  type="button"
                  onClick={() => revealTile(i)}
                  whileTap={{ scale: 0.9 }}
                  disabled={!gameActive || tile !== "hidden"}
                  className="aspect-square rounded-lg flex items-center justify-center text-lg font-bold transition-all"
                  style={{
                    background:
                      tile === "gem"
                        ? "oklch(0.65 0.18 145 / 0.3)"
                        : tile === "mine"
                          ? "oklch(0.62 0.22 20 / 0.3)"
                          : "oklch(var(--secondary))",
                    border:
                      tile === "gem"
                        ? "1px solid oklch(0.65 0.18 145 / 0.5)"
                        : tile === "mine"
                          ? "1px solid oklch(0.62 0.22 20 / 0.5)"
                          : "1px solid oklch(var(--border))",
                  }}
                  data-ocid={`mines.tile.${i + 1}`}
                >
                  {tile === "gem" ? "💎" : tile === "mine" ? "💣" : ""}
                </motion.button>
              ))}
            </div>
            {gameActive && revealedCount > 0 && (
              <Button
                onClick={cashOut}
                className="w-full h-11 font-bold text-background"
                style={{ background: "oklch(0.65 0.18 145)" }}
                data-ocid="mines.cashout_button"
              >
                Cash Out {currentMultiplier}x — ₹
                {(stake * currentMultiplier).toFixed(2)}
              </Button>
            )}
            {!gameActive && (
              <Button
                onClick={startGame}
                className="w-full h-11 font-bold text-background"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
                }}
                data-ocid="mines.restart_button"
              >
                Play Again
              </Button>
            )}
          </>
        )}
      </div>
    </GameShell>
  );
}

// ─── GAME: Limbo ─────────────────────────────────────────────────────────────
function LimboGame({ onBack }: { onBack: () => void }) {
  const { currentUser, debitUserBalance, creditUserBalance, addCasinoHistory } =
    useStore();
  const [stake, setStake] = useState(100);
  const [target, setTarget] = useState(2.0);
  const [result, setResult] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [displayVal, setDisplayVal] = useState<number>(1.0);
  const [showWin, setShowWin] = useState(false);

  const winChance = Number.parseFloat((99 / target).toFixed(2));

  const roll = async () => {
    if (!currentUser) return toast.error("Please login");
    if (currentUser.balance < stake) return toast.error("Insufficient balance");
    if (stake <= 0) return toast.error("Enter valid stake");
    debitUserBalance(currentUser.id, stake);
    setRolling(true);
    setResult(null);
    setDisplayVal(1.0);

    // Animate counter ticking up rapidly from 1.00x
    const crashed = 99 / (Math.random() * 99);
    const actualResult = Number.parseFloat(Math.max(1.0, crashed).toFixed(2));
    const steps = 20;
    const stepDuration = 50; // ms per step
    for (let i = 1; i <= steps; i++) {
      await new Promise((r) => setTimeout(r, stepDuration));
      const progress = i / steps;
      setDisplayVal(
        Number.parseFloat((1.0 + (actualResult - 1.0) * progress).toFixed(2)),
      );
    }

    const won = actualResult >= target;
    const payout = won ? Number.parseFloat((stake * target).toFixed(2)) : 0;
    if (won) {
      creditUserBalance(currentUser.id, payout);
      setShowWin(true);
      setTimeout(() => setShowWin(false), 2000);
    }
    addCasinoHistory({
      userId: currentUser.id,
      game: "limbo",
      roundId: genId(),
      bet: `${target}x`,
      stake,
      result: `${actualResult}x`,
      pnl: won ? payout - stake : -stake,
      placedAt: new Date().toISOString(),
    });
    setResult(actualResult);
    setRolling(false);
    if (won)
      toast.success(
        `🚀 Won! ${actualResult}x >= ${target}x! +₹${(payout - stake).toFixed(2)}`,
      );
    else toast.error(`Lost! ${actualResult}x < ${target}x`);
  };

  const displayColor =
    result === null
      ? rolling
        ? "oklch(var(--gold))"
        : "oklch(var(--muted-foreground))"
      : result >= target
        ? "oklch(0.65 0.18 145)"
        : "oklch(0.62 0.22 20)";

  return (
    <GameShell title="Limbo" icon="📈" onBack={onBack}>
      <AnimatePresence>
        {showWin && <WinOverlay show={showWin} />}
      </AnimatePresence>
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={rolling ? "rolling" : String(result)}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.3 }}
              className="text-6xl font-bold font-mono"
              style={{ color: displayColor }}
            >
              {rolling
                ? `${displayVal.toFixed(2)}x`
                : result !== null
                  ? `${result}x`
                  : "—"}
            </motion.div>
          </AnimatePresence>
          <p className="text-xs text-muted-foreground mt-1">
            Win Chance: {winChance.toFixed(2)}%
          </p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Target Multiplier:{" "}
            <span className="text-foreground font-bold">{target}x</span>
          </Label>
          <Input
            type="number"
            min={1.01}
            step={0.1}
            value={target}
            onChange={(e) =>
              setTarget(Math.max(1.01, Number(e.target.value) || 2))
            }
            className="bg-input border-border h-9 font-mono text-sm"
            data-ocid="limbo.target_input"
          />
        </div>
        <StakeInput stake={stake} setStake={setStake} disabled={rolling} />
        <Button
          onClick={roll}
          disabled={rolling}
          className="w-full h-11 font-bold text-background"
          style={{
            background:
              "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
          }}
          data-ocid="limbo.roll_button"
        >
          {rolling ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "🚀 Launch"
          )}
        </Button>
      </div>
    </GameShell>
  );
}

// ─── GAME: CoinFlip ───────────────────────────────────────────────────────────
function CoinFlipGame({ onBack }: { onBack: () => void }) {
  const { currentUser, debitUserBalance, creditUserBalance, addCasinoHistory } =
    useStore();
  const [stake, setStake] = useState(100);
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<"heads" | "tails" | null>(null);
  const [lastChoice, setLastChoice] = useState<"heads" | "tails" | null>(null);
  const [showWin, setShowWin] = useState(false);

  const flip = async (choice: "heads" | "tails") => {
    if (!currentUser) return toast.error("Please login");
    if (currentUser.balance < stake) return toast.error("Insufficient balance");
    if (stake <= 0) return toast.error("Enter valid stake");
    setLastChoice(choice);
    debitUserBalance(currentUser.id, stake);
    setFlipping(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 1000));
    const outcome = Math.random() < 0.5 ? "heads" : "tails";
    const won = outcome === choice;
    const payout = won ? Number.parseFloat((stake * 1.96).toFixed(2)) : 0;
    if (won) {
      creditUserBalance(currentUser.id, payout);
      setShowWin(true);
      setTimeout(() => setShowWin(false), 2000);
    }
    addCasinoHistory({
      userId: currentUser.id,
      game: "coinflip",
      roundId: genId(),
      bet: choice,
      stake,
      result: outcome,
      pnl: won ? payout - stake : -stake,
      placedAt: new Date().toISOString(),
    });
    setResult(outcome);
    setFlipping(false);
    if (won)
      toast.success(
        `🪙 ${outcome.toUpperCase()}! Won +₹${(payout - stake).toFixed(2)}`,
      );
    else toast.error(`🪙 ${outcome.toUpperCase()}! Lost ₹${stake}`);
  };

  return (
    <GameShell title="Coin Flip" icon="🪙" onBack={onBack}>
      <AnimatePresence>
        {showWin && <WinOverlay show={showWin} />}
      </AnimatePresence>
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="flex justify-center">
          <motion.div
            animate={flipping ? { rotateY: [0, 360, 720, 1080] } : {}}
            transition={{ duration: 1 }}
            className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold border-4"
            style={{
              background:
                result === "heads"
                  ? "oklch(0.78 0.15 85)"
                  : result === "tails"
                    ? "oklch(0.55 0.18 240)"
                    : "oklch(var(--secondary))",
              borderColor: "oklch(var(--border))",
            }}
          >
            {flipping
              ? "🪙"
              : result === "heads"
                ? "👑"
                : result === "tails"
                  ? "🦅"
                  : "🪙"}
          </motion.div>
        </div>
        {result && (
          <p
            className="text-center font-bold text-lg"
            style={{
              color:
                lastChoice === result
                  ? "oklch(0.65 0.18 145)"
                  : "oklch(0.62 0.22 20)",
            }}
          >
            {result.toUpperCase()} {lastChoice === result ? "✓ WIN" : "✗ LOSS"}
          </p>
        )}
        <StakeInput stake={stake} setStake={setStake} disabled={flipping} />
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => flip("heads")}
            disabled={flipping}
            className="h-12 font-bold text-background"
            style={{ background: "oklch(0.78 0.15 85)" }}
            data-ocid="coinflip.heads_button"
          >
            👑 Heads (1.96x)
          </Button>
          <Button
            onClick={() => flip("tails")}
            disabled={flipping}
            className="h-12 font-bold text-background"
            style={{ background: "oklch(0.55 0.18 240)" }}
            data-ocid="coinflip.tails_button"
          >
            🦅 Tails (1.96x)
          </Button>
        </div>
      </div>
    </GameShell>
  );
}

// ─── GAME: Diamonds ──────────────────────────────────────────────────────────
function DiamondsGame({ onBack }: { onBack: () => void }) {
  const { currentUser, debitUserBalance, creditUserBalance, addCasinoHistory } =
    useStore();
  const [stake, setStake] = useState(100);
  const [picks, setPicks] = useState<number[]>([]);
  const [revealed, setRevealed] = useState<boolean>(false);
  const [revealedTiles, setRevealedTiles] = useState<Set<number>>(new Set());
  const [diamonds, setDiamonds] = useState<number[]>([]);
  const [showWin, setShowWin] = useState(false);
  const GRID = 9;
  const DIAMONDS = 3;

  const play = async () => {
    if (!currentUser) return toast.error("Please login");
    if (currentUser.balance < stake) return toast.error("Insufficient balance");
    if (picks.length !== 3) return toast.error("Pick exactly 3 tiles");
    debitUserBalance(currentUser.id, stake);
    const d: number[] = [];
    while (d.length < DIAMONDS) {
      const r = Math.floor(Math.random() * GRID);
      if (!d.includes(r)) d.push(r);
    }
    setDiamonds(d);

    // Staggered tile reveal animation
    const allTiles = Array.from({ length: GRID }, (_, i) => i);
    for (let i = 0; i < allTiles.length; i++) {
      await new Promise((r) => setTimeout(r, 60));
      setRevealedTiles((prev) => new Set([...prev, i]));
    }

    const matches = picks.filter((p) => d.includes(p)).length;
    const mult =
      matches === 3 ? 5 : matches === 2 ? 2 : matches === 1 ? 0.5 : 0;
    const payout = Number.parseFloat((stake * mult).toFixed(2));
    if (payout > 0) {
      creditUserBalance(currentUser.id, payout);
      setShowWin(true);
      setTimeout(() => setShowWin(false), 2000);
    }
    addCasinoHistory({
      userId: currentUser.id,
      game: "diamonds",
      roundId: genId(),
      bet: `${picks.join(",")}`,
      stake,
      result: `${matches} matches`,
      pnl: payout - stake,
      placedAt: new Date().toISOString(),
    });
    setRevealed(true);
    if (payout > 0)
      toast.success(
        `💎 ${matches} matches! ${mult}x! +₹${(payout - stake).toFixed(2)}`,
      );
    else toast.error(`No matches! Lost ₹${stake}`);
  };

  const reset = () => {
    setPicks([]);
    setRevealed(false);
    setRevealedTiles(new Set());
    setDiamonds([]);
    setShowWin(false);
  };
  const togglePick = (i: number) => {
    if (revealed) return;
    setPicks((prev) =>
      prev.includes(i)
        ? prev.filter((p) => p !== i)
        : prev.length < 3
          ? [...prev, i]
          : prev,
    );
  };

  return (
    <GameShell title="Diamonds" icon="💎" onBack={onBack}>
      <AnimatePresence>
        {showWin && <WinOverlay show={showWin} />}
      </AnimatePresence>
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <p className="text-xs text-muted-foreground text-center">
          Pick 3 tiles — find all 3 diamonds for 5x!
        </p>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: GRID }).map((_, i) => {
            const isPicked = picks.includes(i);
            const isDiamond = diamonds.includes(i);
            const isRevealedNow = revealedTiles.has(i);
            const showContent = revealed && isRevealedNow;
            return (
              <motion.button
                key={`diamond-${i}`}
                type="button"
                whileTap={{ scale: 0.9 }}
                animate={
                  showContent
                    ? { rotateY: [0, 90, 180], scale: [1, 1.1, 1] }
                    : isPicked && !revealed
                      ? { scale: [1, 1.05, 1] }
                      : {}
                }
                transition={{ duration: 0.3 }}
                onClick={() => togglePick(i)}
                disabled={revealed}
                className="aspect-square rounded-xl flex items-center justify-center text-2xl font-bold transition-colors border"
                style={{
                  background: showContent
                    ? isDiamond
                      ? "oklch(0.65 0.18 145 / 0.3)"
                      : isPicked
                        ? "oklch(0.62 0.22 20 / 0.3)"
                        : "oklch(var(--secondary))"
                    : isPicked
                      ? "oklch(var(--gold) / 0.2)"
                      : "oklch(var(--secondary))",
                  borderColor: showContent
                    ? isDiamond
                      ? "oklch(0.65 0.18 145 / 0.5)"
                      : isPicked
                        ? "oklch(0.62 0.22 20 / 0.5)"
                        : "oklch(var(--border))"
                    : isPicked
                      ? "oklch(var(--gold))"
                      : "oklch(var(--border))",
                }}
                data-ocid={`diamonds.tile.${i + 1}`}
              >
                {showContent ? (isDiamond ? "💎" : "✗") : isPicked ? "✓" : ""}
              </motion.button>
            );
          })}
        </div>
        <p className="text-xs text-center text-muted-foreground">
          Selected: {picks.length}/3
        </p>
        {!revealed && (
          <>
            <StakeInput stake={stake} setStake={setStake} />
            <Button
              onClick={play}
              disabled={picks.length !== 3}
              className="w-full h-11 font-bold text-background"
              style={{
                background:
                  "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
              }}
              data-ocid="diamonds.play_button"
            >
              💎 Reveal
            </Button>
          </>
        )}
        {revealed && (
          <Button
            onClick={reset}
            className="w-full h-11 font-bold text-background"
            style={{
              background:
                "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
            }}
            data-ocid="diamonds.reset_button"
          >
            Play Again
          </Button>
        )}
      </div>
    </GameShell>
  );
}

// ─── GAME: Tower ─────────────────────────────────────────────────────────────
function TowerGame({ onBack }: { onBack: () => void }) {
  const { currentUser, debitUserBalance, creditUserBalance, addCasinoHistory } =
    useStore();
  const [stake, setStake] = useState(100);
  const [level, setLevel] = useState(0);
  const [active, setActive] = useState(false);
  const [safeCol, setSafeCol] = useState<number[]>([]);
  const [picked, setPicked] = useState<number[]>([]);
  const [lost, setLost] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const LEVELS = 8;
  const COLS = 3;
  const multipliers = [1.3, 1.7, 2.2, 3, 4.2, 6, 9, 14];

  const startGame = () => {
    if (!currentUser) return toast.error("Please login");
    if (currentUser.balance < stake) return toast.error("Insufficient balance");
    debitUserBalance(currentUser.id, stake);
    const safe = Array.from({ length: LEVELS }, () =>
      Math.floor(Math.random() * COLS),
    );
    setSafeCol(safe);
    setPicked([]);
    setLevel(0);
    setActive(true);
    setLost(false);
    setShowWin(false);
  };

  const [pickingCol, setPickingCol] = useState<number | null>(null);

  const pickCol = async (col: number) => {
    if (!active || lost) return;
    // Brief scale pulse before revealing
    setPickingCol(col);
    await new Promise((r) => setTimeout(r, 180));
    setPickingCol(null);

    const isSafe = safeCol[level] === col;
    const newPicked = [...picked, col];
    setPicked(newPicked);
    if (!isSafe) {
      setActive(false);
      setLost(true);
      addCasinoHistory({
        userId: currentUser!.id,
        game: "tower",
        roundId: genId(),
        bet: `level-${level + 1}`,
        stake,
        result: "bomb",
        pnl: -stake,
        placedAt: new Date().toISOString(),
      });
      toast.error(`💥 Hit a trap at level ${level + 1}!`);
    } else {
      const newLevel = level + 1;
      setLevel(newLevel);
      if (newLevel >= LEVELS) {
        const payout = Number.parseFloat(
          (stake * multipliers[LEVELS - 1]).toFixed(2),
        );
        creditUserBalance(currentUser!.id, payout);
        addCasinoHistory({
          userId: currentUser!.id,
          game: "tower",
          roundId: genId(),
          bet: "all-levels",
          stake,
          result: `${multipliers[LEVELS - 1]}x`,
          pnl: payout - stake,
          placedAt: new Date().toISOString(),
        });
        setActive(false);
        setShowWin(true);
        setTimeout(() => setShowWin(false), 2000);
        toast.success(`🏆 Tower cleared! +₹${(payout - stake).toFixed(2)}`);
      }
    }
  };

  const cashOut = () => {
    if (!active || level === 0) return;
    const mult = multipliers[level - 1];
    const payout = Number.parseFloat((stake * mult).toFixed(2));
    creditUserBalance(currentUser!.id, payout);
    addCasinoHistory({
      userId: currentUser!.id,
      game: "tower",
      roundId: genId(),
      bet: `level-${level}`,
      stake,
      result: `${mult}x`,
      pnl: payout - stake,
      placedAt: new Date().toISOString(),
    });
    setActive(false);
    setShowWin(true);
    setTimeout(() => setShowWin(false), 2000);
    toast.success(`🏗️ Cashed out at ${mult}x! +₹${(payout - stake).toFixed(2)}`);
  };

  return (
    <GameShell title="Tower" icon="🏗️" onBack={onBack}>
      <AnimatePresence>
        {showWin && <WinOverlay show={showWin} />}
      </AnimatePresence>
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        {!active && !lost && level === 0 && !showWin && (
          <>
            <StakeInput stake={stake} setStake={setStake} />
            <Button
              onClick={startGame}
              className="w-full h-11 font-bold text-background"
              style={{
                background:
                  "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
              }}
              data-ocid="tower.start_button"
            >
              🏗️ Start Tower
            </Button>
          </>
        )}
        {(active || lost || (level > 0 && !active)) && (
          <>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                Level {level}/{LEVELS}
              </span>
              <span className="text-gold font-bold font-mono">
                {level > 0 ? `${multipliers[level - 1]}x` : "1x"}
              </span>
            </div>
            <div className="space-y-1.5">
              {Array.from({ length: LEVELS })
                .reverse()
                .map((_, ri) => {
                  const lvl = LEVELS - 1 - ri;
                  const isCurrent = lvl === level && active;
                  const isDone = lvl < level;
                  const _isLost = lost && lvl === level - 1;
                  return (
                    <div key={lvl} className="grid grid-cols-3 gap-1.5">
                      {Array.from({ length: COLS }).map((_, col) => {
                        const isPicking = isCurrent && pickingCol === col;
                        return (
                          <motion.button
                            key={`tower-${col}`}
                            type="button"
                            animate={
                              isPicking ? { scale: [1, 1.18, 0.95, 1] } : {}
                            }
                            transition={{ duration: 0.18 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() =>
                              isCurrent ? pickCol(col) : undefined
                            }
                            disabled={!isCurrent}
                            className="py-3 rounded-lg text-sm font-bold transition-all border"
                            style={{
                              background:
                                isDone && safeCol[lvl] === col
                                  ? "oklch(0.65 0.18 145 / 0.2)"
                                  : isCurrent
                                    ? "oklch(var(--secondary))"
                                    : "oklch(var(--card) / 0.5)",
                              borderColor: isCurrent
                                ? "oklch(var(--gold) / 0.5)"
                                : "oklch(var(--border) / 0.3)",
                            }}
                            data-ocid={`tower.col.${col + 1}`}
                          >
                            {isDone && safeCol[lvl] === col ? "✓" : ""}
                            {isCurrent ? "?" : ""}
                          </motion.button>
                        );
                      })}
                    </div>
                  );
                })}
            </div>
            {active && level > 0 && (
              <Button
                onClick={cashOut}
                className="w-full h-10 font-bold text-background mt-2"
                style={{ background: "oklch(0.65 0.18 145)" }}
                data-ocid="tower.cashout_button"
              >
                Cash Out {multipliers[level - 1]}x
              </Button>
            )}
            {!active && (
              <Button
                onClick={startGame}
                className="w-full h-10 font-bold text-background mt-2"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
                }}
                data-ocid="tower.restart_button"
              >
                Play Again
              </Button>
            )}
          </>
        )}
      </div>
    </GameShell>
  );
}

// ─── GAME: Wheel of Fortune ──────────────────────────────────────────────────
function WheelGame({ onBack }: { onBack: () => void }) {
  const { currentUser, debitUserBalance, creditUserBalance, addCasinoHistory } =
    useStore();
  const [stake, setStake] = useState(100);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ label: string; mult: number } | null>(
    null,
  );
  const [rotation, setRotation] = useState(0);
  const [showWin, setShowWin] = useState(false);
  const segments = [
    { label: "1.5x", mult: 1.5, color: "oklch(0.55 0.18 240)" },
    { label: "2x", mult: 2, color: "oklch(var(--gold))" },
    { label: "0x", mult: 0, color: "oklch(0.62 0.22 20)" },
    { label: "3x", mult: 3, color: "oklch(var(--saffron))" },
    { label: "1.5x", mult: 1.5, color: "oklch(0.55 0.18 240)" },
    { label: "5x", mult: 5, color: "oklch(0.65 0.18 145)" },
    { label: "0x", mult: 0, color: "oklch(0.62 0.22 20)" },
    { label: "10x", mult: 10, color: "oklch(0.72 0.20 120)" },
  ];
  const weights = [30, 25, 20, 10, 8, 5, 1.5, 0.5];
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  const spin = async () => {
    if (!currentUser) return toast.error("Please login");
    if (currentUser.balance < stake) return toast.error("Insufficient balance");
    if (stake <= 0) return toast.error("Enter valid stake");
    debitUserBalance(currentUser.id, stake);
    setSpinning(true);
    setResult(null);
    let rand = Math.random() * totalWeight;
    let idx = 0;
    for (let i = 0; i < weights.length; i++) {
      rand -= weights[i];
      if (rand <= 0) {
        idx = i;
        break;
      }
    }
    const seg = segments[idx];
    const spins = 5 + Math.random() * 3;
    const segAngle = 360 / segments.length;
    const targetAngle =
      360 * spins + (segments.length - idx) * segAngle - segAngle / 2;
    setRotation((prev) => prev + targetAngle);
    await new Promise((r) => setTimeout(r, 3000));
    const payout = Number.parseFloat((stake * seg.mult).toFixed(2));
    if (payout > 0) {
      creditUserBalance(currentUser.id, payout);
      if (seg.mult >= 5) {
        setShowWin(true);
        setTimeout(() => setShowWin(false), 2000);
      }
    }
    addCasinoHistory({
      userId: currentUser.id,
      game: "wheel",
      roundId: genId(),
      bet: "spin",
      stake,
      result: seg.label,
      pnl: payout - stake,
      placedAt: new Date().toISOString(),
    });
    setResult(seg);
    setSpinning(false);
    if (payout > 0)
      toast.success(`🎡 ${seg.label}! +₹${(payout - stake).toFixed(2)}`);
    else toast.error(`🎡 No win! Lost ₹${stake}`);
  };

  return (
    <GameShell title="Wheel of Fortune" icon="🎡" onBack={onBack}>
      <AnimatePresence>
        {showWin && <WinOverlay show={showWin} />}
      </AnimatePresence>
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="flex justify-center">
          <div className="relative w-48 h-48">
            <motion.div
              animate={{ rotate: rotation }}
              transition={{ duration: 3, ease: "easeOut" }}
              className="w-48 h-48 rounded-full border-4 border-gold overflow-hidden relative"
              style={{
                background:
                  "conic-gradient(oklch(0.55 0.18 240) 0deg 45deg, oklch(var(--gold)) 45deg 90deg, oklch(0.62 0.22 20) 90deg 135deg, oklch(var(--saffron)) 135deg 180deg, oklch(0.55 0.18 240) 180deg 225deg, oklch(0.65 0.18 145) 225deg 270deg, oklch(0.62 0.22 20) 270deg 315deg, oklch(0.72 0.20 120) 315deg 360deg)",
              }}
            >
              {segments.map((seg, i) => (
                <div
                  key={`wheel-seg-${i}`}
                  className="absolute text-[8px] font-bold text-white"
                  style={{
                    top: "50%",
                    left: "50%",
                    transform: `rotate(${i * 45 + 22}deg) translateY(-60px) translateX(-50%)`,
                  }}
                >
                  {seg.label}
                </div>
              ))}
            </motion.div>
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-0 h-0"
              style={{
                borderLeft: "8px solid transparent",
                borderRight: "8px solid transparent",
                borderTop: "16px solid oklch(var(--gold))",
              }}
            />
          </div>
        </div>
        {result && (
          <p
            className="text-center text-lg font-bold"
            style={{
              color:
                result.mult > 0
                  ? "oklch(0.65 0.18 145)"
                  : "oklch(0.62 0.22 20)",
            }}
          >
            {result.label}
          </p>
        )}
        <StakeInput stake={stake} setStake={setStake} disabled={spinning} />
        <Button
          onClick={spin}
          disabled={spinning}
          className="w-full h-11 font-bold text-background"
          style={{
            background:
              "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
          }}
          data-ocid="wheel.spin_button"
        >
          {spinning ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "🎡 Spin"
          )}
        </Button>
      </div>
    </GameShell>
  );
}

// ─── GAME: Stairs ────────────────────────────────────────────────────────────
function StairsGame({ onBack }: { onBack: () => void }) {
  const { currentUser, debitUserBalance, creditUserBalance, addCasinoHistory } =
    useStore();
  const [stake, setStake] = useState(100);
  const [step, setStep] = useState(0);
  const [active, setActive] = useState(false);
  const [lost, setLost] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const STEPS = 10;
  const mults = [1.2, 1.4, 1.7, 2.1, 2.6, 3.3, 4.2, 5.5, 7.5, 11];

  const startGame = () => {
    if (!currentUser) return toast.error("Please login");
    if (currentUser.balance < stake) return toast.error("Insufficient balance");
    debitUserBalance(currentUser.id, stake);
    setStep(0);
    setActive(true);
    setLost(false);
    setShowWin(false);
  };

  const climb = () => {
    if (!active) return;
    const fail = Math.random() < 0.1 + step * 0.03;
    if (fail) {
      setActive(false);
      setLost(true);
      addCasinoHistory({
        userId: currentUser!.id,
        game: "stairs",
        roundId: genId(),
        bet: `step-${step + 1}`,
        stake,
        result: "fell",
        pnl: -stake,
        placedAt: new Date().toISOString(),
      });
      toast.error(`🪜 Fell at step ${step + 1}!`);
    } else {
      const newStep = step + 1;
      setStep(newStep);
      if (newStep >= STEPS) {
        const payout = Number.parseFloat((stake * mults[STEPS - 1]).toFixed(2));
        creditUserBalance(currentUser!.id, payout);
        addCasinoHistory({
          userId: currentUser!.id,
          game: "stairs",
          roundId: genId(),
          bet: "top",
          stake,
          result: `${mults[STEPS - 1]}x`,
          pnl: payout - stake,
          placedAt: new Date().toISOString(),
        });
        setActive(false);
        setShowWin(true);
        setTimeout(() => setShowWin(false), 2000);
        toast.success(`🏆 Reached the top! +₹${(payout - stake).toFixed(2)}`);
      }
    }
  };

  const cashOut = () => {
    if (!active || step === 0) return;
    const mult = mults[step - 1];
    const payout = Number.parseFloat((stake * mult).toFixed(2));
    creditUserBalance(currentUser!.id, payout);
    addCasinoHistory({
      userId: currentUser!.id,
      game: "stairs",
      roundId: genId(),
      bet: `step-${step}`,
      stake,
      result: `${mult}x`,
      pnl: payout - stake,
      placedAt: new Date().toISOString(),
    });
    setActive(false);
    setShowWin(true);
    setTimeout(() => setShowWin(false), 2000);
    toast.success(`🪜 Cashed out at step ${step}! ${mult}x`);
  };

  return (
    <GameShell title="Stairs" icon="🪜" onBack={onBack}>
      <AnimatePresence>
        {showWin && <WinOverlay show={showWin} />}
      </AnimatePresence>
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        {!active && step === 0 && !lost && !showWin && (
          <>
            <StakeInput stake={stake} setStake={setStake} />
            <Button
              onClick={startGame}
              className="w-full h-11 font-bold text-background"
              style={{
                background:
                  "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
              }}
              data-ocid="stairs.start_button"
            >
              🪜 Start Climbing
            </Button>
          </>
        )}
        {(active || (step > 0 && !active)) && (
          <>
            <div className="space-y-1">
              {mults.map((m, i) => {
                const idx = STEPS - 1 - i;
                const isCurrent = idx === step - 1 && step > 0;
                return (
                  <motion.div
                    key={idx}
                    animate={
                      isCurrent ? { y: [0, -4, 0], scale: [1, 1.03, 1] } : {}
                    }
                    transition={{ duration: 0.35 }}
                    className="flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all"
                    style={{
                      background: isCurrent
                        ? "oklch(var(--gold) / 0.15)"
                        : idx < step - 1
                          ? "oklch(0.65 0.18 145 / 0.1)"
                          : "oklch(var(--secondary) / 0.3)",
                    }}
                  >
                    <span className="text-xs font-bold w-6">{idx + 1}</span>
                    <div
                      className="flex-1 h-1.5 rounded-full"
                      style={{
                        background:
                          idx < step
                            ? "oklch(0.65 0.18 145)"
                            : "oklch(var(--border))",
                      }}
                    />
                    <span
                      className="text-xs font-bold"
                      style={{
                        color: isCurrent
                          ? "oklch(var(--gold))"
                          : "oklch(var(--muted-foreground))",
                      }}
                    >
                      {m}x
                    </span>
                  </motion.div>
                );
              })}
            </div>
            {active && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <Button
                  onClick={climb}
                  className="h-11 font-bold text-background"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
                  }}
                  data-ocid="stairs.climb_button"
                >
                  ⬆️ Climb
                </Button>
                {step > 0 && (
                  <Button
                    onClick={cashOut}
                    className="h-11 font-bold text-background"
                    style={{ background: "oklch(0.65 0.18 145)" }}
                    data-ocid="stairs.cashout_button"
                  >
                    💰 Cash Out
                  </Button>
                )}
              </div>
            )}
            {!active && (
              <Button
                onClick={startGame}
                className="w-full h-11 font-bold text-background"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
                }}
              >
                Play Again
              </Button>
            )}
          </>
        )}
      </div>
    </GameShell>
  );
}

// ─── GAME: HiLo ──────────────────────────────────────────────────────────────
function HiLoGame({ onBack }: { onBack: () => void }) {
  const { currentUser, debitUserBalance, creditUserBalance, addCasinoHistory } =
    useStore();
  const [stake, setStake] = useState(100);
  const [card, setCard] = useState(Math.floor(Math.random() * 13) + 1);
  const [mult, setMult] = useState(1);
  const [active, setActive] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const SUITS = ["♠", "♥", "♦", "♣"];
  const RANKS = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
  ];
  const [suit, setSuit] = useState(SUITS[Math.floor(Math.random() * 4)]);

  const startGame = () => {
    if (!currentUser) return toast.error("Please login");
    if (currentUser.balance < stake) return toast.error("Insufficient balance");
    debitUserBalance(currentUser.id, stake);
    setCard(Math.floor(Math.random() * 13) + 1);
    setSuit(SUITS[Math.floor(Math.random() * 4)]);
    setMult(1);
    setActive(true);
    setShowWin(false);
  };

  const guess = (direction: "higher" | "lower") => {
    if (!active) return;
    const newCard = Math.floor(Math.random() * 13) + 1;
    const newSuit = SUITS[Math.floor(Math.random() * 4)];
    const correct = direction === "higher" ? newCard >= card : newCard <= card;
    if (!correct) {
      addCasinoHistory({
        userId: currentUser!.id,
        game: "hilo",
        roundId: genId(),
        bet: direction,
        stake,
        result: `${RANKS[newCard - 1]}${newSuit}`,
        pnl: -stake,
        placedAt: new Date().toISOString(),
      });
      setActive(false);
      setCard(newCard);
      setSuit(newSuit);
      toast.error(`Wrong! Got ${RANKS[newCard - 1]}${newSuit}. Lost!`);
    } else {
      const newMult = Number.parseFloat((mult * 1.4).toFixed(2));
      setMult(newMult);
      setCard(newCard);
      setSuit(newSuit);
      toast.success(
        `Correct! ${RANKS[newCard - 1]}${newSuit} — Now ${newMult}x`,
      );
    }
  };

  const cashOut = () => {
    if (!active || mult === 1) return;
    const payout = Number.parseFloat((stake * mult).toFixed(2));
    creditUserBalance(currentUser!.id, payout);
    addCasinoHistory({
      userId: currentUser!.id,
      game: "hilo",
      roundId: genId(),
      bet: "cashout",
      stake,
      result: `${mult}x`,
      pnl: payout - stake,
      placedAt: new Date().toISOString(),
    });
    setActive(false);
    setShowWin(true);
    setTimeout(() => setShowWin(false), 2000);
    toast.success(
      `💰 Cashed out at ${mult}x! +₹${(payout - stake).toFixed(2)}`,
    );
  };

  return (
    <GameShell title="Hi-Lo" icon="↕️" onBack={onBack}>
      <AnimatePresence>
        {showWin && <WinOverlay show={showWin} />}
      </AnimatePresence>
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="flex justify-center">
          <div
            className="w-24 h-36 rounded-xl border-2 border-gold flex flex-col items-center justify-center text-4xl font-bold"
            style={{
              background: "oklch(var(--secondary))",
              color:
                suit === "♥" || suit === "♦"
                  ? "oklch(0.62 0.22 20)"
                  : "oklch(var(--foreground))",
            }}
          >
            <div>{RANKS[card - 1]}</div>
            <div className="text-2xl">{suit}</div>
          </div>
        </div>
        {active && (
          <p className="text-center text-sm text-muted-foreground">
            Multiplier: <span className="text-gold font-bold">{mult}x</span>
          </p>
        )}
        {!active && (
          <>
            <StakeInput stake={stake} setStake={setStake} />
            <Button
              onClick={startGame}
              className="w-full h-11 font-bold text-background"
              style={{
                background:
                  "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
              }}
              data-ocid="hilo.start_button"
            >
              Start Game
            </Button>
          </>
        )}
        {active && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => guess("higher")}
                className="h-12 font-bold text-background"
                style={{ background: "oklch(0.65 0.18 145)" }}
                data-ocid="hilo.higher_button"
              >
                ⬆️ Higher
              </Button>
              <Button
                onClick={() => guess("lower")}
                className="h-12 font-bold text-background"
                style={{ background: "oklch(0.62 0.22 20)" }}
                data-ocid="hilo.lower_button"
              >
                ⬇️ Lower
              </Button>
            </div>
            {mult > 1 && (
              <Button
                onClick={cashOut}
                className="w-full h-10 font-bold text-background"
                style={{ background: "oklch(var(--gold))" }}
                data-ocid="hilo.cashout_button"
              >
                💰 Cash Out {mult}x
              </Button>
            )}
          </div>
        )}
      </div>
    </GameShell>
  );
}

// ─── GAME: Blackjack ─────────────────────────────────────────────────────────
function BlackjackGame({ onBack }: { onBack: () => void }) {
  const { currentUser, debitUserBalance, creditUserBalance, addCasinoHistory } =
    useStore();
  const [stake, setStake] = useState(100);
  const [playerCards, setPlayerCards] = useState<number[]>([]);
  const [dealerCards, setDealerCards] = useState<number[]>([]);
  const [active, setActive] = useState(false);
  const [showWin, setShowWin] = useState(false);

  const drawCard = () => Math.min(10, Math.floor(Math.random() * 13) + 1);
  const total = (cards: number[]) => {
    let sum = cards.reduce((a, b) => a + b, 0);
    let aces = cards.filter((c) => c === 1).length;
    while (sum <= 11 && aces > 0) {
      sum += 10;
      aces--;
    }
    return sum;
  };
  const RANKS = [
    "",
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
  ];

  const deal = () => {
    if (!currentUser) return toast.error("Please login");
    if (currentUser.balance < stake) return toast.error("Insufficient balance");
    debitUserBalance(currentUser.id, stake);
    const p = [drawCard(), drawCard()];
    const d = [drawCard(), drawCard()];
    setPlayerCards(p);
    setDealerCards(d);
    setActive(true);
    setShowWin(false);
    if (total(p) === 21) {
      finish(p, d, true);
    }
  };

  const hit = () => {
    const newCards = [...playerCards, drawCard()];
    setPlayerCards(newCards);
    if (total(newCards) > 21) {
      finish(newCards, dealerCards, false);
    }
  };

  const stand = () => {
    let d = [...dealerCards];
    while (total(d) < 17) d.push(drawCard());
    setDealerCards(d);
    const pTotal = total(playerCards);
    const dTotal = total(d);
    const won = pTotal <= 21 && (pTotal > dTotal || dTotal > 21);
    finish(playerCards, d, won);
  };

  const finish = (p: number[], d: number[], won: boolean) => {
    const pT = total(p);
    const dT = total(d);
    const isBlackjack = pT === 21 && p.length === 2;
    const mult = isBlackjack ? 2.5 : 2;
    const payout = won ? Number.parseFloat((stake * mult).toFixed(2)) : 0;
    if (won) {
      creditUserBalance(currentUser!.id, payout);
      setShowWin(true);
      setTimeout(() => setShowWin(false), 2000);
    }
    addCasinoHistory({
      userId: currentUser!.id,
      game: "blackjack",
      roundId: genId(),
      bet: `${pT}vs${dT}`,
      stake,
      result: won ? "win" : "loss",
      pnl: won ? payout - stake : -stake,
      placedAt: new Date().toISOString(),
    });
    setActive(false);
    if (won)
      toast.success(
        `🃏 ${isBlackjack ? "Blackjack!" : "Win!"} +₹${(payout - stake).toFixed(2)}`,
      );
    else toast.error(`Dealer wins. Lost ₹${stake}`);
  };

  const CardDisplay = ({
    cards,
    hideSecond,
  }: { cards: number[]; hideSecond?: boolean }) => (
    <div className="flex gap-2 justify-center">
      {cards.map((c, i) => (
        <motion.div
          key={`card-${i}-${c}`}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: i * 0.1, type: "spring", bounce: 0.4 }}
          className="w-12 h-16 rounded-lg border-2 border-gold flex items-center justify-center font-bold text-lg"
          style={{ background: "oklch(var(--secondary))" }}
        >
          {hideSecond && i === 1 ? "?" : RANKS[c]}
        </motion.div>
      ))}
    </div>
  );

  return (
    <GameShell title="Blackjack" icon="🃏" onBack={onBack}>
      <AnimatePresence>
        {showWin && <WinOverlay show={showWin} />}
      </AnimatePresence>
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        {!active && (
          <>
            <StakeInput stake={stake} setStake={setStake} />
            <Button
              onClick={deal}
              className="w-full h-11 font-bold text-background"
              style={{
                background:
                  "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
              }}
              data-ocid="blackjack.deal_button"
            >
              🃏 Deal
            </Button>
          </>
        )}
        {(active || playerCards.length > 0) && (
          <>
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  Dealer{" "}
                  {!active && dealerCards.length > 0
                    ? `(${total(dealerCards)})`
                    : ""}
                </p>
                <CardDisplay cards={dealerCards} hideSecond={active} />
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  You ({total(playerCards)})
                </p>
                <CardDisplay cards={playerCards} />
              </div>
            </div>
            {active && (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={hit}
                  className="h-11 font-bold text-background"
                  style={{ background: "oklch(0.65 0.18 145)" }}
                  data-ocid="blackjack.hit_button"
                >
                  Hit
                </Button>
                <Button
                  onClick={stand}
                  className="h-11 font-bold text-background"
                  style={{ background: "oklch(0.62 0.22 20)" }}
                  data-ocid="blackjack.stand_button"
                >
                  Stand
                </Button>
              </div>
            )}
            {!active && (
              <Button
                onClick={deal}
                className="w-full h-11 font-bold text-background"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
                }}
              >
                Deal Again
              </Button>
            )}
          </>
        )}
      </div>
    </GameShell>
  );
}

// ─── SIMPLE GAME TEMPLATE (for remaining games) ───────────────────────────────
interface SimpleGameConfig {
  title: string;
  icon: string;
  gameName: string;
  options: { label: string; value: string; color: string; mult: number }[];
  description: string;
}

function SimpleGame({
  config,
  onBack,
}: { config: SimpleGameConfig; onBack: () => void }) {
  const { currentUser, debitUserBalance, creditUserBalance, addCasinoHistory } =
    useStore();
  const [stake, setStake] = useState(100);
  const [result, setResult] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [won, setWon] = useState(false);
  const [showWin, setShowWin] = useState(false);

  const play = async (choice: string, mult: number) => {
    if (!currentUser) return toast.error("Please login");
    if (currentUser.balance < stake) return toast.error("Insufficient balance");
    if (stake <= 0) return toast.error("Enter valid stake");
    debitUserBalance(currentUser.id, stake);
    setPlaying(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 600));
    const optIdx = Math.floor(Math.random() * config.options.length);
    const outcome = config.options[optIdx].value;
    const didWin = outcome === choice;
    const payout = didWin ? Number.parseFloat((stake * mult).toFixed(2)) : 0;
    if (didWin) {
      creditUserBalance(currentUser.id, payout);
      setShowWin(true);
      setTimeout(() => setShowWin(false), 2000);
    }
    addCasinoHistory({
      userId: currentUser.id,
      game: config.gameName,
      roundId: genId(),
      bet: choice,
      stake,
      result: outcome,
      pnl: didWin ? payout - stake : -stake,
      placedAt: new Date().toISOString(),
    });
    setResult(outcome);
    setWon(didWin);
    setPlaying(false);
    if (didWin)
      toast.success(
        `${config.icon} Win! ${mult}x! +₹${(payout - stake).toFixed(2)}`,
      );
    else toast.error(`${config.icon} ${outcome}. Lost ₹${stake}`);
  };

  return (
    <GameShell title={config.title} icon={config.icon} onBack={onBack}>
      <AnimatePresence>
        {showWin && <WinOverlay show={showWin} />}
      </AnimatePresence>
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <p className="text-xs text-muted-foreground text-center">
          {config.description}
        </p>
        {result && (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-center py-3 rounded-xl border"
            style={{
              background: won
                ? "oklch(0.65 0.18 145 / 0.1)"
                : "oklch(0.62 0.22 20 / 0.1)",
              borderColor: won
                ? "oklch(0.65 0.18 145 / 0.3)"
                : "oklch(0.62 0.22 20 / 0.3)",
            }}
          >
            <p className="font-bold text-lg">
              {config.options.find((o) => o.value === result)?.label ?? result}
            </p>
            <p
              className="text-xs"
              style={{
                color: won ? "oklch(0.65 0.18 145)" : "oklch(0.62 0.22 20)",
              }}
            >
              {won ? "WIN!" : "LOSS"}
            </p>
          </motion.div>
        )}
        <StakeInput stake={stake} setStake={setStake} disabled={playing} />
        <div
          className={`grid gap-2 ${config.options.length <= 2 ? "grid-cols-2" : config.options.length <= 3 ? "grid-cols-3" : "grid-cols-2"}`}
        >
          {config.options.map((opt) => (
            <Button
              key={opt.value}
              onClick={() => play(opt.value, opt.mult)}
              disabled={playing}
              className="h-14 font-bold flex flex-col gap-1 text-white text-sm"
              style={{ background: opt.color }}
              data-ocid={`${config.gameName}.${opt.value}_button`}
            >
              <span className="text-lg">{opt.label.split(" ")[0]}</span>
              <span className="text-xs opacity-80">{opt.mult}x</span>
            </Button>
          ))}
        </div>
        {playing && (
          <div className="text-center text-muted-foreground text-sm animate-pulse">
            Rolling...
          </div>
        )}
      </div>
    </GameShell>
  );
}

// ─── Keno Game ───────────────────────────────────────────────────────────────
function KenoGame({ onBack }: { onBack: () => void }) {
  const { currentUser, debitUserBalance, creditUserBalance, addCasinoHistory } =
    useStore();
  const [stake, setStake] = useState(100);
  const [picks, setPicks] = useState<number[]>([]);
  const [drawn, setDrawn] = useState<number[]>([]);
  const [played, setPlayed] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const MAX_PICKS = 10;

  const togglePick = (n: number) => {
    if (played) return;
    setPicks((prev) =>
      prev.includes(n)
        ? prev.filter((p) => p !== n)
        : prev.length < MAX_PICKS
          ? [...prev, n]
          : prev,
    );
  };

  const play = () => {
    if (!currentUser) return toast.error("Please login");
    if (currentUser.balance < stake) return toast.error("Insufficient balance");
    if (picks.length < 1) return toast.error("Pick at least 1 number");
    debitUserBalance(currentUser.id, stake);
    const d: number[] = [];
    while (d.length < 20) {
      const r = Math.floor(Math.random() * 80) + 1;
      if (!d.includes(r)) d.push(r);
    }
    setDrawn(d);
    const matches = picks.filter((p) => d.includes(p)).length;
    const pct = matches / picks.length;
    const mult =
      pct >= 1 ? 8 : pct >= 0.8 ? 4 : pct >= 0.6 ? 2 : pct >= 0.4 ? 1 : 0;
    const payout = Number.parseFloat((stake * mult).toFixed(2));
    if (payout > 0) {
      creditUserBalance(currentUser.id, payout);
      if (mult >= 4) {
        setShowWin(true);
        setTimeout(() => setShowWin(false), 2000);
      }
    }
    addCasinoHistory({
      userId: currentUser.id,
      game: "keno",
      roundId: genId(),
      bet: picks.join(","),
      stake,
      result: `${matches}/${picks.length}`,
      pnl: payout - stake,
      placedAt: new Date().toISOString(),
    });
    setPlayed(true);
    if (payout > 0)
      toast.success(
        `🎱 ${matches} matches! ${mult}x! +₹${(payout - stake).toFixed(2)}`,
      );
    else toast.error(`${matches} matches — no win`);
  };

  const reset = () => {
    setPicks([]);
    setDrawn([]);
    setPlayed(false);
  };

  return (
    <GameShell title="Keno" icon="🎱" onBack={onBack}>
      <AnimatePresence>
        {showWin && <WinOverlay show={showWin} />}
      </AnimatePresence>
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <p className="text-xs text-muted-foreground text-center">
          Pick up to 10 numbers. 20 will be drawn. More matches = higher payout!
        </p>
        <div className="grid grid-cols-10 gap-1">
          {Array.from({ length: 80 }, (_, i) => i + 1).map((n) => {
            const isPick = picks.includes(n);
            const isDrawn = drawn.includes(n);
            const isMatch = isPick && isDrawn;
            return (
              <button
                key={n}
                type="button"
                onClick={() => togglePick(n)}
                disabled={played}
                className="aspect-square text-[10px] font-bold rounded transition-all flex items-center justify-center"
                style={{
                  background: isMatch
                    ? "oklch(0.65 0.18 145)"
                    : isDrawn && played
                      ? "oklch(var(--gold) / 0.3)"
                      : isPick
                        ? "oklch(var(--back))"
                        : "oklch(var(--secondary))",
                  color:
                    isMatch || isPick
                      ? "white"
                      : "oklch(var(--muted-foreground))",
                  fontSize: "9px",
                }}
                data-ocid={`keno.number.${n}`}
              >
                {n}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-center text-muted-foreground">
          Selected: {picks.length}/{MAX_PICKS}
        </p>
        {!played ? (
          <>
            <StakeInput stake={stake} setStake={setStake} />
            <Button
              onClick={play}
              disabled={picks.length < 1}
              className="w-full h-11 font-bold text-background"
              style={{
                background:
                  "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
              }}
              data-ocid="keno.play_button"
            >
              🎱 Draw!
            </Button>
          </>
        ) : (
          <Button
            onClick={reset}
            className="w-full h-11 font-bold text-background"
            style={{
              background:
                "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
            }}
          >
            Play Again
          </Button>
        )}
      </div>
    </GameShell>
  );
}

// ─── Scratch Card Game ────────────────────────────────────────────────────────
function ScratchCardGame({ onBack }: { onBack: () => void }) {
  const { currentUser, debitUserBalance, creditUserBalance, addCasinoHistory } =
    useStore();
  const [stake, setStake] = useState(100);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [scratched, setScratched] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const SYMS = ["💎", "⭐", "🍀", "🎰", "💰", "🔔"];

  const buyCard = () => {
    if (!currentUser) return toast.error("Please login");
    if (currentUser.balance < stake) return toast.error("Insufficient balance");
    debitUserBalance(currentUser.id, stake);
    const s = Array.from(
      { length: 9 },
      () => SYMS[Math.floor(Math.random() * SYMS.length)],
    );
    // Guarantee at least 2 matching
    s[0] = s[1] = SYMS[Math.floor(Math.random() * SYMS.length)];
    setSymbols(s);
    setScratched(Array(9).fill(false));
    setDone(false);
    setShowWin(false);
  };

  const scratch = (i: number) => {
    if (done || symbols.length === 0) return;
    const newScratched = [...scratched];
    newScratched[i] = true;
    setScratched(newScratched);
    if (newScratched.every(Boolean)) {
      const counts: Record<string, number> = {};
      for (const s of symbols) counts[s] = (counts[s] || 0) + 1;
      const maxMatch = Math.max(...Object.values(counts));
      const mult = maxMatch >= 3 ? 5 : maxMatch >= 2 ? 1.5 : 0;
      const payout = Number.parseFloat((stake * mult).toFixed(2));
      if (payout > 0) {
        creditUserBalance(currentUser!.id, payout);
        if (mult >= 5) {
          setShowWin(true);
          setTimeout(() => setShowWin(false), 2000);
        }
      }
      addCasinoHistory({
        userId: currentUser!.id,
        game: "scratch",
        roundId: genId(),
        bet: "scratch",
        stake,
        result: `${maxMatch} match`,
        pnl: payout - stake,
        placedAt: new Date().toISOString(),
      });
      setDone(true);
      if (payout > 0)
        toast.success(
          `🎟️ ${maxMatch} in a row! ${mult}x! +₹${(payout - stake).toFixed(2)}`,
        );
      else toast.error(`No win. Lost ₹${stake}`);
    }
  };

  return (
    <GameShell title="Scratch Cards" icon="🎟️" onBack={onBack}>
      <AnimatePresence>
        {showWin && <WinOverlay show={showWin} />}
      </AnimatePresence>
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        {symbols.length === 0 && (
          <>
            <StakeInput stake={stake} setStake={setStake} />
            <Button
              onClick={buyCard}
              className="w-full h-11 font-bold text-background"
              style={{
                background:
                  "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
              }}
              data-ocid="scratch.buy_button"
            >
              🎟️ Buy Card
            </Button>
          </>
        )}
        {symbols.length > 0 && (
          <>
            <p className="text-xs text-center text-muted-foreground">
              Tap to scratch each tile!
            </p>
            <div className="grid grid-cols-3 gap-2">
              {symbols.map((sym, i) => (
                <motion.button
                  key={`scratch-${i}`}
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => scratch(i)}
                  className="aspect-square rounded-xl flex items-center justify-center text-2xl transition-all border"
                  style={{
                    background: scratched[i]
                      ? "oklch(var(--secondary))"
                      : "oklch(var(--gold) / 0.3)",
                    borderColor: scratched[i]
                      ? "oklch(var(--border))"
                      : "oklch(var(--gold))",
                  }}
                  data-ocid={`scratch.tile.${i + 1}`}
                >
                  {scratched[i] ? sym : "🔘"}
                </motion.button>
              ))}
            </div>
            {done && (
              <Button
                onClick={buyCard}
                className="w-full h-11 font-bold text-background"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
                }}
              >
                Buy New Card
              </Button>
            )}
          </>
        )}
      </div>
    </GameShell>
  );
}

// ─── Satta Matka ─────────────────────────────────────────────────────────────
function SattaMatkaGame({ onBack }: { onBack: () => void }) {
  const { currentUser, debitUserBalance, creditUserBalance, addCasinoHistory } =
    useStore();
  const [stake, setStake] = useState(100);
  const [pick, setPick] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [showWin, setShowWin] = useState(false);

  const play = async () => {
    if (!currentUser) return toast.error("Please login");
    if (currentUser.balance < stake) return toast.error("Insufficient balance");
    const num = Number.parseInt(pick);
    if (Number.isNaN(num) || num < 0 || num > 9)
      return toast.error("Pick a digit 0-9");
    debitUserBalance(currentUser.id, stake);
    setPlaying(true);
    await new Promise((r) => setTimeout(r, 1000));
    const outcome = Math.floor(Math.random() * 10);
    const won = outcome === num;
    const payout = won ? Number.parseFloat((stake * 9).toFixed(2)) : 0;
    if (won) {
      creditUserBalance(currentUser.id, payout);
      setShowWin(true);
      setTimeout(() => setShowWin(false), 2000);
    }
    addCasinoHistory({
      userId: currentUser.id,
      game: "sattamatka",
      roundId: genId(),
      bet: String(num),
      stake,
      result: String(outcome),
      pnl: won ? payout - stake : -stake,
      placedAt: new Date().toISOString(),
    });
    setResult(String(outcome));
    setPlaying(false);
    if (won)
      toast.success(`🎯 ${outcome}! Win 9x! +₹${(payout - stake).toFixed(2)}`);
    else toast.error(`🎯 Result: ${outcome}. Lost ₹${stake}`);
  };

  return (
    <GameShell title="Satta Matka" icon="🎯" onBack={onBack}>
      <AnimatePresence>
        {showWin && <WinOverlay show={showWin} />}
      </AnimatePresence>
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <p className="text-xs text-muted-foreground text-center">
          Pick a digit 0-9. Win 9x if correct!
        </p>
        {result && (
          <div
            className="text-center text-5xl font-bold font-mono py-4"
            style={{
              color:
                result === pick
                  ? "oklch(0.65 0.18 145)"
                  : "oklch(0.62 0.22 20)",
            }}
          >
            {result}
          </div>
        )}
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 10 }, (_, i) => (
            <button
              key={`pick-${i}`}
              type="button"
              onClick={() => setPick(String(i))}
              disabled={playing}
              className="aspect-square rounded-xl text-xl font-bold border-2 transition-all"
              style={{
                background:
                  pick === String(i)
                    ? "oklch(var(--gold) / 0.2)"
                    : "oklch(var(--secondary))",
                borderColor:
                  pick === String(i)
                    ? "oklch(var(--gold))"
                    : "oklch(var(--border))",
              }}
              data-ocid={`matka.digit.${i}`}
            >
              {i}
            </button>
          ))}
        </div>
        <StakeInput stake={stake} setStake={setStake} disabled={playing} />
        <Button
          onClick={play}
          disabled={playing || pick === ""}
          className="w-full h-11 font-bold text-background"
          style={{
            background:
              "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
          }}
          data-ocid="matka.play_button"
        >
          {playing ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "🎯 Play"
          )}
        </Button>
      </div>
    </GameShell>
  );
}

// ─── All Simple game configs ──────────────────────────────────────────────────
const SIMPLE_GAME_CONFIGS: Record<string, SimpleGameConfig> = {
  baccarat: {
    title: "Baccarat",
    icon: "🎴",
    gameName: "baccarat",
    description: "Bet on Player, Banker, or Tie!",
    options: [
      {
        label: "👤 Player",
        value: "player",
        color: "oklch(var(--back))",
        mult: 1.95,
      },
      {
        label: "🏦 Banker",
        value: "banker",
        color: "oklch(0.62 0.22 20)",
        mult: 1.9,
      },
      { label: "🤝 Tie", value: "tie", color: "oklch(var(--gold))", mult: 8 },
    ],
  },
  dragontiger: {
    title: "Dragon Tiger",
    icon: "🐉",
    gameName: "dragontiger",
    description: "Dragon or Tiger — highest card wins!",
    options: [
      {
        label: "🐉 Dragon",
        value: "dragon",
        color: "oklch(0.62 0.22 20)",
        mult: 1.95,
      },
      {
        label: "🐯 Tiger",
        value: "tiger",
        color: "oklch(var(--back))",
        mult: 1.95,
      },
      { label: "🤝 Tie", value: "tie", color: "oklch(var(--gold))", mult: 8 },
    ],
  },
  reddog: {
    title: "Red Dog",
    icon: "🐕",
    gameName: "reddog",
    description: "Bet if next card falls between the two dealt!",
    options: [
      {
        label: "📊 Spread",
        value: "spread",
        color: "oklch(var(--back))",
        mult: 2,
      },
      { label: "🎯 Tie", value: "tie", color: "oklch(var(--gold))", mult: 5 },
    ],
  },
  videopoker: {
    title: "Video Poker",
    icon: "♠️",
    gameName: "videopoker",
    description: "Jacks or Better — pick your hand!",
    options: [
      {
        label: "♠ Hold",
        value: "hold",
        color: "oklch(0.25 0.01 265)",
        mult: 1.5,
      },
      {
        label: "♥ Draw",
        value: "draw",
        color: "oklch(0.62 0.22 20)",
        mult: 2.5,
      },
      { label: "🃏 Fold", value: "fold", color: "oklch(var(--gold))", mult: 0 },
    ],
  },
  bura: {
    title: "Bura",
    icon: "🃏",
    gameName: "bura",
    description: "Indian card game — pick the higher set!",
    options: [
      { label: "Set A", value: "a", color: "oklch(var(--back))", mult: 1.9 },
      { label: "Set B", value: "b", color: "oklch(0.62 0.22 20)", mult: 1.9 },
    ],
  },
  americanroulette: {
    title: "American Roulette",
    icon: "🎰",
    gameName: "americanroulette",
    description: "Double-zero roulette — Red, Black, Green!",
    options: [
      {
        label: "🔴 Red",
        value: "red",
        color: "oklch(0.62 0.22 20)",
        mult: 1.95,
      },
      {
        label: "⚫ Black",
        value: "black",
        color: "oklch(0.25 0.01 265)",
        mult: 1.95,
      },
      {
        label: "🟢 Green",
        value: "green",
        color: "oklch(0.45 0.18 145)",
        mult: 14,
      },
    ],
  },
  sicbo: {
    title: "Sic Bo",
    icon: "🎲",
    gameName: "sicbo",
    description: "Three dice — bet Small (3-10) or Big (11-18)!",
    options: [
      {
        label: "📉 Small\n3-10",
        value: "small",
        color: "oklch(var(--back))",
        mult: 1.9,
      },
      {
        label: "📈 Big\n11-18",
        value: "big",
        color: "oklch(0.62 0.22 20)",
        mult: 1.9,
      },
      {
        label: "🎲 Triple",
        value: "triple",
        color: "oklch(var(--gold))",
        mult: 24,
      },
    ],
  },
  jacksorbetter: {
    title: "Jacks or Better",
    icon: "♠️",
    gameName: "jacksorbetter",
    description: "Video poker — pair of Jacks or better wins!",
    options: [
      {
        label: "♠ Hold All",
        value: "hold",
        color: "oklch(0.25 0.01 265)",
        mult: 2,
      },
      {
        label: "♦ Draw 3",
        value: "draw3",
        color: "oklch(0.62 0.22 20)",
        mult: 3,
      },
      {
        label: "♥ Draw All",
        value: "drawall",
        color: "oklch(var(--saffron))",
        mult: 5,
      },
    ],
  },
  deuceswild: {
    title: "Deuces Wild",
    icon: "🃏",
    gameName: "deuceswild",
    description: "All 2s are wild! Hit the Royal Flush!",
    options: [
      {
        label: "♠ 1 Deuce",
        value: "one",
        color: "oklch(0.25 0.01 265)",
        mult: 2,
      },
      {
        label: "♦ 2 Deuces",
        value: "two",
        color: "oklch(0.55 0.18 240)",
        mult: 5,
      },
      {
        label: "🃏 Wild Royal",
        value: "wild",
        color: "oklch(var(--gold))",
        mult: 25,
      },
    ],
  },
  craps: {
    title: "Craps",
    icon: "🎲",
    gameName: "craps",
    description: "Roll the dice! Pass or Don't Pass!",
    options: [
      {
        label: "✅ Pass",
        value: "pass",
        color: "oklch(0.65 0.18 145)",
        mult: 1.9,
      },
      {
        label: "❌ Don't Pass",
        value: "nopass",
        color: "oklch(0.62 0.22 20)",
        mult: 1.9,
      },
      {
        label: "7️⃣ Any 7",
        value: "seven",
        color: "oklch(var(--gold))",
        mult: 4,
      },
    ],
  },
  crownanchor: {
    title: "Crown & Anchor",
    icon: "⚓",
    gameName: "crownanchor",
    description: "Naval dice game — pick a symbol!",
    options: [
      {
        label: "⚓ Anchor",
        value: "anchor",
        color: "oklch(0.55 0.18 240)",
        mult: 3,
      },
      {
        label: "👑 Crown",
        value: "crown",
        color: "oklch(var(--gold))",
        mult: 3,
      },
      {
        label: "❤️ Heart",
        value: "heart",
        color: "oklch(0.62 0.22 20)",
        mult: 3,
      },
    ],
  },
  headstails3d: {
    title: "Heads & Tails 3D",
    icon: "🪙",
    gameName: "headstails3d",
    description: "3D animated coin flip!",
    options: [
      {
        label: "👑 Heads",
        value: "heads",
        color: "oklch(0.78 0.15 85)",
        mult: 1.95,
      },
      {
        label: "🦅 Tails",
        value: "tails",
        color: "oklch(0.55 0.18 240)",
        mult: 1.95,
      },
    ],
  },
  luckycard: {
    title: "Lucky Card",
    icon: "🍀",
    gameName: "luckycard",
    description: "Pick the lucky card!",
    options: [
      {
        label: "🍀 Lucky",
        value: "lucky",
        color: "oklch(0.65 0.18 145)",
        mult: 2.9,
      },
      {
        label: "💀 Unlucky",
        value: "unlucky",
        color: "oklch(0.62 0.22 20)",
        mult: 0,
      },
      {
        label: "⭐ Star",
        value: "star",
        color: "oklch(var(--gold))",
        mult: 1.5,
      },
    ],
  },
  penaltyshootout: {
    title: "Penalty Shootout",
    icon: "⚽",
    gameName: "penaltyshootout",
    description: "Pick the corner to shoot!",
    options: [
      {
        label: "↖️ Top Left",
        value: "tl",
        color: "oklch(var(--back))",
        mult: 2.8,
      },
      {
        label: "↗️ Top Right",
        value: "tr",
        color: "oklch(0.62 0.22 20)",
        mult: 2.8,
      },
      {
        label: "⬅️ Left",
        value: "l",
        color: "oklch(var(--saffron))",
        mult: 1.9,
      },
      {
        label: "➡️ Right",
        value: "r",
        color: "oklch(0.55 0.18 240)",
        mult: 1.9,
      },
    ],
  },
  spacexy: {
    title: "Space XY",
    icon: "🚀",
    gameName: "spacexy",
    description: "Rocket crash game — cash out before it explodes!",
    options: [
      { label: "1.5x", value: "1.5", color: "oklch(var(--back))", mult: 1.5 },
      { label: "2x", value: "2", color: "oklch(var(--gold))", mult: 2 },
      { label: "5x", value: "5", color: "oklch(0.65 0.18 145)", mult: 5 },
    ],
  },
  jetx: {
    title: "JetX",
    icon: "✈️",
    gameName: "jetx",
    description: "Jet crash — pick your multiplier target!",
    options: [
      {
        label: "1.5x Safe",
        value: "1.5",
        color: "oklch(var(--back))",
        mult: 1.5,
      },
      { label: "3x Medium", value: "3", color: "oklch(var(--gold))", mult: 3 },
      {
        label: "10x Risky",
        value: "10",
        color: "oklch(0.65 0.18 145)",
        mult: 10,
      },
    ],
  },
  bubbles: {
    title: "Bubbles",
    icon: "🫧",
    gameName: "bubbles",
    description: "Pop the right bubble to win!",
    options: [
      {
        label: "🔵 Blue",
        value: "blue",
        color: "oklch(0.55 0.18 240)",
        mult: 1.9,
      },
      {
        label: "🟡 Gold",
        value: "gold",
        color: "oklch(var(--gold))",
        mult: 2.5,
      },
      {
        label: "🟢 Green",
        value: "green",
        color: "oklch(0.65 0.18 145)",
        mult: 3,
      },
      { label: "🔴 Red", value: "red", color: "oklch(0.62 0.22 20)", mult: 5 },
    ],
  },
  ballcup: {
    title: "Ball & Cup",
    icon: "🎩",
    gameName: "ballcup",
    description: "Find the ball under the cup!",
    options: [
      {
        label: "🎩 Cup 1",
        value: "cup1",
        color: "oklch(var(--back))",
        mult: 2.9,
      },
      {
        label: "🎩 Cup 2",
        value: "cup2",
        color: "oklch(var(--gold))",
        mult: 2.9,
      },
      {
        label: "🎩 Cup 3",
        value: "cup3",
        color: "oklch(0.55 0.18 240)",
        mult: 2.9,
      },
    ],
  },
  fruitblast: {
    title: "Fruit Blast",
    icon: "🍓",
    gameName: "fruitblast",
    description: "Match the fruit to win!",
    options: [
      {
        label: "🍓 Strawberry",
        value: "strawberry",
        color: "oklch(0.62 0.22 20)",
        mult: 2,
      },
      {
        label: "🍋 Lemon",
        value: "lemon",
        color: "oklch(0.78 0.15 85)",
        mult: 2,
      },
      {
        label: "🍇 Grapes",
        value: "grapes",
        color: "oklch(0.55 0.18 240)",
        mult: 4,
      },
    ],
  },
  rps: {
    title: "Rock Paper Scissors",
    icon: "✊",
    gameName: "rps",
    description: "Beat the computer!",
    options: [
      {
        label: "✊ Rock",
        value: "rock",
        color: "oklch(0.55 0.01 265)",
        mult: 1.9,
      },
      {
        label: "✋ Paper",
        value: "paper",
        color: "oklch(0.65 0.18 145)",
        mult: 1.9,
      },
      {
        label: "✌️ Scissors",
        value: "scissors",
        color: "oklch(0.62 0.22 20)",
        mult: 1.9,
      },
    ],
  },
  kamikaze: {
    title: "Kamikaze",
    icon: "💥",
    gameName: "kamikaze",
    description: "High risk crash game — go big or go home!",
    options: [
      { label: "2x Safe", value: "2", color: "oklch(var(--back))", mult: 2 },
      { label: "5x Bold", value: "5", color: "oklch(var(--gold))", mult: 5 },
      {
        label: "20x Kamikaze",
        value: "20",
        color: "oklch(0.62 0.22 20)",
        mult: 20,
      },
    ],
  },
  minesweeper: {
    title: "Minesweeper",
    icon: "💣",
    gameName: "minesweeper",
    description: "Pick a safe zone! Avoid the mines!",
    options: [
      {
        label: "Zone A",
        value: "a",
        color: "oklch(0.65 0.18 145)",
        mult: 1.85,
      },
      { label: "Zone B", value: "b", color: "oklch(var(--back))", mult: 1.85 },
      {
        label: "Zone C",
        value: "c",
        color: "oklch(0.55 0.18 240)",
        mult: 1.85,
      },
    ],
  },
  cryptos: {
    title: "Cryptos",
    icon: "₿",
    gameName: "cryptos",
    description: "Will the price go UP or DOWN?",
    options: [
      { label: "📈 Up", value: "up", color: "oklch(0.65 0.18 145)", mult: 1.9 },
      {
        label: "📉 Down",
        value: "down",
        color: "oklch(0.62 0.22 20)",
        mult: 1.9,
      },
    ],
  },
  hashdice: {
    title: "Hash Dice",
    icon: "🔐",
    gameName: "hashdice",
    description: "Provably fair dice roll!",
    options: [
      {
        label: "📈 Over 50",
        value: "over",
        color: "oklch(0.65 0.18 145)",
        mult: 1.96,
      },
      {
        label: "📉 Under 50",
        value: "under",
        color: "oklch(0.62 0.22 20)",
        mult: 1.96,
      },
    ],
  },
  jailbreak: {
    title: "Jailbreak",
    icon: "🔓",
    gameName: "jailbreak",
    description: "Escape through the right door!",
    options: [
      {
        label: "🚪 Door 1",
        value: "d1",
        color: "oklch(0.55 0.18 240)",
        mult: 2.8,
      },
      {
        label: "🚪 Door 2",
        value: "d2",
        color: "oklch(var(--gold))",
        mult: 2.8,
      },
      {
        label: "🚪 Door 3",
        value: "d3",
        color: "oklch(0.65 0.18 145)",
        mult: 2.8,
      },
    ],
  },
  goal: {
    title: "Goal",
    icon: "⚽",
    gameName: "goal",
    description: "Score a goal — pick your direction!",
    options: [
      {
        label: "⬅️ Left",
        value: "left",
        color: "oklch(var(--back))",
        mult: 1.9,
      },
      {
        label: "⬆️ Centre",
        value: "centre",
        color: "oklch(0.65 0.18 145)",
        mult: 1.9,
      },
      {
        label: "➡️ Right",
        value: "right",
        color: "oklch(0.62 0.22 20)",
        mult: 1.9,
      },
    ],
  },
  wildwest: {
    title: "Wild West Duel",
    icon: "🤠",
    gameName: "wildwest",
    description: "Quick draw — faster is better!",
    options: [
      {
        label: "🔫 Quick Draw",
        value: "quick",
        color: "oklch(0.62 0.22 20)",
        mult: 1.9,
      },
      {
        label: "🎯 Aimed Shot",
        value: "aimed",
        color: "oklch(var(--gold))",
        mult: 3,
      },
    ],
  },
  sherlock: {
    title: "Sherlock Clues",
    icon: "🔍",
    gameName: "sherlock",
    description: "Find the clue in 3 locations!",
    options: [
      {
        label: "🏠 Baker St",
        value: "baker",
        color: "oklch(0.55 0.18 240)",
        mult: 2.8,
      },
      {
        label: "🏛️ Museum",
        value: "museum",
        color: "oklch(var(--gold))",
        mult: 2.8,
      },
      {
        label: "🌉 Bridge",
        value: "bridge",
        color: "oklch(var(--back))",
        mult: 2.8,
      },
    ],
  },
  egyptian: {
    title: "Egyptian Treasure",
    icon: "🏺",
    gameName: "egyptian",
    description: "Open the right sarcophagus!",
    options: [
      {
        label: "🏺 Sarcophagus A",
        value: "a",
        color: "oklch(0.78 0.15 85)",
        mult: 2.8,
      },
      {
        label: "🐱 Cat God",
        value: "b",
        color: "oklch(var(--gold))",
        mult: 2.8,
      },
      {
        label: "🔺 Pyramid",
        value: "c",
        color: "oklch(0.62 0.22 20)",
        mult: 2.8,
      },
    ],
  },
  megaball: {
    title: "Mega Ball",
    icon: "🎱",
    gameName: "megaball",
    description: "Pick the Mega Ball number (1-10)!",
    options: [
      {
        label: "1-3 Range",
        value: "low",
        color: "oklch(var(--back))",
        mult: 2.5,
      },
      {
        label: "4-7 Range",
        value: "mid",
        color: "oklch(var(--gold))",
        mult: 1.8,
      },
      {
        label: "8-10 Range",
        value: "high",
        color: "oklch(0.65 0.18 145)",
        mult: 2.5,
      },
    ],
  },
  candydreams: {
    title: "Candy Dreams",
    icon: "🍬",
    gameName: "candydreams",
    description: "Match the candy for a sweet win!",
    options: [
      {
        label: "🍬 Candy",
        value: "candy",
        color: "oklch(0.62 0.22 20)",
        mult: 1.9,
      },
      {
        label: "🍭 Lollipop",
        value: "lolly",
        color: "oklch(var(--saffron))",
        mult: 2.5,
      },
      {
        label: "🍫 Chocolate",
        value: "choc",
        color: "oklch(0.55 0.01 265)",
        mult: 3.5,
      },
    ],
  },
  magicwheel: {
    title: "Magic Wheel",
    icon: "✨",
    gameName: "magicwheel",
    description: "Special multiplier wheel — anything can happen!",
    options: [
      { label: "✨ 2x", value: "2x", color: "oklch(var(--back))", mult: 2 },
      { label: "⭐ 5x", value: "5x", color: "oklch(var(--gold))", mult: 5 },
      {
        label: "🌟 10x",
        value: "10x",
        color: "oklch(0.65 0.18 145)",
        mult: 10,
      },
      {
        label: "💫 50x",
        value: "50x",
        color: "oklch(0.55 0.18 240)",
        mult: 50,
      },
    ],
  },
  teenpatti_simple: {
    title: "Teen Patti",
    icon: "🂠",
    gameName: "teenpatti_simple",
    description: "Indian poker — Player A vs Player B!",
    options: [
      {
        label: "🅰️ Player A",
        value: "player_a",
        color: "oklch(var(--back))",
        mult: 1.9,
      },
      { label: "🤝 Tie", value: "tie", color: "oklch(var(--gold))", mult: 8 },
      {
        label: "🅱️ Player B",
        value: "player_b",
        color: "oklch(0.62 0.22 20)",
        mult: 1.9,
      },
    ],
  },
  andarbahar_simple: {
    title: "Andar Bahar",
    icon: "🃏",
    gameName: "andarbahar_simple",
    description: "Classic Indian card game!",
    options: [
      {
        label: "⬅️ Andar",
        value: "andar",
        color: "oklch(var(--back))",
        mult: 1.9,
      },
      {
        label: "➡️ Bahar",
        value: "bahar",
        color: "oklch(var(--saffron))",
        mult: 1.9,
      },
    ],
  },
};

// ─── GAME REGISTRY ────────────────────────────────────────────────────────────
interface GameEntry {
  id: string;
  title: string;
  icon: string;
  category: string;
  players: string;
  color: string;
}

const ALL_GAMES: GameEntry[] = [
  // Instant Win
  {
    id: "mines",
    title: "Mines",
    icon: "💣",
    category: "instant",
    players: "3.2k",
    color: "from-rose-600/30 to-red-600/30",
  },
  {
    id: "limbo",
    title: "Limbo",
    icon: "📈",
    category: "instant",
    players: "1.8k",
    color: "from-blue-600/30 to-cyan-600/30",
  },
  {
    id: "coinflip",
    title: "Coin Flip",
    icon: "🪙",
    category: "instant",
    players: "2.1k",
    color: "from-yellow-600/30 to-amber-600/30",
  },
  {
    id: "diamonds",
    title: "Diamonds",
    icon: "💎",
    category: "instant",
    players: "1.5k",
    color: "from-cyan-600/30 to-blue-600/30",
  },
  {
    id: "tower",
    title: "Tower",
    icon: "🏗️",
    category: "instant",
    players: "2.4k",
    color: "from-orange-600/30 to-yellow-600/30",
  },
  {
    id: "stairs",
    title: "Stairs",
    icon: "🪜",
    category: "instant",
    players: "1.9k",
    color: "from-green-600/30 to-emerald-600/30",
  },
  {
    id: "wheel",
    title: "Wheel of Fortune",
    icon: "🎡",
    category: "instant",
    players: "2.8k",
    color: "from-purple-600/30 to-pink-600/30",
  },
  {
    id: "aviator_ref",
    title: "Aviator",
    icon: "✈️",
    category: "instant",
    players: "4.1k",
    color: "from-red-600/30 to-orange-600/30",
  },
  {
    id: "plinko_ref",
    title: "Plinko",
    icon: "🎯",
    category: "instant",
    players: "2.6k",
    color: "from-indigo-600/30 to-violet-600/30",
  },
  {
    id: "dice_ref",
    title: "Classic Dice",
    icon: "🎲",
    category: "instant",
    players: "3.5k",
    color: "from-teal-600/30 to-green-600/30",
  },
  // Cards
  {
    id: "hilo",
    title: "Hi-Lo",
    icon: "↕️",
    category: "cards",
    players: "1.7k",
    color: "from-violet-600/30 to-purple-600/30",
  },
  {
    id: "blackjack",
    title: "Blackjack",
    icon: "🃏",
    category: "cards",
    players: "2.3k",
    color: "from-slate-600/30 to-gray-600/30",
  },
  {
    id: "baccarat",
    title: "Baccarat",
    icon: "🎴",
    category: "cards",
    players: "1.4k",
    color: "from-red-600/30 to-rose-600/30",
  },
  {
    id: "dragontiger",
    title: "Dragon Tiger",
    icon: "🐉",
    category: "cards",
    players: "2.0k",
    color: "from-orange-600/30 to-red-600/30",
  },
  {
    id: "reddog",
    title: "Red Dog",
    icon: "🐕",
    category: "cards",
    players: "0.9k",
    color: "from-red-600/30 to-orange-600/30",
  },
  {
    id: "keno",
    title: "Keno",
    icon: "🎱",
    category: "cards",
    players: "1.2k",
    color: "from-blue-600/30 to-indigo-600/30",
  },
  {
    id: "videopoker",
    title: "Video Poker",
    icon: "♠️",
    category: "cards",
    players: "1.1k",
    color: "from-gray-600/30 to-slate-600/30",
  },
  {
    id: "teenpatti_simple",
    title: "Teen Patti",
    icon: "🂠",
    category: "cards",
    players: "5.2k",
    color: "from-yellow-600/30 to-orange-600/30",
  },
  {
    id: "andarbahar_simple",
    title: "Andar Bahar",
    icon: "🃏",
    category: "cards",
    players: "4.8k",
    color: "from-green-600/30 to-teal-600/30",
  },
  {
    id: "bura",
    title: "Bura",
    icon: "🃏",
    category: "cards",
    players: "0.8k",
    color: "from-amber-600/30 to-yellow-600/30",
  },
  // Table/Casino
  {
    id: "roulette_ref",
    title: "European Roulette",
    icon: "🎰",
    category: "table",
    players: "1.8k",
    color: "from-red-600/30 to-rose-600/30",
  },
  {
    id: "americanroulette",
    title: "American Roulette",
    icon: "🎰",
    category: "table",
    players: "1.1k",
    color: "from-rose-600/30 to-pink-600/30",
  },
  {
    id: "sicbo",
    title: "Sic Bo",
    icon: "🎲",
    category: "table",
    players: "0.7k",
    color: "from-orange-600/30 to-yellow-600/30",
  },
  {
    id: "jacksorbetter",
    title: "Jacks or Better",
    icon: "♠️",
    category: "table",
    players: "0.6k",
    color: "from-slate-600/30 to-gray-600/30",
  },
  {
    id: "deuceswild",
    title: "Deuces Wild",
    icon: "🃏",
    category: "table",
    players: "0.5k",
    color: "from-blue-600/30 to-slate-600/30",
  },
  {
    id: "craps",
    title: "Craps",
    icon: "🎲",
    category: "table",
    players: "0.9k",
    color: "from-green-600/30 to-lime-600/30",
  },
  {
    id: "crownanchor",
    title: "Crown & Anchor",
    icon: "⚓",
    category: "table",
    players: "0.4k",
    color: "from-cyan-600/30 to-blue-600/30",
  },
  {
    id: "headstails3d",
    title: "Heads & Tails 3D",
    icon: "🪙",
    category: "table",
    players: "1.3k",
    color: "from-yellow-600/30 to-amber-600/30",
  },
  {
    id: "luckycard",
    title: "Lucky Card",
    icon: "🍀",
    category: "table",
    players: "1.0k",
    color: "from-emerald-600/30 to-green-600/30",
  },
  {
    id: "penaltyshootout",
    title: "Penalty Shootout",
    icon: "⚽",
    category: "table",
    players: "2.1k",
    color: "from-lime-600/30 to-green-600/30",
  },
  // Arcade
  {
    id: "spacexy",
    title: "Space XY",
    icon: "🚀",
    category: "arcade",
    players: "1.6k",
    color: "from-indigo-600/30 to-blue-600/30",
  },
  {
    id: "jetx",
    title: "JetX",
    icon: "✈️",
    category: "arcade",
    players: "2.0k",
    color: "from-sky-600/30 to-cyan-600/30",
  },
  {
    id: "bubbles",
    title: "Bubbles",
    icon: "🫧",
    category: "arcade",
    players: "1.2k",
    color: "from-cyan-600/30 to-teal-600/30",
  },
  {
    id: "ballcup",
    title: "Ball & Cup",
    icon: "🎩",
    category: "arcade",
    players: "0.8k",
    color: "from-purple-600/30 to-violet-600/30",
  },
  {
    id: "fruitblast",
    title: "Fruit Blast",
    icon: "🍓",
    category: "arcade",
    players: "1.5k",
    color: "from-red-600/30 to-pink-600/30",
  },
  {
    id: "scratch",
    title: "Scratch Cards",
    icon: "🎟️",
    category: "arcade",
    players: "2.4k",
    color: "from-amber-600/30 to-orange-600/30",
  },
  {
    id: "rps",
    title: "Rock Paper Scissors",
    icon: "✊",
    category: "arcade",
    players: "1.9k",
    color: "from-gray-600/30 to-slate-600/30",
  },
  {
    id: "kamikaze",
    title: "Kamikaze",
    icon: "💥",
    category: "arcade",
    players: "1.1k",
    color: "from-orange-600/30 to-red-600/30",
  },
  {
    id: "minesweeper",
    title: "Minesweeper",
    icon: "💣",
    category: "arcade",
    players: "0.9k",
    color: "from-yellow-600/30 to-lime-600/30",
  },
  {
    id: "cryptos",
    title: "Cryptos",
    icon: "₿",
    category: "arcade",
    players: "1.7k",
    color: "from-orange-600/30 to-yellow-600/30",
  },
  // Advanced
  {
    id: "hashdice",
    title: "Hash Dice",
    icon: "🔐",
    category: "advanced",
    players: "0.6k",
    color: "from-slate-600/30 to-zinc-600/30",
  },
  {
    id: "sattamatka",
    title: "Satta Matka",
    icon: "🎯",
    category: "advanced",
    players: "3.8k",
    color: "from-green-600/30 to-emerald-600/30",
  },
  {
    id: "jailbreak",
    title: "Jailbreak",
    icon: "🔓",
    category: "advanced",
    players: "0.7k",
    color: "from-zinc-600/30 to-gray-600/30",
  },
  {
    id: "goal",
    title: "Goal",
    icon: "⚽",
    category: "advanced",
    players: "1.4k",
    color: "from-lime-600/30 to-green-600/30",
  },
  {
    id: "wildwest",
    title: "Wild West Duel",
    icon: "🤠",
    category: "advanced",
    players: "0.8k",
    color: "from-amber-600/30 to-orange-600/30",
  },
  {
    id: "sherlock",
    title: "Sherlock Clues",
    icon: "🔍",
    category: "advanced",
    players: "0.5k",
    color: "from-blue-600/30 to-indigo-600/30",
  },
  {
    id: "egyptian",
    title: "Egyptian Treasure",
    icon: "🏺",
    category: "advanced",
    players: "0.6k",
    color: "from-yellow-600/30 to-amber-600/30",
  },
  {
    id: "megaball",
    title: "Mega Ball",
    icon: "🎱",
    category: "advanced",
    players: "0.9k",
    color: "from-purple-600/30 to-pink-600/30",
  },
  {
    id: "candydreams",
    title: "Candy Dreams",
    icon: "🍬",
    category: "advanced",
    players: "1.0k",
    color: "from-pink-600/30 to-rose-600/30",
  },
  {
    id: "magicwheel",
    title: "Magic Wheel",
    icon: "✨",
    category: "advanced",
    players: "1.2k",
    color: "from-violet-600/30 to-purple-600/30",
  },
];

const CATEGORY_INFO = {
  instant: { label: "Instant Win", icon: "⚡" },
  cards: { label: "Cards", icon: "🃏" },
  table: { label: "Table / Casino", icon: "🎰" },
  arcade: { label: "Arcade & Special", icon: "🕹️" },
  advanced: { label: "Advanced", icon: "🔥" },
};

// ─── Game Renderer ────────────────────────────────────────────────────────────
function renderGame(gameId: string, onBack: () => void): ReactNode {
  switch (gameId) {
    case "mines":
      return <MinesGame onBack={onBack} />;
    case "limbo":
      return <LimboGame onBack={onBack} />;
    case "coinflip":
      return <CoinFlipGame onBack={onBack} />;
    case "diamonds":
      return <DiamondsGame onBack={onBack} />;
    case "tower":
      return <TowerGame onBack={onBack} />;
    case "stairs":
      return <StairsGame onBack={onBack} />;
    case "wheel":
      return <WheelGame onBack={onBack} />;
    case "hilo":
      return <HiLoGame onBack={onBack} />;
    case "blackjack":
      return <BlackjackGame onBack={onBack} />;
    case "keno":
      return <KenoGame onBack={onBack} />;
    case "scratch":
      return <ScratchCardGame onBack={onBack} />;
    case "sattamatka":
      return <SattaMatkaGame onBack={onBack} />;
    case "aviator_ref":
      return (
        <GameShell title="Aviator" icon="✈️" onBack={onBack}>
          <div className="rounded-xl border border-border bg-card p-6 text-center space-y-3">
            <div className="text-5xl">✈️</div>
            <p className="text-muted-foreground text-sm">
              Aviator is available in the Crash section!
            </p>
            <Button
              onClick={onBack}
              className="font-bold text-background"
              style={{
                background:
                  "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
              }}
            >
              ← Go Back
            </Button>
          </div>
        </GameShell>
      );
    case "plinko_ref":
      return (
        <GameShell title="Plinko" icon="🎯" onBack={onBack}>
          <div className="rounded-xl border border-border bg-card p-6 text-center space-y-3">
            <div className="text-5xl">🎯</div>
            <p className="text-muted-foreground text-sm">
              Plinko is available in the Crash section!
            </p>
            <Button
              onClick={onBack}
              className="font-bold text-background"
              style={{
                background:
                  "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
              }}
            >
              ← Go Back
            </Button>
          </div>
        </GameShell>
      );
    case "dice_ref":
      return (
        <GameShell title="Classic Dice" icon="🎲" onBack={onBack}>
          <div className="rounded-xl border border-border bg-card p-6 text-center space-y-3">
            <div className="text-5xl">🎲</div>
            <p className="text-muted-foreground text-sm">
              Classic Dice is available in the Crash section!
            </p>
            <Button
              onClick={onBack}
              className="font-bold text-background"
              style={{
                background:
                  "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
              }}
            >
              ← Go Back
            </Button>
          </div>
        </GameShell>
      );
    case "roulette_ref":
      return (
        <GameShell title="European Roulette" icon="🎰" onBack={onBack}>
          <div className="rounded-xl border border-border bg-card p-6 text-center space-y-3">
            <div className="text-5xl">🎰</div>
            <p className="text-muted-foreground text-sm">
              European Roulette is available in the Casino section!
            </p>
            <Button
              onClick={onBack}
              className="font-bold text-background"
              style={{
                background:
                  "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
              }}
            >
              ← Go Back
            </Button>
          </div>
        </GameShell>
      );
    default: {
      const config = SIMPLE_GAME_CONFIGS[gameId];
      if (config) return <SimpleGame config={config} onBack={onBack} />;
      return (
        <GameShell title="Game" icon="🎮" onBack={onBack}>
          <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
            Coming Soon
          </div>
        </GameShell>
      );
    }
  }
}

// ─── Games Lobby ─────────────────────────────────────────────────────────────
export function GamesLobby() {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  if (activeGame) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        {renderGame(activeGame, () => setActiveGame(null))}
      </div>
    );
  }

  const filtered = search
    ? ALL_GAMES.filter(
        (g) =>
          g.title.toLowerCase().includes(search.toLowerCase()) ||
          g.icon.includes(search),
      )
    : null;

  const categories = [
    "instant",
    "cards",
    "table",
    "arcade",
    "advanced",
  ] as const;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🎮</span>
        <h1 className="text-lg font-bold text-foreground">Games Lobby</h1>
        <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full font-bold">
          {ALL_GAMES.length} Games
        </span>
      </div>

      {/* Search */}
      <div className="mb-5">
        <Input
          placeholder="Search games..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-input border-border h-10"
          data-ocid="games.search_input"
        />
      </div>

      {/* Search results */}
      {filtered && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {filtered.map((game) => (
            <motion.button
              key={game.id}
              type="button"
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setActiveGame(game.id)}
              className="relative bg-[#161d2f] border border-white/5 rounded-lg p-4 text-center hover:border-gold/30 transition-all overflow-hidden group"
              data-ocid={`games.${game.id}.card`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-100 transition-opacity`}
              />
              <div className="relative z-10">
                <div className="text-3xl mb-1">{game.icon}</div>
                <p className="text-xs font-bold text-gray-200 truncate">
                  {game.title}
                </p>
                <p className="text-[9px] text-green-400 mt-0.5">
                  👥 {game.players}
                </p>
              </div>
            </motion.button>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-4 text-center text-muted-foreground text-sm py-8">
              No games found
            </p>
          )}
        </div>
      )}

      {/* Categories */}
      {!filtered &&
        categories.map((cat) => {
          const info = CATEGORY_INFO[cat];
          const games = ALL_GAMES.filter((g) => g.category === cat);
          return (
            <div key={cat} className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{info.icon}</span>
                <h2 className="text-sm font-bold text-foreground">
                  {info.label}
                </h2>
                <span className="text-[10px] text-muted-foreground border border-border rounded-full px-1.5">
                  {games.length}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {games.map((game) => (
                  <motion.button
                    key={game.id}
                    type="button"
                    whileTap={{ scale: 0.93 }}
                    whileHover={{ scale: 1.03 }}
                    onClick={() => setActiveGame(game.id)}
                    className="relative bg-[#161d2f] border border-white/5 rounded-xl p-3 text-center hover:border-gold/30 transition-all overflow-hidden group"
                    data-ocid={`games.${game.id}.card`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-100 transition-opacity`}
                    />
                    <div className="relative z-10">
                      <div className="text-2xl mb-1">{game.icon}</div>
                      <p className="text-[10px] font-bold text-gray-200 leading-tight">
                        {game.title}
                      </p>
                      <p className="text-[8px] text-green-500 mt-0.5">
                        👥 {game.players}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
}
