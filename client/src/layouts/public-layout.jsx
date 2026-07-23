import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { AppLogo } from "@/components/brand/app-logo.jsx";
import { ThemeToggle } from "@/components/ui/theme-toggle.jsx";
import { AuthNavigation } from "@/features/auth/components/auth-navigation.jsx";

const publicLinks = [
  { label: "Home", to: "/" },
  { label: "Players", to: "/players" },
  { label: "Leaderboards", to: "/leaderboards" },
  { label: "Analytics", to: "/analytics" },
  { label: "AI Insights", to: "/insights" },
  { label: "MVP", to: "/mvp" },
  { label: "Ratings", to: "/ratings" },
  { label: "Titles", to: "/titles" },
  { label: "Achievements", to: "/achievements" },
  { label: "Rivalries", to: "/rivalries" },
  { label: "Challenges", to: "/challenges" },
  { label: "Matches", to: "/matches" },
  { label: "Hall of Fame", to: "/hall-of-fame" },
  { label: "Seasons", to: "/seasons" },
];

export function PublicLayout() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/90">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <AppLogo />

          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label="Public navigation"
          >
            {publicLinks.map((item) =>
              item.disabled ? (
                <span
                  key={item.label}
                  className="cursor-not-allowed rounded-lg px-3 py-2 text-sm font-bold text-slate-400"
                  title="Available in a later phase"
                >
                  {item.label}
                </span>
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm font-bold transition ${isActive ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"}`
                  }
                >
                  {item.label}
                </NavLink>
              ),
            )}
          </nav>

          <div className="hidden items-center gap-2 sm:flex">
            <AuthNavigation />
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-2 sm:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setIsOpen((value) => !value)}
              className="grid size-10 place-items-center rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
              aria-label={isOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={isOpen}
            >
              {isOpen ? (
                <X size={20} aria-hidden="true" />
              ) : (
                <Menu size={20} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {isOpen ? (
          <div className="border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950 sm:hidden">
            <nav className="grid gap-1" aria-label="Mobile public navigation">
              {publicLinks.map((item) =>
                item.disabled ? (
                  <span
                    key={item.label}
                    className="cursor-not-allowed rounded-xl px-3 py-2.5 text-sm font-bold text-slate-400"
                  >
                    {item.label} · Soon
                  </span>
                ) : (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl px-3 py-2.5 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-900"
                  >
                    {item.label}
                  </NavLink>
                ),
              )}
              <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-800">
                <AuthNavigation />
              </div>
            </nav>
          </div>
        ) : null}
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} Mini Militia League. Verified match data powers
            official analytics.
          </p>
          <div className="flex gap-4">
            <Link to="/login" className="font-bold hover:text-amber-600">
              Sign in
            </Link>
            <Link to="/register" className="font-bold hover:text-amber-600">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
