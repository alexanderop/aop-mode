# Feature boundaries

Use this reference to identify ownership, connect independent features, and turn
the dependency policy into a check. Adapt paths to the repository. A feature is a
business capability, not a mandatory folder template.

## Start with discoverable ownership

A small Vue shop could use:

```text
src/
  app/
    ShopPage.vue
  features/
    products/
      index.ts
      ProductList.vue
      products.types.ts
      products.data.ts
    cart/
      index.ts
      cart.store.ts
      cart.store.test.ts
  shared/
    money.ts
```

Keep files shallow until there is a useful reason to group them. Retain the
repository's separate test layers if it has them. Shared code has an independent
purpose, such as formatting money; it is not a place to hide product/cart coupling.

The dependency graph is:

```text
application -> products -> shared
application -> cart     -> shared
application ------------> shared
```

Neither feature imports the other. Shared code imports neither feature nor the
application. Public entries expose only what application consumers need; internal
files can import each other directly without routing through their own barrel.

## Compose products and cart in the application

These illustrative files show the complete interaction: products emits an intent,
the application translates it, and cart records its own input. They are a design
example, not a shipped storefront or a verified application fixture.

```ts
// features/products/products.types.ts
export interface Product {
  readonly id: string;
  readonly name: string;
  readonly priceInCents: number;
}
```

```vue
<!-- features/products/ProductList.vue -->
<script setup lang="ts">
import type { Product } from './products.types';

defineProps<{ products: readonly Product[] }>();
const emit = defineEmits<{ add: [product: Product] }>();
</script>

<template>
  <ul>
    <li v-for="product in products" :key="product.id">
      {{ product.name }}
      <button type="button" @click="emit('add', product)">Add {{ product.name }} to cart</button>
    </li>
  </ul>
</template>
```

```ts
// features/products/index.ts
export { default as ProductList } from './ProductList.vue';
export type { Product } from './products.types';
```

```ts
// features/cart/cart.store.ts
import { ref } from 'vue';
import { defineStore } from 'pinia';

export interface CartItem {
  readonly productId: string;
  readonly label: string;
  readonly unitPriceInCents: number;
  readonly quantity: number;
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<readonly CartItem[]>([]);

  function add(input: Omit<CartItem, 'quantity'>): void {
    const existing = items.value.find((item) => item.productId === input.productId);
    items.value = existing
      ? items.value.map((item) =>
          item.productId === input.productId ? { ...item, quantity: item.quantity + 1 } : item,
        )
      : [...items.value, { ...input, quantity: 1 }];
  }

  return { items, add };
});

// features/cart/index.ts
export { useCartStore } from './cart.store';
```

```vue
<!-- app/ShopPage.vue -->
<script setup lang="ts">
import { ProductList, type Product } from '../features/products';
import { useCartStore } from '../features/cart';

defineProps<{ products: readonly Product[] }>();
const cart = useCartStore();

function addProduct(product: Product): void {
  cart.add({
    productId: product.id,
    label: product.name,
    unitPriceInCents: product.priceInCents,
  });
}
</script>

<template>
  <ProductList :products="products" @add="addProduct" />
  <p>{{ cart.items.length }} distinct products in cart</p>
</template>
```

Pinia illustrates an existing state owner; the boundary does not require it.
Preserve the project's Vue or Effect state conventions. Cart defines its own input
and does not import `Product`, even as a type. The application owns the translation.
Production checkout pricing still needs its own authoritative validation.

For a non-UI workflow, the application can supply a narrow callback or service
implementing a feature-owned contract. Keep sibling imports in the composition
root. Avoid a global event bus or service locator that merely hides the same coupling.

## Enforce the policy, including its escape routes

Use the existing linter or architecture checker where possible. Resolve each
import to its actual target before applying ownership rules. Parsing source syntax
is more reliable than matching import text with a regular expression. Include Vue
script blocks and the file extensions the project actually uses.

Use the following fixture matrix to exercise the project's checker. Create real
fixture files, run the checker, and assert diagnostics name the importing file and
forbidden target. Run accepted and rejected cases separately so an unrelated error
cannot make a broken fixture appear to work.

| Importing file                       | Target                                | Expected                                 |
| ------------------------------------ | ------------------------------------- | ---------------------------------------- |
| `app/ShopPage.vue`                   | `features/cart/index.ts`              | Accept                                   |
| `app/ShopPage.vue`                   | `features/cart/cart.store.ts`         | Reject: private implementation           |
| `features/products/products.data.ts` | `features/products/products.types.ts` | Accept                                   |
| `features/products/products.data.ts` | `shared/money.ts`                     | Accept                                   |
| `features/products/products.data.ts` | `features/cart/index.ts`              | Reject: sibling, even through public API |
| `features/cart/cart.store.ts`        | `app/checkout.ts`                     | Reject: upward dependency                |
| `shared/money.ts`                    | `features/cart/index.ts`              | Reject: shared depends on feature        |

Exercise the forbidden sibling edge through each supported syntax:

```ts
// Each is a separate rejection fixture inside features/products/.
import { useCartStore } from '../cart';
import { useCartStore } from '@/features/cart';
import type { CartItem } from '../cart/cart.store';
export { useCartStore } from '../cart';
const cart = await import('../cart');
```

Also account for side-effect imports, CommonJS, glob imports, and computed module
paths where the repository uses them. Reject unresolved architectural imports or
report them explicitly; do not silently treat them as safe external packages.
Framework auto-imports need framework-aware analysis or explicit imports at these
boundaries. Generated component registration can conceal coupling too.

Run this check in the normal verification command and CI. When adopting it in a
legacy repository, use narrowly scoped, documented exceptions with a removal plan;
do not disable a whole boundary to accommodate one existing dependency.

The matrix describes required checker behavior. It does not install or implement a
universal checker, and distribution tests for this principle do not prove that a
consumer repository enforces these rules.

## Preserve existing boundaries and migrate one interaction

In Electron, a capability can have related code under `core`, `main`, and
`renderer`. Keep those process and authority constraints intact. A renderer-facing
feature entry must not re-export privileged main-process code for convenience.

Start with one capability whose files are scattered or whose sibling imports make
changes difficult. Identify its public operations, move orchestration to the
application, then enforce the affected boundary. Verify the user-visible workflow
at the lowest realistic test layer. Folder moves and lint success alone do not
prove behavior was preserved.

Features with complex domain rules can introduce a pure core and adapters inside
their boundary. Simple display features need no mandatory ports, service hierarchy,
or full Feature-Sliced Design taxonomy.

## Sources and additions

- [Clean Code Is Sexy Again: Making Your Vue Project AI-Ready](https://alexop.dev/posts/clean-code-is-sexy-again-vue-ai-ready/#part-3-discoverability): capability-based discovery, downward dependencies, independent siblings, and application composition.
- [Building a Modular Monolith with Nuxt Layers](https://alexop.dev/posts/nuxt-layers-modular-monolith/): products/cart composition, lint enforcement, and the explicit-import limitation of the demonstrated plugin.
- [How to Structure Vue Projects](https://alexop.dev/posts/how-to-structure-vue-projects/): structures proportional to project complexity and shallow feature folders.
- [Hexagonal Architecture in Vue](https://alexop.dev/posts/hexagonal-architecture-vue/): optional internal boundaries and incremental adoption.

The public-entry rule, warning against moving feature rules into shared code,
Electron guidance, and enforcement fixture matrix are aop-mode policy additions.
The Vue code above is an original illustrative example of the composition pattern.
