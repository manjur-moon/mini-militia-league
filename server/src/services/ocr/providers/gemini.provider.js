import { GoogleGenAI } from "@google/genai";

import { env } from "../../../config/env.js";
import { OCRProviderError } from "../ocr-provider.error.js";

const extractionSchema = {
  type: "object",
  properties: {
    rows: {
      type: "array",
      minItems: 1,
      description: "Visible player rows from the final score table.",
      items: {
        type: "object",
        properties: {
          playerName: {
            type: "string",
            description: "Player name exactly as it appears in the screenshot.",
          },
          kills: {
            type: "integer",
            minimum: 0,
            description: "Kills displayed for this player.",
          },
          deaths: {
            type: "integer",
            minimum: 0,
            description: "Deaths displayed for this player.",
          },
        },
        required: ["playerName", "kills", "deaths"],
      },
    },
    warnings: {
      type: "array",
      description: "Descriptions of uncertain names or numeric values.",
      items: {
        type: "string",
      },
    },
  },
  required: ["rows", "warnings"],
};

let client = null;

function getClient() {
  if (!client) {
    client = new GoogleGenAI({
      apiKey: env.GEMINI_API_KEY,
    });
  }

  return client;
}

function validateExtraction(value) {
  if (!value || typeof value !== "object") {
    throw new OCRProviderError("Gemini returned an invalid response.", {
      code: "GEMINI_RESPONSE_INVALID",
      retryable: false,
    });
  }

  if (!Array.isArray(value.rows) || value.rows.length === 0) {
    throw new OCRProviderError("Gemini did not extract any player rows.", {
      code: "GEMINI_NO_ROWS_EXTRACTED",
      retryable: false,
    });
  }

  const rows = value.rows.map((row, index) => {
    const playerName = typeof row?.playerName === "string" ? row.playerName.trim() : "";

    if (!playerName) {
      throw new OCRProviderError(`Gemini row ${index + 1} has no player name.`, {
        code: "GEMINI_ROW_INVALID",
        retryable: false,
      });
    }

    if (!Number.isInteger(row.kills) || row.kills < 0) {
      throw new OCRProviderError(`Gemini row ${index + 1} has invalid kills.`, {
        code: "GEMINI_ROW_INVALID",
        retryable: false,
      });
    }

    if (!Number.isInteger(row.deaths) || row.deaths < 0) {
      throw new OCRProviderError(`Gemini row ${index + 1} has invalid deaths.`, {
        code: "GEMINI_ROW_INVALID",
        retryable: false,
      });
    }

    return {
      playerName,
      kills: row.kills,
      deaths: row.deaths,
    };
  });

  const warnings = Array.isArray(value.warnings)
    ? value.warnings
        .filter((warning) => typeof warning === "string")
        .map((warning) => warning.trim())
        .filter(Boolean)
    : [];

  return {
    rows,
    warnings,
  };
}

function createRawText(rows) {
  return rows
    .map((row) => {
      const difference = row.kills - row.deaths;
      const formattedDifference =
        difference >= 0 ? `+${difference}` : String(difference);

      return `${row.playerName} ${row.kills} ${row.deaths} ${formattedDifference}`;
    })
    .join("\n");
}

function getErrorStatus(error) {
  const possibleStatus =
    error?.status ?? error?.statusCode ?? error?.httpMeta?.response?.status ?? null;

  const status = Number(possibleStatus);

  if (Number.isInteger(status)) {
    return status;
  }

  const match = String(error?.message ?? "").match(/\b([45]\d{2})\b/);

  return match ? Number(match[1]) : null;
}

function normalizeGeminiError(error) {
  if (error instanceof OCRProviderError) {
    return error;
  }

  const status = getErrorStatus(error);
  const message = String(error?.message ?? "Gemini OCR request failed.");

  const retryable =
    status === 408 ||
    status === 429 ||
    (status !== null && status >= 500) ||
    /timeout|network|fetch|temporarily unavailable/i.test(message);

  let code = "GEMINI_OCR_FAILED";

  if (status === 401 || status === 403) {
    code = "GEMINI_AUTHENTICATION_FAILED";
  } else if (status === 404) {
    code = "GEMINI_MODEL_NOT_AVAILABLE";
  } else if (status === 429) {
    code = "GEMINI_RATE_LIMITED";
  } else if (/timeout/i.test(message)) {
    code = "GEMINI_REQUEST_TIMEOUT";
  }

  return new OCRProviderError("Gemini was unable to process the screenshot.", {
    code,
    retryable,
    cause: error,
  });
}

async function withTimeout(promise, timeoutMs) {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new OCRProviderError("Gemini OCR request timed out.", {
          code: "GEMINI_REQUEST_TIMEOUT",
          retryable: true,
        }),
      );
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

export const geminiProvider = Object.freeze({
  name: "gemini",
  version: env.GEMINI_MODEL,

  async recognize({ imageUrl, mimeType = "image/jpeg" }) {
    try {
      if (!imageUrl) {
        throw new OCRProviderError("Gemini OCR requires an image URL.", {
          code: "GEMINI_IMAGE_URL_REQUIRED",
          retryable: false,
        });
      }

      const prompt = `
Analyze this Mini Militia final-score screenshot.

Extract every visible player result row.

Rules:
- Copy the player name exactly as it appears.
- Extract kills as a non-negative integer.
- Extract deaths as a non-negative integer.
- Do not extract or calculate placement.
- Do not use deaths to rank players.
- Do not combine multiple players into one row.
- Do not invent missing names or numbers.
- Add a warning for every uncertain name or number.

The application calculates placement from kills only.
Equal kills receive the same dense placement.

Example:
15, 15, 12, 8 kills become placements 1, 1, 2, 3.
`;

      const interaction = await withTimeout(
        getClient().interactions.create({
          model: env.GEMINI_MODEL,
          store: false,
          input: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image",
              uri: imageUrl,
              mime_type: mimeType,
            },
          ],
          generation_config: {
            temperature: 0,
          },
          response_format: {
            type: "text",
            mime_type: "application/json",
            schema: extractionSchema,
          },
        }),
        env.GEMINI_REQUEST_TIMEOUT_MS,
      );

      if (!interaction.output_text) {
        throw new OCRProviderError("Gemini returned an empty response.", {
          code: "GEMINI_RESPONSE_EMPTY",
          retryable: true,
        });
      }

      let parsedResponse;

      try {
        parsedResponse = JSON.parse(interaction.output_text);
      } catch (error) {
        throw new OCRProviderError("Gemini returned malformed JSON.", {
          code: "GEMINI_JSON_INVALID",
          retryable: true,
          cause: error,
        });
      }

      const extraction = validateExtraction(parsedResponse);

      const averageConfidence = extraction.warnings.length ? 0.65 : 0.9;

      return {
        providerJobId: interaction.id ?? null,
        rawText: createRawText(extraction.rows),
        averageConfidence,
        rawResponse: {
          model: env.GEMINI_MODEL,
          rows: extraction.rows,
          warnings: extraction.warnings,
          confidenceMethod: "heuristic",
        },
      };
    } catch (error) {
      throw normalizeGeminiError(error);
    }
  },
});
