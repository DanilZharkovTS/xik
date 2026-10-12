# XIK verification policy

Authority: [root AGENTS.md](../AGENTS.md). This governs development verification
cost, not runtime behavior. Focused checks during iteration and full checks at
meaningful checkpoints are complementary; necessary correctness evidence is
never optional to save time.

## Repository profile and prerequisites

Three TypeScript applications with separate lockfiles (no root npm workspace):
`backend` is Express 5 / Prisma 7; `frontend` is Next.js 16 / React 19 with Axios
and Zustand; `notification_service` is Express / Resend. Docker uses Node 24 and
PostgreSQL 16. Use Node 24 and `npm ci` within each changed component when its
lockfile/dependencies need installation; do not reinstall for every edit.

Backend REST routes use Zod, JWT sessions, database-derived admin/moderator/user
roles, and product membership (`X-Product-Id`). Product membership is an
application authorization boundary, not PostgreSQL RLS or a separate tenant
platform. Stripe webhooks govern paid library access; internal emails require
`service_token`; subscription-service routes use `SUBSCRIPTION_SERVICE_KEY`.
Local media files are served under `/media`. SQL migrations
include unique/partial indexes. No queue worker, native mobile app, Go race
runner, OpenAPI validator, backend lint script, notification test runner, or
standalone workflow/instruction validator exists in this checkout.

Backend Vitest uses Supertest and a real disposable PostgreSQL database.
`tests/global-setup.ts` runs migration deploy even for a selected unit file;
`tests/helpers.ts` truncates application tables. Explicitly supply
`TEST_DATABASE_URL` to every test command. Generate Prisma before checking/building
backend code: `npx prisma generate --config prisma7.config.ts` (backend cwd).
Do not replace PostgreSQL tests with SQLite. Tests within a process are serial;
independent processes must use distinct databases. Timing/race and image tests
can vary with load; mocks avoid paid provider dependencies.

Frontend Playwright has one Chromium project, including responsive browser
coverage and Axe accessibility. Install its browser when absent with
`npx playwright install chromium` (frontend cwd). Default `npm test` builds and
starts a production server at `127.0.0.1:3100`. `PLAYWRIGHT_BASE_URL` skips that
build/server: use it for focused iteration against a known compatible server;
record whether the server is development or production. Full checkpoint evidence
requires the intended production build, not a stale reused server.

Catalog browser tests require a running API with
`backend/prisma/seed/catalog.json` imported. On a separate qualification database,
run `DATABASE_URL="$QUALIFICATION_DATABASE_URL" npm run products:import -- --no-stripe`
from backend, after migration deploy. Configure API `FRONTEND_URL`, frontend
`NEXT_PUBLIC_API_URL` (build time), and `API_INTERNAL_URL` for that stack. Supply
dummy Stripe credentials and mock notification delivery. Do not import into a
working database solely to satisfy tests. Run destructive backend tests separately
from the catalog-serving qualification database.

## Verification inventory

Commands below run from the named component unless marked **root**. Cost is
relative, not a runtime guarantee. There are no per-file typecheck scripts;
component typechecks are the smallest supported TypeScript scope.

| Mechanism | Exact command | Scope / cost | Dependencies and use |
|---|---|---|---|
| Backend owner tests | `TEST_DATABASE_URL="$TEST_DATABASE_URL" npm test -- tests/reports.test.ts` | Selected module/API/DB, medium | Disposable migrated PG; substitute the actual owner file |
| Targeted scenario | `TEST_DATABASE_URL="$TEST_DATABASE_URL" npm test -- tests/audit-fixes.test.ts -t 'concurrent refresh'` | Single regression/race, medium startup | PG; filter must match and execute tests, zero matches is not PASS |
| Backend full | `TEST_DATABASE_URL="$TEST_DATABASE_URL" npm test` | All `tests/**/*.test.ts`, expensive | PG; includes normalizers, image handling, API security and concurrency |
| Backend types / build | `npm run typecheck` / `npm run build` | Component static analysis / compiled output, fast–medium | Installed dependencies and generated Prisma |
| Prisma validation | `npx prisma validate --config prisma7.config.ts` | Schema, fast | Set disposable `DATABASE_URL`; SQL compatibility still needs real PG |
| Migration apply/status | `npx prisma migrate deploy --config prisma7.config.ts` / `npx prisma migrate status --config prisma7.config.ts` | Fresh/upgrade DB, medium | Explicit disposable `DATABASE_URL`; deploy does not test data preservation |
| Frontend types | `npm run typecheck` | Component, medium | Tests excluded by tsconfig; Playwright must validate tests separately |
| Frontend lint | `npm run lint` or `npx eslint src/shared/api/axios.ts` | All / affected file, fast–medium | Use real changed paths for focused lint |
| Frontend production | `npm run build` | Next routes, server/client boundaries, expensive | Node 24, build config and any API reads during build |
| Browser scenario | `npm test -- tests/e2e/session-lifecycle.spec.ts` | Selected file, medium with existing server | Chromium; without base URL includes expensive build |
| E2E / Axe | `npm run test:e2e` / `npm run test:a11y` | Browser behavior / accessibility, expensive | Production frontend and seeded API where required |
| Frontend full | `npm test` | All E2E and Axe, expensive | Includes both above: do not also run them redundantly |
| Notifications types / build | `npm run typecheck` / `npm run build` | Service static / output, fast–medium | No automated service integration suite exists |
| Production images (**root**) | `docker build --target prod -t xik-backend:verify ./backend`; corresponding commands with `xik-frontend:verify ./frontend` and `xik-notifications:verify ./notification_service` | Runtime packaging, expensive | Docker; frontend build args must match intended domains |
| Frontend release audit | `npm audit --omit=dev` | Dependency advisories, network / medium | Existing release check; review actual findings, never force a downgrade |
| Patch hygiene (**root**) | `git diff --check` | All changed text, fast | Every task; does not prove runtime correctness |

Normalizers and storage tests are narrower than API suites but still inherit PG
setup. API tests are the available contract checks; no OpenAPI gate is implied.
Existing full runs are historical evidence, not fixed test-count requirements.

## Change → verification matrix

Owner paths below are under `backend/tests` or `frontend/tests`. Add missing
behavioral coverage when existing tests do not exercise the change.

| Change area | Smallest meaningful iteration | Widen when | Checkpoint coverage |
|---|---|---|---|
| Isolated backend module | Owner `.test.ts`, backend types when TS changes | Shared middleware, DTO, error behavior or repositories change | Backend full + types/build |
| Sessions, accounts, roles, membership | `access.test.ts`, `account.test.ts`, affected cases in `security.test.ts` / `audit-fixes.test.ts` | Session revocation, credential handling, admin protection or product isolation changes | Backend full; browser `session-lifecycle.spec.ts`; frontend types if client touched |
| Outreach normalization/targets/events/transfer/templates | Respective `normalizers`, `outreach`, `events`, `transfer`, `templates` tests; security cases for permissions | Shared locks, ownership, identifier uniqueness or history changes | Backend full; affected journal screens manually as admin/moderator |
| Reports | `reports.test.ts`, invalid-date regression in `audit-fixes.test.ts` | Event accounting, SQL ranges, timezone/DST or cross-product scope changes | Backend full; report UI if response changed |
| Products/catalog/Stripe | `products.test.ts`; relevant price/currency cases in `audit-fixes.test.ts` | Public fields, archive/purchase eligibility, pricing or revalidation changes | Backend full; catalog browser suites and frontend build |
| Billing/library/emails | `audit-fixes.test.ts -t 'Stripe payment lifecycle'`, owner product tests as needed; notifications types/build if touched | Paid access, duplicate/out-of-order delivery, cancellation, signatures or service auth changes | Backend full + session browser checks; local notification boundary smoke with mocked provider |
| Blog/media | `blog.test.ts`, `blog-video.test.ts`, `storage.test.ts` as affected | Upload validation, paths/public URLs, schema or publication visibility changes | Backend full; frontend build and affected public/editor smoke |
| Frontend component/theme/motion/navigation | Affected Playwright file, file lint; component types for TS changes | Shared layout/auth/API/store, focus, reduced motion or content parity changes | Frontend full + lint/types/build; manual affected authenticated screens |
| Shared API/Zod/DTO | Producer API tests + affected consumer browser checks, both component types | Consumers/permissions/status codes span modules | Backend and frontend full + builds |
| Prisma schema/SQL/persistence | Migration procedure below + dependent owner tests | Constraints, data deletion, shared schema/fixtures or permission state changes | Backend full + fresh and populated upgrade evidence |
| Docker/dependencies/configuration | Affected types/build/image + startup/HTTP smoke | Cross-service URLs, secrets, cookie settings, DB or lockfile affect multiple apps | Relevant full suites; all images for stack-wide deployment changes |
| Test-only | Changed tests + owner suite | `helpers.ts`, `env.ts`, global setup or browser support fixtures change | All dependent suites, not unrelated apps |
| Docs/instructions only | Read policy, validate local links/commands, `git diff --check` | Executable/generated contracts or scripts are embedded/changed | No application full regression for ordinary prose |

Security checks must exercise allowed AND denied roles, inactive accounts,
revoked membership/sessions, foreign ownership, safe DTOs and audit records as
applicable. Never reduce security evidence merely to save runtime.
For webhook signatures, subscription-service credentials or notification service
auth, add focused allowed/denied boundary tests when existing suites do not cover
the affected path; typechecking and mocked billing service tests alone do not
prove HTTP authentication. Include tampered/missing credentials without exposing
secrets in logs.

Concurrency changes require affected real-PG scenarios, not a generic race flag:
`outreach.test.ts` covers first-contact contention; `events.test.ts` covers
status/repeat and duplicate publications; `transfer.test.ts` covers ownership;
`templates.test.ts` covers version conflicts; `audit-fixes.test.ts` covers admin
demotion, refresh consumption/rollback, price/currency edits, identifier transfer
and duplicate billing events. Select by actual test name with `-t` during debugging,
then run the complete owner suites at completion. Locks/transactions/idempotency
that cross modules require those modules together and backend full at checkpoint.

## Migration procedure

1. Generate Prisma and validate schema. Inspect SQL, constraints, partial indexes,
   backfills and application reads/writes; never mutate an already-applied migration
   to hide drift.
2. Fresh disposable PG: from backend run
   `DATABASE_URL="$FRESH_DATABASE_URL" npx prisma migrate deploy --config prisma7.config.ts`,
   then the same command with `migrate status`. Run dependent tests with its URL as
   `TEST_DATABASE_URL` to prove application compatibility and constraints.
3. Separate upgrade PG: populate representative data under the previous committed
   schema/application, then apply new migrations using
   `DATABASE_URL="$UPGRADE_DATABASE_URL" npx prisma migrate deploy --config prisma7.config.ts`
   and check status, preserved data, backfills and invariant constraints BEFORE
   destructive test suites truncate it. Record actual assertions, not just deploy exit.
4. Run backend full with a disposable test URL and types/build against the new client.
   Include old/new application compatibility when rolling deployment is intended.

No down-migration/automatic rollback suite is provided. For destructive migrations,
validate a backup/restore or forward-repair plan on disposable data; do not claim
rollback support or production upgrade safety from a clean database run alone.
There are no tenant/RLS checks beyond the application product-access suites.

## Checkpoints and ordered full baseline

Escalate at completion of a major feature/phase, acceptance or verified-baseline
milestone, material shared contract/security/persistence changes, or focused
failures revealing wider impact. Ordinary isolated commits use their owner checks;
not every commit needs all applications. Merge/release preserves mandatory gates.
A repository-wide checkpoint uses this order (do not run while changing source):

1. Record revision/tree, Node version, relevant env and dependency changes; install
   missing/changed lockfile dependencies. Prepare isolated PG and seeded browser API.
2. Backend: Prisma generate; migration fresh/upgrade procedure when migrations changed;
   `TEST_DATABASE_URL="$TEST_DATABASE_URL" npm test`; `npm run typecheck`; `npm run build`.
   Full tests already include relevant concurrency/security scenarios, so no duplicate
   race pass unless diagnosing a concrete intermittent risk.
3. Notifications: `npm run typecheck`; `npm run build`. If its boundary changed,
   smoke-test missing/wrong service token and the modified route with local mocked
   Resend; report the absent permanent notification test suite as a coverage gap.
4. Frontend: `npm run lint`; `npm run typecheck`; `npm run build`; `npm test` against
   that production build via `PLAYWRIGHT_BASE_URL`, or let default Playwright own
   the build instead of building twice. Confirm the reused server is this revision.
   `npm test` includes Axe and responsive browser tests, not native mobile tests.
5. Root `git diff --check`. For Docker/package/deployment changes also build affected
   prod images and smoke-test startup, migrations and HTTP in disposable containers.
6. Release: frontend `npm audit --omit=dev`, review findings, then follow
   [production release checklist](../frontend/docs/production-release-checklist.md).
   HTTPS, real cookies, live provider configuration, indexing and field performance
   remain deployment checks; local mocks cannot establish them.

Do not label a full baseline PASS if required tests skipped, prerequisites were
missing, or checks were blocked. Report those gaps and their acceptance impact.

## Evidence, debugging and environment ownership

Reuse a previously green subsystem baseline only if behavior, dependencies and
relevant configuration are unchanged and no new evidence suggests broader impact.
Record revision/date/scope and distinguish **Previous verified baseline** from
**Checks actually run in this task**. A previous PASS is never a new execution.

On failure inspect the smallest failing output, diagnose, fix and rerun that test.
Widen only when impact warrants it. Log successes compactly: command, PASS/FAIL,
executed counts, meaningful skips and useful duration. Do not read every successful
log or generate a long report for a small change. Test selection must execute
matching tests. Do not delete permanent regressions because they are expensive.

Iteration report: status, change/root cause, checks actually run, remaining risk,
next step (brief; omit empty sections). Checkpoint report: scope, important
invariants, relevant matrix/results, gaps and release/acceptance readiness.

Stripe SDK and notification fetch are mocked in backend product/billing tests;
blog/storage tests use local/fake storage. This verifies local behavior, not live
Stripe/Resend integration. Live or paid calls require explicit authorization and
insufficient offline evidence. Do not repeat them to reproduce historical results.

MAIN is the existing local Compose stack (`xik-*`, ports 3000/5001/3002/5433), with
persistent working data. TEST is disposable PG used for truncating Vitest runs.
QUALIFICATION is an independently seeded stack serving production browser tests.
TEMPORARY belongs to the current task: use purpose-labelled `xik-verify-*` names,
record ports/URLs/owner, and clean only resources that task created when finished.
Before commands, identify the DB/server; never stop/delete another task's or MAIN
resources. This policy setup itself creates/stops/deletes no environments.

## CI and existing guidance

`frontend/.github/workflows/ci.yml` describes npm install/lint/build on Node 22,
without frontend working-directory configuration. It is nested outside the root
`.github/workflows` GitHub discovery location and differs from the current Node 24
engine. Treat CI activation/alignment as a known follow-up, not evidence of an
active repository-wide gate. Preserve its intended checks; this local policy does
not weaken CI or authorize workflow edits/deployment.

Frontend Next.js agent rules and `.ai` architecture/accessibility conventions are
more specific and retained. QA/performance documents are historical measurements,
not new runs or extra automatic iteration gates. Frontend release checks remain
release requirements; this document alone defines repository-wide full regression.
