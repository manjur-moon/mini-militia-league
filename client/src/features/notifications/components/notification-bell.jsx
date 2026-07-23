import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { getUnreadNotificationCount } from "@/services/notification.service.js";

export function NotificationBell({ to }) {
  const query = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: getUnreadNotificationCount,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });
  const unreadCount = query.data?.data?.unreadCount ?? 0;
  const badge = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <Link
      to={to}
      className="relative hidden size-10 place-items-center rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 sm:grid dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      aria-label={
        unreadCount > 0
          ? `Open notifications, ${unreadCount} unread`
          : "Open notifications"
      }
    >
      <Bell size={18} aria-hidden="true" />
      {unreadCount > 0 ? (
        <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-[10px] font-black leading-4 text-white">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
