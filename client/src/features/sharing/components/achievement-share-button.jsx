import { Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getAchievementShare } from "@/services/social-sharing.service.js";
import { sharePublicItem } from "../utils/share-actions.js";

export function AchievementShareButton({ playerId, achievementCode }) {
  const [loading, setLoading] = useState(false);

  async function handleShare() {
    setLoading(true);
    try {
      const response = await getAchievementShare(playerId, achievementCode);
      const data = response.data;
      const result = await sharePublicItem({
        title: data.title,
        text: data.description,
        url: data.urls.shareUrl,
      });
      toast.success(
        result === "copied" ? "Achievement link copied." : "Share dialog opened.",
      );
    } catch (error) {
      if (error?.name !== "AbortError") toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={loading}
      className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-black disabled:cursor-wait disabled:opacity-60 dark:border-slate-700"
    >
      <Share2 size={16} /> {loading ? "Preparing…" : "Share achievement"}
    </button>
  );
}
