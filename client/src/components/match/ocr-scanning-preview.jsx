import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LoaderCircle, ScanLine } from "lucide-react";

function getStatusLabel(status) {
  if (status === "queued") {
    return "Preparing OCR scan";
  }

  if (status === "processing") {
    return "Scanning screenshot";
  }

  return "OCR scan";
}

export function OcrScanningPreview({
  imageUrl,
  alt = "Mini Militia result screenshot",
  isScanning = false,
  status = "",
  provider = "",
}) {
  const shouldReduceMotion = useReducedMotion();

  const statusLabel = getStatusLabel(status);

  return (
    <div className="relative isolate overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 dark:border-slate-800">
      <img src={imageUrl} alt={alt} className="max-h-[680px] w-full object-contain" />

      <AnimatePresence initial={false}>
        {isScanning ? (
          <motion.div
            key="ocr-scanning-overlay"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: 0.25,
            }}
            className="pointer-events-none absolute inset-0 overflow-hidden"
            role="status"
            aria-live="polite"
            aria-label={statusLabel}
          >
            {/* Dark scanning overlay */}
            <div className="absolute inset-0 bg-slate-950/25" />

            {/* Scanner grid */}
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(34, 211, 238, 0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.16) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />

            {/* Animated sweep area */}
            <motion.div
              className="absolute left-0 right-0 h-24 -translate-y-1/2"
              initial={{
                top: "5%",
              }}
              animate={
                shouldReduceMotion
                  ? {
                      top: "50%",
                      opacity: [0.5, 1, 0.5],
                    }
                  : {
                      top: ["5%", "95%"],
                      opacity: 1,
                    }
              }
              transition={
                shouldReduceMotion
                  ? {
                      duration: 1.5,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }
                  : {
                      duration: 2.1,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }
              }
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent" />

              <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-cyan-300 shadow-[0_0_10px_2px_rgba(34,211,238,0.95),0_0_28px_8px_rgba(34,211,238,0.45)]" />
            </motion.div>

            {/* Top-left status */}
            <div className="absolute left-3 top-3 flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-xl border border-cyan-300/40 bg-slate-950/80 px-3 py-2 text-xs font-black text-cyan-200 shadow-lg backdrop-blur-md sm:left-4 sm:top-4 sm:text-sm">
              <LoaderCircle
                size={17}
                className={shouldReduceMotion ? "" : "animate-spin"}
              />

              <span className="truncate">{statusLabel}</span>
            </div>

            {/* Provider */}
            {provider ? (
              <div className="absolute right-3 top-3 rounded-lg border border-white/15 bg-slate-950/75 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-white/90 backdrop-blur-md sm:right-4 sm:top-4 sm:text-xs">
                {provider}
              </div>
            ) : null}

            {/* Bottom status */}
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-white/15 bg-slate-950/80 px-3 py-2 text-[11px] font-bold text-white shadow-xl backdrop-blur-md sm:bottom-4 sm:text-xs">
              <ScanLine size={15} className="text-cyan-300" />
              Detecting players and statistics
            </div>

            {/* Scanner corners */}
            <div className="absolute left-3 top-3 h-8 w-8 border-l-2 border-t-2 border-cyan-300 sm:left-4 sm:top-4" />

            <div className="absolute right-3 top-3 h-8 w-8 border-r-2 border-t-2 border-cyan-300 sm:right-4 sm:top-4" />

            <div className="absolute bottom-3 left-3 h-8 w-8 border-b-2 border-l-2 border-cyan-300 sm:bottom-4 sm:left-4" />

            <div className="absolute bottom-3 right-3 h-8 w-8 border-b-2 border-r-2 border-cyan-300 sm:bottom-4 sm:right-4" />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
