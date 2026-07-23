import { LogOut, Menu, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs.jsx";
import { ThemeToggle } from "@/components/ui/theme-toggle.jsx";
import { authClient } from "@/lib/auth-client.js";
import { NotificationBell } from "@/features/notifications/components/notification-bell.jsx";

export function DashboardHeader({ onOpenNavigation, accountPath, notificationsPath }) {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const user = session?.user;

  async function handleSignOut() {
    const { error } = await authClient.signOut();
    if (error) {
      toast.error(error.message ?? "Unable to sign out.");
      return;
    }
    toast.success("Signed out successfully.");
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-30 flex h-18 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 sm:px-6">
      <button
        type="button"
        onClick={onOpenNavigation}
        className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-300 lg:hidden dark:border-slate-700"
        aria-label="Open dashboard navigation"
      >
        <Menu size={20} aria-hidden="true" />
      </button>
      <div className="min-w-0 flex-1">
        <Breadcrumbs />
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell to={notificationsPath} />
        <ThemeToggle />
        <Link
          to={accountPath}
          className="hidden min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50 md:flex dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 dark:bg-slate-800">
            <UserRound size={17} aria-hidden="true" />
          </span>
          <span className="min-w-0 text-left">
            <span className="block max-w-36 truncate text-sm font-black">
              {user?.name ?? "Account"}
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {user?.role ?? "user"}
            </span>
          </span>
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="grid size-10 place-items-center rounded-xl text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
          aria-label="Sign out"
        >
          <LogOut size={18} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
