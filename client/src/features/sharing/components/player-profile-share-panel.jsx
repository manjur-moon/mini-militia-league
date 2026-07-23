import { useQuery } from "@tanstack/react-query";
import { Share2 } from "lucide-react";
import { getPlayerProfileShare } from "@/services/social-sharing.service.js";
import { ShareActions } from "./share-actions.jsx";

export function PlayerProfileSharePanel({ playerId }) {
  const query = useQuery({
    queryKey: ["player-profile-share", playerId],
    queryFn: () => getPlayerProfileShare(playerId),
    enabled: Boolean(playerId),
    staleTime: 5 * 60 * 1000,
  });

  if (query.isError || !query.data?.data) return null;
  const data = query.data.data;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
            <Share2 size={17} /> Public sharing
          </p>
          <h2 className="mt-2 text-xl font-black">Share this verified profile</h2>
          <p className="mt-1 text-sm text-slate-500">
            The public preview includes league statistics only—never account email or
            private user data.
          </p>
        </div>
        <ShareActions
          data={data}
          downloadFilename={`${playerId}-mini-militia-profile.png`}
          compact
        />
      </div>
    </section>
  );
}
