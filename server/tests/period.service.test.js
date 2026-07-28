import { describe, expect, it } from "vitest";

import {
  formatLeagueDateKey,
  periodContains,
  resolveDailyPeriod,
  resolveMonthlyPeriod,
  resolvePreviousPeriod,
  resolveWeeklyPeriod,
} from "../src/services/period.service.js";

describe("league period boundaries", () => {
  it("resolves a date-only daily period from 7 AM to the next 7 AM", () => {
    const period = resolveDailyPeriod({
      date: "2026-07-29",
      timezone: "Asia/Dhaka",
      dayStartHour: 7,
    });

    expect(period.type).toBe("daily");
    expect(period.key).toBe("2026-07-29");

    expect(period.startAt.toISOString()).toBe("2026-07-29T01:00:00.000Z");

    expect(period.endAt.toISOString()).toBe("2026-07-30T01:00:00.000Z");

    expect(period.dayStartHour).toBe(7);

    expect(period.label).toBe("29 Jul 2026, 7:00 AM – 30 Jul 2026, 7:00 AM");
  });

  it("assigns a timestamp before 7 AM to the previous league day", () => {
    const period = resolveDailyPeriod({
      date: "2026-07-29T06:59:59+06:00",
      timezone: "Asia/Dhaka",
      dayStartHour: 7,
    });

    expect(period.key).toBe("2026-07-28");

    expect(period.startAt.toISOString()).toBe("2026-07-28T01:00:00.000Z");

    expect(period.endAt.toISOString()).toBe("2026-07-29T01:00:00.000Z");
  });

  it("assigns a timestamp at exactly 7 AM to the new league day", () => {
    const period = resolveDailyPeriod({
      date: "2026-07-29T07:00:00+06:00",
      timezone: "Asia/Dhaka",
      dayStartHour: 7,
    });

    expect(period.key).toBe("2026-07-29");

    expect(period.startAt.toISOString()).toBe("2026-07-29T01:00:00.000Z");
  });

  it("uses an exclusive daily period end", () => {
    const period = resolveDailyPeriod({
      date: "2026-07-29",
      timezone: "Asia/Dhaka",
      dayStartHour: 7,
    });

    expect(periodContains(period, "2026-07-30T06:59:59+06:00")).toBe(true);

    expect(periodContains(period, "2026-07-30T07:00:00+06:00")).toBe(false);
  });

  it("resolves the previous daily league period", () => {
    const current = resolveDailyPeriod({
      date: "2026-07-29",
      timezone: "Asia/Dhaka",
      dayStartHour: 7,
    });

    const previous = resolvePreviousPeriod(current);

    expect(previous.key).toBe("2026-07-28");

    expect(previous.startAt.toISOString()).toBe("2026-07-28T01:00:00.000Z");

    expect(previous.endAt.toISOString()).toBe("2026-07-29T01:00:00.000Z");
  });

  it("formats league date keys using the 7 AM rollover", () => {
    expect(
      formatLeagueDateKey(new Date("2026-07-29T00:30:00.000Z"), "Asia/Dhaka", 7),
    ).toBe("2026-07-28");

    expect(
      formatLeagueDateKey(new Date("2026-07-29T01:00:00.000Z"), "Asia/Dhaka", 7),
    ).toBe("2026-07-29");
  });

  it("resolves Monday-start weeks in the league timezone with an exclusive end", () => {
    const period = resolveWeeklyPeriod({
      date: "2026-07-19T18:30:00.000Z",
      timezone: "Asia/Dhaka",
      weekStartsOn: 1,
    });

    expect(period.key).toBe("2026-07-20");

    expect(period.startAt.toISOString()).toBe("2026-07-19T18:00:00.000Z");

    expect(period.endAt.toISOString()).toBe("2026-07-26T18:00:00.000Z");
  });

  it("supports a configurable Sunday week start", () => {
    const period = resolveWeeklyPeriod({
      date: "2026-07-20T12:00:00.000Z",
      timezone: "Asia/Dhaka",
      weekStartsOn: 0,
    });

    expect(period.key).toBe("2026-07-19");

    expect(period.startAt.toISOString()).toBe("2026-07-18T18:00:00.000Z");
  });

  it("treats date-only weekly input as a league-local calendar date", () => {
    const period = resolveWeeklyPeriod({
      date: "2026-07-20",
      timezone: "America/Los_Angeles",
      weekStartsOn: 1,
    });

    expect(period.key).toBe("2026-07-20");

    expect(period.startAt.toISOString()).toBe("2026-07-20T07:00:00.000Z");
  });

  it("resolves calendar months in the league timezone", () => {
    const period = resolveMonthlyPeriod({
      date: "2026-07-20T12:00:00.000Z",
      timezone: "Asia/Dhaka",
    });

    expect(period.key).toBe("2026-07");

    expect(period.startAt.toISOString()).toBe("2026-06-30T18:00:00.000Z");

    expect(period.endAt.toISOString()).toBe("2026-07-31T18:00:00.000Z");
  });
});
