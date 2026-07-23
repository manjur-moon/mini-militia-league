import { playerNavigation } from "@/config/dashboard-navigation.jsx";
import { DashboardShell } from "@/layouts/dashboard/dashboard-shell.jsx";
export function PlayerDashboardLayout() {
  return (
    <DashboardShell
      navigation={playerNavigation}
      roleLabel="Player dashboard"
      accountPath="/player/account"
      notificationsPath="/player/notifications"
    />
  );
}
