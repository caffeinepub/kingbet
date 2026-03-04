import { BetSlip } from "@/components/BetSlip";
import { Toaster } from "@/components/ui/sonner";
import { LoginPage } from "@/pages/LoginPage";
import { AdminBetsPage } from "@/pages/admin/AdminBetsPage";
import { AdminLayout } from "@/pages/admin/AdminLayout";
import { AdminMarketsPage } from "@/pages/admin/AdminMarketsPage";
import { AdminUsersPage } from "@/pages/admin/AdminUsersPage";
import { SuperAdminDashboard } from "@/pages/superadmin/SuperAdminDashboard";
import { AccountPage } from "@/pages/user/AccountPage";
import { MarketsPage } from "@/pages/user/MarketsPage";
import { MyBetsPage } from "@/pages/user/MyBetsPage";
import { UserLayout } from "@/pages/user/UserLayout";
import { useStore } from "@/store/useStore";

function App() {
  const currentUser = useStore((s) => s.currentUser);
  const currentPage = useStore((s) => s.currentPage);

  // Not logged in
  if (!currentUser || currentPage === "login") {
    return (
      <>
        <LoginPage />
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: "oklch(0.16 0.015 265)",
              border: "1px solid oklch(0.22 0.02 265)",
              color: "oklch(0.95 0.01 85)",
            },
          }}
        />
      </>
    );
  }

  // SuperAdmin
  if (currentUser.role === "superadmin") {
    return (
      <>
        <SuperAdminDashboard />
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: "oklch(0.16 0.015 265)",
              border: "1px solid oklch(0.22 0.02 265)",
              color: "oklch(0.95 0.01 85)",
            },
          }}
        />
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
        </AdminLayout>
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: "oklch(0.16 0.015 265)",
              border: "1px solid oklch(0.22 0.02 265)",
              color: "oklch(0.95 0.01 85)",
            },
          }}
        />
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
      </UserLayout>
      <BetSlip />
      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: "oklch(0.16 0.015 265)",
            border: "1px solid oklch(0.22 0.02 265)",
            color: "oklch(0.95 0.01 85)",
          },
        }}
      />
    </>
  );
}

export default App;
