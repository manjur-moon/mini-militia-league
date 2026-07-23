import {
  Award,
  Bell,
  CheckCircle2,
  Crown,
  Link2,
  Medal,
  ShieldCheck,
  ShieldX,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";

const ICONS = Object.freeze({
  achievement_unlocked: Award,
  mvp_award: Trophy,
  challenge_completed: Target,
  title_earned: Crown,
  match_verified: ShieldCheck,
  match_rejected: ShieldX,
  player_account_linked: Link2,
  season_started: Sparkles,
  season_completed: Medal,
  system_announcement: Bell,
});

export function NotificationItem({ notification, onOpen, onMarkRead, isUpdating }) {
  const Icon = ICONS[notification.type] ?? Bell;
  const createdAt = notification.createdAt
    ? new Date(notification.createdAt).toLocaleString()
    : "Unknown time";

  return (
    <article
      className={`rounded-2xl border p-4 transition sm:p-5 ${
        notification.isRead
          ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          : "border-amber-300 bg-amber-50/80 shadow-sm dark:border-amber-800 dark:bg-amber-950/25"
      }`}
    >
      <div className="flex items-start gap-4">
        <span
          className={`grid size-11 shrink-0 place-items-center rounded-xl ${
            notification.isRead
              ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              : "bg-amber-400 text-slate-950"
          }`}
        >
          <Icon size={20} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-base font-black text-slate-950 dark:text-white">
                {notification.title}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {notification.message}
              </p>
            </div>
            {!notification.isRead ? (
              <span className="rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-950">
                New
              </span>
            ) : null}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
            <span>{createdAt}</span>
            <span className="uppercase tracking-wider">
              {notification.type.replaceAll("_", " ")}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {notification.actionUrl ? (
              <button
                type="button"
                onClick={() => onOpen(notification)}
                className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                View details
              </button>
            ) : null}
            {!notification.isRead ? (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => onMarkRead(notification.id)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-black hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <CheckCircle2 size={16} aria-hidden="true" />
                Mark as read
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
