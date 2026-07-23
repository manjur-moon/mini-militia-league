export function PlayerAvatar({ player, size = "lg" }) {
  const dimensions = size === "sm" ? "size-12 text-base" : "size-24 text-2xl";
  const initials = player.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  if (player.profileImage?.secureUrl) {
    return (
      <img
        src={player.profileImage.secureUrl}
        alt={`${player.name} profile`}
        loading="lazy"
        className={`${dimensions} shrink-0 rounded-2xl object-cover ring-1 ring-slate-200 dark:ring-slate-700`}
      />
    );
  }

  return (
    <div
      aria-label={`${player.name} has no profile photo`}
      className={`${dimensions} grid shrink-0 place-items-center rounded-2xl bg-amber-500 font-black text-slate-950`}
    >
      {initials}
    </div>
  );
}
