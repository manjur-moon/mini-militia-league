function clampRating(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(100, Math.max(0, Math.round(number)));
}

function initials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function Metric({ label, value }) {
  return (
    <div className="text-center">
      <p className="text-[0.62rem] font-black uppercase tracking-[0.22em] text-slate-400 sm:text-xs">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-white sm:text-3xl">{value}</p>
    </div>
  );
}

export function LeaguePlayerCard({ card, className = "" }) {
  const ratings = card.ratings ?? {};
  const hasPhoto = Boolean(card.player.profileImage?.secureUrl);

  return (
    <article
      aria-label={`${card.player.name} Mini Militia player card`}
      className={`relative aspect-[4/5] w-full max-w-[30rem] overflow-hidden rounded-[2.5rem] border-[3px] border-amber-400 bg-slate-950 shadow-2xl ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(245,158,11,0.32),transparent_43%),linear-gradient(145deg,#020617_0%,#111827_62%,#451a03_100%)]" />
      <div className="absolute -left-14 top-8 h-44 w-44 rotate-45 bg-amber-400/90" />
      <div className="absolute -bottom-12 -right-12 h-44 w-44 rotate-45 bg-amber-500/70" />

      <div className="relative flex h-full flex-col p-6 sm:p-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">
              Overall
            </p>
            <p className="mt-1 text-5xl font-black text-white sm:text-6xl">
              {clampRating(ratings.overall)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-300">
              {card.player.playerId}
            </p>
            <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              {card.minimumMatchesMet ? "Rank eligible" : "Provisional"}
            </p>
          </div>
        </header>

        <div className="mx-auto mt-2 grid aspect-square w-[68%] place-items-center overflow-hidden rounded-full border-[6px] border-amber-400 bg-slate-900 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
          {hasPhoto ? (
            <img
              src={card.player.profileImage.secureUrl}
              alt={`${card.player.name} profile`}
              className="h-full w-full object-cover"
              crossOrigin="anonymous"
            />
          ) : (
            <span className="text-6xl font-black text-amber-400 sm:text-8xl">
              {initials(card.player.name)}
            </span>
          )}
        </div>

        <div className="mt-auto text-center">
          <h1 className="truncate text-3xl font-black text-white sm:text-4xl">
            {card.player.name}
          </h1>
          <p className="mt-2 truncate text-sm font-black uppercase tracking-[0.2em] text-amber-300 sm:text-base">
            {card.title.name}
          </p>

          <div className="mt-5 grid grid-cols-5 gap-2 rounded-3xl border border-slate-700 bg-slate-950/75 px-3 py-4 backdrop-blur sm:px-5">
            <Metric label="ATT" value={clampRating(ratings.attack)} />
            <Metric label="SUR" value={clampRating(ratings.survival)} />
            <Metric label="CON" value={clampRating(ratings.consistency)} />
            <Metric label="ACT" value={clampRating(ratings.activity)} />
            <Metric label="KDR" value={Number(card.kdr ?? 0).toFixed(2)} />
          </div>

          <p className="mt-4 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-slate-400 sm:text-xs">
            Mini Militia League & Analytics · Formula {card.formulaVersion}
          </p>
        </div>
      </div>
    </article>
  );
}
