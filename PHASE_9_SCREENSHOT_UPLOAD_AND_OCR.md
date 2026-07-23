# Phase 9 — Screenshot Upload and OCR

## Included

- Moderator/Admin-only screenshot upload
- JPEG/PNG/WebP MIME and magic-signature validation
- Configurable 10 MB limit
- SHA-256 exact duplicate detection
- Original Cloudinary asset preservation
- Persisted Match and OCRJob lifecycle
- Google Cloud Vision, mock and disabled OCR providers behind one interface
- Generic configurable result parser
- OCR confidence and raw response storage
- Exact, alias, probable and ambiguous player suggestions
- Manual row correction and missing-row entry
- OCR retry limit and status polling
- Verification and rejection with audit logs
- Server-side uniqueness checks for player and placement
- MongoDB transaction during final verification

## Important parser boundary

No Mini Militia screenshot sample was supplied in this phase. The parser therefore does not claim a final game-layout contract. It uses `OCR_RESULT_COLUMN_ORDER` and requires moderator review. After real screenshots are supplied, add representative fixtures and tune the parser before production verification.

## Environment

```env
CLOUDINARY_MATCH_FOLDER=mini-militia/matches
MATCH_SCREENSHOT_MAX_BYTES=10485760
OCR_PROVIDER=google-vision
GOOGLE_VISION_API_KEY=replace-with-server-only-key
OCR_MAX_ATTEMPTS=3
OCR_LOW_CONFIDENCE_THRESHOLD=0.75
OCR_RESULT_COLUMN_ORDER=placement,name,kills,deaths
```

Use `OCR_PROVIDER=mock` with `OCR_MOCK_TEXT` for local workflow testing, or `disabled` for manual-only review.

## Main endpoints

- `POST /api/v1/matches/uploads`
- `GET /api/v1/matches`
- `GET /api/v1/matches/:matchId`
- `GET /api/v1/matches/ocr/jobs/:jobId`
- `POST /api/v1/matches/ocr/jobs/:jobId/retry`
- `PATCH /api/v1/matches/:matchId/review`
- `POST /api/v1/matches/:matchId/verify`
- `POST /api/v1/matches/:matchId/reject`

## Run

```bash
npm install
cp server/.env.example server/.env
cp client/.env.example client/.env
npm run dev
```

## Verification

```bash
npm run lint
npm test
npm run build
```

## Real Screenshot Parser Refinement

Five supplied 1824x832 Mini Militia final-score screenshots were reviewed. The production parser now uses the `mini-militia-final-score-v1` profile.

Observed score-row layout:

```text
Player name | kills | deaths | signed score difference
```

Placement is not printed as a separate number. The visual row order is therefore stored as placement 1..N. The signed yellow value is retained as `scoreDifference` and checked against `kills - deaths`; a mismatch creates `score_difference_mismatch` for moderator review.

Before OCR, a non-destructive Cloudinary transformation crops only the scoreboard region and upscales it. The preserved original screenshot is never changed. Crop ratios are configurable through environment variables. Names containing spaces and emoji are supported. Numeric-only OCR correction handles common game-font confusions such as `3b` -> `36` without modifying player names.

Ground-truth parser fixtures cover all five supplied screenshots in `server/tests/fixtures/mini-militia-scoreboards.json`. Actual provider accuracy still requires one live Google Vision run because OCR provider output can differ from the visually transcribed fixture text.
