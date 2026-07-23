# Phase 12K — AI Summaries and Insights System

## Scope

This module adds optional AI-assisted narratives without allowing AI to calculate, overwrite or approve official league data.

Implemented outputs:

- Weekly league summary
- Monthly league summary
- Weekly/monthly public highlight
- Player performance analysis
- Constructive improvement suggestions
- Verified match insight
- Admin generation history and explicit regeneration

## Trust boundary

The system sends only compact verified structured metrics to the AI provider. It does not send:

- Better Auth account data
- Email addresses or session information
- Passwords, tokens or environment secrets
- Original screenshots or raw OCR payloads
- Unverified match rows
- Private user metadata

AI output is narrative-only. Official matches, statistics, ratings, rankings, awards and records remain controlled by their existing deterministic services.

## Generation flow

```text
Verified structured data
        ↓
Compact source payload
        ↓
SHA-256 source fingerprint
        ↓
Cached result lookup
        ↓
Optional OpenAI provider
        ↓
Strict structured-output validation
        ↓
Application safety validation
        ↓
Deterministic fallback on any failure
        ↓
Persisted summary + provider metadata + prompt version
```

## Provider abstraction

Provider-specific code is isolated under:

```text
server/src/services/ai/
├── ai-provider.error.js
├── ai-provider.factory.js
├── disabled-ai.provider.js
├── openai-ai.provider.js
├── ai-output.schemas.js
└── deterministic-insight.service.js
```

`ai-insight.service.js` depends on the provider interface rather than on OpenAI directly. A different provider can be introduced without changing controllers, routes or analytics services.

## OpenAI integration

The OpenAI implementation uses:

- Official `openai` Node.js package
- Responses API
- Structured Outputs through strict JSON Schema
- `store: false`
- Configurable request timeout
- One SDK retry plus application fallback
- Server-only API key
- Token-usage persistence

The provider never receives instructions to calculate official values. Source metrics are passed as JSON and the response must conform to an application-owned schema.

## Deterministic fallback

When the provider is disabled, unavailable, rate-limited, returns invalid JSON or fails application validation, the system produces a statistics-based deterministic result.

Fallback results are clearly stored and returned with:

```json
{
  "provider": "deterministic",
  "isFallback": true,
  "status": "fallback_generated"
}
```

The public interface remains usable with no AI API key.

## Validation and safety

The output pipeline validates:

- Exact Zod narrative shape
- Allowed player IDs from the source payload
- No URLs or email-like content
- No unknown player references
- No provider-created official statistics
- No health/personality diagnosis
- No certainty about future performance
- No claim that AI modified official data

Every displayed result is marked `AI-generated analysis` and includes a disclaimer.

## Caching

Cache identity uses:

```text
type + periodKey + playerId + matchId + sourceDataHash
```

`sourceDataHash` is a SHA-256 hash of:

```text
promptVersion + compact verified source data
```

Unchanged data returns the cached result. Changed verified data creates a new cache identity. Admin regeneration explicitly replaces the matching cached record and requires a reason.

## Persistence

`AISummary` stores:

- Type and period boundaries
- Player/match/season references where applicable
- Provider and model
- Provider request ID
- Fallback flag and status
- Display content and structured content
- Compact source metrics
- Source-data hash
- Prompt version
- Generation actor and reason
- Token usage
- Validation warnings
- UTC generation timestamp

## API routes

### Public

```text
GET /api/v1/ai/status
GET /api/v1/ai/summaries/:periodType
GET /api/v1/ai/highlights/:periodType
GET /api/v1/ai/players/:playerId
GET /api/v1/ai/matches/:matchId
```

`periodType` supports `weekly` and `monthly`.

### Admin

```text
GET  /api/v1/admin/ai/summaries
POST /api/v1/admin/ai/regenerate
```

Admin regeneration requires a reason and creates an audit record.

## Frontend routes

```text
/insights
/admin/ai-insights
```

AI insight panels also appear on:

- Homepage weekly-summary section
- Public player profile
- Verified match detail page

## Environment variables

`server/.env`:

```env
AI_PROVIDER=disabled
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.6-luna
AI_REQUEST_TIMEOUT_MS=20000
AI_MAX_OUTPUT_TOKENS=1200
```

### Without external AI

```env
AI_PROVIDER=disabled
```

All endpoints use deterministic fallback.

### With OpenAI

```env
AI_PROVIDER=openai
OPENAI_API_KEY=replace-with-a-server-only-key
OPENAI_MODEL=gpt-5.6-luna
```

Never place `OPENAI_API_KEY` in `client/.env`, Vite variables or browser code.

## MongoDB Atlas migration

Run once after configuring the production database:

```bash
npm install
npm run ai:migrate-indexes
```

The migration runs Mongoose `syncIndexes()` for `aiSummaries`.

## Main files

### Server

```text
server/src/config/env.js
server/src/models/ai-summary.model.js
server/src/services/ai-insight.service.js
server/src/services/ai/*
server/src/controllers/ai-insight.controller.js
server/src/routes/ai-insight.routes.js
server/src/routes/admin-ai-insight.routes.js
server/src/validators/ai-insight.validation.js
server/src/scripts/migrate-ai-summary-indexes.js
```

### Client

```text
client/src/services/ai-insight.service.js
client/src/features/ai/components/ai-insight-card.jsx
client/src/features/ai/components/player-ai-insight-panel.jsx
client/src/features/ai/components/match-ai-insight-panel.jsx
client/src/pages/ai-insights.page.jsx
client/src/pages/admin-ai-insights.page.jsx
```

### Tests

```text
server/tests/openai-ai.provider.test.js
server/tests/ai-output.schemas.test.js
server/tests/ai-summary-model.test.js
server/tests/ai-insight.validation.test.js
server/tests/deterministic-insight.service.test.js
client/src/features/ai/components/ai-insight-card.test.jsx
```

## Run

```bash
npm install
cp server/.env.example server/.env
cp client/.env.example client/.env
npm run ai:migrate-indexes
npm run dev
```

## Verification

```bash
npm run check
npm audit --omit=dev --audit-level=high
```

## Security notes

- Public generation endpoints never accept arbitrary prompts.
- Prompt instructions and schemas are server-owned.
- Admin regeneration is protected by Better Auth and admin RBAC.
- API keys remain server-only.
- Source payloads contain verified league metrics only.
- External output is validated before persistence or display.
- Fallback ensures provider outages do not break public pages.
- Audit logs contain no prompts with secrets or provider credentials.

## Common mistakes to avoid

- Sending raw OCR or unverified rows to the AI provider
- Trusting model-created numbers as official values
- Exposing the API key through a `VITE_` variable
- Allowing users to submit arbitrary prompts
- Displaying unvalidated free-form model text
- Regenerating on every render instead of using the source hash cache
- Hiding the fact that content is AI-generated
- Silently replacing historical results without an explicit admin action
