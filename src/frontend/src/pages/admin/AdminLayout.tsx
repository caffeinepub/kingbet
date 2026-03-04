import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type Page, useStore } from "@/store/useStore";
import {
  ClipboardList,
  Crown,
  LogOut,
  Menu,
  ShieldCheck,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  page: Page;
  icon: React.ComponentType<{ className?: string }>;
}

interface AdminLayoutProps {
  children: React.ReactNode;
  extraNavItems?: NavItem[];
}

export function AdminLayout({
  children,
  extraNavItems = [],
}: AdminLayoutProps) {
  const { currentUser, currentPage, setPage, logout } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const baseNavItems: NavItem[] = [
    { label: "Markets", page: "admin-markets", icon: TrendingUp },
    { label: "Users", page: "admin-users", icon: Users },
    { label: "Bets", page: "admin-bets", icon: ClipboardList },
  ];

  const navItems = [...baseNavItems, ...extraNavItems];

  const isSuperAdmin = currentUser?.role === "superadmin";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md h-14 flex items-center px-4">
        {/* Mobile menu toggle */}
        <button
          type="button"
          className="md:hidden mr-3 text-muted-foreground hover:text-foreground"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>

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

        {/* Admin badge */}
        <Badge
          className="ml-3 text-[10px] uppercase font-bold hidden sm:flex items-center gap-1"
          style={{
            background: isSuperAdmin
              ? "oklch(var(--gold) / 0.15)"
              : "oklch(var(--back) / 0.15)",
            color: isSuperAdmin ? "oklch(var(--gold))" : "oklch(var(--back))",
            borderColor: isSuperAdmin
              ? "oklch(var(--gold) / 0.3)"
              : "oklch(var(--back) / 0.3)",
          }}
          variant="outline"
        >
          <ShieldCheck className="w-3 h-3" />
          {isSuperAdmin ? "Super Admin" : "Admin"} Panel
        </Badge>

        <div className="ml-auto flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-border text-muted-foreground text-xs hidden sm:flex"
          >
            {currentUser?.username}
          </Badge>
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
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`fixed md:static inset-y-14 left-0 z-30 w-52 bg-card border-r border-border flex flex-col transition-transform duration-200 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <nav className="flex-1 p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.page;
              return (
                <button
                  type="button"
                  key={item.page}
                  data-ocid={`nav.${item.label.toLowerCase()}.link`}
                  onClick={() => {
                    setPage(item.page);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-gold/15 text-gold"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                  {isActive && (
                    <div
                      className="ml-auto w-1.5 h-1.5 rounded-full"
                      style={{ background: "oklch(var(--gold))" }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="p-3 border-t border-border">
            <div className="text-xs text-muted-foreground text-center">
              <span className="text-gold">KINGBET</span> Exchange
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-background/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
            role="button"
            tabIndex={0}
            aria-label="Close sidebar"
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto md:ml-0">{children}</main>
      </div>
    </div>
  );
}
