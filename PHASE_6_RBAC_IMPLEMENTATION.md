# Phase 6 — RBAC Implementation

## Implemented

- Roles: `player`, `moderator`, `admin`
- Active/inactive account enforcement
- Backend role and permission middleware
- Frontend protected and role-based route guards
- Admin user list with server-side search and pagination
- Audited role changes
- Audited account-status changes
- One-to-one user/player linking and unlinking
- Last active admin protection
- Session revocation after role, status, or player-link changes
- Initial admin bootstrap script

## Admin API

| Method | Endpoint                            | Access |
| ------ | ----------------------------------- | ------ |
| GET    | `/api/v1/users`                     | Admin  |
| GET    | `/api/v1/users/:userId`             | Admin  |
| PATCH  | `/api/v1/users/:userId/role`        | Admin  |
| PATCH  | `/api/v1/users/:userId/status`      | Admin  |
| PUT    | `/api/v1/users/:userId/player-link` | Admin  |
| DELETE | `/api/v1/users/:userId/player-link` | Admin  |

Every write requires a reason and creates an audit record. Role and status writes revoke the target user's existing sessions.

## Initial Admin

Set these values in `server/.env`:

```env
INITIAL_ADMIN_NAME=League Administrator
INITIAL_ADMIN_EMAIL=admin@example.com
INITIAL_ADMIN_PASSWORD=replace-with-a-strong-unique-password
```

Run once:

```bash
npm run admin:bootstrap
```

The script is idempotent. It exits without modifying users when an active admin already exists. Do not commit the real credentials.

## Run

```bash
npm install
cp server/.env.example server/.env
cp client/.env.example client/.env
npm run admin:bootstrap
npm run dev
```

## Important Rules

- Frontend guards improve UX; backend middleware is the security boundary.
- Public signup cannot submit role, status, or linked-player fields.
- The last active admin cannot be demoted or deactivated.
- User and Player remain separate entities.
- Player linking updates both sides and uses a MongoDB transaction when supported, with a guarded fallback for standalone local MongoDB.
- Better Auth remains the only authentication system.
