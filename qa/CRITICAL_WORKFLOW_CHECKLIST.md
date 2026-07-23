# Critical End-to-End Workflow Checklist

Use a staging MongoDB Atlas database and staging Cloudinary/OCR credentials.

## Authentication and RBAC

- [ ] Register a player account with email/password.
- [ ] Confirm registration cannot submit `role`, `status` or `linkedPlayerId`.
- [ ] Log in and refresh the browser; session remains valid.
- [ ] Log out; protected API and dashboard routes return to login.
- [ ] Player cannot open moderator/admin routes.
- [ ] Moderator can upload/review/verify but cannot manage admin roles.
- [ ] Admin can manage users and players.
- [ ] Attempt to demote or disable the last active admin; request is rejected.

## Player Management

- [ ] Create at least five players concurrently; IDs are unique and sequential.
- [ ] Search by player ID, name and alias.
- [ ] Filter active/inactive players and paginate.
- [ ] Upload valid JPEG, PNG and WebP photos.
- [ ] Reject invalid signature, oversize and unauthorized uploads.
- [ ] Deactivate a player with historical matches; history remains available.

## Screenshot, OCR and Verification

- [ ] Upload each supplied real Mini Militia screenshot.
- [ ] Original Cloudinary asset remains unchanged.
- [ ] Exact duplicate screenshot is rejected or clearly flagged.
- [ ] OCR job moves through persisted statuses.
- [ ] Parsed rows follow `Name → Kills → Deaths → Difference`.
- [ ] Row order becomes placement.
- [ ] Low-confidence and score-difference mismatches are visible.
- [ ] Correct player links, kills, deaths and placements manually.
- [ ] Duplicate player and duplicate placement are rejected.
- [ ] Verify the match.
- [ ] Only after verification, statistics and leaderboards change.
- [ ] Reject a separate match; official statistics do not change.
- [ ] Simulate OCR failure and retry within the configured attempt limit.

## Statistics and Analytics

- [ ] Check total matches, kills, deaths, KDR, averages and win rate.
- [ ] Verify zero-death KDR remains finite.
- [ ] Verify first-place and last-place counts.
- [ ] Confirm weekly boundaries use the configured league timezone.
- [ ] Confirm leaderboard tie-breakers are deterministic.
- [ ] Confirm weekly MVP score breakdown and formula version are stored.
- [ ] Confirm 7-day and 30-day graphs match verified rows.

## Controlled Correction

- [ ] Open a verified-match revision with a reason.
- [ ] Confirm previous and proposed snapshots are preserved.
- [ ] Reject one revision; official data remains unchanged.
- [ ] Approve one revision; affected statistics are recalculated.
- [ ] Confirm audit log includes actor, reason and before/after data.

## Extended V1

- [ ] Rating recalculation respects minimum matches.
- [ ] Dynamic title priority selects one current title and retains history.
- [ ] Achievement unlock is not duplicated.
- [ ] Rivalry comparison follows placement, kills, then draw.
- [ ] Challenge progress changes only from verified data.
- [ ] Hall of Fame keeps historical snapshots.
- [ ] Season overlap and second active season are rejected.
- [ ] Notifications show unread count and mark-read behavior.
- [ ] Public share pages expose no private user fields.
- [ ] AI fallback works with `AI_PROVIDER=disabled`.
- [ ] AI output never changes official data.
