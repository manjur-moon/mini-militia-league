import { DateTime, IANAZone } from "luxon";

import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

export const DEFAULT_WEEK_STARTS_ON = 1;
export const DEFAULT_LEAGUE_DAY_START_HOUR = 7;

function assertTimezone(timezone) {
  if (!IANAZone.isValidZone(timezone)) {
    throw new AppError({
      statusCode: 422,
      code: "INVALID_TIMEZONE",
      message: "A valid IANA league timezone is required.",
    });
  }
}

function assertLeagueDayStartHour(dayStartHour) {
  if (!Number.isInteger(dayStartHour) || dayStartHour < 0 || dayStartHour > 23) {
    throw new AppError({
      statusCode: 422,
      code: "INVALID_LEAGUE_DAY_START_HOUR",
      message: "League day start hour must be a whole number from 0 through 23.",
    });
  }
}

function isDateOnlyInput(input) {
  return typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input);
}

function toDateTime(input, timezone) {
  let value;

  if (input === undefined || input === null || input === "") {
    value = DateTime.now().setZone(timezone);
  } else if (input instanceof Date) {
    value = DateTime.fromJSDate(input, {
      zone: timezone,
    });
  } else if (isDateOnlyInput(input)) {
    /*
     * A date-only filter represents an explicit
     * calendar date in the configured league zone.
     */
    value = DateTime.fromISO(input, {
      zone: timezone,
    });
  } else if (typeof input === "string") {
    value = DateTime.fromISO(input, {
      setZone: true,
    }).setZone(timezone);
  } else {
    value = DateTime.fromJSDate(new Date(input), {
      zone: timezone,
    });
  }

  if (!value.isValid) {
    throw new AppError({
      statusCode: 422,
      code: "INVALID_PERIOD_DATE",
      message: "The requested analytics date is invalid.",
    });
  }

  return value;
}

function serializePeriod({
  type,
  key,
  start,
  end,
  timezone,
  seasonId = null,
  dayStartHour = null,
  label,
}) {
  return Object.freeze({
    type,
    key,
    startAt: start.toUTC().toJSDate(),
    endAt: end.toUTC().toJSDate(),
    timezone,
    seasonId,
    dayStartHour,
    label,
  });
}

/**
 * Resolves a league day using a configurable rollover hour.
 *
 * For LEAGUE_DAY_START_HOUR=7:
 *
 * 29 Jul 2026 07:00 inclusive
 * through
 * 30 Jul 2026 07:00 exclusive
 *
 * A date-only input explicitly selects that league-day key.
 *
 * A timestamp input is classified according to the actual
 * league-day boundary. Therefore, 29 Jul at 06:59 belongs
 * to the 28 Jul league day.
 */
export function resolveDailyPeriod({
  date,
  timezone = env.LEAGUE_TIMEZONE,
  dayStartHour = env.LEAGUE_DAY_START_HOUR ?? DEFAULT_LEAGUE_DAY_START_HOUR,
} = {}) {
  assertTimezone(timezone);
  assertLeagueDayStartHour(dayStartHour);

  const reference = toDateTime(date, timezone);

  const start = isDateOnlyInput(date)
    ? reference.startOf("day").plus({
        hours: dayStartHour,
      })
    : reference
        .minus({
          hours: dayStartHour,
        })
        .startOf("day")
        .plus({
          hours: dayStartHour,
        });

  const end = start.plus({
    days: 1,
  });

  return serializePeriod({
    type: "daily",
    key: start.toFormat("yyyy-LL-dd"),
    start,
    end,
    timezone,
    dayStartHour,
    label: `${start.toFormat("dd LLL yyyy, h:mm a")} – ${end.toFormat(
      "dd LLL yyyy, h:mm a",
    )}`,
  });
}

export function resolveWeeklyPeriod({
  date,
  timezone = env.LEAGUE_TIMEZONE,
  weekStartsOn = DEFAULT_WEEK_STARTS_ON,
} = {}) {
  assertTimezone(timezone);

  const localDate = toDateTime(date, timezone).startOf("day");

  const currentWeekday = localDate.weekday % 7;

  const daysSinceStart = (currentWeekday - weekStartsOn + 7) % 7;

  const start = localDate.minus({
    days: daysSinceStart,
  });

  const end = start.plus({
    days: 7,
  });

  return serializePeriod({
    type: "weekly",
    key: start.toFormat("yyyy-LL-dd"),
    start,
    end,
    timezone,
    label: `${start.toFormat("dd LLL yyyy")} – ${end
      .minus({
        milliseconds: 1,
      })
      .toFormat("dd LLL yyyy")}`,
  });
}

export function resolveMonthlyPeriod({ date, timezone = env.LEAGUE_TIMEZONE } = {}) {
  assertTimezone(timezone);

  const start = toDateTime(date, timezone).startOf("month");

  const end = start.plus({
    months: 1,
  });

  return serializePeriod({
    type: "monthly",
    key: start.toFormat("yyyy-LL"),
    start,
    end,
    timezone,
    label: start.toFormat("LLLL yyyy"),
  });
}

export function resolveAllTimePeriod({
  startAt = new Date(0),
  endAt = new Date(),
  timezone = env.LEAGUE_TIMEZONE,
} = {}) {
  assertTimezone(timezone);

  const start = toDateTime(startAt, timezone);

  const requestedEnd = toDateTime(endAt, timezone);

  const end =
    requestedEnd <= start
      ? start.plus({
          milliseconds: 1,
        })
      : requestedEnd;

  return serializePeriod({
    type: "all_time",
    key: "all-time",
    start,
    end,
    timezone,
    label: "All time",
  });
}

export function resolveSeasonPeriod(season) {
  if (!season) {
    throw new AppError({
      statusCode: 404,
      code: "SEASON_NOT_FOUND",
      message: "Season was not found.",
    });
  }

  const timezone = season.timezone ?? env.LEAGUE_TIMEZONE;

  assertTimezone(timezone);

  const start = toDateTime(season.startAt, timezone);

  const end = toDateTime(season.endAt, timezone);

  return serializePeriod({
    type: "season",
    key: season.slug ?? `season-${season._id}`,
    start,
    end,
    timezone,
    seasonId: season._id,
    label: season.name,
  });
}

export function resolvePreviousPeriod(period) {
  if (period.type === "daily") {
    return resolveDailyPeriod({
      date: DateTime.fromJSDate(period.startAt)
        .setZone(period.timezone)
        .minus({
          days: 1,
        })
        .toJSDate(),

      timezone: period.timezone,

      dayStartHour:
        period.dayStartHour ??
        env.LEAGUE_DAY_START_HOUR ??
        DEFAULT_LEAGUE_DAY_START_HOUR,
    });
  }

  if (period.type === "weekly") {
    return resolveWeeklyPeriod({
      date: DateTime.fromJSDate(period.startAt)
        .minus({
          days: 1,
        })
        .toJSDate(),

      timezone: period.timezone,
    });
  }

  if (period.type === "monthly") {
    return resolveMonthlyPeriod({
      date: DateTime.fromJSDate(period.startAt)
        .setZone(period.timezone)
        .minus({
          months: 1,
        })
        .toJSDate(),

      timezone: period.timezone,
    });
  }

  return null;
}

export function periodContains(period, date) {
  const instant = new Date(date).getTime();

  return instant >= period.startAt.getTime() && instant < period.endAt.getTime();
}

export function formatLeagueDateKey(
  date,
  timezone = env.LEAGUE_TIMEZONE,
  dayStartHour = env.LEAGUE_DAY_START_HOUR ?? DEFAULT_LEAGUE_DAY_START_HOUR,
) {
  assertTimezone(timezone);
  assertLeagueDayStartHour(dayStartHour);

  const value = DateTime.fromJSDate(new Date(date), {
    zone: timezone,
  });

  if (!value.isValid) {
    throw new AppError({
      statusCode: 422,
      code: "INVALID_PERIOD_DATE",
      message: "The requested analytics date is invalid.",
    });
  }

  return value
    .minus({
      hours: dayStartHour,
    })
    .toFormat("yyyy-LL-dd");
}
