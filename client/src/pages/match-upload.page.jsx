import { useMutation } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header.jsx";
import { getLeagueToday } from "@/lib/league-date.js";
import { uploadMatchScreenshot } from "@/services/match.service.js";

const fieldClass =
  "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900";

export function MatchUploadPage({ basePath = "/moderator" }) {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const leagueToday = getLeagueToday();
  const [leagueDate, setLeagueDate] = useState(leagueToday);
  const [participantCount, setParticipantCount] = useState(4);

  const mutation = useMutation({
    mutationFn: uploadMatchScreenshot,
    onSuccess: (result) => {
      toast.success(result.message);
      navigate(`${basePath}/matches/${result.data.match.id}`);
    },
    onError: (error) => toast.error(error.message),
  });

  function submit(event) {
    event.preventDefault();
    if (!file) return toast.error("Select a match screenshot.");
    mutation.mutate({
      file,
      leagueDate,
      participantCount: Number(participantCount),
    });
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Moderator workflow"
        title="Upload match screenshot"
        description="Choose the date the match belongs to, then upload the screenshot. Upload time does not affect the match date."
        icon={Upload}
      />
      <form
        onSubmit={submit}
        className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <label className="text-sm font-bold">
          Screenshot
          <input
            className={fieldClass}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <span className="mt-2 block text-xs text-slate-500">
            JPEG, PNG or WebP. Maximum 10 MB.
          </span>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold">
            Match date
            <input
              className={fieldClass}
              type="date"
              value={leagueDate}
              max={leagueToday}
              onChange={(event) => setLeagueDate(event.target.value)}
              required
            />
            <span className="mt-2 block text-xs font-medium text-slate-500">
              You can upload a previous date at any time. Future dates are not allowed.
            </span>
          </label>
          <label className="text-sm font-bold">
            Participant count
            <input
              className={fieldClass}
              type="number"
              min="2"
              max="50"
              value={participantCount}
              onChange={(event) => setParticipantCount(event.target.value)}
              required
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="justify-self-start rounded-xl bg-amber-500 px-5 py-3 font-black text-white disabled:opacity-50"
        >
          {mutation.isPending ? "Uploading…" : "Upload and queue OCR"}
        </button>
      </form>
    </div>
  );
}
