from __future__ import annotations

import asyncio
from functools import lru_cache
from typing import Annotated, Any

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from paddleocr import PaddleOCR

APP_NAME = "Mini Militia OCR Service"
APP_VERSION = "1.0.0"

MAX_FILE_SIZE = 10 * 1024 * 1024

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
)


@lru_cache(maxsize=1)
def get_ocr_pipeline() -> PaddleOCR:
    return PaddleOCR(
        lang="en",
        device="cpu",
        enable_mkldnn=False,
        use_doc_orientation_classify=False,
        use_doc_unwarping=False,
        use_textline_orientation=False,
    )


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """
    Decode and mildly enhance the screenshot.

    We preserve the game scoreboard layout because aggressive
    thresholding may destroy column and row relationships.
    """

    encoded_image = np.frombuffer(image_bytes, dtype=np.uint8)

    image = cv2.imdecode(
        encoded_image,
        cv2.IMREAD_COLOR,
    )

    if image is None:
        raise ValueError("Unable to decode the uploaded image.")

    upscaled = cv2.resize(
        image,
        None,
        fx=2,
        fy=2,
        interpolation=cv2.INTER_CUBIC,
    )

    lab_image = cv2.cvtColor(
        upscaled,
        cv2.COLOR_BGR2LAB,
    )

    lightness, channel_a, channel_b = cv2.split(lab_image)

    clahe = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize=(8, 8),
    )

    enhanced_lightness = clahe.apply(lightness)

    enhanced_lab = cv2.merge(
        (
            enhanced_lightness,
            channel_a,
            channel_b,
        ),
    )

    return cv2.cvtColor(
        enhanced_lab,
        cv2.COLOR_LAB2BGR,
    )


def to_serializable(value: Any) -> Any:
    """
    Convert NumPy values into JSON-compatible Python values.
    """

    if isinstance(value, np.ndarray):
        return value.tolist()

    if isinstance(value, np.generic):
        return value.item()

    if isinstance(value, dict):
        return {
            key: to_serializable(item)
            for key, item in value.items()
        }

    if isinstance(value, (list, tuple)):
        return [
            to_serializable(item)
            for item in value
        ]

    return value


def run_ocr(image: np.ndarray) -> dict[str, Any]:
    pipeline = get_ocr_pipeline()

    predictions = pipeline.predict(
        image,
        text_rec_score_thresh=0.25,
    )

    pages: list[dict[str, Any]] = []
    tokens: list[dict[str, Any]] = []

    for prediction in predictions:
        prediction_json = to_serializable(
            prediction.json,
        )

        pages.append(prediction_json)

        result = prediction_json.get(
            "res",
            prediction_json,
        )

        texts = result.get("rec_texts", [])
        scores = result.get("rec_scores", [])
        boxes = result.get("rec_boxes", [])

        for index, text in enumerate(texts):
            normalized_text = str(text).strip()

            if not normalized_text:
                continue

            confidence = (
                float(scores[index])
                if index < len(scores)
                else None
            )

            box = (
                boxes[index]
                if index < len(boxes)
                else None
            )

            tokens.append(
                {
                    "text": normalized_text,
                    "confidence": confidence,
                    "box": box,
                },
            )

    return {
        "provider": "paddleocr",
        "tokens": tokens,
        "rawResults": pages,
    }


@app.get("/health")
async def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": APP_NAME,
        "version": APP_VERSION,
        "provider": "paddleocr",
    }


@app.post("/ocr")
async def extract_scoreboard(
    file: Annotated[
        UploadFile,
        File(description="Mini Militia match screenshot"),
    ],
) -> dict[str, Any]:
    try:
        if file.content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(
                status_code=415,
                detail="Only JPEG, PNG and WebP images are supported.",
            )

        image_bytes = await file.read()

        if not image_bytes:
            raise HTTPException(
                status_code=400,
                detail="The uploaded image is empty.",
            )

        if len(image_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="The uploaded image exceeds the 10 MB limit.",
            )

        processed_image = preprocess_image(
            image_bytes,
        )

        result = await asyncio.to_thread(
            run_ocr,
            processed_image,
        )

        return {
            "success": True,
            "message": "Screenshot processed successfully.",
            "data": result,
        }

    except HTTPException:
        raise

    except ValueError as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"PaddleOCR processing failed: {error}",
        ) from error

    finally:
        await file.close()