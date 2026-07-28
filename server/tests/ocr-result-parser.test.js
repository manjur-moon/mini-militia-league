import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  OCR_PARSER_PROFILES,
  parseOCRText,
} from "../src/services/ocr/ocr-result-parser.js";

const scoreboards = JSON.parse(
  readFileSync(
    new URL("./fixtures/mini-militia-scoreboards.json", import.meta.url),
    "utf8",
  ),
);

/**
 * Recalculates expected placement using kills only.
 *
 * Dense-ranking examples:
 *
 * 15, 15, 12, 8 => 1, 1, 2, 3
 * 21, 21, 18, 18, 10 => 1, 1, 2, 2, 3
 *
 * Deaths never affect placement.
 */
function createDenseExpectedRows(rows) {
  const sortedRows = rows
    .map((row, sourceIndex) => ({
      row,
      sourceIndex,
    }))
    .sort(
      (left, right) =>
        right.row.kills - left.row.kills || left.sourceIndex - right.sourceIndex,
    );

  let currentPlacement = 0;
  let previousKills = null;

  return sortedRows.map(({ row }) => {
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

describe("Mini Militia final-score OCR parser", () => {
  it.each(scoreboards)("parses $source ground-truth rows", (fixture) => {
    const result = parseOCRText({
      rawText: fixture.rawText,
      profile: OCR_PARSER_PROFILES.MINI_MILITIA_FINAL_SCORE,
      averageConfidence: 0.91,
    });

    const expectedRows = createDenseExpectedRows(fixture.rows);

    expect(result.parserVersion).toBe(OCR_PARSER_PROFILES.MINI_MILITIA_FINAL_SCORE);

    expect(result.rows).toHaveLength(fixture.rows.length);

    expect(result.rows).toEqual(
      expectedRows.map((row) =>
        expect.objectContaining({
          ...row,
          confidence: 0.91,
        }),
      ),
    );
  });

  it("assigns the same dense placement to players with equal kills", () => {
    const result = parseOCRText({
      rawText: [
        "Alpha 21 35 -14",
        "Bravo 21 27 -6",
        "Charlie 18 20 -2",
        "Delta 12 9 +3",
      ].join("\n"),
      profile: OCR_PARSER_PROFILES.MINI_MILITIA_FINAL_SCORE,
      averageConfidence: 0.9,
    });

    expect(result.rows).toEqual([
      expect.objectContaining({
        playerName: "Alpha",
        kills: 21,
        deaths: 35,
        placement: 1,
      }),
      expect.objectContaining({
        playerName: "Bravo",
        kills: 21,
        deaths: 27,
        placement: 1,
      }),
      expect.objectContaining({
        playerName: "Charlie",
        kills: 18,
        deaths: 20,
        placement: 2,
      }),
      expect.objectContaining({
        playerName: "Delta",
        kills: 12,
        deaths: 9,
        placement: 3,
      }),
    ]);
  });

  it("does not use deaths to break equal-kill ties", () => {
    const result = parseOCRText({
      rawText: [
        "High Deaths 30 50 -20",
        "Low Deaths 30 5 +25",
        "Third Player 20 1 +19",
      ].join("\n"),
      profile: OCR_PARSER_PROFILES.MINI_MILITIA_FINAL_SCORE,
    });

    expect(result.rows).toEqual([
      expect.objectContaining({
        playerName: "High Deaths",
        kills: 30,
        deaths: 50,
        placement: 1,
      }),
      expect.objectContaining({
        playerName: "Low Deaths",
        kills: 30,
        deaths: 5,
        placement: 1,
      }),
      expect.objectContaining({
        playerName: "Third Player",
        kills: 20,
        deaths: 1,
        placement: 2,
      }),
    ]);
  });

  it("recovers common OCR glyph confusion in numeric columns only", () => {
    const result = parseOCRText({
      rawText: "Littleboy 3b 25 +11\nRAFAYEL 1b 25 -9",
      profile: OCR_PARSER_PROFILES.MINI_MILITIA_FINAL_SCORE,
    });

    expect(result.rows).toEqual([
      expect.objectContaining({
        playerName: "Littleboy",
        kills: 36,
        deaths: 25,
        scoreDifference: 11,
        placement: 1,
      }),
      expect.objectContaining({
        playerName: "RAFAYEL",
        kills: 16,
        deaths: 25,
        scoreDifference: -9,
        placement: 2,
      }),
    ]);
  });

  it("does not invent rows without three trailing score columns", () => {
    const result = parseOCRText({
      rawText: "FINAL GAME SCORES\nNinja NOT READY\nTOTAL BP: 5050",
      profile: OCR_PARSER_PROFILES.MINI_MILITIA_FINAL_SCORE,
    });

    expect(result.rows).toHaveLength(0);
  });
});

describe("generic OCR result parser", () => {
  it("parses configurable placement-name-kills-deaths rows", () => {
    const result = parseOCRText({
      rawText: "Rank Player Kills Deaths\n1 Alpha Soldier 12 3\n2 Bravo 8 5",
      profile: OCR_PARSER_PROFILES.GENERIC,
      columnOrder: ["placement", "name", "kills", "deaths"],
      averageConfidence: 0.91,
    });

    expect(result.rows).toEqual([
      expect.objectContaining({
        playerName: "Alpha Soldier",
        placement: 1,
        kills: 12,
        deaths: 3,
        confidence: 0.91,
      }),
      expect.objectContaining({
        playerName: "Bravo",
        placement: 2,
        kills: 8,
        deaths: 5,
        confidence: 0.91,
      }),
    ]);
  });

  it("assigns dense placements to generic rows with equal kills", () => {
    const result = parseOCRText({
      rawText: [
        "Rank Player Kills Deaths",
        "1 Alpha 15 9",
        "2 Bravo 15 2",
        "3 Charlie 10 1",
      ].join("\n"),
      profile: OCR_PARSER_PROFILES.GENERIC,
      columnOrder: ["placement", "name", "kills", "deaths"],
      averageConfidence: 0.85,
    });

    expect(result.rows).toEqual([
      expect.objectContaining({
        playerName: "Alpha",
        kills: 15,
        deaths: 9,
        placement: 1,
      }),
      expect.objectContaining({
        playerName: "Bravo",
        kills: 15,
        deaths: 2,
        placement: 1,
      }),
      expect.objectContaining({
        playerName: "Charlie",
        kills: 10,
        deaths: 1,
        placement: 2,
      }),
    ]);
  });

  it("supports a different configured column order", () => {
    const result = parseOCRText({
      rawText: "Alpha Soldier 15 4 1",
      profile: OCR_PARSER_PROFILES.GENERIC,
      columnOrder: ["name", "kills", "deaths", "placement"],
      averageConfidence: 0.8,
    });

    expect(result.rows[0]).toMatchObject({
      playerName: "Alpha Soldier",
      kills: 15,
      deaths: 4,
      placement: 1,
      confidence: 0.8,
    });
  });
});
