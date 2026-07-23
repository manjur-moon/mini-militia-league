# Phase 8 — Player CRUD

## Included

- Atomic `MM001`, `MM002`, ... player ID generation
- Admin create and edit workflows
- Activate/deactivate instead of destructive deletion
- Public player directory and profile
- Server-side search, status filtering, sorting and pagination
- Optimistic update protection with `expectedUpdatedAt`
- Cloudinary player-photo upload, replacement and removal
- JPEG/PNG/WebP MIME and magic-signature validation
- 5 MB upload limit and SHA-256 checksum storage
- Public field projection that excludes linked user and audit fields
- Audit logs for create, edit, status and photo actions
- Backend, validation and frontend tests

## Routes

```text
GET    /api/v1/players
POST   /api/v1/players
GET    /api/v1/players/:playerId
GET    /api/v1/players/:playerId/profile
PATCH  /api/v1/players/:playerId
PATCH  /api/v1/players/:playerId/status
POST   /api/v1/players/:playerId/photo
DELETE /api/v1/players/:playerId/photo
```

Admin UI:

```text
/admin/players
```

Public UI:

```text
/players
/players/:playerId
```

## Cloudinary environment

Add these values to `server/.env`:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_PLAYER_FOLDER=mini-militia/players
```

The API secret must remain server-side.

## Run

```bash
npm install
npm run dev
```

## Verify

```bash
npm run check
npm audit --omit=dev
```
