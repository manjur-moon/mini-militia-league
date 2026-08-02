import {
  calculateCoreMetrics,
  calculateKdr,
  isLastPlaceResult,
} from "./statistics.service.js";
import { formatLeagueDateKey } from "./period.service.js";

export const ANALYTICS_CALCULATION_VERSION = "analytics-v4";
export const DEFAULT_DECIMAL_PRECISION = 6;

/*
 * Overall leaderboard points:
 *
 * First place: +100 points
 * Last place:  -100 points
 *
 * Kills provide a bounded secondary score below 90 points.
 * Therefore, one additional net first place always remains
 * more valuable than any possible kill advantage.
 */
const OVERALL_FIRST_PLACE_POINTS = 100;
const OVERALL_LAST_PLACE_PENALTY = 100;
const OVERALL_KILL_TIE_BREAK_CAP = 90;

export function roundAnalytics(value, precision = DEFAULT_DECIMAL_PRECISION) {
  if (!Number.isFinite(value)) return 0;

  const factor = 10 ** precision;

  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function placementBonus(placement, weights) {
  if (placement === 1) return weights.firstPlaceBonus;
  if (placement === 2) return weights.secondPlaceBonus;
  if (placement === 3) return weights.thirdPlaceBonus;

  return 0;
}

function toMetricNumber(value) {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function calculateFirstPlaceMetricValue(metrics) {
  const firstPlaceCount = toMetricNumber(metrics?.firstPlaceCount);
  const lastPlaceCount = toMetricNumber(metrics?.lastPlaceCount);

  return firstPlaceCount - lastPlaceCount;
}

function calculateKillTieBreakPoints(totalKills) {
  const kills = Math.max(0, toMetricNumber(totalKills));

  if (kills === 0) {
    return 0;
  }

  return roundAnalytics(OVERALL_KILL_TIE_BREAK_CAP * (kills / (kills + 100)));
}

function calculateOverallLeaderboardPoints(metrics) {
  const firstPlaceCount = toMetricNumber(metrics?.firstPlaceCount);
  const lastPlaceCount = toMetricNumber(metrics?.lastPlaceCount);

  const firstPlacePoints = firstPlaceCount * OVERALL_FIRST_PLACE_POINTS;

  const lastPlacePenalty = lastPlaceCount * OVERALL_LAST_PLACE_PENALTY;

  const killTieBreakPoints = calculateKillTieBreakPoints(metrics?.totalKills);

  return roundAnalytics(firstPlacePoints - lastPlacePenalty + killTieBreakPoints);
}

export function calculateMvpScoreBreakdown(metrics, config) {
  const weights = config.weights;

  const killScore = roundAnalytics(metrics.totalKills * weights.killWeight);

  const deathPenalty = roundAnalytics(metrics.totalDeaths * weights.deathPenalty);

  const placementScore = roundAnalytics(
    metrics.firstPlaceCount * weights.firstPlaceBonus +
      (metrics.secondPlaceCount ?? 0) * weights.secondPlaceBonus +
      (metrics.thirdPlaceCount ?? 0) * weights.thirdPlaceBonus,
  );

  const kdrBonus = roundAnalytics(
    Math.min(metrics.kdr * weights.kdrBonusWeight, weights.maximumKdrBonus),
  );

  const activityAdjustment = roundAnalytics(
    Math.min(
      metrics.matchesPlayed * weights.activityWeight,
      weights.maximumActivityBonus,
    ),
  );

  const totalScore = roundAnalytics(
    killScore - deathPenalty + placementScore + kdrBonus + activityAdjustment,
  );

  return {
    killScore,
    deathPenalty,
    placementBonus: placementScore,
    kdrBonus,
    activityAdjustment,
    totalScore,

    inputs: {
      matchesPlayed: metrics.matchesPlayed,
      totalKills: metrics.totalKills,
      totalDeaths: metrics.totalDeaths,
      kdr: metrics.kdr,
      firstPlaceCount: metrics.firstPlaceCount,
      secondPlaceCount: metrics.secondPlaceCount ?? 0,
      thirdPlaceCount: metrics.thirdPlaceCount ?? 0,
    },
  };
}

export function calculateMatchPerformanceScore(row, config) {
  const weights = config.weights;

  const kdr = calculateKdr(row.kills, row.deaths);

  return roundAnalytics(
    row.kills * weights.killWeight -
      row.deaths * weights.deathPenalty +
      placementBonus(row.placement, weights) +
      Math.min(kdr * weights.kdrBonusWeight, weights.maximumKdrBonus),
  );
}

export function calculateKillEfficiency(totalKills, totalDeaths) {
  const attempts = totalKills + totalDeaths;

  return attempts ? roundAnalytics((totalKills / attempts) * 100) : 0;
}

export function calculateConsistency(scores) {
  if (!scores.length) return 0;
  if (scores.length === 1) return 50;

  const mean = scores.reduce((sum, value) => sum + value, 0) / scores.length;

  const variance =
    scores.reduce((sum, value) => sum + (value - mean) ** 2, 0) / scores.length;

  const standardDeviation = Math.sqrt(variance);

  const denominator = Math.max(Math.abs(mean), 1);

  const coefficientOfVariation = standardDeviation / denominator;

  return roundAnalytics(100 / (1 + coefficientOfVariation));
}

export function calculateImprovementRate(currentAverage, previousAverage) {
  if (!Number.isFinite(currentAverage) || !Number.isFinite(previousAverage)) {
    return null;
  }

  return roundAnalytics(
    ((currentAverage - previousAverage) / Math.max(Math.abs(previousAverage), 1)) * 100,
  );
}

export function enrichPeriodMetrics(rows, mvpCount = 0) {
  const metrics = calculateCoreMetrics(rows, mvpCount);

  return {
    ...metrics,

    secondPlaceCount: rows.filter((row) => row.placement === 2).length,

    thirdPlaceCount: rows.filter((row) => row.placement === 3).length,
  };
}

export function buildDailyTrend(rows, period) {
  const grouped = new Map();

  for (const row of rows) {
    const key = formatLeagueDateKey(row.matchDate, period.timezone);

    const value = grouped.get(key) ?? {
      date: key,
      matches: 0,
      kills: 0,
      deaths: 0,
      placementTotal: 0,
      firstPlaces: 0,
      lastPlaces: 0,
    };

    value.matches += 1;
    value.kills += row.kills;
    value.deaths += row.deaths;
    value.placementTotal += row.placement;

    if (row.placement === 1) {
      value.firstPlaces += 1;
    }

    if (isLastPlaceResult(row)) {
      value.lastPlaces += 1;
    }

    grouped.set(key, value);
  }

  return [...grouped.values()]
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((value) => ({
      date: value.date,
      matches: value.matches,
      kills: value.kills,
      deaths: value.deaths,
      kdr: calculateKdr(value.kills, value.deaths),
      averageRank: roundAnalytics(value.placementTotal / value.matches),
      firstPlaces: value.firstPlaces,
      lastPlaces: value.lastPlaces,
    }));
}

export function rankPeriodicEntries(entries) {
  return [...entries]
    .sort((left, right) => {
      if (right.performanceScore !== left.performanceScore) {
        return right.performanceScore - left.performanceScore;
      }

      if (right.metrics.totalKills !== left.metrics.totalKills) {
        return right.metrics.totalKills - left.metrics.totalKills;
      }

      if (left.metrics.totalDeaths !== right.metrics.totalDeaths) {
        return left.metrics.totalDeaths - right.metrics.totalDeaths;
      }

      if (right.metrics.firstPlaceCount !== left.metrics.firstPlaceCount) {
        return right.metrics.firstPlaceCount - left.metrics.firstPlaceCount;
      }

      return String(left.playerId).localeCompare(String(right.playerId));
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
}

export function sortLeaderboardEntries(entries, metric) {
  const selectors = {
    kills: (entry) => entry.metrics.totalKills,

    deaths: (entry) => entry.metrics.totalDeaths,

    kdr: (entry) => entry.metrics.kdr,

    activity: (entry) => entry.metrics.matchesPlayed,

    /*
     * First-place metric:
     * +1 for every first place
     * -1 for every last place
     */
    first_places: (entry) => calculateFirstPlaceMetricValue(entry.metrics),

    last_places: (entry) => entry.metrics.lastPlaceCount,

    win_rate: (entry) => entry.metrics.winRate,

    average_rank: (entry) => entry.metrics.averageRank,

    /*
     * Overall leaderboard:
     * first and last places determine the main points.
     * Kills only provide a bounded secondary contribution.
     *
     * This does not replace or modify the existing MVP formula.
     */
    overall: (entry) => calculateOverallLeaderboardPoints(entry.metrics),
  };

  const selector = selectors[metric];

  const ascending = metric === "average_rank";

  return [...entries]
    .sort((left, right) => {
      const valueDifference = selector(right) - selector(left);

      if (valueDifference !== 0) {
        return ascending ? -valueDifference : valueDifference;
      }

      /*
       * Equal overall or first-place points:
       * fewer last places ranks higher.
       */
      if (
        ["overall", "first_places"].includes(metric) &&
        left.metrics.lastPlaceCount !== right.metrics.lastPlaceCount
      ) {
        return left.metrics.lastPlaceCount - right.metrics.lastPlaceCount;
      }

      if (right.metrics.firstPlaceCount !== left.metrics.firstPlaceCount) {
        return right.metrics.firstPlaceCount - left.metrics.firstPlaceCount;
      }

      if (right.metrics.totalKills !== left.metrics.totalKills) {
        return right.metrics.totalKills - left.metrics.totalKills;
      }

      if (left.metrics.totalDeaths !== right.metrics.totalDeaths) {
        return left.metrics.totalDeaths - right.metrics.totalDeaths;
      }

      if (right.metrics.kdr !== left.metrics.kdr) {
        return right.metrics.kdr - left.metrics.kdr;
      }

      return String(left.playerId).localeCompare(String(right.playerId));
    })
    .map((entry, index) => ({
      ...entry,

      leaderboardRank: index + 1,

      leaderboardValue: roundAnalytics(selector(entry)),
    }));
}
