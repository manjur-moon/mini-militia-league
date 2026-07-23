import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { DashboardHeader } from "./dashboard-header.jsx";
import { DashboardSidebar } from "./dashboard-sidebar.jsx";

export function DashboardShell({
  navigation,
  roleLabel,
  accountPath,
  notificationsPath,
}) {
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMobileNavigationOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isMobileNavigationOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileNavigationOpen]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-200 bg-white lg:block dark:border-slate-800 dark:bg-slate-900">
        <DashboardSidebar navigation={navigation} roleLabel={roleLabel} />
      </aside>

      {isMobileNavigationOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setIsMobileNavigationOpen(false)}
            aria-label="Close dashboard navigation overlay"
          />
          <aside className="relative h-full w-[min(88vw,18rem)] bg-white shadow-2xl dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setIsMobileNavigationOpen(false)}
              className="absolute right-3 top-4 z-10 grid size-10 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close dashboard navigation"
            >
              <X size={20} aria-hidden="true" />
            </button>
            <DashboardSidebar
              navigation={navigation}
              roleLabel={roleLabel}
              onNavigate={() => setIsMobileNavigationOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <DashboardHeader
          onOpenNavigation={() => setIsMobileNavigationOpen(true)}
          accountPath={accountPath}
          notificationsPath={notificationsPath}
        />
        <main className="min-h-[calc(100vh-4.5rem)] p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1500px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
