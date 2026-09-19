import { DateTime, IANAZone } from "luxon";

import { env } from "../config/env.js";
import { AppError } from "./app-error.js";

export const LEAGUE_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const LEGACY_LEAGUE_DAY_START_HOUR = 7;

function assertTimezone(timezone) {
  if (!IANAZone.isValidZone(timezone)) {
    throw new AppError({
      statusCode: 422,
      code: "INVALID_TIMEZONE",
      message: "A valid IANA league timezone is required.",
    });
  }
}

export function isValidLeagueDate(value, timezone = env.LEAGUE_TIMEZONE) {
  if (typeof value !== "string" || !LEAGUE_DATE_PATTERN.test(value)) {
    return false;
  }

  assertTimezone(timezone);

  const parsed = DateTime.fromISO(value, {
    zone: timezone,
  });

  return parsed.isValid && parsed.toFormat("yyyy-LL-dd") === value;
}

export function assertValidLeagueDate(value, timezone = env.LEAGUE_TIMEZONE) {
  if (!isValidLeagueDate(value, timezone)) {
    throw new AppError({
      statusCode: 422,
      code: "INVALID_LEAGUE_DATE",
      message: "Match date must be a valid calendar date in YYYY-MM-DD format.",
    });
  }

  return value;
}

export function leagueDateToCanonicalInstant(
  leagueDate,
  timezone = env.LEAGUE_TIMEZONE,
) {
  assertValidLeagueDate(leagueDate, timezone);

  return DateTime.fromISO(leagueDate, {
    zone: timezone,
  })
    .set({
      hour: 12,
      minute: 0,
      second: 0,
      millisecond: 0,
    })
    .toUTC()
    .toJSDate();
}

export function leagueDateFromTimestamp(value, timezone = env.LEAGUE_TIMEZONE) {
  assertTimezone(timezone);

  const parsed =
    value instanceof Date
      ? DateTime.fromJSDate(value, { zone: timezone })
      : DateTime.fromISO(String(value), { setZone: true }).setZone(timezone);

  if (!parsed.isValid) {
    throw new AppError({
      statusCode: 422,
      code: "INVALID_MATCH_DATE",
      message: "A valid match date is required.",
    });
  }

  return parsed.toFormat("yyyy-LL-dd");
}

export function resolveRequestedLeagueDate(input, timezone = env.LEAGUE_TIMEZONE) {
  if (input?.leagueDate) {
    return assertValidLeagueDate(input.leagueDate, timezone);
  }

  if (input?.matchDate) {
    return leagueDateFromTimestamp(input.matchDate, timezone);
  }

  throw new AppError({
    statusCode: 422,
    code: "MATCH_DATE_REQUIRED",
    message: "A match date is required.",
  });
}

export function assertLeagueDateNotFuture(
  leagueDate,
  timezone = env.LEAGUE_TIMEZONE,
) {
  assertValidLeagueDate(leagueDate, timezone);

  const selected = DateTime.fromISO(leagueDate, {
    zone: timezone,
  }).startOf("day");

  const today = DateTime.now().setZone(timezone).startOf("day");

  if (selected > today) {
    throw new AppError({
      statusCode: 422,
      code: "FUTURE_MATCH_DATE_NOT_ALLOWED",
      message: "Match date cannot be in the future.",
    });
  }

  return leagueDate;
}

export function resolveLegacyLeagueDate(
  value,
  timezone = env.LEAGUE_TIMEZONE,
  dayStartHour = LEGACY_LEAGUE_DAY_START_HOUR,
) {
  assertTimezone(timezone);

  const parsed = DateTime.fromJSDate(new Date(value), {
    zone: timezone,
  });

  if (!parsed.isValid) {
    throw new AppError({
      statusCode: 422,
      code: "INVALID_MATCH_DATE",
      message: "A valid historical match date is required.",
    });
  }

  return parsed.minus({ hours: dayStartHour }).toFormat("yyyy-LL-dd");
}
