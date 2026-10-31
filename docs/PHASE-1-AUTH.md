# Phase 1: Authentication and private user profiles

Status: implementation for review; not released. Google OAuth, email delivery, and hosted Supabase configuration require live verification. Phase 2/3 are not implemented.

## Architecture and scope

The owner approved static Cloudflare Pages + Supabase Auth PKCE + PostgreSQL RLS in this chat. No Cloudflare Worker, file storage, Drive integration, sharing, or paid service is introduced. Start point: main merge commit `67abe2d`. The active app remains root src/; the nested legacy copy and existing file tools/hero are untouched.

Supabase client SDK v2 handles access/refresh tokens and cross-tab session events in browser storage. This is a SPA design, not HttpOnly-cookie authentication. Browser storage is exposed to same-origin JavaScript and therefore to XSS; never inject untrusted HTML or add unreviewed scripts. Hosted Auth validates sessions; protected UI uses getUser(), and Postgres grants/RLS enforce authorization independently of UI state. HTTPS is required except localhost development. Sign out revokes the current session using local scope; it does not promise instant revocation of already-issued access JWTs or all other devices.

Auth routes: /auth/login, /auth/signup, /auth/forgot-password, /auth/reset-password, /auth/callback and /account. Existing homepage fragment links keep working. Cloudflare Pages' static SPA fallback serves index.html for these paths (do not add a top-level 404.html without deliberate routing changes).

Missing env configuration disables account actions with a message; all existing tools continue working for guests. Google sign-in requests only openid/email/profile identity scopes. There are no Drive permissions or offline-access requests. The Supabase SDK's session storage must be treated as sensitive; provider tokens must never be reused as Drive credentials in a later phase.

## Database migration

`supabase/migrations/202610310001_profiles.sql` is a single transaction, designed to run once through Supabase migrations or SQL Editor on the correct project. It creates:

- profiles(id, username, display_name, created_at, updated_at), linked by primary/foreign key to auth.users; account deletion cascades.
- An Auth insert trigger and existing-user backfill. User-supplied metadata never grants roles or reserves usernames.
- A case-canonical username check (3–24 ASCII letters/numbers/underscores, start with a letter), a reserved-name list, a database unique constraint, and an 80-character display-name limit.
- Private own-row SELECT/UPDATE RLS policies. Only username and display_name are client-writable; clients cannot insert/delete profiles or change identity/timestamps.
- A public exact-match `lookup_username(candidate)` function that returns **username only**. It cannot list profiles, reveal email/UUID/name/timestamps, reserve names, or authorize sharing. Public exact lookup permits checking whether a username exists; do not mistake this for an anti-enumeration guarantee. Rate limiting/recipient resolution belongs to the sharing architecture review.

Signup records a preferred username. Verification-enabled signup normally has no authenticated session, so the real username is claimed on the account page **after authentication**. If two users choose the same name, the database allows exactly one claim; the other user chooses another. This avoids permanently reserving names with unverified signup attempts. Changing a username frees the old name; later sharing must use stable user IDs with server authorization, not names as authorization.

Do not run an ad-hoc DROP rollback on a populated project: it would delete account profiles. Review any existing public.profiles schema first; this migration intentionally fails rather than overwriting an unrelated existing table.

## Setup — simple Gujarati, one step at a time

### 1. Free project

Supabase Dashboardમાં Free organizationમાં `filemate-dev` નામનું project બનાવો. Paid plan, card, upgrade કે billable add-on પસંદ ન કરો. Database password password managerમાં રાખો; chat/repositoryમાં મોકલશો નહીં. Project તૈયાર થાય ત્યારે જ આગળનું પગલું લો.

### 2. Migration

યોગ્ય development projectમાં SQL Editor ખોલો. `supabase/migrations/202610310001_profiles.sql`નું content review કરીને Run કરો. Existing profiles table હોય તો પહેલાં અટકો અને schema તપાસાવો. આ migration હજી કોઈ hosted project પર apply થયેલું નથી.

### 3. Browser public config

Project Connect / Settings → API Keysમાંથી Project URL અને **publishable** key મેળવો (legacy `anon` JWT પણ સ્વીકાર્ય છે). `.env.example`ને local `.env.local`માં copy કરીને બે values भरो. `service_role`, `sb_secret`, database password, personal access token કે Google client secret browser/env VITE_ variablesમાં ક્યારેય ન નાખો. `.env.local` commit ન કરો.

### 4. Supabase Auth URLs

Authentication → URL Configurationમાં Site URL તરીકે તમારું approved app origin રાખો. Redirect allowlistમાં exact paths ઉમેરો:

- http://localhost:5173/auth/callback
- http://localhost:5173/auth/callback?flow=recovery
- https://YOUR-APPROVED-PREVIEW.pages.dev/auth/callback
- https://YOUR-APPROVED-PREVIEW.pages.dev/auth/callback?flow=recovery

Actual local port/preview origin પ્રમાણે બદલો. Broad wildcard for every pages.dev project ન ઉમેરો. Production approval પછી જ production originની exact callback URLs ઉમેરો. PKCE links એ જ browser/deviceમાં ખોલો જ્યાંથી signup/reset શરૂ કર્યું હોય; overlapping flows જૂનો verifier બદલી શકે છે. Invalid/expired link હોય તો નવો link માગો.

### 5. Email/password

Authentication → Providers → Email enable કરો; Confirm email ચાલુ રાખો. Password policyમાં minimum 12 characters અને available rate limits સેટ કરો. Verification/reset emails માટે SMTP configure કરો. Supabaseના built-in senderથી ફક્ત project teamના pre-authorized addresses પર, હાલમાં 2 emails/hourના મર્યાદિત test થઈ શકે છે; public signup માટે તે તૈયાર sender નથી. Email confirmation બંધ કરીને આ મર્યાદા bypass ન કરો.

જો SMTP provider માટે paid plan/domain જરૂરી થાય, તો ખરીદી કરતાં પહેલાં મંજૂરી લો. ₹0 budgetમાં verified sender ધરાવતો free option ઉપલબ્ધ ન હોય તો public email signup release અટકાવી રાખો. Google loginનું independent testing થઈ શકે છે. SMTP credentials ફક્ત Supabase Dashboardમાં જ રાખો.

### 6. Google identity login

Google Cloud Console → Google Auth Platformમાં app બનાવો (billing અથવા paid API enable કરવાની જરૂર નથી). Branding/Audienceમાં appને testingમાં રાખીને તમારી test Google account ઉમેરો. Data Accessમાં ફક્ત openid, userinfo.email, userinfo.profile રાખો. Web OAuth client બનાવો; Authorized redirect URIમાં Supabase બતાવે તે exact `https://PROJECT_REF.supabase.co/auth/v1/callback` દાખલ કરો. Supabase Authentication → Providers → Googleમાં Client ID/Client secret દાખલ કરો; code અથવા VITE_ envમાં નહીં. OAuth verification/branding reviewની જરૂર actual consent configuration પર આધારિત રહેશે. Drive API/scopes અત્યારે enable ન કરો.

### 7. Preview only

Phase 1 code approval અને hosted migration પછી જ Cloudflare Pagesમાં **Preview** environment માટે બે public VITE_ variables ઉમેરો અને preview rebuild કરો. Vite આ values build સમયે bundle કરે છે; secret તરીકે label કરવાથી browserથી છુપાતી નથી. Production env/config હાલ ન બદલો. PRને mainમાં merge ન કરો.

### 8. Live verification before release

તમારા test accountsથી signup → email verify → username claim → logout → login → refresh → forgot/reset password ચકાસો. Google login success, denied consent, expired link અને બીજા browserમાં link ચકાસો. બે usersથી એક જ username claim કરો; એક જ જીતવો જોઈએ. Browser network requestથી બીજા userના profile ID પર SELECT/UPDATE અજમાવો: private row ન મળવી/બદલાવી ન જોઈએ. Own-row update અને public username-only lookup પણ ચકાસો. Credentials અથવા real user tokens test reportsમાં મૂકશો નહીં.

## Costs and limits

No subscription, hosted project, billing change, or SMTP purchase was made. As checked on 2026-10-31, Supabase Free lists 50,000 MAU, 500 MB database, 5 GB egress, two active projects, and inactivity pausing. These are limits, not an uptime or forever-free guarantee. No Supabase Storage is used. Review Dashboard usage before nearing limits; do not enable paid upgrades automatically. Public email delivery is a separate release dependency; zero-cost delivery cannot be guaranteed without an appropriate free sender.

Node.js 22 or newer is required by the added Supabase SDK. The current local runtime is Node 22.14.0; verify the preview build image uses a supported Node version before release. No production build settings were changed.

## Tests and honest limits

- `npm test`: Node validation/API contract tests plus PostgreSQL WASM (PGlite) migration/grant/RLS tests.
- PGlite tests use a minimal auth.users/auth.uid test harness. This exercises real PostgreSQL constraints and roles locally, not the hosted Supabase service. Competing claims are queued on PGlite's single connection, not a live multi-connection race benchmark.
- `npm run test:browser`: real Supabase JS SDK and React UI with mocked Auth/PostgREST HTTP responses. No real password or Google credentials are sent. It validates frontend request flows, error handling, protected screens, profile saving, recovery, and session persistence—not Google's consent server, SMTP delivery, or production Supabase configuration.
- `npm run test:regression`: existing guest PDF/image/text, themes, mobile and hero regression suite.
- `npm run build` and `node tests/check-modules.cjs`: production compilation.

Install Playwright for browser tests with `npm.cmd install --no-save --package-lock=false playwright@1.62.1` and Chrome installed. In this workspace the bundled Playwright is supplied via PLAYWRIGHT_MODULE. Test reports use synthetic users only. Existing Vite/esbuild development advisories and large-chunk warnings are inherited; no unrelated major upgrades are included.

Live signup/email confirmation, live Google OAuth, email delivery, hosted RLS, real-device/Safari testing, and public email sender readiness remain **unverified** until the owner completes setup and tests. Do not label Phase 1 production-ready or proceed to Phase 2 yet.

Sources: [Supabase PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow), [Auth user data](https://supabase.com/docs/guides/auth/managing-user-data), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Google setup](https://supabase.com/docs/guides/auth/social-sign-in/auth-google), [SMTP restrictions](https://supabase.com/docs/guides/auth/auth-smtp), [Free plan](https://supabase.com/pricing).

## Current verification result

Clean npm ci passed. Node/PostgreSQL tests: **19 passed**. Configured auth browser checks: **31 passed**. Unconfigured/mobile/guest-navigation checks: **6 passed**. Existing guest-tool regression checks: **26 passed**. Production build and 36-module TypeScript compilation passed. Production dependency audit found zero known advisories. Large main/Three.js chunk warnings remain. See audit/phase1-results.json and the browser/regression reports.

## Changed files

- src/auth/{client.js,api.js,validation.js,navigation.js,AuthProvider.jsx,AuthScreen.jsx}: account configuration, SDK wrapper, safe validation, route helpers, verified session context, and UI.
- src/App.jsx and src/main.tsx: account navigation/provider and auth routes; guest tool implementations and hero are unchanged.
- supabase/migrations/202610310001_profiles.sql: private profile table, constraints, triggers, grants, RLS and username-only lookup.
- .env.example, package.json, package-lock.json, README.md and this guide: public-only configuration, dependencies and reproducible setup.
- tests/auth/{validation.test.mjs,database.test.mjs,browser.cjs,unconfigured.cjs}: unit, database and UI tests.
- tests/check-modules.cjs and tests/zip-update.cjs: ESM-aware compile check and font-independent browser loading.
- audit/phase1-*: synthetic screenshots and actual verification reports.
