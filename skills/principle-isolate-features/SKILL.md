---
name: principle-isolate-features
description: 'Apply when organizing business capabilities or changing feature dependencies. Keep sibling features independent, compose workflows in the application, and enforce import boundaries.'
disable-model-invocation: true
---

# Isolate Features

Organize code around business capabilities. Keep sibling features independent and
compose their interactions in the application layer.

**Why:** Clear ownership lets a developer or agent find a capability's implementation
without searching unrelated folders. Enforced dependencies let that implementation
change without spreading hidden coupling across the application.

- Keep a feature's components, state, operations, and helpers with the feature that owns them. Start with shallow folders and descriptive names; add nesting when it improves navigation. Colocate tests where repository conventions permit.
- Give each feature a small, explicit public API. Application consumers use that API, not internal files. A public API does not grant sibling features permission to import each other, including type-only imports.
- Compose cross-feature workflows in the application or page layer. Translate a feature's event into another feature's operation there. Pass data or narrow capabilities when needed; do not make features locate sibling implementations themselves.
- Keep dependencies directed downward: application to features and shared code; features to themselves and shared code; shared code to shared code. Shared code cannot import features or application code.
- Extract genuinely shared concepts deliberately. Do not move feature-specific business rules into `shared/` to silence an import violation. First consider application composition or an explicitly supplied dependency.
- Preserve runtime and authority boundaries. In Electron, organize capabilities within main, renderer, and core without moving filesystem authority into the renderer. Feature ownership does not override security or process contracts.
- Make the import policy executable in the repository's normal verification command and CI. Resolve aliases and relative paths; cover re-exports, dynamic imports, and type imports. Account for framework auto-imports or use explicit imports where the checker otherwise cannot see dependencies. Prove the checker rejects forbidden edges and accepts allowed ones.
- Adopt boundaries incrementally. Keep small applications simple, preserve established conventions, and avoid a wholesale rewrite. Add internal ports or layers only when they reduce real testing or change friction.

**The test:** Can you find and change a capability without reading sibling internals,
and does verification reject a dependency that breaks its boundary?

Read [Feature boundaries](references/feature-boundaries.md) when choosing ownership,
composing a cross-feature interaction, or configuring enforcement. It includes Vue
examples, allowed and forbidden imports, and adoption guidance.
