# Fix: "Save Profile" fails — sprint6 onboarding RPCs missing on live DB

## Root cause (confirmed by live probes)
- `submitOnboardingAction` passes validation, then `supabase.rpc('submit_player_onboarding')` (`app/actions/onboarding.ts:59`) errors → generic message at `:88`.
- Live anon-oracle probes: `submit_player_onboarding`, `submit_scout_onboarding`, `submit_guardian_onboarding`, `claim_guardian_invite` all return **404 PGRST202 (function does not exist)**. Meanwhile `guardian_invites`, `get_my_guardian_link_requests()`, `player_guardian_approval_complete()` return 401 (exist, correctly ungranted to anon).
- Sprint6 migration (`supabase/migrations/20261026100000_sprint6_server_backed_onboarding.sql`) was applied only partially by hand in the Dashboard: the table + approval helpers went in, the four submit/claim functions did not.
- Photo pipeline is unaffected (sprint10 `save_owner_media` is live and verified). Same root cause also breaks scout onboarding, guardian onboarding, and guardian invite claiming (`app/actions/onboarding.ts:179`).

## Changes

### 1. New migration: `supabase/migrations/20261027150000_sprint6_backfill_onboarding_functions.sql`
Contents = sprint6 file **minus lines 1–22** (guardian_invites table/index/RLS/revoke that already exist), i.e. verbatim:
- `private.claim_guardian_invite(text, uuid)` (sprint6:25–79)
- `public.submit_player_onboarding(...)` (81–264)
- `public.submit_scout_onboarding(...)` (266–392)
- `public.submit_guardian_onboarding(...)` (394–457)
- `public.claim_guardian_invite(text)` (459–476)
- `public.get_my_guardian_link_requests()` (479–510) — create-or-replace refresh (already exists; guarantees canonical definition)
- `public.player_guardian_approval_complete()` (514–568) — same refresh
- All revoke/grant statements (570–599), execute granted to `authenticated` only

Header comment: backfill of partially-applied sprint6, applied via Dashboard per `supabase/README.md`.

### 2. Apply via Supabase Dashboard (user step)
Paste the backfill file into Dashboard → SQL Editor → run. All statements are idempotent (`create or replace`), so re-running after a mid-file failure is safe. Do **not** use `supabase db push`/Docker (repo convention).

### 3. Minimal error logging in actions
`app/actions/onboarding.ts` (all four RPC call sites) and `app/actions/media.ts` (save + discard paths): on RPC error, `console.error('[onboarding] <fn> failed', error.code, error.message)` — code + static message only (PGRST202, raise strings, constraint names). **No** athlete data, DOB, tokens, or URLs (security scan rules preserved). This bug would then be diagnosable straight from the dev-server console.

### 4. `supabase/README.md`
Update the sprint6 note: partially applied manually; fully applied via backfill migration `20261027150000` on 2026-10-27.

## Verification
1. Re-run anon probes: the four functions must flip from 404 to 401/42501 (exist, no anon grant).
2. Retry Save Profile in browser → "Profile submitted"; photo stays attached.
3. Throwaway test accounts, end-to-end:
   - adult player: submit with 4 consents → `/player` dashboard; re-submit → still succeeds (consents are append-only, profile rows upsert).
   - minor player: submit → guardian invite URL shown; guardian claims it → link/approval flow.
   - scout: submit → scout dashboard.
4. `pnpm exec tsc --noEmit --incremental false`, `pnpm test:onboarding`, `pnpm test:dashboard`, `pnpm build`.

## Out of scope
- No logic changes to sprint6 function bodies; applied verbatim.
- R2 CORS restrictions (only `http://localhost:3000` and `https://demodayy.vercel.app` allowed) — documented earlier, unrelated to this failure.

## Risks
- Create-or-replace on the two existing functions is an idempotent refresh to canonical sprint6 content (removes hand-edit drift).
- Grants stay locked down: anon/public revoked, authenticated-only execute — confirmed by post-apply probes.
