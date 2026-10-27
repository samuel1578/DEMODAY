# Testing checklist — Phases 1–5

Use this checklist in a **staging/test environment** before launch. Record each item as Pass, Fail, or Blocked, with the date, tester, environment, and notes. Do not use real athlete identity documents or sensitive personal data during testing.

## Before testing

- [ ] Confirm the target Supabase project and deployment environment.
- [ ] Confirm which migrations are applied; do not rerun an already-applied migration. Back up the database before applying SQL changes.
- [ ] Confirm the required environment variables are set in the hosting provider without pasting their values into tickets or chat.
- [ ] For Phase 5, configure R2 CORS for the exact test-app origin. Confirm that the public bucket is public and the private bucket has no public access or public domain.
- [ ] Create separate test accounts for player, guardian, scout, and administrator roles. Use test email addresses and non-sensitive data.
- [ ] Verify the production build and automated tests:

  ```powershell
  pnpm exec tsc --noEmit --incremental false
  pnpm test:onboarding
  pnpm test:dashboard
  pnpm test:media
  pnpm build
  ```

- [ ] Confirm `.env.local` and all credentials are excluded from Git. Never include secret values in screenshots or evidence.

## Phase 1 — Supabase foundation and access controls

- [ ] Confirm the expected profile schema exists, including profile user ID, role, and status.
- [ ] Confirm Row Level Security (RLS) is enabled on protected tables.
- [ ] As an unauthenticated visitor, verify protected profile data cannot be read or changed.
- [ ] As an authenticated user, verify only permitted self-owned data can be read or changed.
- [ ] Attempt to access another test user's private/profile data; confirm the request is denied or returns no data.
- [ ] Confirm users cannot set their own account status, admin role, or scout vetting status.
- [ ] Confirm administrator-only actions reject a non-admin account.
- [ ] Review Supabase logs for unexpected permission errors during the tests.

## Phase 2 — Authentication and account lifecycle

- [ ] Sign up with valid details and each supported public role: player, guardian, and scout.
- [ ] Confirm a new account is created in the expected pending state and receives the expected onboarding route.
- [ ] Attempt signup with invalid email, missing fields, weak/invalid input, and unsupported role; confirm useful errors and no unauthorized account state.
- [ ] Sign in with valid credentials; confirm the authenticated session survives page navigation and refresh.
- [ ] Sign in with an incorrect password; confirm access is denied without exposing sensitive account details.
- [ ] Sign out; confirm protected pages and actions are no longer available.
- [ ] Open a protected route while signed out; confirm redirection/denial.
- [ ] Confirm a user cannot elevate their role by changing form data, URL parameters, browser storage, or client requests.
- [ ] If email confirmation is enabled in the target environment, verify the confirmation flow and unconfirmed-user restrictions. If disabled, verify the configured immediate-sign-in behavior.

## Phase 3 — Role profiles, consent, and safeguarding

- [ ] Complete player, guardian, and scout onboarding with valid data; confirm only the appropriate role fields are accepted.
- [ ] Submit missing, malformed, out-of-range, and unsupported values; confirm server validation rejects them.
- [ ] Confirm sensitive fields (such as date of birth and private athlete details) are not exposed in scout-readable profile data.
- [ ] Confirm consent choices are saved with the expected history and that changing a choice does not silently erase the previous record.
- [ ] Verify a minor athlete cannot bypass guardian approval by submitting self-consent.
- [ ] Verify an adult athlete follows the applicable self-consent flow.
- [ ] Create a guardian invitation/link; confirm the intended player can claim it and an unrelated account cannot.
- [ ] Confirm invitation expiry and one-time-use behavior; try reusing an expired or already-claimed invitation.
- [ ] Confirm guardian access to a player's private information is denied before approval and allowed only for the correctly linked guardian after approval.
- [ ] Confirm withdrawing/revoking approval prevents subsequent delegated access.
- [ ] Confirm an unapproved or incomplete player profile is not exposed as discoverable to scouts.
- [ ] Confirm scout discovery requires the applicable approval, vetting, and player discovery consent.

## Phase 4 — Server-backed dashboards and administration

- [ ] Sign in as each role and confirm the correct dashboard loads with that user's saved data.
- [ ] Confirm dashboard data is current after a page refresh and does not rely on stale browser-only demo state.
- [ ] Confirm player, guardian, and scout dashboards do not expose data belonging to unrelated accounts.
- [ ] Confirm a guardian dashboard only shows approved linked-player data and respects consent/access restrictions.
- [ ] Confirm scout results include only eligible, discoverable profiles and exclude private details.
- [ ] Open administrator review pages as a non-admin; confirm access is denied even if the URL is known.
- [ ] As an administrator, review a test account and verify allowed review decisions update the expected status.
- [ ] Attempt invalid or repeated review actions; confirm they fail safely and do not create inconsistent state.
- [ ] Confirm user-facing pages reflect review/status changes after revalidation or refresh.
- [ ] Check the browser console and server logs for runtime errors during role changes, empty states, and denied access.

## Phase 5 — R2 uploads, private delivery, and media records

- [ ] Confirm all R2 variables are configured server-side, including `R2_PRIVATE_BUCKET_NAME`; verify no R2 secret is exposed in browser bundles or network responses.
- [ ] Confirm the public bucket is used only for media approved for public delivery. Confirm the private bucket has no public route/domain.
- [ ] Confirm bucket CORS permits `PUT` only from the required application origins and accepts the signed `Content-Type` header.
- [ ] As an authorized user, upload JPEG, PNG, and WebP files up to 10 MB; confirm they upload directly to R2 and their object keys are recorded in `public.profile_media`.
- [ ] Try a file over 10 MB, an unsupported MIME type, an invalid media type for the role, and an unauthenticated upload request; confirm each is rejected.
- [ ] Confirm upload URLs expire after 30 minutes and are signed for the expected content type and byte length.
- [ ] Confirm an adult player's public profile photo is delivered through the configured public `r2.dev` route or custom domain.
- [ ] Confirm public profile photo display dimensions are constrained by the UI and do not require R2 image variants.
- [ ] Confirm under-18 athlete photos are uploaded to the private bucket and never receive a public URL.
- [ ] Confirm scout identity documents are uploaded to the private bucket and never receive a public URL.
- [ ] Confirm private previews use a one-hour presigned GET URL and that an expired URL no longer grants access.
- [ ] Verify a private object cannot be fetched through the public bucket/domain or by changing its key in the browser.
- [ ] Confirm a saved record contains the R2 object key (not file bytes or a delivery URL) and has the expected visibility, MIME type, byte size, and owner.
- [ ] Confirm a declared type/size mismatch or failed upload is not saved as valid media.
- [ ] Replace a current image; confirm the new object is saved and the previous row/object is retired/deleted as intended.
- [ ] Remove media; confirm the row is retired and the corresponding object is deleted from the correct bucket.
- [ ] Confirm access to another user's media key or media record is denied.
- [ ] Recheck R2 and Supabase logs; confirm no private URLs, identity documents, or credentials are logged.

## Release sign-off

- [ ] All required checks above are Pass, or remaining failures are documented and accepted by the project owner.
- [ ] Database/RLS behavior has been tested against the target Supabase environment, not only inferred from local code or a successful build.
- [ ] R2 public/private behavior has been verified with real test uploads in the target Cloudflare account.
- [ ] No unresolved high-severity safeguarding, authorization, or data exposure issue remains.
- [ ] Record the deployment commit, environment, test date, tester, migration state, and any known limitations.

## Current validation boundary

Automated media, onboarding, and dashboard tests plus TypeScript/build checks validate local application behavior. They do **not** by themselves verify live Supabase migration/RLS behavior, authenticated cross-role access, R2 bucket configuration, browser CORS, or actual upload and presigned delivery. Complete the corresponding manual checks above before treating those integrations as production-verified.
