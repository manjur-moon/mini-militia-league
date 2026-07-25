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

const priorityLinks = [{ label: "Hall of Fame", to: "/hall-of-fame" }];

function getDesktopLinkClass({ isActive }) {
  return [
    "whitespace-nowrap rounded-lg px-2 py-2 text-sm font-bold transition",
    isActive
      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white",
  ].join(" ");
}

function getPriorityLinkClass({ isActive }) {
  return [
    "whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-bold transition",
    isActive
      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white",
  ].join(" ");
}

function getMobileLinkClass({ isActive }) {
  return [
    "rounded-xl px-3 py-2.5 text-sm font-bold transition",
    isActive
      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900",
  ].join(" ");
}

export function PublicLayout() {
  const [isOpen, setIsOpen] = useState(false);

  function closeNavigation() {
    setIsOpen(false);
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/90">
        <div className="mx-auto flex h-18 w-full max-w-[1920px] items-center gap-3 px-4 sm:px-6 min-[1700px]:px-8">
          <div className="shrink-0">
            <AppLogo />
          </div>

          {/* Complete navigation for very large screens */}
          <nav
            className="hidden min-w-0 flex-1 items-center justify-center gap-1 min-[1700px]:flex"
            aria-label="Public navigation"
          >
            {publicLinks.map((item) =>
              item.disabled ? (
                <span
                  key={item.label}
                  className="cursor-not-allowed whitespace-nowrap rounded-lg px-2 py-2 text-sm font-bold text-slate-400"
                  title="Available in a later phase"
                >
                  {item.label}
                </span>
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={getDesktopLinkClass}
                >
                  {item.label}
                </NavLink>
              ),
            )}
          </nav>

          {/* Laptop priority link */}
          <nav
            className="ml-auto hidden shrink-0 items-center gap-1 xl:flex min-[1700px]:hidden"
            aria-label="Priority navigation"
          >
            {priorityLinks.map((item) => (
              <NavLink key={item.to} to={item.to} className={getPriorityLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Dashboard, Account and Sign in/Sign out */}
          <div className="hidden shrink-0 items-center xl:flex">
            <AuthNavigation />
          </div>

          <div
            className={["flex shrink-0 items-center gap-2", "max-xl:ml-auto"].join(" ")}
          >
            <ThemeToggle />

            {/* Menu button stays visible below 1700px */}
            <button
              type="button"
              onClick={() => setIsOpen((value) => !value)}
              className="grid size-10 place-items-center rounded-xl border border-slate-300 bg-white transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 min-[1700px]:hidden"
              aria-label={isOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={isOpen}
              aria-controls="responsive-public-navigation"
            >
              {isOpen ? (
                <X size={20} aria-hidden="true" />
              ) : (
                <Menu size={20} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Laptop, tablet and mobile dropdown */}
        {isOpen ? (
          <div
            id="responsive-public-navigation"
            className="border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950 min-[1700px]:hidden"
          >
            <div className="mx-auto w-full max-w-6xl">
              <nav
                className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                aria-label="Responsive public navigation"
              >
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
                      end={item.to === "/"}
                      onClick={closeNavigation}
                      className={getMobileLinkClass}
                    >
                      {item.label}
                    </NavLink>
                  ),
                )}
              </nav>

              {/* Mobile and tablet authentication navigation */}
              <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800 xl:hidden">
                <AuthNavigation />
              </div>
            </div>
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
