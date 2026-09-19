import { describe, expect, it } from "vitest";

import {
  formatLeagueDate,
  getLeagueToday,
  isLeagueDate,
  resolveMatchLeagueDate,
} from "./league-date.js";

describe("league-date utilities", () => {
  it("resolves the current calendar date in Asia/Dhaka", () => {
    expect(
      getLeagueToday({
        now: new Date("2026-09-18T19:30:00.000Z"),
      }),
    ).toBe("2026-09-19");
  });

  it("rejects impossible calendar dates", () => {
    expect(isLeagueDate("2026-02-28")).toBe(true);
    expect(isLeagueDate("2026-02-31")).toBe(false);
    expect(isLeagueDate("09/19/2026")).toBe(false);
  });

  it("formats a date-only value without timezone shifting", () => {
    expect(formatLeagueDate("2026-09-15", { locale: "en-US" })).toBe(
      "Sep 15, 2026",
    );
  });

  it("prefers the explicit league date on a match", () => {
    expect(
      resolveMatchLeagueDate({
        leagueDate: "2026-09-15",
        matchDate: "2026-09-16T18:00:00.000Z",
        timezone: "Asia/Dhaka",
      }),
    ).toBe("2026-09-15");
  });
});
