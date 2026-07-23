import { LockKeyhole } from "lucide-react";
import { NavLink } from "react-router-dom";
import { AppLogo } from "@/components/brand/app-logo.jsx";

function NavigationItem({ item, onNavigate }) {
  const Icon = item.icon;

  if (item.disabled) {
    return (
      <span
        className="group flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-400"
        title="Available in a later development phase"
      >
        <Icon size={19} aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        <LockKeyhole size={13} aria-hidden="true" />
      </span>
    );
  }

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${isActive ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/15" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"}`
      }
    >
      <Icon size={19} aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
    </NavLink>
  );
}

export function DashboardSidebar({ navigation, roleLabel, onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-18 items-center border-b border-slate-200 px-4 dark:border-slate-800">
        <AppLogo to="/dashboard" />
      </div>
      <div className="px-4 pt-5">
        <span className="inline-flex rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
          {roleLabel}
        </span>
      </div>
      <nav
        className="flex-1 space-y-1 overflow-y-auto px-3 py-5"
        aria-label={`${roleLabel} dashboard navigation`}
      >
        {navigation.map((item) => (
          <NavigationItem key={item.label} item={item} onNavigate={onNavigate} />
        ))}
      </nav>
      <div className="border-t border-slate-200 p-4 text-xs leading-5 text-slate-500 dark:border-slate-800 dark:text-slate-400">
        Features marked with a lock are scheduled for later phases.
      </div>
    </div>
  );
}
