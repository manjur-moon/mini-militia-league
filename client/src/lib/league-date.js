const DEFAULT_LEAGUE_TIMEZONE = "Asia/Dhaka";
const LEAGUE_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function partsToLeagueDate(parts) {
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export function getLeagueToday({
  now = new Date(),
  timezone = DEFAULT_LEAGUE_TIMEZONE,
} = {}) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return partsToLeagueDate(formatter.formatToParts(now));
}

export function isLeagueDate(value) {
  if (!LEAGUE_DATE_PATTERN.test(value ?? "")) return false;

  const [year, month, day] = value.split("-").map(Number);
  const candidate = new Date(Date.UTC(year, month - 1, day, 12));

  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day
  );
}

export function formatLeagueDate(
  leagueDate,
  { locale, fallback = "Unavailable", dateStyle = "medium" } = {},
) {
  if (!isLeagueDate(leagueDate)) return fallback;

  const [year, month, day] = leagueDate.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day, 12));

  return new Intl.DateTimeFormat(locale, {
    dateStyle,
    timeZone: "UTC",
  }).format(value);
}

export function resolveMatchLeagueDate(match) {
  if (isLeagueDate(match?.leagueDate)) return match.leagueDate;
  if (!match?.matchDate) return null;

  return getLeagueToday({
    now: new Date(match.matchDate),
    timezone: match.timezone ?? DEFAULT_LEAGUE_TIMEZONE,
  });
}

export function formatMatchLeagueDate(match, options) {
  return formatLeagueDate(resolveMatchLeagueDate(match), options);
}

export { DEFAULT_LEAGUE_TIMEZONE };
