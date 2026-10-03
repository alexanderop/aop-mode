---
name: principle-functional-core
description: 'Apply when business decisions are mixed with I/O, expected failures are hidden in exceptions, or state flags permit impossible combinations. Model decisions as data and compose pure TypeScript functions.'
disable-model-invocation: true
---

# Functional Core

Model decisions as data and compose pure functions. Keep effects in a small outer
workflow that handles storage, network, and UI.

**Why:** Explicit inputs and returned outcomes make business rules understandable
and testable without running infrastructure. Tagged data makes the caller's choices
visible in the type system.

- Separate decisions from effects. Pass known values into pure functions; let the outer workflow obtain those values and act on the result.
- Return expected failures as discriminated unions when callers need to handle rejection. Preserve useful error details. Do not turn every exception into a business rejection or hide unexpected defects in a generic failure.
- Model meaningful states with tagged unions when booleans and optional properties allow impossible combinations. Handle variants exhaustively at decision points. Keep ordinary optional values when absence is sufficient; a custom Option type is not mandatory.
- Treat inputs as immutable and return new values. Use readonly types at shared boundaries, remembering that readonly is shallow and does not freeze runtime objects. Contained local mutation is fine when it improves clarity and does not escape.
- Compose small, named transformations with ordinary calls and intermediate variables. Use pipelines, currying, or generic helpers only when real call sites become easier to read; do not force point-free code or replace a clear loop with a complicated reduce.
- Keep abstractions proportional. Prefer domain-specific outcomes before introducing a shared Result abstraction. Do not build a custom Effect runtime, generator DSL, DI container, or functional toolkit to apply this principle.
- Preserve existing project conventions. These patterns need no Effect dependency. In a project already using Effect, use its existing facilities rather than adding a parallel result or service system. Keep simple Vue state in Vue.

**The test:** Can I understand and test this business decision using only its inputs
and returned value?

Read [Functional core in TypeScript](references/functional-core.md) when separating
a workflow into pure decisions and effects. It includes exhaustive handling and
behavioral tests. This complements Make Dependencies Explicit and upstream Model
the Domain and Type System Discipline.
