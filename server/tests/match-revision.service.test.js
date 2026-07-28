import { describe, expect, it } from "vitest";

import { validateCorrectionRows } from "../src/services/match-revision.service.js";

const RESULT_ID_ONE = "000000000000000000000001";
const RESULT_ID_TWO = "000000000000000000000002";

const PLAYER_ID_ONE = "000000000000000000000011";
const PLAYER_ID_TWO = "000000000000000000000012";

function createRow({ resultId, playerId, kills, deaths = 5, placement = 99 }) {
  return {
    resultId,
    playerId,
    kills,
    deaths,
    placement,
  };
}

describe("verified match correction validation", () => {
  it("accepts complete unique rows and returns dense placements", () => {
    const result = validateCorrectionRows(
      [
        createRow({
          resultId: RESULT_ID_ONE,
          playerId: PLAYER_ID_ONE,
          kills: 20,
          placement: 7,
        }),
        createRow({
          resultId: RESULT_ID_TWO,
          playerId: PLAYER_ID_TWO,
          kills: 15,
          placement: 9,
        }),
      ],
      2,
    );

    expect(result).toEqual([
      expect.objectContaining({
        resultId: RESULT_ID_ONE,
        playerId: PLAYER_ID_ONE,
        kills: 20,
        placement: 1,
      }),
      expect.objectContaining({
        resultId: RESULT_ID_TWO,
        playerId: PLAYER_ID_TWO,
        kills: 15,
        placement: 2,
      }),
    ]);
  });

  it("rejects duplicate players", () => {
    expect(() =>
      validateCorrectionRows(
        [
          createRow({
            resultId: RESULT_ID_ONE,
            playerId: PLAYER_ID_ONE,
            kills: 20,
          }),
          createRow({
            resultId: RESULT_ID_TWO,
            playerId: PLAYER_ID_ONE,
            kills: 15,
          }),
        ],
        2,
      ),
    ).toThrowError(
      expect.objectContaining({
        statusCode: 422,
        code: "CORRECTION_PLAYER_DUPLICATE",
      }),
    );
  });

  it("rejects duplicate result identifiers", () => {
    expect(() =>
      validateCorrectionRows(
        [
          createRow({
            resultId: RESULT_ID_ONE,
            playerId: PLAYER_ID_ONE,
            kills: 20,
          }),
          createRow({
            resultId: RESULT_ID_ONE,
            playerId: PLAYER_ID_TWO,
            kills: 15,
          }),
        ],
        2,
      ),
    ).toThrowError(
      expect.objectContaining({
        statusCode: 422,
        code: "CORRECTION_RESULT_DUPLICATE",
      }),
    );
  });

  it("normalizes placement gaps from kills", () => {
    const result = validateCorrectionRows(
      [
        createRow({
          resultId: RESULT_ID_ONE,
          playerId: PLAYER_ID_ONE,
          kills: 30,
          placement: 1,
        }),
        createRow({
          resultId: RESULT_ID_TWO,
          playerId: PLAYER_ID_TWO,
          kills: 20,
          placement: 8,
        }),
      ],
      2,
    );

    expect(result.map((row) => row.placement)).toEqual([1, 2]);
  });

  it("assigns equal placement when kills are tied", () => {
    const result = validateCorrectionRows(
      [
        createRow({
          resultId: RESULT_ID_ONE,
          playerId: PLAYER_ID_ONE,
          kills: 21,
          deaths: 40,
          placement: 1,
        }),
        createRow({
          resultId: RESULT_ID_TWO,
          playerId: PLAYER_ID_TWO,
          kills: 21,
          deaths: 2,
          placement: 2,
        }),
      ],
      2,
    );

    expect(result).toEqual([
      expect.objectContaining({
        playerId: PLAYER_ID_ONE,
        kills: 21,
        deaths: 40,
        placement: 1,
      }),
      expect.objectContaining({
        playerId: PLAYER_ID_TWO,
        kills: 21,
        deaths: 2,
        placement: 1,
      }),
    ]);
  });

  it("rejects participant count mismatch", () => {
    expect(() =>
      validateCorrectionRows(
        [
          createRow({
            resultId: RESULT_ID_ONE,
            playerId: PLAYER_ID_ONE,
            kills: 20,
          }),
        ],
        2,
      ),
    ).toThrowError(
      expect.objectContaining({
        statusCode: 422,
        code: "PARTICIPANT_COUNT_MISMATCH",
      }),
    );
  });
});
