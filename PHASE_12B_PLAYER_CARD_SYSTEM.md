# Phase 12B — Player Card System

## Implemented

- FIFA-style responsive public player card
- Verified all-time, weekly, monthly and season rating selection
- Player photo with initials fallback
- Overall, Attack, Survival, Consistency, Activity and KDR values
- Current dynamic title lookup with `League Competitor` fallback
- Public interactive route: `/players/:playerId/card`
- Public card-data API
- Server-rendered SVG artwork
- Server-rendered 1200×1500 PNG artwork using Sharp
- PNG download
- Copyable canonical share URL
- Web Share API support where available
- Backend social metadata page with Open Graph and Twitter tags
- Cloudinary-only remote photo embedding and five-megabyte limit
- HTML/XML escaping and finite rating guards
- Public cache headers
- Component, service and renderer tests

## Public routes

```text
GET /api/v1/players/:playerId/card
GET /api/v1/players/:playerId/card/image.svg
GET /api/v1/players/:playerId/card/image.png
GET /share/players/:playerId/card
```

Supported rating query parameters:

```text
periodType=all_time|weekly|monthly|season
date=<ISO date, optional>
seasonId=<MongoDB ObjectId, optional>
```

## Environment variables

```env
PUBLIC_APP_URL=http://localhost:5173
PUBLIC_API_URL=http://localhost:5000
```

Production example:

```env
PUBLIC_APP_URL=https://your-frontend.vercel.app
PUBLIC_API_URL=https://your-backend.onrender.com
```

`PUBLIC_API_URL` is used for canonical share and image URLs. `PUBLIC_APP_URL` is used for the interactive player-card and public-profile links.

## Data rules

- Card ratings come from the versioned rating service.
- Unverified match data never reaches the card.
- KDR comes from verified player statistics.
- A current, non-expired `PlayerTitle` is used when available.
- Missing rating data produces a safe provisional zero-value card.
- Missing or unavailable profile photos produce an initials fallback.
- Historical rating formula version is displayed on the artwork.

## Security

- The server never accepts arbitrary card HTML.
- Player names and titles are escaped before SVG/HTML rendering.
- Remote image embedding accepts HTTPS Cloudinary hosts only.
- Redirects are rejected while fetching a card photo.
- Embedded photos are restricted to JPEG, PNG or WebP and five megabytes.
- Generated image responses use `nosniff` and cache headers.

## Verification

```bash
npm run check
```

Additional validation includes a real Sharp render check confirming a 1200×1500 PNG output.
