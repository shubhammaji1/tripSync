# Production setup and verification

Use Node 22.13+ and pnpm 8.15.9. Install with `pnpm install --frozen-lockfile`.

## Required deployment configuration

- Configure a real `DATABASE_URL` and a migration connection in `DIRECT_URL`. Back up the database, then run `pnpm db:migrate`. Committed migrations include TrailWatch, shared chat, trip coordinates, and private document metadata. Do not seed demo data in production.
- Configure Clerk's publishable key on the web app and its secret key on both web and API servers. The API also supports existing Supabase JWT sessions when explicitly configured. Never expose service-role or secret keys through `NEXT_PUBLIC_*` variables.
- Set `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL` and `WEB_URL` to the deployed HTTPS origins. Public Next.js variables are compiled into the bundle; rebuild after changing them. Configure trusted proxy handling only behind a controlled proxy.
- Create a **private** Supabase storage bucket named `trip-documents` (or set `DOCUMENTS_BUCKET`). Configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` on the API. Uploaded documents are limited to 5 MB PDF/JPEG/PNG/WEBP, verified by file signatures, and downloaded through short-lived signed URLs. PINs are verified on the server; direct browser reads of chat and document tables are revoked by migration 0003.
- Apply the Supabase RLS policies in `supabase/migrations` when browser access to other tables is enabled. Reapply the private collaboration revocations after older policies. The API database role must have the appropriate server-side table permissions; browser roles must not receive those permissions.
- Configure verified email delivery using Resend or SMTP. For queued invitation delivery, set `NOTIFICATIONS_USE_QUEUE=true`, configure Redis, and deploy `apps/worker` with the same Redis and email settings. Jobs retry five times with exponential backoff. Queued means accepted by Redis, not delivered. Automatic task/settlement reminders still require a scheduling producer; the worker can process those job types but does not invent schedules.
- Weather uses Open-Meteo and saved destination coordinates. Configure `OPEN_METEO_FORECAST_URL` and `OPEN_METEO_API_KEY` for a licensed production endpoint where required. Confirm the provider's current commercial terms and limits before launch. Maps use OpenStreetMap tiles; configure an appropriate production tile provider if traffic exceeds its usage policy.

## Behavior and limits

TrailWatch prefers the trip's selected coordinates, then attempts an unambiguous destination lookup. A missing or ambiguous location shows an unavailable state. Coordinates at zero are valid. Weather is location checked and timestamped; current weather does not predict future trip conditions. Alerts remain relevant after acknowledgment until they expire. Community reports are unverified. Route lines connect submitted coordinates and are schematic, not turn-by-turn navigation. Route coverage requires submitted route records; weather availability alone does not establish route safety.

Expenses and settlements use the trip currency. Participant shares must add up exactly in cents. Payments are manually confirmed ledger entries, not bank or UPI confirmations. Recording a payment reduces outstanding balances and rejects overpayments. UPI requires a supplied valid recipient ID and INR; no recipient ID is fabricated.

Chat and documents persist on the API. The offline travel packet contains only itinerary and emergency information, encrypted with a per-tab session key. It excludes payments, documents and live hazards. Offline writes are not queued. Signing out clears the packet. Receipts remain stored with their expense; move them to private object storage and add retention limits before supporting large-scale receipt uploads.

## Checks

```sh
pnpm lint
pnpm typecheck
pnpm --filter @tripsync/api run test --runInBand
pnpm build
node scripts/api-smoke.cjs
pnpm exec playwright install chromium
pnpm test:browser
pnpm audit --prod
```

The browser suite renders the real TrailWatch components with explicit test fixtures for Kyoto, Mumbai, Darjeeling, zero coordinates and missing location. It verifies route drawing, filters, report coordinates, keyboard dismissal and mobile overflow. It does not authenticate into a deployed account or inspect a user's private saved trips. Before launch, verify a real trip from each supported destination in the configured deployment, including document upload/download, invitation delivery, member permissions, payment persistence, sign-out/offline isolation and mobile map loading. Check `/api/v1/health` for database readiness and `/api/v1/health/live` for process liveness.

CI runs build, lint, type checks, database regressions and browser checks. Add infrastructure monitoring, database backups and a restore drill to the deployment.

Local verification on 2026-10-06: 29 backend regressions and 6 browser checks passed, including encrypted offline packet isolation. The production build, lint and type checks passed. The production dependency audit reported zero vulnerabilities. The real API startup probe returned 200 for liveness, 401 for unauthenticated trip access, and 503 for unavailable database readiness. A live Open-Meteo request for Darjeeling returned current weather and hourly visibility. These results do not substitute for testing the deployed database and account.

The existing deployment at `https://trip-sync-liard.vercel.app/` was also inspected. Its dashboard redirects an unauthenticated session to Clerk sign-in, which visibly reports **Development mode**. It still displays the earlier preloader and offline/automatic currency-conversion claims. Deploy the updated code and switch to production Clerk keys before launch. Saved trip data requires an authenticated session for verification.

Goa regression follow-up (2026-10-07): the supplied screenshot shows a Goa trip centered on Darjeeling, fallback weather, an unsupported normal-status claim, and low text contrast. The map now uses saved/resolved destination coordinates, empty route coverage stays unknown, and TrailWatch has an opaque dark background. Existing trips named `Goa, India` can resolve through a country-checked regional fallback when Open-Meteo's city search misses the Indian state. Successful lookups are cached, simultaneous same-destination requests share one lookup, and regional requests are serialized at one per second per API process. Configure `NOMINATIM_SEARCH_URL` to your production geocoder and enforce its quota across replicas. Public Nominatim's usage policy applies; it is not an unrestricted production geocoder.

Follow-up checks: 30 backend tests and 8 browser tests passed. Both API and web production builds passed, along with type checks and lint. A live regional lookup returned `Goa, India` at latitude 15.3004543, longitude 74.0855134. The Goa browser regression checks rendered map tile coordinates, loaded map imagery, empty-route status and report coordinates. Its weather values are explicit fixtures, not measurements for the user's saved trip.
