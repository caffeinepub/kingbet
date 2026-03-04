import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type Page, useStore } from "@/store/useStore";
import {
  ClipboardList,
  Crown,
  LogOut,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";

interface UserLayoutProps {
  children: React.ReactNode;
}

export function UserLayout({ children }: UserLayoutProps) {
  const { currentUser, currentPage, setPage, logout } = useStore();

  const navItems = [
    { label: "Markets", page: "user-markets" as Page, icon: TrendingUp },
    { label: "My Bets", page: "user-bets" as Page, icon: ClipboardList },
    { label: "Account", page: "user-account" as Page, icon: User },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--accent)))",
              }}
            >
              <Crown className="w-4 h-4 text-background" />
            </div>
            <span className="text-lg font-bold text-gold tracking-tight font-display">
              KINGBET
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.page;
              return (
                <button
                  type="button"
                  key={item.page}
                  data-ocid={`nav.${item.label.toLowerCase().replace(" ", "_")}.link`}
                  onClick={() => setPage(item.page)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-gold/15 text-gold"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Balance */}
            <div
              data-ocid="nav.balance_panel"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border"
            >
              <Wallet className="w-4 h-4 text-gold" />
              <span className="text-sm font-semibold text-foreground">
                ₹
                {currentUser?.balance.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            {/* Username */}
            <Badge
              variant="outline"
              className="hidden sm:flex border-border text-muted-foreground text-xs"
            >
              {currentUser?.username}
            </Badge>

            {/* Logout */}
            <Button
              variant="ghost"
              size="sm"
              data-ocid="nav.logout_button"
              onClick={logout}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 px-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline ml-1.5 text-xs">Logout</span>
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex items-center gap-1 px-4 pb-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.page;
            return (
              <button
                type="button"
                key={item.page}
                onClick={() => setPage(item.page)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-gold/15 text-gold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
          {/* Mobile balance */}
          <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-secondary border border-border text-xs font-semibold text-foreground">
            <Wallet className="w-3.5 h-3.5 text-gold" />₹
            {currentUser?.balance.toLocaleString("en-IN", {
              minimumFractionDigits: 0,
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
