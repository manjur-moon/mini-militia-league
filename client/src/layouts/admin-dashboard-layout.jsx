import { adminNavigation } from "@/config/dashboard-navigation.jsx";
import { DashboardShell } from "@/layouts/dashboard/dashboard-shell.jsx";
export function AdminDashboardLayout() {
  return (
    <DashboardShell
      navigation={adminNavigation}
      roleLabel="Admin dashboard"
      accountPath="/admin/account"
      notificationsPath="/admin/notifications"
    />
  );
}
