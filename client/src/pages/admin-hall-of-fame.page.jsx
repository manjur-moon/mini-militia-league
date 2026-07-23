import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Crown, RefreshCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ErrorState } from "@/components/ui/error-state.jsx";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { PageHeader } from "@/components/ui/page-header.jsx";
import { SectionCard } from "@/components/ui/section-card.jsx";
import { HallOfFameRecordCard } from "@/features/hall-of-fame/components/hall-of-fame-record-card.jsx";
import {
  getHallOfFame,
  recalculateHallOfFame,
} from "@/services/hall-of-fame.service.js";

export function AdminHallOfFamePage() {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState("");
  const [seasonId, setSeasonId] = useState("");
  const [reason, setReason] = useState(
    "Refresh Hall of Fame records from current verified league data.",
  );
  const query = useQuery({
    queryKey: ["admin-hall-of-fame"],
    queryFn: () => getHallOfFame({ status: "all", limit: 100 }),
  });
  const mutation = useMutation({
    mutationFn: recalculateHallOfFame,
    onSuccess: async (response) => {
      toast.success(response.message);
      await queryClient.invalidateQueries({ queryKey: ["admin-hall-of-fame"] });
      await queryClient.invalidateQueries({ queryKey: ["hall-of-fame"] });
    },
    onError: (error) => toast.error(error.message),
  });

  function submit(event) {
    event.preventDefault();
    mutation.mutate({
      category: category || undefined,
      seasonId: seasonId || undefined,
      reason,
    });
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Historical governance"
        title="Hall of Fame management"
        description="Recalculate versioned records without rewriting historical snapshots."
        icon={Crown}
      />

      <SectionCard
        title="Recalculate records"
        description="Global records are refreshed automatically after verified data changes; season champions require a completed season"
      >
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-black">
            Category
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="">All global records and completed seasons</option>
              <option value="season_champion">Season Champion</option>
              <option value="all_time_legend">All-Time Legend</option>
              <option value="most_kills">Most Kills</option>
              <option value="most_mvp_awards">Most MVP Awards</option>
              <option value="best_kdr">Best KDR</option>
              <option value="longest_winning_streak">Longest Winning Streak</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-black">
            Season MongoDB ID
            <input
              value={seasonId}
              onChange={(event) => setSeasonId(event.target.value)}
              placeholder="Required only for one season champion"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <label className="grid gap-2 text-sm font-black md:col-span-2">
            Audit reason
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="min-h-24 rounded-xl border border-slate-300 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <button
            type="submit"
            disabled={mutation.isPending || reason.trim().length < 5}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 font-black text-slate-950 disabled:opacity-50 md:col-span-2"
          >
            <RefreshCcw size={18} /> Recalculate Hall of Fame
          </button>
        </form>
      </SectionCard>

      <SectionCard
        title="Record archive"
        description="Current and superseded snapshots remain independently auditable"
      >
        {query.isPending ? <LoadingState title="Loading Hall of Fame archive" /> : null}
        {query.isError ? (
          <ErrorState
            title="Hall of Fame archive unavailable"
            description={query.error.message}
            onRetry={() => query.refetch()}
          />
        ) : null}
        {query.data?.data?.items?.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {query.data.data.items.map((record) => (
              <HallOfFameRecordCard key={record.id} record={record} compact />
            ))}
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}
