# Test Matrix

| Area                       | Automated coverage                                                                    | Primary files                                                           |
| -------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Better Auth                | Handler mounting, protected-session rejection, middleware behavior                    | `auth.integration.test.js`, `auth.middleware.test.js`                   |
| RBAC                       | Role allow/deny behavior, complete permission matrix                                  | `authorize.middleware.test.js`, `rbac-permission-matrix.test.js`        |
| Validation                 | Strict unknown-key rejection, score bounds, role and formula hardening                | `critical-validation-hardening.test.js`, validator tests                |
| Player IDs                 | Concurrent unique sequential IDs; optional real MongoDB replica-set test              | `player.service.test.js`, `mongodb-memory-critical.integration.test.js` |
| Upload security            | MIME/signature and file-size middleware                                               | screenshot/player upload middleware tests                               |
| OCR                        | Five real-layout fixtures, numeric confusion rules, crop and matching                 | OCR parser, image-source and matcher tests                              |
| Verification               | Transaction boundary, official snapshot, dependent recalculation and failure recovery | `match-verification.workflow.test.js`                                   |
| Statistics                 | Zero-safe KDR, averages, records and streaks                                          | `statistics.service.test.js`                                            |
| MVP                        | Caps, penalties, deterministic score breakdown                                        | `analytics-math.service.test.js`, `mvp-leaderboard.qa.test.js`          |
| Leaderboards               | Metric ordering and deterministic tie-breakers                                        | analytics and MVP/leaderboard QA tests                                  |
| Ratings                    | Normalization, confidence and minimum-sample behavior                                 | rating math/model/validation tests                                      |
| Extended V1                | Titles, achievements, rivalries, challenges, Hall of Fame and seasons                 | module-specific rule/model/validation tests                             |
| Notifications              | Deduplication, validation and rendering                                               | notification service/model/component tests                              |
| AI                         | Structured-output validation, provider fallback and deterministic insight             | AI provider/output/service tests                                        |
| Frontend auth              | Pending, anonymous, inactive, allowed and denied routes                               | `route-guards.test.jsx`                                                 |
| Accessibility              | Critical/serious axe violations and accessible actions                                | `critical-accessibility.test.jsx`                                       |
| Responsive/static security | Viewport, breakpoint utilities, no client secret identifiers                          | `static-quality-check.mjs`                                              |
