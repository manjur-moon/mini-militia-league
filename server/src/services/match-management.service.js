import { AuditLog } from "../models/audit-log.model.js";
import { MatchResult } from "../models/match-result.model.js";
import { Match } from "../models/match.model.js";
import { normalizeText } from "../models/model.helpers.js";
import { Player } from "../models/player.model.js";
import { AppError } from "../utils/app-error.js";
import { assignDenseKillPlacements } from "../utils/dense-kill-ranking.js";
import { seasonService } from "./season.service.js";

function notFound() {
  return new AppError({
    statusCode: 404,
    code: "MATCH_NOT_FOUND",
    message: "Match was not found.",
  });
}

function ensureReviewable(match) {
  if (["verified", "rejected"].includes(match.status)) {
    throw new AppError({
      statusCode: 409,
      code: "MATCH_IMMUTABLE",
      message:
        "Verified or rejected matches cannot be changed through pending-match APIs.",
    });
  }
}

function auditMeta(actor, requestMeta) {
  return {
    actorUserId: actor.id,
    ipAddress: requestMeta.ipAddress,
    userAgent: requestMeta.userAgent,
    requestId: requestMeta.requestId,
  };
}

function serialize(value) {
  if (!value) {
    return null;
  }

  const document = typeof value.toObject === "function" ? value.toObject() : value;

  return {
    ...document,
    id: String(document._id),
    _id: undefined,
  };
}

export function createMatchManagementService({
  MatchModel = Match,
  MatchResultModel = MatchResult,
  PlayerModel = Player,
  AuditLogModel = AuditLog,
  seasonManager = seasonService,
} = {}) {
  async function resolvePlayer(playerId) {
    const player = await PlayerModel.findById(playerId);

    if (!player) {
      throw new AppError({
        statusCode: 422,
        code: "PLAYER_REFERENCE_INVALID",
        message: "The selected player does not exist.",
      });
    }

    return player;
  }

  async function ensureUniquePlayer(matchId, { resultId, playerId }) {
    const conflict = await MatchResultModel.findOne({
      matchId,
      status: {
        $ne: "rejected",
      },
      ...(resultId
        ? {
            _id: {
              $ne: resultId,
            },
          }
        : {}),
      "corrected.playerId": playerId,
    }).lean();

    if (conflict) {
      throw new AppError({
        statusCode: 409,
        code: "DUPLICATE_MATCH_PLAYER",
        message: "The selected player already exists in this match.",
      });
    }
  }

  async function recalculatePendingPlacements(matchId) {
    const results = await MatchResultModel.find({
      matchId,
      status: {
        $ne: "rejected",
      },
    }).sort({
      rowIndex: 1,
    });

    if (!results.length) {
      return;
    }

    const rankedRows = assignDenseKillPlacements(
      results.map((result) => {
        const correctedKills = result.corrected?.kills;
        const extractedKills = result.extracted?.kills;

        return {
          result,
          kills: Number.isInteger(correctedKills) ? correctedKills : extractedKills,
        };
      }),
    );

    await MatchResultModel.bulkWrite(
      rankedRows.map(({ result, placement }) => {
        const update = {
          "extracted.placement": placement,
        };

        if (result.corrected?.playerId) {
          update["corrected.placement"] = placement;
        }

        return {
          updateOne: {
            filter: {
              _id: result._id,
            },
            update: {
              $set: update,
            },
          },
        };
      }),
    );
  }

  async function syncCounts(match) {
    const count = await MatchResultModel.countDocuments({
      matchId: match._id,
      status: {
        $ne: "rejected",
      },
    });

    match.resultCount = count;
    match.participantCount = count;
    match.status = "needs_review";

    await match.save();
  }

  return Object.freeze({
    async updateMetadata({ actor, matchId, input, requestMeta }) {
      const match = await MatchModel.findById(matchId);

      if (!match) {
        throw notFound();
      }

      ensureReviewable(match);

      if (
        input.expectedUpdatedAt &&
        new Date(input.expectedUpdatedAt).getTime() !== match.updatedAt.getTime()
      ) {
        throw new AppError({
          statusCode: 409,
          code: "STALE_WRITE",
          message: "The match was changed by another request. Refresh and retry.",
        });
      }

      const previousValue = {
        matchDate: match.matchDate,
        timezone: match.timezone,
        seasonId: match.seasonId,
        participantCount: match.participantCount,
        duplicateReviewNote: match.duplicateReviewNote,
      };

      const nextMatchDate =
        input.matchDate !== undefined ? new Date(input.matchDate) : match.matchDate;

      const requestedSeasonId =
        input.seasonId !== undefined ? input.seasonId || null : match.seasonId;

      const assignedSeason = await seasonManager.resolveForMatch({
        matchDate: nextMatchDate,
        requestedSeasonId,
      });

      match.matchDate = nextMatchDate;

      if (input.timezone !== undefined) {
        match.timezone = input.timezone;
      }

      match.seasonId = assignedSeason?._id ?? null;

      if (input.participantCount !== undefined) {
        const activeRows = await MatchResultModel.countDocuments({
          matchId,
          status: {
            $ne: "rejected",
          },
        });

        if (activeRows && activeRows !== input.participantCount) {
          throw new AppError({
            statusCode: 409,
            code: "PARTICIPANT_COUNT_MISMATCH",
            message: "Participant count must equal the current included result rows.",
          });
        }

        match.participantCount = input.participantCount;
      }

      if (input.duplicateReviewNote !== undefined) {
        match.duplicateReviewNote = input.duplicateReviewNote || null;
      }

      await match.save();

      await AuditLogModel.create({
        ...auditMeta(actor, requestMeta),
        action: "match.reviewed",
        entityType: "match",
        entityId: String(match._id),
        previousValue,
        newValue: {
          matchDate: match.matchDate,
          timezone: match.timezone,
          seasonId: match.seasonId,
          participantCount: match.participantCount,
          duplicateReviewNote: match.duplicateReviewNote,
        },
        reason: input.reason,
      });

      return serialize(match);
    },

    async addResult({ actor, matchId, input, requestMeta }) {
      const match = await MatchModel.findById(matchId);

      if (!match) {
        throw notFound();
      }

      ensureReviewable(match);

      const player = await resolvePlayer(input.playerId);

      await ensureUniquePlayer(matchId, input);

      const latest = await MatchResultModel.findOne({
        matchId,
      })
        .sort({
          rowIndex: -1,
        })
        .select({
          rowIndex: 1,
        })
        .lean();

      const now = new Date();

      const result = await MatchResultModel.create({
        matchId: match._id,
        rowIndex: (latest?.rowIndex ?? -1) + 1,
        source: "manual",
        status: "pending",

        extracted: {
          playerName: player.name,
          normalizedPlayerName: normalizeText(player.name),
          kills: input.kills,
          deaths: input.deaths,
          placement: 1,
          scoreDifference: input.kills - input.deaths,
          confidence: 1,
          rawText: "Manual result row",
        },

        playerMatch: {
          status: "confirmed",
          suggestedPlayerId: player._id,
          candidates: [],
          confirmedBy: actor.id,
          confirmedAt: now,
        },

        corrected: {
          playerId: player._id,
          playerName: player.name,
          normalizedPlayerName: normalizeText(player.name),
          kills: input.kills,
          deaths: input.deaths,
          placement: 1,
          correctedBy: actor.id,
          correctedAt: now,
          reason: input.reason ?? "Manual result row added",
        },
      });

      await recalculatePendingPlacements(matchId);
      await syncCounts(match);

      const updatedResult = await MatchResultModel.findById(result._id);

      await AuditLogModel.create({
        ...auditMeta(actor, requestMeta),
        action: "match.reviewed",
        entityType: "matchResult",
        entityId: String(result._id),
        newValue: serialize(updatedResult),
        reason: input.reason,
      });

      return serialize(updatedResult);
    },

    async updateResult({ actor, matchId, resultId, input, requestMeta }) {
      const match = await MatchModel.findById(matchId);

      if (!match) {
        throw notFound();
      }

      ensureReviewable(match);

      const result = await MatchResultModel.findOne({
        _id: resultId,
        matchId,
      });

      if (!result) {
        throw new AppError({
          statusCode: 404,
          code: "MATCH_RESULT_NOT_FOUND",
          message: "Match result was not found.",
        });
      }

      const player = await resolvePlayer(input.playerId);

      await ensureUniquePlayer(matchId, {
        ...input,
        resultId,
      });

      const previousValue = result.corrected?.toObject?.() ?? result.corrected ?? null;

      const now = new Date();

      result.status = "pending";

      result.corrected = {
        playerId: player._id,
        playerName: player.name,
        normalizedPlayerName: normalizeText(player.name),
        kills: input.kills,
        deaths: input.deaths,
        placement: result.corrected?.placement ?? result.extracted?.placement ?? 1,
        correctedBy: actor.id,
        correctedAt: now,
        reason: input.reason,
      };

      result.playerMatch.status = "confirmed";
      result.playerMatch.suggestedPlayerId = player._id;
      result.playerMatch.confirmedBy = actor.id;
      result.playerMatch.confirmedAt = now;
      result.rejectedReason = null;

      await result.save();

      await recalculatePendingPlacements(matchId);

      const updatedResult = await MatchResultModel.findById(result._id);

      await AuditLogModel.create({
        ...auditMeta(actor, requestMeta),
        action: "match.reviewed",
        entityType: "matchResult",
        entityId: String(result._id),
        previousValue,
        newValue:
          updatedResult?.corrected?.toObject?.() ?? updatedResult?.corrected ?? null,
        reason: input.reason,
      });

      return serialize(updatedResult);
    },

    async removeResult({ actor, matchId, resultId, reason, requestMeta }) {
      const match = await MatchModel.findById(matchId);

      if (!match) {
        throw notFound();
      }

      ensureReviewable(match);

      const result = await MatchResultModel.findOne({
        _id: resultId,
        matchId,
      });

      if (!result) {
        throw new AppError({
          statusCode: 404,
          code: "MATCH_RESULT_NOT_FOUND",
          message: "Match result was not found.",
        });
      }

      const previousStatus = result.status;

      result.status = "rejected";
      result.rejectedReason = reason;

      await result.save();

      await recalculatePendingPlacements(matchId);
      await syncCounts(match);

      await AuditLogModel.create({
        ...auditMeta(actor, requestMeta),
        action: "match.reviewed",
        entityType: "matchResult",
        entityId: String(result._id),
        previousValue: {
          status: previousStatus,
        },
        newValue: {
          status: "rejected",
        },
        reason,
      });

      return {
        id: String(result._id),
        status: result.status,
        resultCount: match.resultCount,
      };
    },
  });
}

export const matchManagementService = createMatchManagementService();
