---
name: principle-compose-ui-variants
description: 'Apply when UI variants duplicate shared behavior or accumulate props that select different component trees. Let consumers compose the parts they need.'
disable-model-invocation: true
---

# Compose UI Variants

Let consumers express variants through the component tree.
Share behavior in focused components.

**Why:** Duplicated shells drift. Components that know every layout accumulate
flags and business-specific state. Composition keeps shared behavior consistent
while callers own content and arrangement.

- Distinguish what renders from how it renders. Keep useful props such as size, disabled, and visual variant. When props select substantially different trees, move that structure into the consumer's template. A boolean alone is not a design problem.
- Design from real call sites. Start with ordinary slots. Introduce compound components when several parts need to coordinate across different layouts.
- Keep forms and business actions with the consumer. A dialog should not need profile-field props because one caller contains an edit form.
- Put coordinated state in the nearest shared owner. When descendants need context, use a typed local provider and fail clearly when it is missing. Expose state for reading and actions for changing it.
- Provide the extension points callers need. Children control structure. Class overrides control appearance. Stable data attributes expose state for styling. Element composition permits appropriate markup. Do not require every component to support all four.
- Preserve accessibility across compositions. Prefer established accessible components for complex interactions. Custom elements must preserve keyboard behavior, focus management, and accessible names.
- Build fixed-shape convenience wrappers on top of the shared components. Let unusual layouts use those components directly.
- Keep simple, single-shape components simple. Do not invent variants or add providers where slots and props already suffice. Preserve existing project conventions.

**The test:** Can another real variant change its layout or form at the call site
while keeping the shared interaction behavior?

Read [Component composition](references/component-composition.md) when designing
a compound API or replacing layout-selection props. It shows Vue examples,
provider boundaries, and convenience wrappers.
