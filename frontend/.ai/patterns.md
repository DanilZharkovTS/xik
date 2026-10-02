# XIK.APP Patterns

Patterns solve recurring problems. They are not mandatory decoration.

## Feature Module

Organize functionality by feature:

```text
features/
  catalog/
  checkout/
  licenses/
  arcade/
```

Each feature owns its domain, services, infrastructure, and feature components.

Expose only a small public API through `index.ts`.

## Repository

Use repositories for persistence and data-source boundaries.

```ts
export interface ProductRepository {
  findAll(): Promise<readonly Product[]>;
  findBySlug(slug: string): Promise<Product | null>;
}
```

Appropriate for:

- products;
- purchases;
- licenses;
- entitlements.

Not appropriate for:

- DOM access;
- local UI state;
- animation frames;
- formatting helpers.

Avoid generic CRUD repositories.

## Service / Use Case

A service performs one meaningful application workflow.

```ts
type CreateCheckoutDependencies = {
  productRepository: ProductRepository;
  checkoutGateway: CheckoutGateway;
};

export async function createCheckoutSession(
  dependencies: CreateCheckoutDependencies,
  input: CreateCheckoutInput,
): Promise<CheckoutSession> {
  const product = await dependencies.productRepository.findBySlug(input.productSlug);

  if (!product || !product.isPurchasable) {
    throw new ProductUnavailableError(input.productSlug);
  }

  return dependencies.checkoutGateway.createSession({
    productId: product.id,
    priceId: product.priceId,
  });
}
```

A service coordinates. It does not render UI or import React.

## Adapter

Wrap third-party systems behind application-owned contracts.

Examples:

```text
StripeCheckoutGateway
ResendEmailGateway
DatabaseProductRepository
CloudflareAnalyticsAdapter
```

Vendor types must remain inside infrastructure.

## Strategy

Use when multiple interchangeable policies exist.

Possible uses:

- license-key generation;
- pricing;
- delivery method;
- full/reduced/static animation behavior.

Do not use Strategy for one simple conditional.

## Factory

Use when creation has meaningful branching or validation.

Examples:

```text
createCheckoutGateway
createLicenseKeyGenerator
```

Do not wrap every constructor in a factory.

## Composition Root

Create concrete dependencies in one place.

```ts
export function createCatalogServices() {
  const repository = new StaticProductRepository();

  return {
    getCatalog: () => getProductCatalog(repository),
    getProduct: (slug: string) => getProductBySlug(repository, slug),
  };
}
```

Do not add a DI framework until manual composition becomes a real problem.

## Facade

Expose a small stable API over a larger feature.

Useful for licensing:

```ts
export type LicenseFacade = {
  issueLicense(input: IssueLicenseInput): Promise<IssuedLicense>;
  activateLicense(input: ActivateLicenseInput): Promise<ActivatedLicense>;
  validateLicense(key: string): Promise<LicenseValidation>;
};
```

## Mapper

Translate between boundaries explicitly.

Examples:

- database row to domain entity;
- Stripe event to application command;
- domain entity to API response;
- product entity to UI view model.

Mappers should be deterministic and side-effect free.

## Value Object

Use for validated concepts that have behavior or invariants.

Candidates:

```text
Money
EmailAddress
LicenseKey
ProductSlug
```

Do not wrap every primitive.

## Result

Use a discriminated union for expected business failures.

```ts
export type ActivateLicenseResult =
  | { ok: true; license: ActivatedLicense }
  | { ok: false; reason: 'not_found' | 'already_activated' | 'expired' };
```

Use exceptions for unexpected infrastructure failures.

Do not use Result everywhere.

## State Machine

Use for workflows with explicit states and restricted transitions.

Good candidates:

- checkout;
- license activation;
- hero sequence;
- mini-game.

Start with a reducer or discriminated union before adding a state-machine library.

## Observer

Use browser observers at UI boundaries:

- `IntersectionObserver`;
- `ResizeObserver`;
- `MutationObserver` only for external DOM integration.

Always clean up observers.

Avoid custom global event buses for normal React communication.

## Command

A typed input to a use case is usually enough.

Use command classes only when queuing, serialization, auditing, or dispatching requires them.

## Cache-Aside

Use Next.js caching primitives first.

Typical flow:

1. read cache;
2. load from repository if missing;
3. cache the result;
4. invalidate after writes.

Document revalidation behavior.

## Next.js patterns

### Server Component by default

Fetch data on the server and keep infrastructure server-only.

### Server Action

A Server Action should:

- validate input;
- call a service;
- map errors to safe results;
- revalidate paths or tags.

Do not put business rules directly in the action.

### Route Handler

Use for:

- webhooks;
- public APIs;
- callbacks;
- external integrations.

Validate and delegate.

## UI patterns

### Compound Components

Use for structures with meaningful related parts.

```tsx
<TerminalWindow>
  <TerminalWindow.Header />
  <TerminalWindow.Body />
</TerminalWindow>
```

Do not hide surprising behavior.

### Custom Hooks

Use hooks for reusable client interaction.

Hooks must not become repositories, payment gateways, or domain services.

## Pixel animation patterns

### CSS Sprite Loop

Use for:

- blinking;
- cursor animation;
- tail movement;
- short idle cycles.

Use sprite sheets, `steps()`, integer scaling, and a reduced-motion fallback.

### requestAnimationFrame Controller

Use for scroll-linked visuals such as ScrollChomper.

Rules:

- store changing values in refs;
- avoid React state on every frame;
- update transforms directly in a focused component;
- cancel frames on cleanup;
- pause when the document is hidden.

### Intersection Observer Activation

Start and stop decorative animation based on visibility.

### Dynamic Import

Dynamically import heavy browser-only animation or canvas features.

## Anti-patterns

Avoid:

- God Components;
- `BaseService`, `BaseRepository`, and `BaseController`;
- premature abstraction;
- service locators;
- global mutable singletons;
- boolean parameter explosion;
- components that only rename a `div`;
- business logic inside React hooks;
- vendor SDK types across the application;
- catch-all `utils.ts`, `helpers.ts`, or `common.ts`;
- rewriting the whole project for a local problem.

## Pattern selection checklist

Before using a pattern, answer:

1. What recurring problem exists now?
2. What boundary does the pattern create?
3. Which dependency becomes replaceable?
4. What complexity is added?
5. Would a direct function be clearer?
6. How will it be tested?
7. How will another developer discover it?

Use the pattern only when the benefit exceeds the cost.
