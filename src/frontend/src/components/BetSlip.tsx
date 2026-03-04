import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/store/useStore";
import {
  AlertCircle,
  CheckCircle,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

export function BetSlip() {
  const { betSlip, closeBetSlip, updateBetSlip, placeBet, currentUser } =
    useStore();
  const [placing, setPlacing] = useState(false);

  if (!betSlip) return null;

  const isBack = betSlip.type === "back";
  const odds = betSlip.odds;
  const stake = betSlip.stake;

  const potentialWin = isBack ? stake * (odds - 1) : stake;
  const liability = isBack ? stake : stake * (odds - 1);
  const payout = isBack ? stake + potentialWin : potentialWin;

  const insufficientBalance = currentUser
    ? currentUser.balance < (isBack ? stake : liability)
    : false;

  const handlePlaceBet = async () => {
    setPlacing(true);
    await new Promise((r) => setTimeout(r, 300));
    const result = placeBet();
    setPlacing(false);

    if (result.success) {
      toast.success(result.message, {
        description: `${betSlip.selectionName} @ ${odds} - Stake: ₹${stake}`,
      });
    } else {
      toast.error(result.message);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed right-4 bottom-4 z-50 w-80 rounded-xl border shadow-2xl overflow-hidden"
        style={{
          borderColor: isBack
            ? "oklch(var(--back) / 0.4)"
            : "oklch(var(--lay) / 0.4)",
          background: "oklch(var(--card))",
          boxShadow: isBack
            ? "0 20px 60px oklch(var(--back) / 0.2), 0 0 0 1px oklch(var(--back) / 0.1)"
            : "0 20px 60px oklch(var(--lay) / 0.2), 0 0 0 1px oklch(var(--lay) / 0.1)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{
            background: isBack
              ? "oklch(var(--back) / 0.15)"
              : "oklch(var(--lay) / 0.15)",
            borderBottom: `1px solid ${isBack ? "oklch(var(--back) / 0.2)" : "oklch(var(--lay) / 0.2)"}`,
          }}
        >
          <div className="flex items-center gap-2">
            {isBack ? (
              <TrendingUp
                className="w-4 h-4"
                style={{ color: "oklch(var(--back))" }}
              />
            ) : (
              <TrendingDown
                className="w-4 h-4"
                style={{ color: "oklch(var(--lay))" }}
              />
            )}
            <span className="font-semibold text-sm text-foreground">
              Bet Slip
            </span>
            <Badge
              className="text-[10px] px-1.5 py-0 font-bold uppercase"
              style={{
                background: isBack ? "oklch(var(--back))" : "oklch(var(--lay))",
                color: "oklch(var(--back-foreground))",
              }}
            >
              {betSlip.type}
            </Badge>
          </div>
          <button
            type="button"
            data-ocid="betslip.cancel_button"
            onClick={closeBetSlip}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Market Info */}
        <div className="px-4 pt-3 pb-2">
          <p className="text-xs text-muted-foreground truncate">
            {betSlip.marketName}
          </p>
          <p className="text-sm font-semibold text-foreground truncate mt-0.5">
            {betSlip.selectionName}
          </p>
        </div>

        {/* Inputs */}
        <div className="px-4 pb-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Odds</Label>
              <Input
                data-ocid="betslip.odds_input"
                type="number"
                step="0.01"
                min="1.01"
                value={odds}
                onChange={(e) =>
                  updateBetSlip({
                    odds: Number.parseFloat(e.target.value) || 1.01,
                  })
                }
                className="h-9 text-sm font-mono font-semibold bg-input border-border"
                style={{
                  borderColor: isBack
                    ? "oklch(var(--back) / 0.4)"
                    : "oklch(var(--lay) / 0.4)",
                  color: isBack ? "oklch(var(--back))" : "oklch(var(--lay))",
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Stake (₹)</Label>
              <Input
                data-ocid="betslip.stake_input"
                type="number"
                step="1"
                min="1"
                value={stake}
                onChange={(e) =>
                  updateBetSlip({
                    stake: Number.parseFloat(e.target.value) || 0,
                  })
                }
                className="h-9 text-sm font-mono font-semibold bg-input border-border text-foreground"
              />
            </div>
          </div>

          {/* Quick stake buttons */}
          <div className="flex gap-1.5">
            {[100, 500, 1000, 5000].map((amount) => (
              <button
                type="button"
                key={amount}
                onClick={() => updateBetSlip({ stake: amount })}
                className="flex-1 text-xs py-1 rounded border border-border text-muted-foreground hover:text-foreground hover:border-gold/50 transition-all"
              >
                ₹{amount >= 1000 ? `${amount / 1000}k` : amount}
              </button>
            ))}
          </div>

          {/* Calculations */}
          <div className="rounded-lg bg-secondary/50 border border-border p-2.5 space-y-1.5">
            {isBack ? (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Potential Win</span>
                  <span className="text-green-400 font-semibold font-mono">
                    +₹{potentialWin.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total Payout</span>
                  <span className="text-foreground font-semibold font-mono">
                    ₹{payout.toFixed(2)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Liability</span>
                  <span className="text-rose-400 font-semibold font-mono">
                    -₹{liability.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    Profit if Lay wins
                  </span>
                  <span className="text-green-400 font-semibold font-mono">
                    +₹{stake.toFixed(2)}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between text-xs pt-1 border-t border-border">
              <span className="text-muted-foreground">Available Balance</span>
              <span
                className={`font-semibold font-mono ${insufficientBalance ? "text-destructive" : "text-foreground"}`}
              >
                ₹{currentUser?.balance.toFixed(2) ?? "0.00"}
              </span>
            </div>
          </div>

          {/* Error */}
          {insufficientBalance && (
            <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-2.5 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Insufficient balance
            </div>
          )}

          {/* Place Bet Button */}
          <Button
            data-ocid="betslip.submit_button"
            onClick={handlePlaceBet}
            disabled={
              placing || insufficientBalance || stake <= 0 || odds < 1.01
            }
            className="w-full h-10 font-bold text-sm"
            style={{
              background:
                placing || insufficientBalance || stake <= 0
                  ? "oklch(var(--muted))"
                  : isBack
                    ? "oklch(var(--back))"
                    : "oklch(var(--lay))",
              color: "oklch(var(--back-foreground))",
            }}
          >
            {placing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Placing Bet...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Place {isBack ? "Back" : "Lay"} Bet
              </div>
            )}
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
