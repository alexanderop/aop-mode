---
name: principle-make-dependencies-explicit
description: "Apply when designing code with time, randomness, persistence, network, or service dependencies, or when tests need to replace them. Make dependencies explicit without unnecessary abstraction."
disable-model-invocation: true
---

# Make Dependencies Explicit

Pass dependencies into the code that uses them. Keep business rules pure and
connect infrastructure at the application boundary.

**Why:** Hidden dependencies make behavior depend on ambient state and encourage
tests that replace implementation details. Explicit dependencies make the same
operation usable with production infrastructure and deterministic test inputs.

- Pass values into pure functions. Inject a capability only when an operation needs to obtain a value or perform an effect itself.
- Prefer ordinary parameters and small, purpose-specific dependency objects. Do not add a DI container or an interface for every function.
- Make time, randomness, storage, and network access explicit when they affect behavior. Avoid service locators and mutable global registries.
- Connect concrete adapters at application startup or another clear composition boundary. Domain code must not import its concrete infrastructure.
- In unit tests, use real domain code with deterministic values or small in-memory implementations. Assert outcomes rather than internal call sequences; avoid module mocks and global replacements.
- Preserve existing conventions. In Effect-based projects, use the existing services and layers for substantial workflows; do not introduce Effect just to inject one function. Keep simple Vue state local.
- An in-memory implementation is a test double, not proof of the production adapter. Test adapters separately and retain application-level wiring checks.

Read [Dependency design](references/dependency-design.md) for a TypeScript example,
composition boundaries, and guidance on testing adapters. This complements
upstream Boundary Discipline, Model the Domain, and Test Behavior, Not Implementation.
