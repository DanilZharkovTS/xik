# XIK.APP Code Style

## Language

- Use TypeScript.
- Enable strict mode.
- Use English for identifiers, code comments, UI, and commit messages.
- Avoid `any`; use `unknown` at external boundaries.
- Add explicit return types to exported functions and contracts.

## General rules

- Prefer readable code over clever code.
- Use early returns.
- Remove dead code instead of commenting it out.
- Comments explain why or constraints, not what the code already says.
- Keep unrelated changes out of the same task.

## Naming

Files:

```text
product-card.tsx
create-checkout-session.ts
stripe-checkout-gateway.ts
```

Components: `PascalCase`

Functions and variables: `camelCase`

True constants: `SCREAMING_SNAKE_CASE`

Boolean names:

```text
isOpen
hasLicense
canPurchase
shouldAnimate
```

Interfaces must not use an `I` prefix.

## Imports

Order:

1. React and Next.js;
2. third-party packages;
3. application aliases;
4. relative imports;
5. type-only imports.

Prefer:

```ts
import type { Product } from '../domain/product';
```

Use path aliases for stable project imports.

Avoid large barrel files and circular dependencies.

## React and Next.js

- Server Components by default.
- Client Components must be focused.
- Use named exports for reusable components.
- Default exports are acceptable for framework files such as `page.tsx`.
- Use stable domain identifiers as React keys.
- Avoid deeply nested ternaries.
- Use semantic HTML.

Example:

```tsx
type ProductCardProps = {
  product: ProductSummary;
};

export function ProductCard({ product }: ProductCardProps) {
  return <article>{product.name}</article>;
}
```

## Functions

Prefer pure functions for transformations and business rules.

Avoid unclear boolean arguments.

Bad:

```ts
loadProducts(true, false);
```

Good:

```ts
loadProducts({
  includeDrafts: true,
  useCache: false,
});
```

## Types

Prefer string unions over enums when runtime enum behavior is unnecessary.

```ts
export type ProductStatus = 'draft' | 'active' | 'archived';
```

Use discriminated unions for state.

```ts
export type CheckoutState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; checkoutUrl: string }
  | { status: 'error'; message: string };
```

Use `readonly` where mutation is not intended.

## Async code

Use `async/await`.

Run independent operations with `Promise.all`.

Do not create unnecessary promises or broad `try/catch` blocks.

Catch errors only to recover, add context, or map to a safer error.

## Tailwind CSS

Use Tailwind for the design system and layout.

Keep class lists readable:

```tsx
<div
  className={cn(
    'relative border bg-surface',
    'px-6 py-8 md:px-8',
    'transition-transform duration-150',
    'hover:-translate-y-1',
  )}
/>
```

Use `cn` only for conditional or reusable class composition.

Create semantic reusable components for stable UI patterns:

```tsx
<PixelButton>View product</PixelButton>
<PixelPanel>...</PixelPanel>
```

Use theme tokens rather than repeated arbitrary values.

Arbitrary values are acceptable for genuine pixel-art details. Promote repeated values into theme tokens or utilities.

## Pixel graphics and animation

- Use `image-rendering: pixelated`.
- Keep sprite positions on integer pixels.
- Prefer `steps()` for frame-like movement.
- Animate `transform` and `opacity` where possible.
- Avoid per-frame React state updates.
- Respect `prefers-reduced-motion`.
- Decorative animation must never be required to use the site.

## Accessibility

- Use `button` for actions and `Link`/`a` for navigation.
- Every interaction must work by keyboard.
- Use visible `focus-visible` styles.
- Use concise alt text for meaningful images.
- Decorative images use empty alt text.
- Do not replace native scrolling.
- Do not disable browser zoom.
- Avoid rapid flashing.

## Quality checks

Use available scripts:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Do not claim a check passed unless it was executed successfully.

## Definition of done

A task is complete when:

- the requested behavior works;
- architecture rules are respected;
- types and lint pass;
- relevant tests pass;
- build passes;
- accessibility was considered;
- unrelated files were not changed;
- documentation was updated where necessary.
