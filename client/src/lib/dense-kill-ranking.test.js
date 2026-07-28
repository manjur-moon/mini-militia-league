import { describe, expect, it } from "vitest";

import {
  assignDenseKillPlacements,
  validateMatchReviewRows,
} from "./dense-kill-ranking.js";

describe("assignDenseKillPlacements", () => {
  it("assigns dense placements from kills", () => {
    const result = assignDenseKillPlacements([
      {
        playerId: "player-1",
        kills: 15,
        deaths: 5,
      },
      {
        playerId: "player-2",
        kills: 15,
        deaths: 20,
      },
      {
        playerId: "player-3",
        kills: 12,
        deaths: 1,
      },
      {
        playerId: "player-4",
        kills: 8,
        deaths: 0,
      },
    ]);

    expect(result.map((row) => row.placement)).toEqual([1, 1, 2, 3]);
  });

  it("does not use deaths as a tie breaker", () => {
    const result = assignDenseKillPlacements([
      {
        playerId: "player-1",
        kills: 21,
        deaths: 50,
      },
      {
        playerId: "player-2",
        kills: 21,
        deaths: 1,
      },
    ]);

    expect(result.map((row) => row.placement)).toEqual([1, 1]);
  });

  it("preserves the current row order", () => {
    const result = assignDenseKillPlacements([
      {
        playerId: "player-1",
        kills: 10,
        deaths: 2,
      },
      {
        playerId: "player-2",
        kills: 30,
        deaths: 4,
      },
      {
        playerId: "player-3",
        kills: 20,
        deaths: 3,
      },
    ]);

    expect(result.map((row) => row.playerId)).toEqual([
      "player-1",
      "player-2",
      "player-3",
    ]);

    expect(result.map((row) => row.placement)).toEqual([3, 1, 2]);
  });
});

describe("validateMatchReviewRows", () => {
  it("accepts valid rows with tied kills", () => {
    const result = validateMatchReviewRows([
      {
        playerId: "player-1",
        kills: 21,
        deaths: 30,
      },
      {
        playerId: "player-2",
        kills: 21,
        deaths: 5,
      },
    ]);

    expect(result).toEqual({
      isValid: true,
      errors: [],
    });
  });

  it("rejects duplicate players", () => {
    const result = validateMatchReviewRows([
      {
        playerId: "player-1",
        kills: 20,
        deaths: 5,
      },
      {
        playerId: "player-1",
        kills: 15,
        deaths: 8,
      },
    ]);

    expect(result.isValid).toBe(false);

    expect(result.errors).toContain(
      "Each registered player can appear only once in a match.",
    );
  });

  it("rejects invalid kills or deaths", () => {
    const result = validateMatchReviewRows([
      {
        playerId: "player-1",
        kills: "",
        deaths: 5,
      },
      {
        playerId: "player-2",
        kills: 15,
        deaths: -1,
      },
    ]);

    expect(result.isValid).toBe(false);

    expect(result.errors).toContain(
      "Kills and deaths must be non-negative whole numbers.",
    );
  });
});
