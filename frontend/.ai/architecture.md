# XIK.APP Architecture

## Goal

Build XIK.APP as a modular Next.js application that stays simple while supporting product pages, checkout, licensing, and interactive pixel-art features.

Decision order:

1. KISS: choose the simplest correct solution.
2. DRY: remove proven duplication, not hypothetical duplication.
3. SOLID: isolate responsibilities and volatile dependencies.
4. Prefer composition over inheritance.
5. Prefer Next.js capabilities before adding packages.

## Stack assumptions

- Next.js with App Router
- TypeScript in strict mode
- React Server Components by default
- Tailwind CSS for layout and UI styling
- Dedicated CSS for sprite sheets, stepped keyframes, CRT effects, and pixel rendering
- Server Actions for trusted UI mutations
- Route Handlers for webhooks and public integrations

## Layers

### Presentation

Locations:

```text
src/app
src/components
src/features/*/components
```

Responsibilities:

- pages, layouts, loading and error states;
- React components;
- UI state;
- accessibility;
- animation orchestration.

Presentation must not contain database, Stripe, email, or license implementation details.

### Application

Locations:

```text
src/features/*/services
src/features/*/use-cases
```

Responsibilities:

- application workflows;
- validation at use-case boundaries;
- coordination between repositories and gateways;
- authorization and transaction boundaries.

Examples:

```text
GetProductCatalog
CreateCheckoutSession
IssueLicense
ActivateLicense
```

### Domain

Locations:

```text
src/features/*/domain
```

Responsibilities:

- entities;
- value objects;
- business rules;
- domain errors;
- repository and service contracts.

The domain must not import React, Next.js, Stripe, database clients, or browser APIs.

### Infrastructure

Locations:

```text
src/features/*/infrastructure
src/infrastructure
```

Responsibilities:

- repository implementations;
- Stripe adapters;
- email adapters;
- analytics;
- database clients;
- external APIs.

Infrastructure implements contracts owned by the domain or application layer.

## Recommended structure

```text
src/
  app/
    (marketing)/
      page.tsx
      about/page.tsx
      products/page.tsx
      products/[slug]/page.tsx
    api/
    layout.tsx
    globals.css

  components/
    ui/
    layout/

  features/
    catalog/
      components/
      domain/
      services/
      infrastructure/
      index.ts
    checkout/
      components/
      domain/
      services/
      infrastructure/
      index.ts
    licenses/
      domain/
      services/
      infrastructure/
      index.ts
    arcade/
      components/
      hooks/
      animation/
      sprites/
      index.ts

  infrastructure/
    env/
    logging/
    analytics/

  config/
  lib/
  styles/
```

Create only folders needed by current requirements.

## Feature boundaries

Organize by feature, not by global technical folders.

Good:

```text
features/checkout/services/create-checkout-session.ts
features/checkout/infrastructure/stripe-checkout-gateway.ts
```

Avoid unrelated global collections such as:

```text
services/
repositories/
interfaces/
```

Each feature may expose a small public API from `index.ts`. Avoid deep imports across features.

## Server and client boundaries

Use Server Components by default.

Add `"use client"` only for:

- browser APIs;
- local interactive state;
- event handlers;
- DOM-based animation;
- client context.

Keep Client Components small. Do not make an entire page client-side because one child is animated.

## Services

Use function-based services by default.

```ts
export async function getProductBySlug(
  repository: ProductRepository,
  slug: string,
): Promise<Product | null> {
  return repository.findBySlug(slug);
}
```

Use classes only when configuration, lifecycle, or shared state justify them.

## Repositories

Create repositories for meaningful persistence boundaries.

```ts
export interface ProductRepository {
  findAll(): Promise<readonly Product[]>;
  findBySlug(slug: string): Promise<Product | null>;
}
```

Use repositories when:

- the data source may change;
- tests need a fake implementation;
- persistence is non-trivial;
- multiple implementations are realistic.

Avoid generic `Repository<T>` and `BaseRepository<T>` abstractions.

## Interfaces

Use interfaces for behavior contracts.

```ts
export interface CheckoutGateway {
  createSession(input: CheckoutInput): Promise<CheckoutSession>;
}
```

Use types for data.

```ts
export type Product = {
  id: string;
  slug: string;
  name: string;
};
```

Do not prefix interfaces with `I`.

## Dependency injection

Prefer explicit dependency passing and a small composition root.

Do not add a dependency-injection framework until manual wiring is a verified problem.

## State

Priority:

1. local component state;
2. URL state;
3. server data and Next.js cache;
4. feature context;
5. external state library only when necessary.

Do not add global state for simple navigation, product pages, or decorative animation.

## Styling and animation

Tailwind CSS:

- layout;
- spacing;
- typography;
- responsive rules;
- colors;
- borders;
- basic transitions.

Dedicated CSS:

- sprite sheets;
- `steps()` animations;
- CRT and glitch effects;
- `image-rendering: pixelated`.

Animation libraries belong only in client-side arcade components. Domain and application code must remain animation-independent.

## Validation

Validate external input at:

- Server Actions;
- Route Handlers;
- webhooks;
- environment variables;
- third-party API responses.

Zod is acceptable at these boundaries.

## Error handling

Use domain-specific errors for expected business failures.

Use `null` for expected absence where appropriate.

Use Result unions only when callers must handle several expected outcomes. Do not wrap every function.

## Testing

- Unit tests: domain rules and services.
- Component tests: interaction and accessibility.
- End-to-end tests: navigation, checkout, purchase, license delivery.

Test behavior, not Tailwind class strings or private helpers.

## Abstraction rule

Before adding an abstraction, answer:

1. What concrete problem exists now?
2. Which dependency or behavior is isolated?
3. Is another implementation realistic?
4. Does testing become materially easier?
5. Is the abstraction simpler than the duplicated code?

If not, keep the implementation direct.
