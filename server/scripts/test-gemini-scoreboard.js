import { readFile, stat } from "node:fs/promises";
import { extname, resolve } from "node:path";

import { GoogleGenAI } from "@google/genai";

const MAX_INLINE_IMAGE_SIZE = 15 * 1024 * 1024;

const MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash";

const extractionSchema = {
  type: "object",
  properties: {
    rows: {
      type: "array",
      description: "Visible player rows from the final score table.",
      items: {
        type: "object",
        properties: {
          playerName: {
            type: "string",
            description: "Player name exactly as visible in the screenshot.",
          },
          kills: {
            type: "integer",
            description: "Kills displayed for this player.",
          },
          deaths: {
            type: "integer",
            description: "Deaths displayed for this player. Omit when not visible.",
          },
        },
        required: ["playerName", "kills"],
      },
    },
    warnings: {
      type: "array",
      description: "Uncertain or unreadable values.",
      items: {
        type: "string",
      },
    },
  },
  required: ["rows", "warnings"],
};

function getMimeType(filePath) {
  const extension = extname(filePath).toLowerCase();

  const mimeTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
  };

  const mimeType = mimeTypes[extension];

  if (!mimeType) {
    throw new Error("Only JPG, JPEG, PNG and WebP files are supported.");
  }

  return mimeType;
}

function validateExtraction(value) {
  if (!value || typeof value !== "object") {
    throw new Error("Gemini returned an invalid response object.");
  }

  if (!Array.isArray(value.rows) || value.rows.length === 0) {
    throw new Error("Gemini did not extract any player rows.");
  }

  const rows = value.rows.map((row, index) => {
    const playerName = typeof row?.playerName === "string" ? row.playerName.trim() : "";

    if (!playerName) {
      throw new Error(`Row ${index + 1} has no player name.`);
    }

    if (!Number.isInteger(row.kills) || row.kills < 0) {
      throw new Error(`Row ${index + 1} has invalid kills.`);
    }

    if (row.deaths !== undefined && (!Number.isInteger(row.deaths) || row.deaths < 0)) {
      throw new Error(`Row ${index + 1} has invalid deaths.`);
    }

    return {
      playerName,
      kills: row.kills,
      ...(row.deaths !== undefined
        ? {
            deaths: row.deaths,
          }
        : {}),
    };
  });

  return {
    rows,
    warnings: Array.isArray(value.warnings)
      ? value.warnings
          .filter((warning) => typeof warning === "string")
          .map((warning) => warning.trim())
          .filter(Boolean)
      : [],
  };
}

function assignDenseKillPlacements(rows) {
  const sortedRows = [...rows].sort((left, right) => {
    const killDifference = right.kills - left.kills;

    if (killDifference !== 0) {
      return killDifference;
    }

    return left.playerName.localeCompare(right.playerName);
  });

  let currentPlacement = 0;
  let previousKills = null;

  return sortedRows.map((row) => {
    if (row.kills !== previousKills) {
      currentPlacement += 1;
    }

    previousKills = row.kills;

    return {
      ...row,
      placement: currentPlacement,
    };
  });
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing from server/.env.");
  }

  const suppliedPath = process.argv[2];

  if (!suppliedPath) {
    throw new Error("Provide the Mini Militia screenshot path as the first argument.");
  }

  const filePath = resolve(suppliedPath);
  const fileInformation = await stat(filePath);

  if (!fileInformation.isFile()) {
    throw new Error("The supplied screenshot path is not a file.");
  }

  if (fileInformation.size > MAX_INLINE_IMAGE_SIZE) {
    throw new Error("The screenshot is too large for this inline smoke test.");
  }

  const mimeType = getMimeType(filePath);
  const imageBuffer = await readFile(filePath);

  const client = new GoogleGenAI({
    apiKey,
  });

  const prompt = `
Analyze this Mini Militia final-score screenshot.

Extract every visible player result row.

Rules:
- Copy each player name as accurately as possible.
- Extract kills as a non-negative integer.
- Extract deaths only when clearly visible.
- Do not calculate or extract placement.
- Do not use deaths for ranking.
- Do not combine two players into one row.
- Do not invent missing players or numbers.
- Add a warning whenever text or a number is uncertain.

The application will calculate placement using kills only.
Players with equal kills must receive the same dense placement.

Example:
15, 15, 12, 8 kills becomes placement 1, 1, 2, 3.
`;

  const interaction = await client.interactions.create({
    model: MODEL,
    input: [
      {
        type: "text",
        text: prompt,
      },
      {
        type: "image",
        data: imageBuffer.toString("base64"),
        mime_type: mimeType,
      },
    ],
    response_format: {
      type: "text",
      mime_type: "application/json",
      schema: extractionSchema,
    },
  });

  if (!interaction.output_text) {
    throw new Error("Gemini returned an empty response.");
  }

  let parsedResponse;

  try {
    parsedResponse = JSON.parse(interaction.output_text);
  } catch {
    throw new Error("Gemini response was not valid JSON.");
  }

  const extraction = validateExtraction(parsedResponse);

  const rankedRows = assignDenseKillPlacements(extraction.rows);

  console.log(
    JSON.stringify(
      {
        provider: "gemini",
        model: MODEL,
        rows: rankedRows,
        warnings: extraction.warnings,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(
    "\nGemini scoreboard test failed:\n",
    error instanceof Error ? error.message : error,
  );

  process.exitCode = 1;
});
