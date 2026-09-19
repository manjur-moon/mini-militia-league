import { describe, expect, it, vi } from "vitest";

import {
  assertLeagueDateNotFuture,
  isValidLeagueDate,
  leagueDateFromTimestamp,
  leagueDateToCanonicalInstant,
  resolveLegacyLeagueDate,
  resolveRequestedLeagueDate,
} from "../src/utils/league-date.js";

describe("league date utilities", () => {
  it("converts an explicit league date to local-noon canonical UTC", () => {
    expect(leagueDateToCanonicalInstant("2026-09-15", "Asia/Dhaka").toISOString()).toBe(
      "2026-09-15T06:00:00.000Z",
    );
  });

  it("converts legacy timestamp input to the same local calendar date without a 7 AM rollover", () => {
    expect(leagueDateFromTimestamp("2026-09-15T06:15:00+06:00", "Asia/Dhaka")).toBe(
      "2026-09-15",
    );

    expect(
      resolveRequestedLeagueDate(
        { matchDate: "2026-09-15T06:15:00+06:00" },
        "Asia/Dhaka",
      ),
    ).toBe("2026-09-15");
  });

  it("preserves the old 7 AM classification only for historical migration", () => {
    expect(resolveLegacyLeagueDate("2026-09-15T00:15:00.000Z", "Asia/Dhaka")).toBe(
      "2026-09-14",
    );
  });

  it("rejects impossible calendar dates", () => {
    expect(isValidLeagueDate("2026-02-31", "Asia/Dhaka")).toBe(false);
    expect(isValidLeagueDate("2026-09-15", "Asia/Dhaka")).toBe(true);
  });

  it("rejects future league dates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-19T10:00:00.000Z"));

    expect(() => assertLeagueDateNotFuture("2026-09-20", "Asia/Dhaka")).toThrowError(
      expect.objectContaining({
        statusCode: 422,
        code: "FUTURE_MATCH_DATE_NOT_ALLOWED",
      }),
    );

    expect(() => assertLeagueDateNotFuture("2026-09-19", "Asia/Dhaka")).not.toThrow();

    vi.useRealTimers();
  });
});
