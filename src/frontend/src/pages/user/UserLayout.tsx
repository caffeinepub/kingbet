import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type Page, useStore } from "@/store/useStore";
import {
  ClipboardList,
  Crown,
  Gamepad2,
  LogOut,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";
import { useState } from "react";

interface UserLayoutProps {
  children: React.ReactNode;
}

export function UserLayout({ children }: UserLayoutProps) {
  const { currentUser, currentPage, setPage, logout } = useStore();
  const [lang, setLang] = useState<"en" | "hi">("en");

  const navLabels = {
    en: {
      markets: "Markets",
      bets: "My Bets",
      games: "Games",
      account: "Account",
    },
    hi: {
      markets: "मार्केट",
      bets: "मेरे बेट",
      games: "गेम्स",
      account: "खाता",
    },
  };
  const labels = navLabels[lang];

  const navItems = [
    { label: labels.markets, page: "user-markets" as Page, icon: TrendingUp },
    { label: labels.bets, page: "user-bets" as Page, icon: ClipboardList },
    { label: labels.games, page: "user-games" as Page, icon: Gamepad2 },
    { label: labels.account, page: "user-account" as Page, icon: User },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Promo Ticker */}
      <div
        className="w-full py-1 px-4 text-center text-xs font-medium"
        style={{
          background:
            "linear-gradient(90deg, oklch(var(--saffron) / 0.15), oklch(var(--gold) / 0.15), oklch(var(--saffron) / 0.15))",
          borderBottom: "1px solid oklch(var(--saffron) / 0.2)",
        }}
      >
        <span className="text-saffron">🏏 IPL 2026 LIVE</span>
        <span className="mx-3 opacity-30">|</span>
        <span className="text-gold">
          Balance: ₹
          {currentUser?.balance.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
          })}
        </span>
        <span className="mx-3 opacity-30">|</span>
        <span className="text-foreground/60 hidden sm:inline">
          Fast Withdrawals
        </span>
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center gold-glow"
              style={{
                background:
                  "linear-gradient(135deg, oklch(var(--gold)), oklch(var(--saffron)))",
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
                  data-ocid={`nav.${item.page}.link`}
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
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <button
              type="button"
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              className="hidden lg:flex items-center gap-1 text-xs border border-border rounded-full px-2 py-0.5 text-muted-foreground hover:text-gold hover:border-gold/50 transition-all"
              data-ocid="nav.lang_toggle"
            >
              {lang === "en" ? "हि" : "EN"}
            </button>

            {/* Balance */}
            <div
              data-ocid="nav.balance_panel"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary border border-border"
            >
              <Wallet className="w-4 h-4 text-gold" />
              <span className="text-sm font-semibold text-foreground font-mono">
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
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">{children}</main>

      {/* Mobile Fixed Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
        <div className="flex items-stretch">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.page;
            return (
              <button
                type="button"
                key={item.page}
                data-ocid={`mobile_nav.${item.page}.link`}
                onClick={() => setPage(item.page)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-all duration-150 ${
                  isActive
                    ? "text-gold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-gold" : ""}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <footer className="hidden md:block border-t border-border bg-card/50 py-4 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setPage("user-markets")}
              className="hover:text-gold transition-colors"
              data-ocid="footer.markets_link"
            >
              Markets
            </button>
            <button
              type="button"
              onClick={() => setPage("user-games")}
              className="hover:text-gold transition-colors"
              data-ocid="footer.games_link"
            >
              Games
            </button>
            <button
              type="button"
              onClick={() => setPage("user-bets")}
              className="hover:text-gold transition-colors"
              data-ocid="footer.bets_link"
            >
              My Bets
            </button>
            <button
              type="button"
              className="hover:text-gold transition-colors"
              onClick={() =>
                window.open("https://wa.me/919999999999", "_blank")
              }
            >
              Support
            </button>
          </div>
          <p>
            © {new Date().getFullYear()} KINGBET. 18+ only. Bet responsibly.
          </p>
        </div>
      </footer>
    </div>
  );
}
