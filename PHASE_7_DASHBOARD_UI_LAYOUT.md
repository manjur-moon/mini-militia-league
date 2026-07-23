# Phase 7 — Dashboard and UI Layout

## Completed

- Public layout with responsive navigation and footer
- Authentication split-screen layout
- Player, moderator and admin dashboard layouts
- Desktop sidebar and mobile drawer navigation
- Sticky dashboard header
- Role-aware account navigation
- Breadcrumbs
- Dark and light theme context
- Homepage gaming analytics preview
- Reusable page header, stat card, section card, loading, empty and error states
- Unauthorized, inactive-account, route-error and not-found screens
- Existing admin user management integrated into the admin dashboard

## Main Files

```text
client/src/app/router.jsx
client/src/app/theme-provider.jsx
client/src/layouts/public-layout.jsx
client/src/layouts/auth-layout.jsx
client/src/layouts/dashboard/dashboard-shell.jsx
client/src/layouts/dashboard/dashboard-sidebar.jsx
client/src/layouts/dashboard/dashboard-header.jsx
client/src/layouts/player-dashboard-layout.jsx
client/src/layouts/moderator-dashboard-layout.jsx
client/src/layouts/admin-dashboard-layout.jsx
client/src/config/dashboard-navigation.jsx
client/src/components/navigation/breadcrumbs.jsx
client/src/components/ui/loading-state.jsx
client/src/components/ui/empty-state.jsx
client/src/components/ui/error-state.jsx
client/src/pages/admin-dashboard.page.jsx
client/src/pages/moderator-dashboard.page.jsx
client/src/pages/player-dashboard.page.jsx
client/src/styles/index.css
```

## Route Structure

```text
/                       Public homepage
/login                  Authentication layout
/register               Authentication layout
/dashboard              Redirects to the signed-in user's dashboard
/account                 Redirects to the signed-in user's account page
/player                  Player dashboard
/player/account          Player account
/moderator               Moderator dashboard
/moderator/account       Moderator account
/admin                   Admin overview
/admin/users             Admin user management
/admin/account           Admin account
/unauthorized            Role-denied state
/account-inactive        Inactive-account state
```

## Run

```bash
npm install
cp server/.env.example server/.env
cp client/.env.example client/.env
npm run admin:bootstrap
npm run dev
```

## Validation

```bash
npm run format:check
npm run lint
npm run test
npm run build
```

## Notes

- Locked navigation items intentionally identify modules scheduled for later phases and do not link to incomplete routes.
- Backend authorization remains the source of truth; dashboard guards only improve user experience.
- Theme state is stored in local storage and applied through a single React context.
- Mobile navigation locks body scrolling and closes after route changes.
