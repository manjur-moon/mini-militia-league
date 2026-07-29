import { describe, expect, it } from "vitest";

import { sortLeaderboardEntries } from "../src/services/analytics-math.service.js";

import {
  calculateCoreMetrics,
  isLastPlaceResult,
} from "../src/services/statistics.service.js";

describe("dense-ranking last place", () => {
  it("recognizes the maximum dense placement as last place", () => {
    const row = {
      matchId: "match-1",
      kills: 10,
      deaths: 12,
      placement: 7,
      participantCount: 8,
      lastPlaceRank: 7,
    };

    expect(isLastPlaceResult(row)).toBe(true);
  });

  it("does not use participant count when a dense last-place rank exists", () => {
    const metrics = calculateCoreMetrics([
      {
        matchId: "match-1",
        kills: 10,
        deaths: 12,
        placement: 7,
        participantCount: 8,
        lastPlaceRank: 7,
      },

      {
        matchId: "match-2",
        kills: 20,
        deaths: 10,
        placement: 5,
        participantCount: 8,
        lastPlaceRank: 7,
      },
    ]);

    expect(metrics.lastPlaceCount).toBe(1);
  });

  it("sorts the last-places leaderboard using the corrected count", () => {
    const entries = [
      {
        playerId: "player-1",
        performanceScore: 100,

        metrics: {
          lastPlaceCount: 2,
          firstPlaceCount: 0,
          totalKills: 50,
          totalDeaths: 60,
        },
      },

      {
        playerId: "player-2",
        performanceScore: 120,

        metrics: {
          lastPlaceCount: 1,
          firstPlaceCount: 1,
          totalKills: 70,
          totalDeaths: 55,
        },
      },
    ];

    const ranked = sortLeaderboardEntries(entries, "last_places");

    expect(ranked[0].playerId).toBe("player-1");

    expect(ranked[0].leaderboardValue).toBe(2);

    expect(ranked[0].leaderboardRank).toBe(1);
  });
});
