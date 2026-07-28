function validateKills(row, index) {
  if (!Number.isInteger(row?.kills) || row.kills < 0) {
    throw new TypeError(
      `Dense ranking row ${index + 1} must contain non-negative integer kills.`,
    );
  }
}

/**
 * Creates dense placements using kills only.
 *
 * Examples:
 * 15, 15, 12, 8 => 1, 1, 2, 3
 * 21, 21, 18, 18, 10 => 1, 1, 2, 2, 3
 *
 * Deaths never affect placement.
 */
export function assignDenseKillPlacements(rows) {
  if (!Array.isArray(rows)) {
    throw new TypeError("Dense ranking rows must be an array.");
  }

  const preparedRows = rows.map((row, sourceIndex) => {
    validateKills(row, sourceIndex);

    return {
      row,
      sourceIndex,
    };
  });

  preparedRows.sort(
    (left, right) =>
      right.row.kills - left.row.kills ||
      left.sourceIndex - right.sourceIndex,
  );

  let currentPlacement = 0;
  let previousKills = null;

  return preparedRows.map(({ row }) => {
    if (previousKills === null || row.kills !== previousKills) {
      currentPlacement += 1;
    }

    previousKills = row.kills;

    return {
      ...row,
      placement: currentPlacement,
    };
  });
}

export function hasUniquePlayerIds(rows) {
  const playerIds = rows.map((row) => String(row.playerId));

  return new Set(playerIds).size === playerIds.length;
}

export function hasUniqueResultIds(rows) {
  const resultIds = rows.map((row) => String(row.resultId));

  return new Set(resultIds).size === resultIds.length;
}