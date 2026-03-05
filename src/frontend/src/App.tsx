import { BetSlip } from "@/components/BetSlip";
import { Toaster } from "@/components/ui/sonner";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { AdminBetsPage } from "@/pages/admin/AdminBetsPage";
import { AdminCasinoPage } from "@/pages/admin/AdminCasinoPage";
import { AdminCrashPage } from "@/pages/admin/AdminCrashPage";
import { AdminLayout } from "@/pages/admin/AdminLayout";
import { AdminMarketsPage } from "@/pages/admin/AdminMarketsPage";
import { AdminUsersPage } from "@/pages/admin/AdminUsersPage";
import { SuperAdminDashboard } from "@/pages/superadmin/SuperAdminDashboard";
import { AccountPage } from "@/pages/user/AccountPage";
import { CasinoPage } from "@/pages/user/CasinoPage";
import { CrashPage } from "@/pages/user/CrashPage";
import { MarketsPage } from "@/pages/user/MarketsPage";
import { MyBetsPage } from "@/pages/user/MyBetsPage";
import { UserLayout } from "@/pages/user/UserLayout";
import { useStore } from "@/store/useStore";

const toasterProps = {
  theme: "dark" as const,
  toastOptions: {
    style: {
      background: "oklch(0.16 0.015 265)",
      border: "1px solid oklch(0.22 0.02 265)",
      color: "oklch(0.95 0.01 85)",
    },
  },
};

function App() {
  const currentUser = useStore((s) => s.currentUser);
  const currentPage = useStore((s) => s.currentPage);

  // Landing page — always show first if not logged in and not explicitly on login
  if (!currentUser && currentPage !== "login") {
    return (
      <>
        <LandingPage />
        <Toaster {...toasterProps} />
      </>
    );
  }

  // Login page
  if (!currentUser || currentPage === "login") {
    return (
      <>
        <LoginPage />
        <Toaster {...toasterProps} />
      </>
    );
  }

  // SuperAdmin
  if (currentUser.role === "superadmin") {
    return (
      <>
        <SuperAdminDashboard />
        <Toaster {...toasterProps} />
      </>
    );
  }

  // Admin
  if (currentUser.role === "admin") {
    return (
      <>
        <AdminLayout>
          {currentPage === "admin-markets" && <AdminMarketsPage />}
          {currentPage === "admin-users" && <AdminUsersPage />}
          {currentPage === "admin-bets" && <AdminBetsPage />}
          {currentPage === "admin-casino" && <AdminCasinoPage />}
          {currentPage === "admin-crash" && <AdminCrashPage />}
        </AdminLayout>
        <Toaster {...toasterProps} />
      </>
    );
  }

  // Regular User
  return (
    <>
      <UserLayout>
        {currentPage === "user-markets" && <MarketsPage />}
        {currentPage === "user-bets" && <MyBetsPage />}
        {currentPage === "user-account" && <AccountPage />}
        {currentPage === "user-casino" && <CasinoPage />}
        {currentPage === "user-crash" && <CrashPage />}
      </UserLayout>
      <BetSlip />
      <Toaster {...toasterProps} />
    </>
  );
}

export default App;
