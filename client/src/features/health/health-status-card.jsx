import { useQuery } from "@tanstack/react-query";
import { Activity, CircleAlert, LoaderCircle } from "lucide-react";
import { getApiHealth } from "@/services/health.service.js";

export function HealthStatusCard() {
  const healthQuery = useQuery({
    queryKey: ["api-health"],
    queryFn: getApiHealth,
    refetchInterval: 60_000,
  });

  if (healthQuery.isPending) {
    return (
      <section className="status-card" aria-live="polite">
        <LoaderCircle className="animate-spin" aria-hidden="true" size={22} />
        <div>
          <p className="font-semibold">Checking API connection</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Waiting for the backend health endpoint.
          </p>
        </div>
      </section>
    );
  }

  if (healthQuery.isError) {
    return (
      <section className="status-card border-red-300 dark:border-red-900" role="alert">
        <CircleAlert className="text-red-500" aria-hidden="true" size={22} />
        <div>
          <p className="font-semibold">API connection failed</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {healthQuery.error.message}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="status-card border-emerald-300 dark:border-emerald-900"
      aria-live="polite"
    >
      <Activity className="text-emerald-500" aria-hidden="true" size={22} />
      <div>
        <p className="font-semibold">API is online</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Database: {healthQuery.data.database.status}
        </p>
      </div>
    </section>
  );
}
