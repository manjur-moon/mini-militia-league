import { moderatorNavigation } from "@/config/dashboard-navigation.jsx";
import { DashboardShell } from "@/layouts/dashboard/dashboard-shell.jsx";
export function ModeratorDashboardLayout() {
  return (
    <DashboardShell
      navigation={moderatorNavigation}
      roleLabel="Moderator dashboard"
      accountPath="/moderator/account"
      notificationsPath="/moderator/notifications"
    />
  );
}
