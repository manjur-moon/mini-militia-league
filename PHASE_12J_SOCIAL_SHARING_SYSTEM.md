# Phase 12J — Social Sharing System

## Included

- Public player-profile sharing metadata.
- Verified achievement sharing.
- Weekly MVP sharing.
- Open Graph and Twitter card HTML endpoints.
- Server-rendered 1200x630 PNG artwork.
- Copy-link, Web Share and image-download controls.
- Existing downloadable 1200x1500 player card.
- Public-field projection that excludes user email, Better Auth data and linked-user identifiers.

## Public API

```text
GET /api/v1/share/players/:playerId
GET /api/v1/share/players/:playerId/image.png
GET /api/v1/share/players/:playerId/achievements/:achievementCode
GET /api/v1/share/players/:playerId/achievements/:achievementCode/image.png
GET /api/v1/share/mvp/weekly
GET /api/v1/share/mvp/weekly/image.png
```

## Open Graph pages

```text
GET /share/players/:playerId/profile
GET /share/players/:playerId/achievements/:achievementCode
GET /share/mvp/weekly
```

Social networks should receive the backend share URL, not the Vite SPA URL. The backend returns crawler-readable metadata and points to a 1200x630 PNG. The canonical link still points to the public frontend page.

## Required production environment

```env
PUBLIC_APP_URL=https://your-frontend.vercel.app
PUBLIC_API_URL=https://your-backend.onrender.com
```

Both values must use public HTTPS origins in production. Do not include a trailing slash.

## Privacy rules

- Only player display name, player ID, public photo and verified league statistics are shared.
- User email, role-management metadata, Better Auth IDs and linked-user IDs are excluded.
- Achievement pages exist only for unlocked achievements.
- Weekly MVP content comes from the centralized versioned MVP service.
- Public images fetch profile photos only from approved Cloudinary HTTPS hosts.

## Caching

Open Graph HTML and PNG responses use:

```text
Cache-Control: public, max-age=300, stale-while-revalidate=3600
```

This keeps previews responsive while limiting how long corrected verified data remains stale.

## Run

```bash
npm install
npm run check
npm run dev
```

No MongoDB index migration is needed for this module.

## Manual verification

1. Open a public profile and copy its share link.
2. Confirm the link uses `/share/players/MM.../profile`.
3. Open the link source and verify `og:title`, `og:description`, `og:image`, `og:url` and Twitter metadata.
4. Open `og:image`; confirm a 1200x630 PNG is returned.
5. Share an unlocked achievement and confirm a locked achievement returns 404.
6. Open the MVP page, select Weekly, and share the current award.
7. Confirm no private account fields appear in metadata responses.
