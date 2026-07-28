function isNonNegativeInteger(value) {
  if (value === "" || value === null || value === undefined) {
    return false;
  }

  const numericValue = Number(value);

  return Number.isInteger(numericValue) && numericValue >= 0;
}

/**
 * Calculates dense placements from kills while preserving
 * the current UI row order.
 *
 * Examples:
 * 15, 15, 12, 8 => 1, 1, 2, 3
 * 21, 21, 18, 18 => 1, 1, 2, 2
 *
 * Deaths do not affect placement.
 */
export function assignDenseKillPlacements(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }

  const uniqueKills = [
    ...new Set(
      rows
        .filter((row) => isNonNegativeInteger(row.kills))
        .map((row) => Number(row.kills)),
    ),
  ].sort((left, right) => right - left);

  const placementByKills = new Map(
    uniqueKills.map((kills, index) => [kills, index + 1]),
  );

  return rows.map((row) => {
    const killsValid = isNonNegativeInteger(row.kills);

    return {
      ...row,
      placement: killsValid ? placementByKills.get(Number(row.kills)) : null,
    };
  });
}

export function validateMatchReviewRows(rows) {
  const errors = [];

  if (!Array.isArray(rows) || rows.length < 2) {
    errors.push("At least two result rows are required.");
  }

  const playerIds = Array.isArray(rows)
    ? rows.map((row) => String(row.playerId ?? "").trim())
    : [];

  if (playerIds.some((playerId) => !playerId)) {
    errors.push("Every result row must be linked to a registered player.");
  }

  const selectedPlayerIds = playerIds.filter(Boolean);

  if (new Set(selectedPlayerIds).size !== selectedPlayerIds.length) {
    errors.push("Each registered player can appear only once in a match.");
  }

  const invalidStatistics = Array.isArray(rows)
    ? rows.some(
        (row) => !isNonNegativeInteger(row.kills) || !isNonNegativeInteger(row.deaths),
      )
    : true;

  if (invalidStatistics) {
    errors.push("Kills and deaths must be non-negative whole numbers.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
