import { useQuery } from "@tanstack/react-query";
import {
  Archive,
  CircleAlert,
  Clock3,
  ScanSearch,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/ui/empty-state.jsx";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { PageHeader } from "@/components/ui/page-header.jsx";
import { SectionCard } from "@/components/ui/section-card.jsx";
import { StatCard } from "@/components/ui/stat-card.jsx";
import { getMatches } from "@/services/match.service.js";

async function getModeratorDashboard() {
  const [pending, processing, failed, verified, queue] = await Promise.all([
    getMatches({ status: "needs_review", page: 1, limit: 1 }),
    getMatches({ status: "processing", page: 1, limit: 1 }),
    getMatches({ status: "processing_failed", page: 1, limit: 1 }),
    getMatches({ status: "verified", page: 1, limit: 1 }),
    getMatches({ status: "needs_review", page: 1, limit: 5, sortOrder: "asc" }),
  ]);
  return {
    pending: pending.pagination.totalItems,
    processing: processing.pagination.totalItems,
    failed: failed.pagination.totalItems,
    verified: verified.pagination.totalItems,
    queue: queue.data,
  };
}

export function ModeratorDashboardPage() {
  const query = useQuery({
    queryKey: ["moderator-dashboard"],
    queryFn: getModeratorDashboard,
  });
  if (query.isPending) return <LoadingState title="Loading moderator dashboard" />;
  if (query.isError) {
    return (
      <ErrorState description={query.error.message} onRetry={() => query.refetch()} />
    );
  }
  const data = query.data;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Verification operations"
        title="Moderator dashboard"
        description="Review screenshot processing, correct OCR output and verify match results."
        icon={ScanSearch}
        action={
          <Link
            to="/moderator/uploads"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-3 font-black text-slate-950"
          >
            <Upload size={18} aria-hidden="true" />
            Upload screenshot
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pending verification"
          value={data.pending}
          helper="Requires manual review"
          icon={Clock3}
        />
        <StatCard
          label="Processing OCR"
          value={data.processing}
          helper="Active extraction jobs"
          icon={ScanSearch}
        />
        <StatCard
          label="Failed OCR jobs"
          value={data.failed}
          helper="Available for retry"
          icon={CircleAlert}
        />
        <StatCard
          label="Verified matches"
          value={data.verified}
          helper="Official match results"
          icon={ShieldCheck}
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <SectionCard
          title="Verification queue"
          description="Oldest pending screenshots"
        >
          {data.queue.length ? (
            <div className="grid gap-3">
              {data.queue.map((match) => (
                <Link
                  key={match.id}
                  to={`/moderator/matches/${match.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 hover:border-amber-400 dark:border-slate-800"
                >
                  <div>
                    <p className="font-black">{match.matchCode}</p>
                    <p className="text-xs text-slate-500">
                      {match.participantCount} players ·{" "}
                      {new Date(match.matchDate).toLocaleString()}
                    </p>
                  </div>
                  <span className="font-bold text-amber-700 dark:text-amber-300">
                    Review →
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ShieldCheck}
              title="Verification queue is clear"
              description="There are no reviewed screenshots waiting for verification."
            />
          )}
        </SectionCard>
        <SectionCard title="Screenshot archive" description="League evidence">
          <Link
            to="/moderator/archive"
            className="flex items-center gap-3 rounded-2xl border border-slate-200 p-5 font-black hover:border-amber-400 dark:border-slate-800"
          >
            <Archive size={24} /> Open complete archive
          </Link>
        </SectionCard>
      </div>
    </div>
  );
}
