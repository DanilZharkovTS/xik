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
