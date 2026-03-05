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
import { AdminLayout } from "@/pages/admin/AdminLayout";
import { AdminMarketsPage } from "@/pages/admin/AdminMarketsPage";
import { AdminUsersPage } from "@/pages/admin/AdminUsersPage";
import { type Page, useStore } from "@/store/useStore";
import {
  BarChart3,
  Circle,
  ClipboardList,
  Crown,
  Plus,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

function CreateAdminDialog() {
  const createAdmin = useStore((s) => s.createAdmin);
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    createAdmin(username, password);
    toast.success(`Admin account created: ${username}`);
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
              "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--accent)))",
          }}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create Admin
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Create Admin Account
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Admin username"
              className="bg-input border-border h-9"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              className="bg-input border-border h-9"
              required
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              data-ocid="superadmin.create_admin_dialog.cancel_button"
              className="text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="superadmin.create_admin_dialog.confirm_button"
              className="text-background font-semibold"
              style={{ background: "oklch(var(--gold))" }}
            >
              Create Admin
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AdminsSection() {
  const users = useStore((s) => s.users);
  const currentUser = useStore((s) => s.currentUser);
  const deleteAdmin = useStore((s) => s.deleteAdmin);

  const admins = users.filter((u) => u.role === "admin");

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-gold" />
          <h1 className="text-lg font-bold text-foreground">Admin Accounts</h1>
          <Badge
            variant="outline"
            className="text-xs border-border text-muted-foreground"
          >
            {admins.length} admins
          </Badge>
        </div>
        <CreateAdminDialog />
      </div>

      {admins.length === 0 ? (
        <div
          data-ocid="superadmin.admins.empty_state"
          className="flex flex-col items-center justify-center py-16"
        >
          <Circle className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No admin accounts</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="divide-y divide-border/50">
            {admins.map((admin, i) => (
              <motion.div
                key={admin.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between px-4 py-3 hover:bg-secondary/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-background"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--accent)))",
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

                <div className="flex items-center gap-2">
                  <Badge
                    className="text-[10px]"
                    style={{
                      background: "oklch(var(--gold) / 0.15)",
                      color: "oklch(var(--gold))",
                      borderColor: "oklch(var(--gold) / 0.3)",
                    }}
                    variant="outline"
                  >
                    Admin
                  </Badge>
                  {admin.id !== currentUser?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      data-ocid={`superadmin.admin_delete_button.${i + 1}`}
                      onClick={() => {
                        deleteAdmin(admin.id);
                        toast.success(`Admin ${admin.username} removed`);
                      }}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
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

function SystemStatsSection() {
  const users = useStore((s) => s.users);
  const bets = useStore((s) => s.bets);
  const markets = useStore((s) => s.markets);

  const regularUsers = users.filter((u) => u.role === "user");
  const admins = users.filter((u) => u.role === "admin");
  const totalBets = bets.length;
  const totalVolume = bets.reduce((sum, b) => sum + b.stake, 0);
  const settledBets = bets.filter((b) => b.status === "settled");
  const platformPnl = settledBets.reduce((sum, b) => sum - b.pnl, 0); // Platform profit is opposite of user pnl
  const openMarkets = markets.filter((m) => m.status === "open").length;

  const stats = [
    {
      label: "Total Users",
      value: regularUsers.length,
      icon: Users,
      color: "oklch(var(--back))",
      desc: `${regularUsers.filter((u) => u.status === "active").length} active`,
    },
    {
      label: "Admin Accounts",
      value: admins.length,
      icon: ShieldCheck,
      color: "oklch(var(--gold))",
      desc: "Active admins",
    },
    {
      label: "Total Bets",
      value: totalBets,
      icon: ClipboardList,
      color: "oklch(var(--accent))",
      desc: `${settledBets.length} settled`,
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
      desc: "Total wagered",
    },
    {
      label: "Platform P&L",
      value: `${platformPnl >= 0 ? "+" : ""}₹${platformPnl.toFixed(2)}`,
      icon: Crown,
      color: platformPnl >= 0 ? "oklch(0.65 0.18 145)" : "oklch(var(--lay))",
      desc: "Net platform earnings",
    },
  ];

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <Crown className="w-5 h-5 text-gold" />
        <h1 className="text-lg font-bold text-foreground">System Statistics</h1>
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

export function SuperAdminDashboard() {
  const currentPage = useStore((s) => s.currentPage);

  const extraNavItems = [
    { label: "Admins", page: "superadmin-admins" as Page, icon: ShieldCheck },
  ];

  const renderContent = () => {
    switch (currentPage) {
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
      case "superadmin-admins":
        return <AdminsSection />;
      default:
        return (
          <>
            <SystemStatsSection />
          </>
        );
    }
  };

  return (
    <AdminLayout extraNavItems={extraNavItems}>{renderContent()}</AdminLayout>
  );
}
