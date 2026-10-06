# XIK development verification

This file owns repository-wide AI verification policy. Read
[docs/verification-policy.md](docs/verification-policy.md) for commands, the
change matrix, environment prerequisites, and checkpoint order. Subsystem
instructions remain applicable; `frontend/AGENTS.md` contains the Next.js rules.

- Iterate with affected tests → fix → affected tests. Choose scope by impact,
  not file count. Do not run full regression after every small edit or commit.
- Widen coverage for sessions/roles/product membership, payments and replay,
  shared API/persistence, migrations, locking, deletion, and deployment changes.
  Run the relevant database concurrency scenarios when their guarantees change.
- At a meaningful checkpoint use the full baseline in the linked policy;
  preserve existing merge/release gates. Do not remove tests to reduce cost.
- Backend tests migrate and truncate their PostgreSQL database. Always set an
  explicit disposable `TEST_DATABASE_URL`; never use the working database.
  Never run two test processes against the same database concurrently.
- Use local provider mocks by default. Live Stripe/Resend calls require explicit
  authorization and an evidence gap that offline verification cannot close.
- Reuse green evidence only for unchanged behavior, dependencies, and relevant
  configuration. Label previous baselines separately from checks run now.
- Inspect the smallest failure output first. Report command, result, counts,
  skips and meaningful limitations; avoid large successful logs.
- Documentation-only changes need instruction/link review and `git diff --check`,
  not application regression. Test-only changes need changed tests and their
  owner suite; shared fixtures require coverage of all dependent suites.
- Do not commit unless the user asks or explicitly requests CI/CD or production
  deployment. Verification alone does not authorize push or deployment.
