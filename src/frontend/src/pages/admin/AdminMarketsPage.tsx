import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type MarketStatus, type SportType, useStore } from "@/store/useStore";
import {
  AlertTriangle,
  CheckCircle,
  Plus,
  Settings,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

const STATUS_INFO: Record<
  MarketStatus,
  { color: string; bg: string; icon: React.ReactNode }
> = {
  open: {
    color: "oklch(0.65 0.18 145)",
    bg: "oklch(0.65 0.18 145 / 0.15)",
    icon: <CheckCircle className="w-3 h-3" />,
  },
  suspended: {
    color: "oklch(0.72 0.18 60)",
    bg: "oklch(0.72 0.18 60 / 0.15)",
    icon: <AlertTriangle className="w-3 h-3" />,
  },
  closed: {
    color: "oklch(0.55 0.01 265)",
    bg: "oklch(0.55 0.01 265 / 0.15)",
    icon: <XCircle className="w-3 h-3" />,
  },
  settled: {
    color: "oklch(0.55 0.18 240)",
    bg: "oklch(0.55 0.18 240 / 0.15)",
    icon: <CheckCircle className="w-3 h-3" />,
  },
};

function CreateMarketDialog() {
  const createMarket = useStore((s) => s.createMarket);
  const [open, setOpen] = useState(false);
  const [sport, setSport] = useState<SportType>("cricket");
  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [selections, setSelections] = useState([
    {
      id: "1",
      name: "",
      backOdds: 2.0,
      layOdds: 2.05,
      backVolume: 0,
      layVolume: 0,
    },
    {
      id: "2",
      name: "",
      backOdds: 2.0,
      layOdds: 2.05,
      backVolume: 0,
      layVolume: 0,
    },
  ]);

  const addSelection = () => {
    setSelections([
      ...selections,
      {
        id: String(selections.length + 1),
        name: "",
        backOdds: 2.0,
        layOdds: 2.05,
        backVolume: 0,
        layVolume: 0,
      },
    ]);
  };

  const updateSelection = (idx: number, name: string) => {
    const updated = [...selections];
    updated[idx] = { ...updated[idx], name };
    setSelections(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim()) return toast.error("Event name is required");
    const validSelections = selections.filter((s) => s.name.trim());
    if (validSelections.length < 2)
      return toast.error("At least 2 selections required");

    createMarket({
      sport,
      eventName,
      description,
      selections: validSelections,
    });
    toast.success("Market created successfully");
    setOpen(false);
    setEventName("");
    setDescription("");
    setSport("cricket");
    setSelections([
      {
        id: "1",
        name: "",
        backOdds: 2.0,
        layOdds: 2.05,
        backVolume: 0,
        layVolume: 0,
      },
      {
        id: "2",
        name: "",
        backOdds: 2.0,
        layOdds: 2.05,
        backVolume: 0,
        layVolume: 0,
      },
    ]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          data-ocid="admin.create_market_button"
          size="sm"
          className="text-background font-semibold"
          style={{
            background:
              "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--accent)))",
          }}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create Market
        </Button>
      </DialogTrigger>
      <DialogContent
        data-ocid="admin.create_market_dialog"
        className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Create New Market
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Sport</Label>
            <Select
              value={sport}
              onValueChange={(v) => setSport(v as SportType)}
            >
              <SelectTrigger className="bg-input border-border h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="cricket">🏏 Cricket</SelectItem>
                <SelectItem value="football">⚽ Football</SelectItem>
                <SelectItem value="tennis">🎾 Tennis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Event Name</Label>
            <Input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g. IND vs AUS - 1st Test"
              className="bg-input border-border h-9 text-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Market description"
              className="bg-input border-border h-9 text-sm"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Selections
              </Label>
              <button
                type="button"
                onClick={addSelection}
                className="text-xs text-gold hover:text-gold/80 transition-colors"
              >
                + Add Selection
              </button>
            </div>
            <div className="space-y-2">
              {selections.map((sel, i) => (
                <Input
                  key={sel.id}
                  value={sel.name}
                  onChange={(e) => updateSelection(i, e.target.value)}
                  placeholder={`Selection ${i + 1} name`}
                  className="bg-input border-border h-9 text-sm"
                />
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              data-ocid="admin.create_market_dialog.cancel_button"
              onClick={() => setOpen(false)}
              className="text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="admin.create_market_dialog.confirm_button"
              className="text-background font-semibold"
              style={{ background: "oklch(var(--gold))" }}
            >
              Create Market
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SettleMarketDialog({
  marketId,
  selections,
}: {
  marketId: string;
  selections: { name: string }[];
}) {
  const updateMarketStatus = useStore((s) => s.updateMarketStatus);
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState("");

  const handleSettle = () => {
    if (!result) return;
    updateMarketStatus(marketId, "settled", result);
    toast.success(`Market settled: ${result} wins`);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <CheckCircle className="w-3.5 h-3.5 mr-2 text-green-400" />
          Settle Market
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground">Settle Market</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Label className="text-xs text-muted-foreground">Select Winner</Label>
          <Select value={result} onValueChange={setResult}>
            <SelectTrigger className="bg-input border-border">
              <SelectValue placeholder="Choose winning selection" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {selections.map((s) => (
                <SelectItem key={s.name} value={s.name}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter className="gap-2 mt-4">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="text-muted-foreground"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSettle}
            disabled={!result}
            className="text-background font-semibold"
            style={{ background: "oklch(0.65 0.18 145)" }}
          >
            Confirm Result
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AdminMarketsPage() {
  const markets = useStore((s) => s.markets);
  const updateMarketStatus = useStore((s) => s.updateMarketStatus);

  return (
    <div className="p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-gold" />
          <h1 className="text-lg font-bold text-foreground">Markets</h1>
          <Badge
            variant="outline"
            className="text-xs border-border text-muted-foreground"
          >
            {markets.length} total
          </Badge>
        </div>
        <CreateMarketDialog />
      </div>

      {/* Markets List */}
      <div className="space-y-3">
        {markets.map((market, i) => {
          const info = STATUS_INFO[market.status];
          return (
            <motion.div
              key={market.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              {/* Market Header Row */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg">
                    {market.sport === "cricket"
                      ? "🏏"
                      : market.sport === "football"
                        ? "⚽"
                        : "🎾"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {market.eventName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {market.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    className="text-[10px] capitalize flex items-center gap-1"
                    style={{
                      background: info.bg,
                      color: info.color,
                      borderColor: `${info.color}44`,
                    }}
                    variant="outline"
                  >
                    {info.icon}
                    {market.status}
                  </Badge>
                  {market.result && (
                    <Badge
                      className="text-[10px]"
                      style={{
                        background: "oklch(0.65 0.18 145 / 0.15)",
                        color: "oklch(0.65 0.18 145)",
                      }}
                      variant="outline"
                    >
                      Winner: {market.result}
                    </Badge>
                  )}

                  {/* Actions Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="bg-card border-border"
                      align="end"
                    >
                      {market.status === "open" && (
                        <DropdownMenuItem
                          onClick={() => {
                            updateMarketStatus(market.id, "suspended");
                            toast.success("Market suspended");
                          }}
                          className="text-yellow-400"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 mr-2" />
                          Suspend
                        </DropdownMenuItem>
                      )}
                      {market.status === "suspended" && (
                        <DropdownMenuItem
                          onClick={() => {
                            updateMarketStatus(market.id, "open");
                            toast.success("Market reopened");
                          }}
                          className="text-green-400"
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-2" />
                          Reopen
                        </DropdownMenuItem>
                      )}
                      {(market.status === "open" ||
                        market.status === "suspended") && (
                        <>
                          <DropdownMenuItem
                            onClick={() => {
                              updateMarketStatus(market.id, "closed");
                              toast.success("Market closed");
                            }}
                            className="text-muted-foreground"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-2" />
                            Close Market
                          </DropdownMenuItem>
                          <SettleMarketDialog
                            marketId={market.id}
                            selections={market.selections}
                          />
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Selections */}
              <div className="px-4 py-2">
                <div className="flex flex-wrap gap-2">
                  {market.selections.map((sel) => (
                    <div
                      key={sel.id}
                      className="flex items-center gap-2 text-xs rounded-lg px-2.5 py-1.5 bg-secondary"
                    >
                      <span className="text-foreground font-medium">
                        {sel.name}
                      </span>
                      <span
                        className="font-mono font-bold"
                        style={{ color: "oklch(var(--back))" }}
                      >
                        {sel.backOdds.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground">/</span>
                      <span
                        className="font-mono font-bold"
                        style={{ color: "oklch(var(--lay))" }}
                      >
                        {sel.layOdds.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
