# Phase 13: Testing and Quality Assurance

## Scope

This phase adds release-focused QA for the Mini Militia League & Analytics Platform without changing the product scope.

Implemented areas:

- Unit tests for calculations, rules, validators and renderers
- API integration tests with Supertest
- Better Auth session-protection tests
- RBAC permission-matrix tests
- Strict validation and input-hardening tests
- Atomic player-ID concurrency tests
- OCR parser and player-matching tests
- Match verification workflow tests
- Statistics, MVP and leaderboard edge-case tests
- React component and route-guard tests
- Automated critical accessibility checks with axe-core
- Coverage thresholds for critical code paths
- Static security and responsive-design checks
- Manual end-to-end, security, accessibility and mobile release checklists

## Important Fix Found During QA

Malformed JSON previously reached the generic internal-error branch. The error middleware now returns:

```json
{
  "success": false,
  "message": "The JSON request body is invalid.",
  "errors": [],
  "requestId": "..."
}
```

HTTP status: `400`.

No stack trace or parser internals are exposed.

## Commands

Install dependencies:

```bash
npm ci
```

Run the complete release QA gate:

```bash
npm run qa
```

Run all tests:

```bash
npm test
```

Run critical tests only:

```bash
npm run test:critical
```

Run coverage gates:

```bash
npm run test:coverage
```

Run static security and responsive checks:

```bash
npm run qa:static
```

Build the production frontend:

```bash
npm run build
```

## MongoDB Memory Server

The real MongoDB concurrency suite is opt-in because `mongodb-memory-server` must download a MongoDB binary the first time.

```bash
npm run test:database:memory
```

In CI, cache the MongoDB binary or set `MONGOMS_SYSTEM_BINARY` to an installed binary.

The application will use MongoDB Atlas in production. Atlas already provides the replica-set behavior required by transactions.

## Test Results

Validated in this phase:

- Server: 212 passing tests
- Client: 39 passing tests
- Total: 251 passing tests
- Optional MongoDB binary suite: 1 skipped by default
- ESLint: passed
- Prettier: passed
- Production build: passed
- Static QA: 25 checks passed
- Dependency audit: 0 vulnerabilities

## Coverage Gate

Coverage is intentionally scoped to critical calculation, rule, parser, authorization, route-guard, validation and sharing code.

Server critical-code coverage:

- Statements: 70.08%
- Branches: 55.51%
- Functions: 72.68%
- Lines: 73.00%

Client critical-code coverage:

- Statements: 98.75%
- Branches: 89.13%
- Functions: 100%
- Lines: 100%

HTML reports are generated under:

```text
coverage/server/
coverage/client/
```

## New Critical Test Files

```text
server/tests/security.integration.test.js
server/tests/critical-validation-hardening.test.js
server/tests/rbac-permission-matrix.test.js
server/tests/match-verification.workflow.test.js
server/tests/mvp-leaderboard.qa.test.js
server/tests/mongodb-memory-critical.integration.test.js

client/src/features/auth/components/route-guards.test.jsx
client/src/test/critical-accessibility.test.jsx
```

## Release Documents

```text
qa/TEST_MATRIX.md
qa/CRITICAL_WORKFLOW_CHECKLIST.md
qa/SECURITY_CHECKLIST.md
qa/ACCESSIBILITY_REVIEW.md
qa/MOBILE_RESPONSIVENESS_REVIEW.md
qa/MONGODB_ATLAS_TEST_GUIDE.md
qa/RELEASE_GATE.md
```

## Known Testing Boundary

The automated suite does not call real Cloudinary, Google Vision or OpenAI production accounts. Provider behavior is tested through adapters, mocks, output validation and deterministic fallbacks.

Before production release, complete the manual provider checks in the critical workflow checklist using restricted non-production credentials.
