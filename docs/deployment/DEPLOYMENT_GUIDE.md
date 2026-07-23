# Production Deployment Guide

## 1. MongoDB Atlas

1. Create an Atlas project and a replica-set-backed cluster.
2. Create a dedicated database user with access only to `mini_militia_league`.
3. Add the backend platform's outbound IP or approved CIDR to Atlas Network Access.
4. Copy the SRV connection string.
5. URL-encode special characters in the password.
6. Set `MONGODB_URI` and `MONGODB_DB_NAME` on the backend.

Avoid `0.0.0.0/0` for a real production environment unless the hosting provider has no stable outbound IP and the database user has a strong unique password with least privilege.

## 2. Cloudinary

1. Create a Cloudinary product environment.
2. Copy Cloud Name, API Key and API Secret.
3. Store all three only in backend environment variables.
4. Keep player and match folders separate.
5. Do not create an unsigned browser upload preset; this project performs authenticated server-side uploads.

Required values:

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_PLAYER_FOLDER=mini-militia/players
CLOUDINARY_MATCH_FOLDER=mini-militia/matches
```

## 3. Google Vision OCR

1. Create or select a Google Cloud project.
2. Enable Cloud Vision API and billing.
3. Create an API key.
4. Restrict the key to Cloud Vision API.
5. Store the key only on the backend.
6. Keep the supplied Mini Militia crop profile unchanged until more layouts are tested.

```env
OCR_PROVIDER=google-vision
GOOGLE_VISION_API_KEY=
OCR_PARSER_PROFILE=mini-militia-final-score-v1
```

## 4. Backend on Render

The repository includes `render.yaml`.

1. Push the repository to GitHub.
2. In Render, create a Blueprint from the repository.
3. Supply every variable marked `sync: false`.
4. Use a paid instance for a real production service; the included Blueprint uses `starter`.
5. Confirm the health-check path is `/api/v1/health`.
6. After Render assigns the URL, set:

```env
PUBLIC_API_URL=https://your-service.onrender.com
BETTER_AUTH_URL=https://your-service.onrender.com
```

7. Set the final Vercel URL in:

```env
CLIENT_ORIGINS=https://your-app.vercel.app
PUBLIC_APP_URL=https://your-app.vercel.app
```

8. Redeploy after changing URL variables.

Manual Render settings when not using the Blueprint:

```text
Runtime: Node
Root directory: repository root
Build command: npm ci --omit=dev
Start command: npm run start -w server
Health check: /api/v1/health
```

## 5. Backend on Railway

The repository includes `railway.toml`.

1. Create a Railway project and connect the GitHub repository.
2. Keep the service root at the repository root because the server depends on the shared workspace.
3. Add every value from `server/.env.production.example` in Railway Variables.
4. Generate a public domain.
5. Set `PUBLIC_API_URL` and `BETTER_AUTH_URL` to that HTTPS domain.
6. Set `CLIENT_ORIGINS` and `PUBLIC_APP_URL` to the final Vercel domain.
7. Confirm the health check uses `/api/v1/health`.

## 6. Database preparation

Run from a secure local machine with `server/.env` pointing to Atlas:

```bash
npm ci
npm run deploy:preflight
npm run db:prepare
```

`db:prepare` runs all versioned index migrations and then seeds:

- Dynamic titles
- Achievements
- Weekly/monthly challenges
- MVP formula configuration
- Player rating configuration

## 7. Initial admin

Add temporary values to local `server/.env`:

```env
INITIAL_ADMIN_NAME=League Administrator
INITIAL_ADMIN_EMAIL=admin@example.com
INITIAL_ADMIN_PASSWORD=use-a-unique-password-with-at-least-12-characters
```

Run:

```bash
npm run admin:bootstrap
```

Delete the temporary values from local and platform environments after the command succeeds. The script is idempotent and refuses to create another initial admin when an active admin already exists.

## 8. Frontend on Vercel

1. Import the same GitHub repository into Vercel.
2. Keep Root Directory at the repository root so the client can resolve the shared workspace package.
3. Framework preset: Vite.
4. Build command: `npm run build`.
5. Output directory: `client/dist`.
6. Add:

```env
VITE_API_BASE_URL=https://your-backend.example.com/api/v1
VITE_AUTH_BASE_URL=https://your-backend.example.com
```

7. Deploy.
8. Copy the final Vercel URL into backend `CLIENT_ORIGINS` and `PUBLIC_APP_URL`.
9. Redeploy the backend.

The included `vercel.json` rewrites SPA routes to `index.html`, so direct navigation to `/players`, `/leaderboards` and dashboard routes does not return Vercel's 404 page.

## 9. Production verification

```bash
PUBLIC_API_URL=https://your-backend.example.com \
PUBLIC_APP_URL=https://your-frontend.example.com \
npm run verify:production
```

Then manually test:

1. Register a Player account.
2. Login and refresh the page.
3. Login as Admin.
4. Create a Player profile and link the account.
5. Assign a Moderator.
6. Upload one supplied Mini Militia screenshot.
7. Review OCR rows and player matching.
8. Verify the match.
9. Confirm statistics, leaderboard and notification updates.
10. Logout and confirm protected routes are inaccessible.
