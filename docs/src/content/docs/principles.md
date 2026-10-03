---
title: Personal principles
description: Frontend testing and explicit dependencies in aop-mode.
---

These two principles are aop-mode additions. The original pstack source remains
unchanged. Each principle has a short skill entrypoint and a supporting reference,
packaged for Claude Code, Codex, and Copilot.

An explicit `aop-mode` invocation loads them when the task concerns frontend testing
or dependency design. They can also be requested individually by their full skill
name. They do not install startup hooks or activate outside the requested task.

## Test at the Right Layer

`principle-test-at-the-right-layer` chooses a test by the failure it must expose:

- **Vitest unit:** pure rules and operations with explicit dependencies; no module mocks or global replacements.
- **Vitest Browser Mode:** real component interaction, focus, lifecycle, and browser storage.
- **HTTP integration:** real request/response code with MSW, including Node adapter tests.
- **Playwright E2E:** application journeys, routing, and persistence across reloads. New acceptance scenarios use executable Gherkin steps.

Its [frontend testing reference](https://github.com/alexanderop/aop-mode/blob/main/skills/principle-test-at-the-right-layer/references/frontend-testing.md)
covers setup, scripts, CI, MSW's browser and server boundaries, and a saved-package
example across layers. npmx inspired the layer separation; Gherkin and the MSW
policy are personal additions. Existing repositories retain their conventions.

## Make Dependencies Explicit

`principle-make-dependencies-explicit` keeps business rules pure and connects
infrastructure at an application boundary. Pass known values directly; inject
small capabilities when an operation needs storage, time, randomness, or services.

Unit tests use deterministic inputs or in-memory implementations through those
interfaces. These test doubles do not prove production adapters; adapter tests and
application journeys provide that additional evidence. No DI container is required.

The [dependency design reference](https://github.com/alexanderop/aop-mode/blob/main/skills/principle-make-dependencies-explicit/references/dependency-design.md)
includes a TypeScript operation and a behavioral unit test. It explains how this
fits existing Vue state and Effect service conventions without requiring a migration.

## Verification status

Packaging checks cover both principles, their references, explicit invocation
policy, and the unchanged upstream files for each harness. This is distribution
coverage, not evidence that a live agent follows either principle correctly.
See [the evaluation guide](/aop-mode/testing/) for how behavioral evidence is gathered.
