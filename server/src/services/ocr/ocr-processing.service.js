import { randomUUID } from "node:crypto";

import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { AuditLog } from "../../models/audit-log.model.js";
import { MatchResult } from "../../models/match-result.model.js";
import { Match } from "../../models/match.model.js";
import { OCRJob } from "../../models/ocr-job.model.js";
import { buildOCRSourceUrl, calculateOCRCrop } from "./ocr-image-source.service.js";
import { OCRProviderError } from "./ocr-provider.error.js";
import { getOCRProvider } from "./ocr-provider.factory.js";
import { parseOCRText } from "./ocr-result-parser.js";
import { playerMatcher } from "./player-matcher.service.js";

const LOCK_DURATION_MS = 60_000;

function failureRecord(error) {
  return {
    code: error.code ?? "OCR_PROCESSING_ERROR",
    message: error.message ?? "OCR processing failed.",
    occurredAt: new Date(),
    retryable: Boolean(error.retryable),
  };
}

function normalizeProviderError(error, providerName) {
  if (error instanceof OCRProviderError) {
    return error;
  }

  return new OCRProviderError(`${providerName} OCR processing failed.`, {
    code: "OCR_PROVIDER_FAILED",
    retryable: true,
    cause: error,
  });
}

async function recognizeAndParse({ provider, imageUrl, mimeType }) {
  const recognized = await provider.recognize({
    imageUrl,
    mimeType,
  });

  const parsed = parseOCRText({
    rawText: recognized.rawText,
    profile: env.OCR_PARSER_PROFILE,
    columnOrder: env.ocrColumnOrder,
    averageConfidence: recognized.averageConfidence,
  });

  if (!parsed.rows.length) {
    throw new OCRProviderError(
      `${provider.name} completed but no valid result rows were parsed.`,
      {
        code: "OCR_NO_ROWS_PARSED",
        retryable: false,
      },
    );
  }

  return {
    provider,
    recognized,
    parsed,
  };
}

async function recognizeWithFallback({
  primaryProviderName,
  providerFactory,
  imageUrl,
  mimeType,
}) {
  const primaryProvider = providerFactory(primaryProviderName);

  try {
    const result = await recognizeAndParse({
      provider: primaryProvider,
      imageUrl,
      mimeType,
    });

    return {
      ...result,
      fallbackUsed: false,
      primaryProviderName,
      primaryFailure: null,
    };
  } catch (error) {
    const primaryFailure = normalizeProviderError(error, primaryProvider.name);

    const fallbackProviderName = env.OCR_FALLBACK_PROVIDER;

    const fallbackAvailable =
      fallbackProviderName &&
      fallbackProviderName !== "disabled" &&
      fallbackProviderName !== primaryProviderName;

    if (!fallbackAvailable) {
      throw primaryFailure;
    }

    logger.warn("Primary OCR provider failed; attempting fallback", {
      primaryProvider: primaryProvider.name,
      fallbackProvider: fallbackProviderName,
      code: primaryFailure.code,
      message: primaryFailure.message,
    });

    const fallbackProvider = providerFactory(fallbackProviderName);

    try {
      const result = await recognizeAndParse({
        provider: fallbackProvider,
        imageUrl,
        mimeType,
      });

      return {
        ...result,
        fallbackUsed: true,
        primaryProviderName,
        primaryFailure: {
          provider: primaryProvider.name,
          code: primaryFailure.code,
          message: primaryFailure.message,
        },
      };
    } catch (fallbackError) {
      const normalizedFallbackError = normalizeProviderError(
        fallbackError,
        fallbackProvider.name,
      );

      const combinedError = new OCRProviderError(
        "Both the primary and fallback OCR providers failed.",
        {
          code: "OCR_ALL_PROVIDERS_FAILED",
          retryable: primaryFailure.retryable || normalizedFallbackError.retryable,
          cause: normalizedFallbackError,
        },
      );

      combinedError.providerFailures = [
        {
          provider: primaryProvider.name,
          code: primaryFailure.code,
          message: primaryFailure.message,
        },
        {
          provider: fallbackProvider.name,
          code: normalizedFallbackError.code,
          message: normalizedFallbackError.message,
        },
      ];

      throw combinedError;
    }
  }
}

export function createOCRProcessingService({
  OCRJobModel = OCRJob,
  MatchModel = Match,
  MatchResultModel = MatchResult,
  AuditLogModel = AuditLog,
  matcher = playerMatcher,
  providerFactory = getOCRProvider,
} = {}) {
  async function processJob(jobId) {
    const token = randomUUID();
    const now = new Date();

    const job = await OCRJobModel.findOneAndUpdate(
      {
        _id: jobId,
        status: {
          $in: ["queued", "failed"],
        },
        attempts: {
          $lt: env.OCR_MAX_ATTEMPTS,
        },
        $or: [
          {
            "lock.expiresAt": null,
          },
          {
            "lock.expiresAt": {
              $lte: now,
            },
          },
        ],
      },
      {
        $set: {
          status: "processing",
          startedAt: now,
          nextRetryAt: null,
          "lock.token": token,
          "lock.lockedAt": now,
          "lock.expiresAt": new Date(now.getTime() + LOCK_DURATION_MS),
        },
        $inc: {
          attempts: 1,
        },
      },
      {
        returnDocument: "after",
      },
    );

    if (!job) {
      return null;
    }

    const match = await MatchModel.findById(job.matchId);

    if (!match) {
      return null;
    }

    await MatchModel.updateOne(
      {
        _id: match._id,
      },
      {
        $set: {
          status: "processing",
        },
      },
    );

    try {
      const sourceCrop = calculateOCRCrop(match.screenshot);
      const imageUrl = buildOCRSourceUrl(match.screenshot);

      const recognitionResult = await recognizeWithFallback({
        primaryProviderName: job.provider,
        providerFactory,
        imageUrl,
        mimeType: match.uploadMetadata?.mimeType ?? "image/jpeg",
      });

      const {
        provider,
        recognized,
        parsed,
        fallbackUsed,
        primaryProviderName,
        primaryFailure,
      } = recognitionResult;

      const matches = await matcher.matchNames(
        parsed.rows.map((row) => row.playerName),
      );

      const docs = parsed.rows.map((row, index) => ({
        matchId: match._id,
        rowIndex: index,
        source: "ocr",
        status: "pending",
        extracted: row,
        playerMatch: matches[index],
        validationWarnings: [
          ...(row.confidence < env.OCR_LOW_CONFIDENCE_THRESHOLD
            ? ["low_ocr_confidence"]
            : []),
          ...(matches[index].status === "none" ? ["player_not_matched"] : []),
          ...(matches[index].status === "ambiguous" ? ["player_match_ambiguous"] : []),
          ...(Number.isFinite(row.scoreDifference) &&
          row.scoreDifference !== row.kills - row.deaths
            ? ["score_difference_mismatch"]
            : []),
        ],
      }));

      await MatchResultModel.deleteMany({
        matchId: match._id,
        status: "pending",
      });

      await MatchResultModel.insertMany(docs);

      const completedAt = new Date();

      await OCRJobModel.updateOne(
        {
          _id: job._id,
          "lock.token": token,
        },
        {
          $set: {
            status: "succeeded",
            provider: provider.name,
            providerVersion: provider.version,
            providerJobId: recognized.providerJobId ?? null,
            rawText: recognized.rawText,
            rawResponse: {
              actualProvider: provider.name,
              primaryProvider: primaryProviderName,
              fallbackUsed,
              primaryFailure,
              providerResponse: recognized.rawResponse,
            },
            averageConfidence: recognized.averageConfidence,
            parsedRowCount: docs.length,
            parserVersion: parsed.parserVersion,
            parserProfile: env.OCR_PARSER_PROFILE,
            sourceCrop,
            columnOrder: env.ocrColumnOrder,
            completedAt,
            lock: {
              token: null,
              lockedAt: null,
              expiresAt: null,
            },
          },
        },
      );

      await MatchModel.updateOne(
        {
          _id: match._id,
        },
        {
          $set: {
            status: "needs_review",
            resultCount: docs.length,
          },
        },
      );

      await AuditLogModel.create({
        actorUserId: match.uploadedBy,
        action: "match.ocr_completed",
        entityType: "match",
        entityId: String(match._id),
        previousValue: {
          status: "processing",
        },
        newValue: {
          status: "needs_review",
          parsedRowCount: docs.length,
          provider: provider.name,
          fallbackUsed,
        },
        reason: fallbackUsed
          ? `OCR completed with fallback provider ${provider.name} after ${primaryProviderName} failed.`
          : `OCR completed with ${provider.name}.`,
      });

      return {
        status: "succeeded",
        parsedRowCount: docs.length,
        provider: provider.name,
        fallbackUsed,
      };
    } catch (error) {
      const normalized =
        error instanceof OCRProviderError
          ? error
          : new OCRProviderError("OCR processing failed.", {
              retryable: true,
              cause: error,
            });

      const failedAt = new Date();
      const retryable = normalized.retryable && job.attempts < job.maxAttempts;

      await OCRJobModel.updateOne(
        {
          _id: job._id,
          "lock.token": token,
        },
        {
          $set: {
            status: "failed",
            completedAt: failedAt,
            nextRetryAt: retryable ? new Date(failedAt.getTime() + 60_000) : null,
            lock: {
              token: null,
              lockedAt: null,
              expiresAt: null,
            },
          },
          $push: {
            errorHistory: failureRecord(normalized),
          },
        },
      );

      await MatchModel.updateOne(
        {
          _id: match._id,
        },
        {
          $set: {
            status: "processing_failed",
          },
        },
      );

      await AuditLogModel.create({
        actorUserId: match.uploadedBy,
        action: "match.ocr_failed",
        entityType: "match",
        entityId: String(match._id),
        previousValue: {
          status: "processing",
        },
        newValue: {
          status: "processing_failed",
          code: normalized.code,
        },
        reason: normalized.message,
      });

      throw normalized;
    }
  }

  function enqueue(jobId) {
    setImmediate(() => {
      processJob(jobId).catch((error) => {
        logger.warn("OCR job failed", {
          jobId: String(jobId),
          code: error.code,
          message: error.message,
        });
      });
    });
  }

  return Object.freeze({
    processJob,
    enqueue,
  });
}

export const ocrProcessingService = createOCRProcessingService();
