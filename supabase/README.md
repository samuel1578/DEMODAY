# Supabase and Cloudflare deployment configuration

This directory contains timestamped SQL migrations under `supabase/migrations/`. The repository currently ignores that folder by request, so migration files are local-only and will not appear in normal Git status or commits. Treat every migration applied to the live database as immutable; create a new migration for each schema change. To version a migration in Git, the ignore rule must be changed or the file explicitly force-added.

## Provider environment variables

`.env.example` lists only Supabase and Cloudflare variable names, with blank values. Put real values from the provider dashboards in the ignored `.env.local` for local use and in the production host's secret/environment settings for deployment. Never commit real values.

### Supabase

- `NEXT_PUBLIC_SUPABASE_URL` — Project URL from Supabase Project Settings → API.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public/anon key; the only Supabase key intended for browser use and the key used by `pnpm supabase:check`.
- `APP_URL` — optional canonical origin for future email-link/OAuth callbacks. Direct email/password signup does not use it. If used, set it to the HTTPS production origin or `http://localhost:<port>` for local development; do not derive it from the request Host header.
- The Sprint 5 signup flow does not use a service-role key; do not add one for user registration or profile provisioning.

### Cloudflare R2

- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, and `R2_SECRET_ACCESS_KEY` — server-only S3-compatible R2 credentials. Scope the token to the public and private media buckets.
- `R2_BUCKET_NAME` — public-only media bucket.
- `R2_PRIVATE_BUCKET_NAME` — private bucket for under-18 athlete media and scout identity documents. Do not enable public access or attach a public domain.
- `R2_PUBLIC_CUSTOM_DOMAIN` — optional HTTPS origin for public delivery; this may be the bucket's `r2.dev` URL for a demo or a custom domain for production.

See [`CLOUDFLARE-R2-SETUP.md`](../CLOUDFLARE-R2-SETUP.md) for bucket setup and CORS details. Never expose the R2 access key or secret in a client bundle.

## Creating migrations

The Supabase CLI is a project dev dependency. Run it with `pnpm exec supabase`.

```powershell
pnpm exec supabase migration new add_profile_field
```

Edit and review each generated SQL file before applying it. Migrations are currently ignored by Git per project request; keep a safe local backup, and explicitly change the ignore rule or force-add a migration when it must be versioned. Never modify a migration already applied to the live database.

## Deploying the production auth flow

This workflow targets one production Supabase project; a separate staging project is not required. The project owner uses the Supabase Dashboard SQL Editor workflow.

1. Confirm the production project, back up the database, and inspect the live `public.profiles` schema and existing policies. The Sprint 5 SQL expects `profile_role`, `profile_status`, and `profiles(user_id, role, status, first_name, last_name)`. Do not rerun Sprint 3/4 SQL.
2. In Supabase Authentication → Providers → Email, turn **Confirm email** off to allow immediate password signup. Supabase then treats new signup emails as confirmed. Password signup goes directly to `/account/pending`; callback URL allowlisting and `APP_URL` are not required for this flow.
3. The project owner reports applying `20261026090200_sprint5_auth_profile_trigger.sql` through Dashboard → SQL Editor. The trigger creates an allowlisted pending base profile for new Auth users; it does not backfill existing users or create role-specific rows. The workspace has not independently verified the live trigger behavior.
4. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the production host. `APP_URL` is optional unless a separate email-link/OAuth callback flow is introduced. This auth flow requires no service-role key. `pnpm supabase:check -- --network` checks environment format and Auth health only; it does not verify SQL, RLS, or signup behavior.
5. If SQL is applied directly in the Dashboard, Supabase CLI migration history is not automatically reconciled. Do not run `db push` until migration history has been reviewed and reconciled. Keep provider secrets out of source control and chat.
6. Configure Cloudflare variables only when the Images integration is implemented and ready to deploy.

## Current access boundary

The foundation migration creates `profiles` with RLS enabled and no policies; Sprint 3 adds role-specific profiles, append-only self-consent, published-event reads, and narrowly scoped self-access. The Sprint 4 migrations add active-admin policies and guarded status RPCs, approved guardian-player links and delegated consent, private athlete details, opt-in scout discovery through an allowlisted view, event administration, and append-only audit logging. Direct profile lifecycle and scout-vetting status updates remain unavailable; administrators must use the RPCs, which require an active admin profile. Guardian access to private athlete details and delegated consent requires an approved link; pending requests expire after 30 days, while approved links remain active until revoked. Scout discovery requires active scout vetting, an approved/active player profile, and the player's latest `profile_discovery` consent to be granted. DOB, district, school, gender, jersey number, height, and weight are stored separately from scout-readable profile rows. Review the SQL before deployment; do not disable RLS or add permissive policies to make the prototype appear functional. The project owner reports applying Sprint 3/4 SQL through the Supabase Dashboard. A reported single `is_empty` result for assertion 40 does not establish that the entire 40-assertion Sprint 4 pgTAP suite passed; preserve that as an outstanding verification item. The project owner reports applying the Sprint 5 profile trigger SQL through the Dashboard; its live behavior has not been independently verified. The signup/sign-in UI and database-gated dashboards are implemented. Sprint 6 onboarding is implemented locally, but its SQL and remote behavior remain unverified. Phase 4 replaces the browser-only role dashboards with server-backed reads and adds administrator review actions; it needs no new SQL and no new environment values. Phase 5 adds the `profile_media` metadata table, owner-scoped R2 media access, guarded media review, and presigned private delivery.

## Sprint 5 authentication and route pattern

- For direct signup with no confirmation email, turn **Confirm email** off under Supabase Authentication → Providers → Email. Supabase implicitly confirms new signup emails when this setting is disabled. No callback allowlist or `APP_URL` is required for the password signup flow.
- The sign-up flow accepts only `player`, `guardian`, and `scout`; no public admin option exists. Passwords go only to Supabase Auth. Server-side validation repeats all role, name, email, and password checks. A successful signup establishes the session and redirects straight to `/account/pending`.
- The `20261026090200_sprint5_auth_profile_trigger.sql` migration installs an `auth.users` trigger that creates a pending `public.profiles` row. It applies only to newly created Auth users and does not create role-specific profile rows. The migration folder is ignored by request; preserve the file locally and do not rerun an applied migration.
- `GET /api/auth/session` returns only whether the request has a valid Supabase user, with private/no-store caching.
- `requireDashboardAccess()` guards dashboards using the confirmed Auth email (automatically confirmed for new signups when Confirm email is disabled), saved role/status, required role-profile row, and scout vetting status. Proxy refreshes cookies but does not authorize pages.
- New users remain pending: Sprint 5 does not create role-specific profile rows. Do not use client role selection, metadata after provisioning, hidden navigation, localStorage, or `getSession()` alone to make authorization decisions.
- Sprint 6 implements role-specific onboarding persistence, consent history, and under-18 guardian approval gating on the existing guardian-link/security foundation. Profile media and conversion of demo dashboard data remain later roadmap work.
- The check command validates required environment presence/format and optional Auth health only; it does not verify SQL, RLS, or signup behavior.

## Sprint 6 server-backed onboarding

The active onboarding route is `/account/onboarding`. It reads the saved `profiles.role` for the signed-in user, loads that role's RLS-protected profile rows, and submits through authenticated Server Actions. The actions call `auth.getUser()`, re-read the persisted role, validate form values server-side, and invoke role-specific database functions. Client-supplied role and identity fields are not used to choose the target profile. No action changes `profiles.status` or `scout_profiles.vetting_status`.

- `submit_player_onboarding` atomically saves public player fields and private DOB/demographic fields. Adults must give the required self-consents. Under-18 players do not self-record those consents; the server generates a one-time token, stores only its SHA-256 hash, and displays the raw invite URL once. The invite expires after 30 days.
- Guardian onboarding can claim the invitation after a guardian profile is saved. Claiming creates only a pending link. The player approves or rejects it through the existing RLS transition/audit rules. A guardian must also pass independent account review before delegated consent is accepted.
- `submit_scout_onboarding` saves the scout profile and typed interest rows, and appends the required safeguarding consents. Scout vetting remains an independent review decision.
- `/account/pending` reports onboarding completion, account status, scout vetting status, and the minor guardian gate. Dashboard access requires account review, a complete role profile, and (for scouts) approved vetting. Under-18 player access additionally requires the same approved guardian link and current guardian-attributed participation, media, safeguarding, and financial consents.
- Run `pnpm test:onboarding`, `pnpm exec tsc --noEmit --incremental false`, and `pnpm build` for local validation. These checks do not apply or verify SQL against PostgreSQL.

### Applying the Sprint 6 SQL

`supabase/migrations/20261026100000_sprint6_server_backed_onboarding.sql` was applied only partially by hand in the Dashboard: the `guardian_invites` table, `get_my_guardian_link_requests()`, and `player_guardian_approval_complete()` exist live, but `submit_player_onboarding`, `submit_scout_onboarding`, `submit_guardian_onboarding`, and `claim_guardian_invite` were never created, so every onboarding submission failed with PostgREST `PGRST202` (function not found). The missing objects are restored verbatim by `supabase/migrations/20261027150000_sprint6_backfill_onboarding_functions.sql`, which the project owner must apply through Supabase Dashboard → SQL Editor. Do not run Docker, `db push`, or CLI migrations for this sprint. Dashboard SQL execution does not reconcile Supabase CLI migration history. After application, verify the RPC signatures, grants, RLS behavior, consent history, guardian invite expiry/one-time claim, and status gates in a non-production account before relying on live onboarding.

## Phase 4 role dashboards and admin review

Phase 4 converts the role dashboards from browser-only demo state to server-backed reads and adds an administrator review surface. It requires **no new SQL migration and no new environment variables**: it reads through the existing Sprint 4 data contract with the existing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, so nothing new needs to be configured in the provider before it runs.

- `lib/supabase/dashboard-data.ts` composes the contract into per-role view models and is `server-only`. Authorization remains RLS and the admin RPCs; no client-supplied role or status is trusted.
- The athlete dashboard (`/player`) shows the saved athlete profile, private details, and the current decision per self-consent type. Under-18 athletes see guardian-approval state instead of self-consents, which are guardian-attributed.
- The scout dashboard (`/scout`) reads the allowlisted `scout_discoverable_players` view plus the scout's own typed interests and safeguarding consents. Discovery stays empty until account review and independent vetting are both approved.
- The guardian dashboard (`/guardian`) shows approved links, linked athlete safeguarding details, and delegated consent, gated on an approved link and an approved/active guardian account.
- `/admin/reviews` lists accounts through the active-admin RLS reads and changes status only through the guarded `admin_set_profile_status` and `admin_set_scout_vetting_status` RPCs. Every change is appended to `audit_logs`, which the same page displays as the shared cross-role trail.
- Each route segment adds `loading.tsx` and `error.tsx` for the empty, pending, loading, and error states. These dashboards are read-only apart from the guarded RPCs, so no new grants are required.

Validation was local only: `pnpm exec tsc --noEmit --incremental false`, `pnpm test:dashboard`, `pnpm test:onboarding`, and `pnpm build` (which reports `/player`, `/scout`, `/guardian`, and `/admin/reviews` as server-rendered on demand). No authenticated cross-role run against PostgreSQL was performed in the workspace.

## Phase 5 media metadata and private delivery

`supabase/migrations/20261027120000_sprint9_10_profile_media.sql` is applied to the live database (verified: the tables, constraints, and the `save_owner_media` RPC respond as written). It creates the media enums and `public.profile_media`, which stores **only** R2 object keys and delivery metadata; image bytes never enter Postgres. The legacy `cloudflare_image_id` column name remains for compatibility.

- RLS is enabled. Owners can read their own media, register their own media as `pending`, and retire it (`is_current`, `deleted_at`) at any time so a photo can always be withdrawn. Column-scoped grants keep image ID, visibility, signed-URL requirement, and review state outside owner writes.
- Active administrators can read all media and change review state only through the guarded `admin_set_media_status` RPC. Direct `status` updates are not granted.
- The schema enforces the delivery boundary: `visibility = 'public' or requires_signed_urls`, and `identity_document` media must be `private`. Private media is uploaded with `requireSignedURLs = true` and is only ever delivered through an HMAC-signed URL, so a public endpoint cannot leak it.
- Limits are enforced in SQL and in the server code: 10 MB maximum and JPEG/PNG/WebP only.
- Uploads go from the browser straight to Cloudflare using a single-use URL issued by the authenticated `POST /api/media/upload-url` route, so the API token never reaches the client and the app server never holds the bytes.
- The base64/browser storage photo path has been removed. Enabling uploads requires the Cloudflare values documented in [`CLOUDFLARE-IMAGES-SETUP.md`](../CLOUDFLARE-IMAGES-SETUP.md); until they are set, photo fields show a configuration notice and the route answers `503`.

Validation: `pnpm exec tsc --noEmit --incremental false`, `pnpm test:media`, `pnpm test:dashboard`, `pnpm test:onboarding`, and `pnpm build`, plus a live end-to-end run against the applied database and R2 buckets: browser-shaped upload to R2, `save_owner_media` save/replace, private-bucket 403 without a signature, signed GET success, retire, and object delete. The owner-scoped RPC rejects cross-user writes, malformed object keys, and role-inappropriate media types as designed.

## Sprint 11 events, live

`supabase/migrations/20261027170000_sprint11_event_images.sql` adds `events.image_object_key` (public R2 cover images) and a partial unique index enforcing a single homepage spotlight event. Apply it through Dashboard → SQL Editor. No new RPCs: event CRUD stays on the Sprint 4 admin RLS policies, and status changes are audited by the existing events audit trigger.

`supabase/seeds/events-2026-10-27.sql` seeds the original demo events as real `published` rows (fixed UUIDs, idempotent upserts; requires the sprint11 column). The cover image for the spotlight event was uploaded to the public R2 bucket at `events/e7e60000-0000-4000-8000-000000000001.jpg`.

- The public calendar (`/events`) and the homepage spotlight card read published events server-side through `lib/supabase/events-data.ts`; drafts never leave RLS.
- `/admin/events` is the admin manager (create, edit, status changes, spotlight, delete). It writes through the existing policies; deletes best-effort remove the R2 cover object.
- Event cover images upload straight to the public R2 bucket: `POST /api/media/upload-url` with `{ "kind": "event", "contentType", "byteSize" }`, admin-only, same presigned-PUT pattern as profile photos.
- The legacy browser-localStorage event editor was removed from the admin dashboard; it now points at the real manager.

Validation: `pnpm exec tsc --noEmit --incremental false`, `pnpm test:media`, `pnpm test:dashboard`, `pnpm test:onboarding`, and `pnpm build`. Live DB verification of the seeded rows and the admin manager flow is pending the owner applying the sprint11 migration and seed through the Dashboard.
