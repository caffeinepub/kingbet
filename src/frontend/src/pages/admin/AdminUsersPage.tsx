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
import { type User, useStore } from "@/store/useStore";
import {
  Circle,
  CreditCard,
  MinusCircle,
  Plus,
  PlusCircle,
  Shield,
  ShieldOff,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

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
            User:{" "}
            <span className="text-foreground font-semibold">
              {user.username}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            Current Balance:{" "}
            <span className="text-foreground font-semibold font-mono">
              ₹{user.balance.toLocaleString("en-IN")}
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
              min="1"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 mt-4">
          <Button
            variant="ghost"
            data-ocid="admin.balance_dialog.cancel_button"
            onClick={() => setOpen(false)}
            className="text-muted-foreground"
          >
            Cancel
          </Button>
          <Button
            data-ocid="admin.balance_dialog.confirm_button"
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

function CreditLimitDialog({ user }: { user: User }) {
  const setCreditLimit = useStore((s) => s.setCreditLimit);
  const [open, setOpen] = useState(false);
  const [limit, setLimit] = useState(String(user.creditLimit));

  const handleSubmit = () => {
    const val = Number.parseFloat(limit);
    if (Number.isNaN(val) || val < 0) return toast.error("Enter a valid limit");
    setCreditLimit(user.id, val);
    toast.success(`Credit limit updated for ${user.username}`);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <CreditCard className="w-3 h-3 mr-1" />
          Limit
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Set Credit Limit
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            User:{" "}
            <span className="text-foreground font-semibold">
              {user.username}
            </span>
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Credit Limit (₹)
            </Label>
            <Input
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="bg-input border-border h-9"
              min="0"
            />
          </div>
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
            onClick={handleSubmit}
            className="font-semibold text-background"
            style={{ background: "oklch(var(--gold))" }}
          >
            Update Limit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateUserDialog() {
  const createUser = useStore((s) => s.createUser);
  const currentUser = useStore((s) => s.currentUser);
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    createUser(username, password, currentUser?.id ?? "");
    toast.success(`User account created: ${username}`);
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
          data-ocid="admin.create_user.open_modal_button"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create User
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Create User Account
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="bg-input border-border h-9"
              data-ocid="admin.create_user.input"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="bg-input border-border h-9"
              required
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              data-ocid="admin.create_user_dialog.cancel_button"
              onClick={() => setOpen(false)}
              className="text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="admin.create_user_dialog.confirm_button"
              className="text-background font-semibold"
              style={{ background: "oklch(var(--gold))" }}
            >
              Create User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AdminUsersPage() {
  const users = useStore((s) => s.users);
  const toggleUserStatus = useStore((s) => s.toggleUserStatus);
  const currentUser = useStore((s) => s.currentUser);

  // Only show regular users (not admins/superadmins)
  const regularUsers = users.filter((u) => u.role === "user");

  return (
    <div className="p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gold" />
          <h1 className="text-lg font-bold text-foreground">Users</h1>
          <Badge
            variant="outline"
            className="text-xs border-border text-muted-foreground"
          >
            {regularUsers.length} users
          </Badge>
        </div>
        <CreateUserDialog />
      </div>

      {/* Users Table */}
      {regularUsers.length === 0 ? (
        <div
          data-ocid="admin.users.empty_state"
          className="flex flex-col items-center justify-center py-16"
        >
          <Circle className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No users found</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Table Header (desktop) */}
          <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-2.5 bg-secondary/50 border-b border-border text-xs text-muted-foreground font-medium">
            <span>Username</span>
            <span className="text-right">Balance</span>
            <span className="text-right">Credit Limit</span>
            <span className="text-center">Status</span>
            <span className="text-right">Actions</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border/50">
            {regularUsers.map((user, i) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto_auto] gap-2 md:gap-4 px-4 py-3 hover:bg-secondary/20 transition-colors"
              >
                {/* Username */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-background"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(var(--back)), oklch(var(--back) / 0.6))",
                    }}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {user.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ID: {user.id}
                    </p>
                  </div>
                </div>

                {/* Balance */}
                <div className="flex items-center md:justify-end gap-2">
                  <span className="md:hidden text-xs text-muted-foreground">
                    Balance:
                  </span>
                  <span className="text-sm font-semibold font-mono text-foreground">
                    ₹{user.balance.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Credit Limit */}
                <div className="flex items-center md:justify-end gap-2">
                  <span className="md:hidden text-xs text-muted-foreground">
                    Credit Limit:
                  </span>
                  <span className="text-sm font-mono text-muted-foreground">
                    ₹{user.creditLimit.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Status */}
                <div className="flex items-center md:justify-center">
                  <Badge
                    className="text-[10px] capitalize"
                    style={{
                      background:
                        user.status === "active"
                          ? "oklch(0.65 0.18 145 / 0.15)"
                          : "oklch(var(--destructive) / 0.15)",
                      color:
                        user.status === "active"
                          ? "oklch(0.65 0.18 145)"
                          : "oklch(var(--destructive))",
                      borderColor:
                        user.status === "active"
                          ? "oklch(0.65 0.18 145 / 0.3)"
                          : "oklch(var(--destructive) / 0.3)",
                    }}
                    variant="outline"
                  >
                    {user.status}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="flex items-center md:justify-end gap-1 flex-wrap">
                  <BalanceDialog
                    user={user}
                    type="credit"
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        data-ocid={`admin.user_credit_button.${i + 1}`}
                        className="h-7 px-2 text-xs text-green-400 hover:text-green-300 hover:bg-green-950/30"
                      >
                        <PlusCircle className="w-3 h-3 mr-1" />
                        Credit
                      </Button>
                    }
                  />
                  <BalanceDialog
                    user={user}
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
                  <CreditLimitDialog user={user} />
                  <Button
                    variant="ghost"
                    size="sm"
                    data-ocid={`admin.user_suspend_button.${i + 1}`}
                    onClick={() => {
                      if (user.id === currentUser?.id) {
                        toast.error("Cannot suspend yourself");
                        return;
                      }
                      toggleUserStatus(user.id);
                      toast.success(
                        user.status === "active"
                          ? `${user.username} suspended`
                          : `${user.username} unsuspended`,
                      );
                    }}
                    className={`h-7 px-2 text-xs ${
                      user.status === "active"
                        ? "text-yellow-400 hover:bg-yellow-950/30"
                        : "text-green-400 hover:bg-green-950/30"
                    }`}
                  >
                    {user.status === "active" ? (
                      <>
                        <ShieldOff className="w-3 h-3 mr-1" />
                        Suspend
                      </>
                    ) : (
                      <>
                        <Shield className="w-3 h-3 mr-1" />
                        Unsuspend
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
