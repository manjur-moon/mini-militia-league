import { Check, Copy, Download, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  copyShareLink,
  downloadPublicImage,
  sharePublicItem,
} from "../utils/share-actions.js";

export function ShareActions({ data, downloadFilename, compact = false }) {
  const [activeAction, setActiveAction] = useState("");
  const [copied, setCopied] = useState(false);
  if (!data?.urls?.shareUrl) return null;

  async function run(name, operation, successMessage) {
    setActiveAction(name);
    try {
      await operation();
      toast.success(successMessage);
    } catch (error) {
      if (error?.name !== "AbortError") toast.error(error.message);
    } finally {
      setActiveAction("");
    }
  }

  const buttonClass = compact
    ? "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-black dark:border-slate-700"
    : "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 font-black dark:border-slate-700";

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className={buttonClass}
        onClick={() =>
          run(
            "copy",
            async () => {
              await copyShareLink(data.urls.shareUrl);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1800);
            },
            "Public share link copied.",
          )
        }
        disabled={Boolean(activeAction)}
      >
        {copied ? <Check size={17} /> : <Copy size={17} />}
        {copied ? "Copied" : "Copy link"}
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={() =>
          run(
            "share",
            () =>
              sharePublicItem({
                title: data.title,
                text: data.description,
                url: data.urls.shareUrl,
              }),
            globalThis.navigator?.share ? "Share dialog opened." : "Link copied.",
          )
        }
        disabled={Boolean(activeAction)}
      >
        <Share2 size={17} /> Share
      </button>
      {data.urls.imageUrl && downloadFilename ? (
        <button
          type="button"
          className={buttonClass}
          onClick={() =>
            run(
              "download",
              () =>
                downloadPublicImage({
                  imageUrl: data.urls.imageUrl,
                  filename: downloadFilename,
                }),
              "Social artwork downloaded.",
            )
          }
          disabled={Boolean(activeAction)}
        >
          <Download size={17} />
          {activeAction === "download" ? "Rendering…" : "Download image"}
        </button>
      ) : null}
    </div>
  );
}
