# xik_backend

*Cmd to start an app*
**npm run dev**

*Cmd to migrate changes to prisma*
**npx prisma migrate dev --name here goes name**

*Cmd to migrate changes from another developer*
**npx prisma migrate dev**
## Moderator access (outreach ledger, stage 1)

- Roles: `admin` (global), `moderator` (works only in products granted to them), `user` (shop customer, no access to the ledger).
- First admin: `ADMIN_EMAIL=... ADMIN_NAME=... ADMIN_PASSWORD=... npm run admin:create`. If the user already exists, they are promoted to admin and the password is left unchanged.
- Admins manage moderators under `/api/team` (create, reset password, deactivate/activate, grant/revoke products). Every action is written to `AuditEvent` without secrets.
- `verifyAccess` checks the session and the account in the DB on every request and takes the role from the DB, so deactivation, password reset and role changes apply immediately.
- Product-scoped routes use `requireProduct` with the `X-Product-Id` header: unknown product 404, no active membership 403. `GET /api/me/products` lists the products for the switcher.

### Tests

Tests run against a real Postgres (not SQLite). Point `TEST_DATABASE_URL` at an empty database
(default: `postgresql://postgres:1234@localhost:5432/xik_test`); migrations are applied automatically.

```bash
npm test
```

## Outreach ledger: check and first contact (stage 2)

All routes live under `/api/outreach`, need a token and the `X-Product-Id` header (see `requireProduct`).

- `POST /check` `{ value, channel? }`: recognizes the channel, normalizes the value and returns `free`, `mine`, `foreign` or `do_not_contact`. A foreign target exposes only the owner name and the first-contact date; history and identifiers are for the owner and admins.
- `POST /targets`: registers the first contact atomically (`INSERT ... ON CONFLICT DO NOTHING` in a transaction). The loser of a race gets `409 ALREADY_REGISTERED` with the owner.
- `POST /targets/:id/identifiers`: adds another channel to your own target.
- `GET /targets`, `GET /targets/:id`: moderators see only their targets, admins all.
- Check, register and add-identifier share a per-user limit of 30 requests per minute (`OUTREACH_RATE_LIMIT`).

Normalization lives in `src/modules/outreach/normalizers.ts` (one function per channel, table-driven tests in `tests/normalizers.test.ts`). Websites match by registrable domain (`blog.company.com` is `company.com`); platforms like `github.com` or `medium.com` match by path, and `*.substack.com` by subdomain.

## Outreach ledger: events, do not contact, publications (stage 3)

- `POST /targets/:id/events` `{ type: 'repeat' | 'reply', channel?, url?, comment?, occurredAt? }`: a repeat moves `lastContactedAt` forward (never back); a reply does not. Dates cannot be in the future.
- `POST /targets/:id/do-not-contact` (owner or admin) and `POST /targets/:id/release` (admin only). Status changes lock the target row (`SELECT ... FOR UPDATE`), write a `status` event into the history and an `AuditEvent`. A repeat to a `do_not_contact` target is rejected with `409 DO_NOT_CONTACT`; a reply can still be logged.
- Target responses carry a server-computed `permissions` object (`canRepeat`, `canReply`, `canAddIdentifier`, `canMarkDoNotContact`, `canRelease`) and `isMine`, so the UI never guesses rights from the role.
- `POST /publications` `{ channel, kind: post | ad | article | link_in_offer, url, comment?, occurredAt? }` records a publication without a target. Duplicates are rejected by a partial unique index on the normalized URL (tracking params, `www.`, hash and trailing slash are ignored; path case is kept). `GET /publications`: moderators see their own, admins all.

## Outreach ledger: templates (stage 4)

Product-scoped text templates for copying (`/api/outreach/templates`).

- A template has a channel (a ledger channel or `any`), a title, an optional subject (email and `any` only), a body and a `version`. Allowed variables: `{{name}}`, `{{product_name}}`, `{{product_link}}`, `{{manager_name}}`; anything else is rejected so typos never reach a recipient.
- Rights (variant A): everyone in the product sees and copies active templates; only the owner or an admin edits, archives (soft delete) or restores; others duplicate a template and edit the copy. Only an admin can delete permanently, and only if no journal event used it (`409 TEMPLATE_IN_USE`, archive instead). Archived templates are visible to the owner and admins only.
- Every content change bumps `version`; `PATCH` needs `expectedVersion` (`409 STALE_VERSION` returns the latest template).
- Events (`POST /targets`, `POST /targets/:id/events`) accept an optional `templateId`; the server stores the template and its current version on the event. Only the version number is kept, not the old text.
- Login and refresh responses now include the user's `name` (used for `{{manager_name}}`).

## Reports and target transfer (stage 5)

**Reports.** `GET /api/outreach/reports` (product-scoped) and `GET /api/reports` (admin only, all products or one via `productId`).

- Query: `period` (`day|week|month|year|custom`), `date` (anchor day, default today), `from`/`to` for `custom`, `types` (`first,repeat,reply,publication`), `userId` (admins only; moderators always see only their own events).
- Day boundaries use `REPORT_TIMEZONE` (default `Europe/Kyiv`) via `AT TIME ZONE`, so a day with a DST change is 23/25 hours. Weeks start on Monday. A custom range is limited to 366 days. Up to 62 days the series is per day, longer it is per month; empty buckets are zero-filled.
- Response: `totals` (`contacts` = first + repeat; replies and publications are counted separately), `series`, `byChannel`, plus `byModerator` for admins and `byProduct` for the all-products view. Internal `status` events are never counted.
- `occurredAt` columns are `timestamp` holding UTC; clients get ISO 8601 with `Z`.

**Transfer.** `POST /api/team/transfer-targets { productId, fromUserId, toUserId, targetIds? }` (admin only). The recipient must be an active admin or have an active membership in the product. Only `ownerUserId` changes; events are kept and a `status` note is appended to each target's history. One `AuditEvent` records who, from whom, to whom and how many. Rows are locked with `SELECT ... FOR UPDATE`, so concurrent transfers or events cannot interleave. `GET /api/team/targets?productId&ownerId` lists a user's targets (targets of a former member stay with them until transferred).
