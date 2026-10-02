# XIK.APP Agent Modes

The coding agent must work in one explicit mode.

## Analyze Mode

Use for audits, reviews, comparisons, and recommendations.

Rules:

- inspect the repository first;
- do not modify files;
- do not install packages;
- separate repository facts from recommendations;
- identify exact files and boundaries;
- stop after the report unless implementation was requested.

Output:

1. current state;
2. findings;
3. risks;
4. recommended changes;
5. implementation order;
6. affected files.

## Plan Mode

Use when a plan is requested without code changes.

Rules:

- define scope and assumptions;
- split work into small phases;
- list dependencies and risks;
- define acceptance criteria;
- include verification commands;
- avoid speculative unrelated work.

## Implement Mode

Use only when file changes are explicitly requested.

Before coding:

1. inspect relevant files;
2. identify existing patterns;
3. choose the smallest viable scope;
4. avoid unrelated refactoring.

During coding:

- follow all `.ai` documents;
- use existing dependencies where adequate;
- justify new packages;
- preserve compatibility unless a breaking change is requested;
- update tests with behavior changes.

After coding:

- run available lint, typecheck, tests, and build;
- report changed files;
- report real command results;
- state any unexecuted checks.

## Refactor Mode

Use only for an explicit refactor or when a requested feature cannot be added safely otherwise.

Refactoring must:

- preserve behavior;
- reduce verified complexity, coupling, or duplication;
- be separated from feature work when possible;
- avoid hypothetical architecture.

For major refactors, provide scope, migration, risks, and rollback.

## Debug Mode

Process:

1. reproduce;
2. capture the exact error;
3. isolate the failing boundary;
4. form a hypothesis;
5. verify it;
6. implement the smallest fix;
7. add a regression test;
8. run checks.

Do not suppress errors without understanding them.

## Review Mode

Review priority:

1. correctness;
2. security;
3. data-loss risk;
4. architecture;
5. accessibility;
6. performance;
7. maintainability;
8. style.

Severity:

- Blocker;
- High;
- Medium;
- Low.

Each finding needs a file, problem, impact, and fix.

## Security Mode

Use for payments, authentication, secrets, webhooks, and licensing.

Rules:

- validate all external input;
- keep secrets server-side;
- verify webhook signatures;
- use idempotency for payments and webhooks;
- never trust client-provided prices;
- log without secrets or personal data;
- apply least privilege;
- test failure paths.

## Animation Mode

Use for sprites, scroll interactions, route transitions, and mini-games.

Rules:

- animation stays outside domain and services;
- use CSS for simple sprite loops;
- use `requestAnimationFrame` only when needed;
- avoid React state updates every frame;
- stop offscreen and hidden-tab animation;
- support reduced motion;
- keep keyboard and screen-reader behavior intact;
- custom scroll indicators remain decorative;
- dynamically import heavy engines.

Every animation task must define:

- visual behavior;
- interaction behavior;
- reduced-motion behavior;
- cleanup behavior;
- performance budget.

## Package Evaluation Mode

Before adding a substantial dependency, evaluate:

- concrete use case;
- maintenance status;
- Next.js compatibility;
- bundle cost;
- client/server boundary;
- accessibility impact;
- existing alternatives;
- removal cost.

Do not install multiple packages for the same primary problem without a documented reason.

## Documentation Mode

When changing `.ai` files:

- reflect actual project behavior;
- separate current rules from future recommendations;
- keep examples aligned with Next.js;
- avoid unenforceable rules;
- update related documents when terminology changes.

## Stop conditions

Stop and ask for clarification when:

- requirements conflict;
- destructive migration was not approved;
- repository state differs materially from the request;
- production credentials are required;
- a product decision cannot be inferred safely.

Do not stop for minor details that existing project rules already resolve.
