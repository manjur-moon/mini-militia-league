import { env } from "../../../config/env.js";
import { OCRProviderError } from "../ocr-provider.error.js";

function getBoxMetrics(box) {
  if (!Array.isArray(box)) {
    return null;
  }

  if (
    box.length >= 4 &&
    box.slice(0, 4).every((value) => Number.isFinite(Number(value)))
  ) {
    const [x1, y1, x2, y2] = box.slice(0, 4).map(Number);

    return {
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      width: Math.abs(x2 - x1),
      height: Math.abs(y2 - y1),
      centerY: (y1 + y2) / 2,
    };
  }

  const points = box
    .filter(
      (point) =>
        Array.isArray(point) &&
        point.length >= 2 &&
        Number.isFinite(Number(point[0])) &&
        Number.isFinite(Number(point[1])),
    )
    .map(([x, y]) => ({
      x: Number(x),
      y: Number(y),
    }));

  if (!points.length) {
    return null;
  }

  const xValues = points.map((point) => point.x);
  const yValues = points.map((point) => point.y);

  const x1 = Math.min(...xValues);
  const x2 = Math.max(...xValues);
  const y1 = Math.min(...yValues);
  const y2 = Math.max(...yValues);

  return {
    x: x1,
    y: y1,
    width: x2 - x1,
    height: y2 - y1,
    centerY: (y1 + y2) / 2,
  };
}

function tokensToLines(tokens) {
  const positionedTokens = [];
  const unpositionedTokens = [];

  for (const token of tokens) {
    const text = String(token?.text ?? "").trim();

    if (!text) {
      continue;
    }

    const metrics = getBoxMetrics(token.box);

    if (!metrics) {
      unpositionedTokens.push(text);
      continue;
    }

    positionedTokens.push({
      text,
      ...metrics,
    });
  }

  positionedTokens.sort(
    (left, right) => left.centerY - right.centerY || left.x - right.x,
  );

  const lines = [];

  for (const token of positionedTokens) {
    let selectedLine = null;
    let smallestDistance = Number.POSITIVE_INFINITY;

    for (const line of lines) {
      const distance = Math.abs(token.centerY - line.centerY);
      const tolerance = Math.max(12, token.height * 0.75, line.averageHeight * 0.75);

      if (distance <= tolerance && distance < smallestDistance) {
        selectedLine = line;
        smallestDistance = distance;
      }
    }

    if (!selectedLine) {
      lines.push({
        centerY: token.centerY,
        averageHeight: Math.max(token.height, 1),
        tokens: [token],
      });

      continue;
    }

    selectedLine.tokens.push(token);

    const tokenCount = selectedLine.tokens.length;

    selectedLine.centerY =
      (selectedLine.centerY * (tokenCount - 1) + token.centerY) / tokenCount;

    selectedLine.averageHeight =
      (selectedLine.averageHeight * (tokenCount - 1) + Math.max(token.height, 1)) /
      tokenCount;
  }

  const positionedLines = lines
    .sort((left, right) => left.centerY - right.centerY)
    .map((line) =>
      line.tokens
        .sort((left, right) => left.x - right.x)
        .map((token) => token.text)
        .join(" "),
    )
    .filter(Boolean);

  return [...positionedLines, ...unpositionedTokens];
}

function calculateAverageConfidence(tokens) {
  const scores = tokens
    .map((token) => Number(token?.confidence))
    .filter(Number.isFinite);

  if (!scores.length) {
    return 0;
  }

  return scores.reduce((total, score) => total + score, 0) / scores.length;
}

function filenameForMimeType(mimeType) {
  const extensions = {
    "image/jpeg": "match.jpg",
    "image/png": "match.png",
    "image/webp": "match.webp",
  };

  return extensions[mimeType] ?? "match.jpg";
}

function normalizePaddleError(error) {
  if (error instanceof OCRProviderError) {
    return error;
  }

  const message = String(error?.message ?? "PaddleOCR request failed.");

  return new OCRProviderError("PaddleOCR was unable to process the screenshot.", {
    code: /timeout/i.test(message) ? "PADDLE_OCR_TIMEOUT" : "PADDLE_OCR_FAILED",
    retryable: /timeout|network|fetch|ECONNREFUSED|temporarily unavailable/i.test(
      message,
    ),
    cause: error,
  });
}

async function fetchSourceImage({ imageUrl, mimeType }) {
  const response = await fetch(imageUrl, {
    signal: AbortSignal.timeout(env.PADDLE_OCR_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new OCRProviderError(
      `Unable to download the OCR source image. HTTP ${response.status}.`,
      {
        code: "OCR_SOURCE_DOWNLOAD_FAILED",
        retryable: response.status >= 500,
      },
    );
  }

  const responseMimeType =
    response.headers.get("content-type")?.split(";")[0]?.trim() || mimeType;

  return {
    bytes: await response.arrayBuffer(),
    mimeType: responseMimeType,
  };
}

export const paddleOCRProvider = Object.freeze({
  name: "paddleocr",
  version: "PP-OCR",

  async recognize({ imageUrl, mimeType = "image/jpeg" }) {
    try {
      if (!env.paddleOcrUrl) {
        throw new OCRProviderError("PaddleOCR service URL is not configured.", {
          code: "PADDLE_OCR_NOT_CONFIGURED",
          retryable: false,
        });
      }

      const source = await fetchSourceImage({
        imageUrl,
        mimeType,
      });

      const formData = new FormData();

      formData.append(
        "file",
        new Blob([source.bytes], {
          type: source.mimeType,
        }),
        filenameForMimeType(source.mimeType),
      );

      const response = await fetch(`${env.paddleOcrUrl}/ocr`, {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(env.PADDLE_OCR_TIMEOUT_MS),
      });

      let payload;

      try {
        payload = await response.json();
      } catch (error) {
        throw new OCRProviderError("PaddleOCR service returned a non-JSON response.", {
          code: "PADDLE_OCR_RESPONSE_INVALID",
          retryable: response.status >= 500,
          cause: error,
        });
      }

      if (!response.ok || payload?.success !== true) {
        throw new OCRProviderError(
          payload?.detail ??
            payload?.message ??
            `PaddleOCR service failed with HTTP ${response.status}.`,
          {
            code: "PADDLE_OCR_SERVICE_FAILED",
            retryable: response.status === 429 || response.status >= 500,
          },
        );
      }

      const tokens = Array.isArray(payload?.data?.tokens) ? payload.data.tokens : [];

      const lines = tokensToLines(tokens);
      const rawText = lines.join("\n").trim();

      if (!rawText) {
        throw new OCRProviderError(
          "PaddleOCR completed but did not recognize any text.",
          {
            code: "PADDLE_OCR_NO_TEXT",
            retryable: false,
          },
        );
      }

      return {
        providerJobId: null,
        rawText,
        averageConfidence: calculateAverageConfidence(tokens),
        rawResponse: {
          provider: payload?.data?.provider ?? "paddleocr",
          tokenCount: tokens.length,
          tokens,
          rawResultCount: Array.isArray(payload?.data?.rawResults)
            ? payload.data.rawResults.length
            : 0,
        },
      };
    } catch (error) {
      throw normalizePaddleError(error);
    }
  },
});
