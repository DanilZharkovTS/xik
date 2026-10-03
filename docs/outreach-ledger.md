# Outreach ledger

A manual journal of outreach for moderators. It **sends nothing**: it records who contacted whom,
in which channel and when, so the team does not duplicate work, "do not contact" is respected, and
work can be counted per day, week, month and year. It replaces an external notebook.

## Roles and access

| Role | What they can do |
|---|---|
| `admin` | Everything: all products, all moderators' data, team and access management, reports, releasing "do not contact", permanent template delete. |
| `moderator` | Works only in products an admin granted. Sees only their own targets, history and report numbers. |
| `user` | A shop customer. No access to the journal (403). |

- The product of a request is decided by the server: the `X-Product-Id` header is accepted only if the
  user has an active membership (admins may enter any product). Unknown product 404, foreign product 403.
- Access is checked against the database on every request (session, account state, role, membership), so
  deactivation, a password reset, a role change or a revoked product apply to the very next request.
- Moderators cannot change their own e-mail or password, delete the account, or grant themselves anything.
  Admins create accounts and reset passwords (a reset signs out all sessions of that user).
- Revoking a product is a soft revoke (`revokedAt`); history and past reports stay. Targets of a former
  member stay with them until an admin transfers them.

## What is in the journal

- **Check** (`/outreach/check`): paste a Telegram username, e-mail, LinkedIn, Facebook or website link. The
  channel is auto-detected (or chosen manually), the value is normalized and the result is one of:
  *free*, *mine* (full history), *foreign* (owner name and date only), *do not contact* (visible to everyone).
- **Register first contact**: atomic (`INSERT ... ON CONFLICT DO NOTHING` in a transaction); the loser of a
  race sees the owner. One target can have several identifiers (Telegram, e-mail, site...).
- **Events**: repeat contact, reply, optional proof link and comment, optional template used (with its version).
- **Do not contact**: set by the owner or an admin, released only by an admin. It blocks repeat contact for
  everyone. The reason is visible to the owner and admins only.
- **Publications**: posts, ads, articles, links in an offer (Facebook, Instagram, Threads, TikTok, X, YouTube...)
  with a proof link, deduplicated by normalized URL, counted separately from personal contacts.
- **Templates**: per-product texts for copying (channel or universal), variables `{{name}}`,
  `{{product_name}}`, `{{product_link}}`, `{{manager_name}}`. Owner or admin edits; others duplicate. Every
  content change bumps a version; events remember the version used.
- **Reports**: day/week/month/year/custom (max 366 days), by channel, moderator and product, event-type
  filter, a dashboard with a chart and a table view. Admins also get an "All products" scope.
- **Team** (admin): create moderators, reset passwords, give and take products one by one, deactivate and
  reactivate, transfer targets (all or chosen) between moderators.
- **Audit**: access changes, password resets, do-not-contact changes, template deletions and target transfers
  are written to `AuditEvent` without secrets.

Normalization rules (`backend/src/modules/outreach/normalizers.ts`): Telegram `@name` / `t.me/name` /
`tg://resolve?domain=name` -> lowercase; e-mail lowercase (plus-addresses are not merged); LinkedIn and
Facebook drop tracking parameters, `www` and trailing slash; websites match by registrable domain
(`blog.company.com` = `company.com`), while platforms such as `github.com` or `medium.com` match by path and
`*.substack.com` by subdomain.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `REPORT_TIMEZONE` | `Europe/Kyiv` | IANA time zone for report day boundaries (`AT TIME ZONE`). An invalid name fails loudly. |
| `OUTREACH_RATE_LIMIT` | `30` | Requests per minute per user for check, register and add-identifier. |
| `LOGIN_RATE_LIMIT` | `10` | Failed sign-ins per e-mail per 5 minutes (successful ones do not count). |
| `TEST_DATABASE_URL` | `postgresql://postgres:1234@localhost:5432/xik_test` | Empty Postgres database used by `npm test`. |

Database columns hold UTC (`timestamp`); the API returns ISO 8601 with `Z`.

## Running and testing

```bash
# backend (from backend/)
npm run dev                      # API on :5001
npm run admin:create             # first admin, see the root README
npm test                         # Vitest + supertest on a REAL Postgres (TEST_DATABASE_URL)

# frontend (from frontend/)
npm run dev
npm run typecheck && npm run lint
```

`npm test` applies the migrations to `TEST_DATABASE_URL` first and truncates tables between tests, so point it at
a dedicated database, never at real data.

## Acceptance checklist

| Criterion | Where it is proven |
|---|---|
| A moderator in product A cannot see or change product B; a forged id returns 403 | `tests/security.test.ts` (matrix over every endpoint), `tests/outreach.test.ts` |
| A second moderator cannot take a registered identifier and sees owner and date | `tests/outreach.test.ts` (incl. 5-way race) |
| "Do not contact" is visible to all, blocks repeats, only an admin releases it | `tests/events.test.ts` (incl. row-lock test and race) |
| Report equals the event table for each period; admin sees a per-moderator breakdown | `tests/reports.test.ts` (DST and midnight boundaries) |
| A deactivated moderator cannot sign in and the open session ends | `tests/access.test.ts` |
| Products are added and removed one by one; revoked access fails on the next request; transfer keeps history and is audited | `tests/access.test.ts`, `tests/transfer.test.ts` |
| All automated tests pass on Postgres | `npm test` (374 tests) |
| Manual check on mobile (390px) and desktop | Checklist below |

Manual check (390px and 1280px, both themes), signed in as admin and as a moderator:

1. Admin: Team -> add a moderator (generated password), give two products, take one away, reset the password, deactivate and reactivate.
2. Moderator: switch product, Check -> register a contact, add another channel, repeat contact, reply, mark do not contact.
3. Second moderator: check the same identifier -> sees only owner and date; a do-not-contact target shows no actions.
4. Admin: release do not contact; transfer targets to another moderator.
5. Templates: create, copy with a recipient name, duplicate someone else's, edit, archive; pick a template when logging a contact.
6. Publications: add one, add the same link again -> duplicate message.
7. Reports: switch Day/Week/Month/Year/Custom, use the arrows, toggle event types, open the table view; as admin try "All products" and the moderator filter.
8. No horizontal scroll anywhere, all tap targets at least 44px, sheets close with Escape and return focus.

Automated checks already run for this: axe (WCAG 2 A/AA and best practices) found no violations on all journal screens in
both themes at both sizes, including open dialogs, and the production build (`next build`) passes.

## Products, agents and Stripe

There is one `Product` model for the database, the site and Stripe. A `kind` tag (`product` or `agent`) only decides
which block of the site shows it; services stay static in the frontend.

- **One-to-one link.** Every product has one Stripe product (`stripeProductId`) and one current Stripe price
  (`stripePriceId`), both unique. Create is Stripe-first; if the database write then fails, the new Stripe objects are
  deactivated. Changing the price creates a new Stripe price and deactivates the old one (existing subscribers keep it).
- **Price is always set.** `showPrice` only decides whether the product page shows it; otherwise the buyer sees it at checkout.
  Public responses never contain Stripe ids, and hide the price when `showPrice` is off.
- **Delete is archive.** `DELETE /products/:id` sets `archivedAt` and deactivates the Stripe product; `POST /products/:id/restore`
  brings it back. Archived products disappear from the site, checkout and the journal product list.
- **Repair.** `POST /products/:id/stripe-sync` creates or re-links missing Stripe objects.
- **Admin screen:** Dashboard -> Products (list, filters, create/edit sheet, Sync Stripe, Archive/Restore).

Loading the existing catalog (15 products and agents from `backend/prisma/seed/catalog.json`) into a database:

```bash
docker compose -f docker-compose.local.yml exec backend npm run products:import            # with STRIPE_SECRET_KEY
docker compose -f docker-compose.local.yml exec backend npm run products:import -- --no-stripe
```

The import is idempotent (matched by slug). Prices in the file are placeholders: set the real ones in Admin -> Products.
The Next.js server reads the catalog through `API_INTERNAL_URL` (`http://backend:5001` inside Docker) with no caching.

## Language (English / Ukrainian)

The workspace (dashboard, journal, reports, Team, Products, Users) and the sign-in pages are available in English and
Ukrainian. The switch (EN | УК) sits in the header and on the sign-in page; the choice is stored in the browser
(`xik-locale`), the first visit follows the browser language. Texts live in `frontend/src/shared/i18n/messages/*`
(English and Ukrainian side by side; the type checker fails the build if a key is missing in one language).
In Ukrainian, API errors are shown by error code from the same dictionary; unknown codes fall back to the server text.
The public site (home, product pages) and product content from the catalog are not translated.

## Known limitations and deliberately deferred

- **Suppression list and personal-data policy.** "Do not contact" works per product. The cross-product, hashed
  `suppression_list` (so a person removed on request is not approached again), a retention policy, deletion on
  request and an access log are not implemented. They are needed before the journal holds data for real people
  in production.
- **Row-level security** in Postgres was considered and not added; access is enforced in the application and
  covered by tests. Revisit if more services start reading the database directly.
- **Not built:** merging targets, importing existing usernames, screenshots as proof, a reply-rate metric,
  automatic checking of proof links, more than one link per event, UI translations (the UI is English).
- **Templates** keep the version number on events, not the old text of each version.
- **Same person in two products** is two independent targets; "do not contact" in one product does not block the other.
- **Migrations only add structures.** They were applied to a clean database and to the test database, not to a
  copy of production; do that rehearsal before deploying.
- **Dependencies.** `npm audit` reports advisories in packages that were already in the project (`next`,
  `prisma`, `qs` via `express`, `postcss`, `sharp`, `nanoid`); none in the packages added for the journal.
  Plan a separate, tested upgrade.
- Tests use a plain Postgres instance (`TEST_DATABASE_URL`); Testcontainers was not used because the build
  environment has no Docker daemon.
