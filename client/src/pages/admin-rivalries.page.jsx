import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCcw, Swords } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header.jsx";
import { SectionCard } from "@/components/ui/section-card.jsx";
import { recalculateRivalries } from "@/services/rivalry.service.js";

export function AdminRivalriesPage() {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState(
    "Rebuild rivalry caches after verified match review",
  );
  const mutation = useMutation({
    mutationFn: (periodTypes) => recalculateRivalries({ periodTypes, reason }),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ["player-rivalries"] });
      queryClient.invalidateQueries({ queryKey: ["rival-of-week"] });
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Head-to-head governance"
        title="Rivalry controls"
        description="Rebuild versioned rivalry caches from shared verified match results."
        icon={Swords}
      />
      <SectionCard
        title="Calculation rule"
        description="Better placement wins; equal placement uses kills; equal placement and kills is a draw."
      >
        <p className="text-sm text-slate-500">
          Rival of the Week requires at least two shared matches and prioritizes match
          activity, close win margins, combined kills and recency.
        </p>
      </SectionCard>
      <SectionCard
        title="Recalculation"
        description="All calculations remain reproducible from verified match results"
      >
        <label className="grid gap-2 text-sm font-black">
          Audit reason
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="min-h-24 rounded-xl border border-slate-300 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950"
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-3">
          {[
            ["all_time"],
            ["weekly"],
            ["monthly"],
            ["all_time", "weekly", "monthly"],
          ].map((periodTypes) => (
            <button
              key={periodTypes.join("-")}
              type="button"
              disabled={mutation.isPending || reason.trim().length < 5}
              onClick={() => mutation.mutate(periodTypes)}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 font-black text-white disabled:opacity-50 dark:bg-white dark:text-slate-950"
            >
              <RefreshCcw size={17} />
              {periodTypes.length > 1
                ? "Rebuild core periods"
                : `Rebuild ${periodTypes[0].replace("_", " ")}`}
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
