# API Documentation

## Base paths

```text
Better Auth: /api/auth/*
Application API: /api/v1/*
Public social metadata: /share/*
Health check: /api/v1/health
```

## Specifications

Primary contract:

```text
docs/openapi.yaml
```

Module contracts:

```text
docs/phase-12d-achievements.openapi.yaml
docs/phase-12e-rivalries.openapi.yaml
docs/phase-12f-challenges.openapi.yaml
docs/phase-12g-hall-of-fame.openapi.yaml
docs/phase-12h-seasons.openapi.yaml
docs/phase-12i-notifications.openapi.yaml
docs/phase-12j-social-sharing.openapi.yaml
docs/phase-12k-ai-insights.openapi.yaml
```

## Standard success response

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {}
}
```

## Standard application error

```json
{
  "success": false,
  "message": "Readable error message.",
  "errors": [],
  "requestId": "request-correlation-id"
}
```

## Authentication

Browser requests use Better Auth HTTP-only cookies. Frontend requests must use `credentials: include`; the backend must use exact credentialed CORS origins.

Authorization is enforced by backend role/permission middleware. Frontend guards are navigation controls only and are not a security boundary.

## Pagination

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 100,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

## Production API review

Before release, import the OpenAPI files into an API client or validator and confirm:

- Production server URL is correct.
- No secret appears in examples.
- Protected routes reject missing sessions.
- Role-specific routes enforce backend authorization.
- Upload endpoints enforce size and image signature checks.
