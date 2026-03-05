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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminBetsPage } from "@/pages/admin/AdminBetsPage";
import { AdminCasinoPage } from "@/pages/admin/AdminCasinoPage";
import { AdminCrashPage } from "@/pages/admin/AdminCrashPage";
import { AdminGamesPage } from "@/pages/admin/AdminGamesPage";
import { AdminLayout } from "@/pages/admin/AdminLayout";
import { AdminMarketsPage } from "@/pages/admin/AdminMarketsPage";
import { AdminUsersPage } from "@/pages/admin/AdminUsersPage";
import { type Page, type User, useStore } from "@/store/useStore";
import {
  BarChart3,
  Circle,
  ClipboardList,
  Crown,
  MinusCircle,
  Plus,
  PlusCircle,
  Shield,
  ShieldCheck,
  ShieldOff,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

// ── Shared dialog for creating an account ─────────────────────────────────────
function CreateAccountDialog({
  title,
  buttonLabel,
  onSubmit,
}: {
  title: string;
  buttonLabel: string;
  onSubmit: (username: string, password: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    onSubmit(username, password);
    setOpen(false);
    setUsername("");
    setPassword("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="text-background font-semibold"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.65 0.18 300), oklch(0.55 0.22 290))",
          }}
          data-ocid="master.create_account.open_modal_button"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground">{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="bg-input border-border h-9"
              data-ocid="master.create_account.input"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="bg-input border-border h-9"
              required
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              data-ocid="master.create_account.cancel_button"
              onClick={() => setOpen(false)}
              className="text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="master.create_account.confirm_button"
              className="text-white font-semibold"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.65 0.18 300), oklch(0.55 0.22 290))",
              }}
            >
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Balance dialog ─────────────────────────────────────────────────────────────
function BalanceDialog({
  user,
  type,
  trigger,
}: {
  user: User;
  type: "credit" | "debit";
  trigger: React.ReactNode;
}) {
  const creditUserBalance = useStore((s) => s.creditUserBalance);
  const debitUserBalance = useStore((s) => s.debitUserBalance);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");

  const handleSubmit = () => {
    const val = Number.parseFloat(amount);
    if (!val || val <= 0) return toast.error("Enter a valid amount");

    if (type === "credit") {
      creditUserBalance(user.id, val);
      toast.success(`₹${val} credited to ${user.username}`);
    } else {
      debitUserBalance(user.id, val);
      toast.success(`₹${val} debited from ${user.username}`);
    }
    setOpen(false);
    setAmount("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {type === "credit" ? "Credit Balance" : "Debit Balance"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Account:{" "}
            <span className="text-foreground font-semibold">
              {user.username}
            </span>
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Amount (₹)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="bg-input border-border h-9"
              data-ocid="master.balance_dialog.input"
              min="1"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 mt-4">
          <Button
            variant="ghost"
            data-ocid="master.balance_dialog.cancel_button"
            onClick={() => setOpen(false)}
            className="text-muted-foreground"
          >
            Cancel
          </Button>
          <Button
            data-ocid="master.balance_dialog.confirm_button"
            onClick={handleSubmit}
            className="font-semibold text-white"
            style={{
              background:
                type === "credit"
                  ? "oklch(0.65 0.18 145)"
                  : "oklch(var(--destructive))",
            }}
          >
            {type === "credit" ? "Credit" : "Debit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── System Stats ───────────────────────────────────────────────────────────────
function MasterStatsSection() {
  const users = useStore((s) => s.users);
  const bets = useStore((s) => s.bets);
  const markets = useStore((s) => s.markets);

  const regularUsers = users.filter((u) => u.role === "user");
  const admins = users.filter((u) => u.role === "admin");
  const superAdmins = users.filter((u) => u.role === "superadmin");
  const totalBets = bets.length;
  const totalVolume = bets.reduce((sum, b) => sum + b.stake, 0);
  const settledBets = bets.filter((b) => b.status === "settled");
  const platformPnl = settledBets.reduce((sum, b) => sum - b.pnl, 0);
  const openMarkets = markets.filter((m) => m.status === "open").length;

  const stats = [
    {
      label: "Super Admins",
      value: superAdmins.length,
      icon: Crown,
      color: "oklch(0.65 0.18 300)",
      desc: `${superAdmins.filter((u) => u.status === "active").length} active`,
    },
    {
      label: "Admins",
      value: admins.length,
      icon: ShieldCheck,
      color: "oklch(var(--gold))",
      desc: `${admins.filter((u) => u.status === "active").length} active`,
    },
    {
      label: "Total Users",
      value: regularUsers.length,
      icon: Users,
      color: "oklch(var(--back))",
      desc: `${regularUsers.filter((u) => u.status === "active").length} active`,
    },
    {
      label: "Open Markets",
      value: openMarkets,
      icon: TrendingUp,
      color: "oklch(0.65 0.18 145)",
      desc: `${markets.length} total markets`,
    },
    {
      label: "Betting Volume",
      value: `₹${(totalVolume / 1000).toFixed(1)}K`,
      icon: BarChart3,
      color: "oklch(var(--gold))",
      desc: `${totalBets} total bets`,
    },
    {
      label: "Platform P&L",
      value: `${platformPnl >= 0 ? "+" : ""}₹${platformPnl.toFixed(2)}`,
      icon: ClipboardList,
      color: platformPnl >= 0 ? "oklch(0.65 0.18 145)" : "oklch(var(--lay))",
      desc: "Net platform earnings",
    },
  ];

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <Crown className="w-5 h-5" style={{ color: "oklch(0.65 0.18 300)" }} />
        <h1 className="text-lg font-bold text-foreground">Master Overview</h1>
        <Badge
          variant="outline"
          className="text-xs font-bold"
          style={{
            background: "oklch(0.65 0.18 300 / 0.15)",
            color: "oklch(0.65 0.18 300)",
            borderColor: "oklch(0.65 0.18 300 / 0.3)",
          }}
        >
          Full Access
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${stat.color}20` }}
                >
                  <Icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                <span className="text-xs text-muted-foreground">
                  {stat.label}
                </span>
              </div>
              <p className="text-2xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{stat.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── Super Admins List ──────────────────────────────────────────────────────────
function SuperAdminsSection() {
  const users = useStore((s) => s.users);
  const currentUser = useStore((s) => s.currentUser);
  const deleteAdmin = useStore((s) => s.deleteAdmin);
  const toggleUserStatus = useStore((s) => s.toggleUserStatus);
  const createSuperAdmin = useStore((s) => s.createSuperAdmin);

  const superAdmins = users.filter((u) => u.role === "superadmin");

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Crown
            className="w-5 h-5"
            style={{ color: "oklch(0.65 0.18 300)" }}
          />
          <h1 className="text-lg font-bold text-foreground">
            Super Admin Accounts
          </h1>
          <Badge
            variant="outline"
            className="text-xs border-border text-muted-foreground"
          >
            {superAdmins.length} accounts
          </Badge>
        </div>
        <CreateAccountDialog
          title="Create Super Admin"
          buttonLabel="Create Super Admin"
          onSubmit={(username, password) => {
            createSuperAdmin(username, password);
            toast.success(`Super Admin created: ${username}`);
          }}
        />
      </div>

      {superAdmins.length === 0 ? (
        <div
          data-ocid="master.superadmins.empty_state"
          className="flex flex-col items-center justify-center py-16"
        >
          <Circle className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No super admin accounts</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-2.5 bg-secondary/50 border-b border-border text-xs text-muted-foreground font-medium">
            <span>Username</span>
            <span className="text-right">Balance</span>
            <span className="text-center">Status</span>
            <span className="text-right">Balance Actions</span>
            <span className="text-right">Manage</span>
          </div>

          <div className="divide-y divide-border/50">
            {superAdmins.map((admin, i) => (
              <motion.div
                key={admin.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                data-ocid={`master.superadmin.row.${i + 1}`}
                className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto_auto] gap-2 md:gap-4 px-4 py-3 hover:bg-secondary/20 transition-colors"
              >
                {/* Username */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.65 0.18 300), oklch(0.55 0.22 290))",
                    }}
                  >
                    {admin.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {admin.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(admin.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Balance */}
                <div className="flex items-center md:justify-end gap-2">
                  <span className="md:hidden text-xs text-muted-foreground">
                    Balance:
                  </span>
                  <span className="text-sm font-semibold font-mono text-foreground">
                    ₹{admin.balance.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Status */}
                <div className="flex items-center md:justify-center">
                  <Badge
                    className="text-[10px] capitalize"
                    style={{
                      background:
                        admin.status === "active"
                          ? "oklch(0.65 0.18 145 / 0.15)"
                          : "oklch(var(--destructive) / 0.15)",
                      color:
                        admin.status === "active"
                          ? "oklch(0.65 0.18 145)"
                          : "oklch(var(--destructive))",
                      borderColor:
                        admin.status === "active"
                          ? "oklch(0.65 0.18 145 / 0.3)"
                          : "oklch(var(--destructive) / 0.3)",
                    }}
                    variant="outline"
                  >
                    {admin.status}
                  </Badge>
                </div>

                {/* Balance actions */}
                <div className="flex items-center md:justify-end gap-1">
                  <BalanceDialog
                    user={admin}
                    type="credit"
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        data-ocid={`master.superadmin_credit_button.${i + 1}`}
                        className="h-7 px-2 text-xs text-green-400 hover:text-green-300 hover:bg-green-950/30"
                      >
                        <PlusCircle className="w-3 h-3 mr-1" />
                        Credit
                      </Button>
                    }
                  />
                  <BalanceDialog
                    user={admin}
                    type="debit"
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
                      >
                        <MinusCircle className="w-3 h-3 mr-1" />
                        Debit
                      </Button>
                    }
                  />
                </div>

                {/* Manage actions */}
                <div className="flex items-center md:justify-end gap-1">
                  {admin.id !== currentUser?.id && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        data-ocid={`master.superadmin_suspend_button.${i + 1}`}
                        onClick={() => {
                          toggleUserStatus(admin.id);
                          toast.success(
                            admin.status === "active"
                              ? `${admin.username} suspended`
                              : `${admin.username} unsuspended`,
                          );
                        }}
                        className={`h-7 px-2 text-xs ${
                          admin.status === "active"
                            ? "text-yellow-400 hover:bg-yellow-950/30"
                            : "text-green-400 hover:bg-green-950/30"
                        }`}
                      >
                        {admin.status === "active" ? (
                          <>
                            <ShieldOff className="w-3 h-3 mr-1" />
                            Suspend
                          </>
                        ) : (
                          <>
                            <Shield className="w-3 h-3 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        data-ocid={`master.superadmin_delete_button.${i + 1}`}
                        onClick={() => {
                          deleteAdmin(admin.id);
                          toast.success(`${admin.username} removed`);
                        }}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Master Dashboard root ──────────────────────────────────────────────────────
export function MasterDashboard() {
  const currentPage = useStore((s) => s.currentPage);

  const extraNavItems = [
    {
      label: "Super Admins",
      page: "master-superadmins" as Page,
      icon: Crown,
    },
    {
      label: "Admins",
      page: "superadmin-admins" as Page,
      icon: ShieldCheck,
    },
  ];

  const renderContent = () => {
    switch (currentPage) {
      case "master-superadmins":
        return <SuperAdminsSection />;
      case "superadmin-admins":
        // Reuse the admins section from superadmin area
        return <AdminUsersPage />;
      case "admin-markets":
        return <AdminMarketsPage />;
      case "admin-users":
        return <AdminUsersPage />;
      case "admin-bets":
        return <AdminBetsPage />;
      case "admin-casino":
        return <AdminCasinoPage />;
      case "admin-crash":
        return <AdminCrashPage />;
      case "admin-games":
        return <AdminGamesPage />;
      default:
        return <MasterStatsSection />;
    }
  };

  return (
    <AdminLayout extraNavItems={extraNavItems}>{renderContent()}</AdminLayout>
  );
}
