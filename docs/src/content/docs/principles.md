---
title: Personal principles
description: Frontend testing, explicit dependencies, functional core design, UI composition, calm interface design, and mobile-first design in aop-mode.
---

These six principles are aop-mode additions. The original pstack source remains
unchanged. Each principle has a short skill entrypoint and a supporting reference,
packaged for Claude Code, Codex, and Copilot.

An explicit `aop-mode` invocation loads them when the task concerns frontend testing,
dependency design, functional core design, UI composition, calm interface design, or mobile-first design. They can also be requested individually by their full skill
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

## Functional Core

`principle-functional-core` models decisions as data and composes pure functions.
Return typed outcomes for expected rejections, use tagged unions for meaningful
states, and keep storage, network, and UI effects in an outer workflow.

Its [TypeScript reference](https://github.com/alexanderop/aop-mode/blob/main/skills/principle-functional-core/references/functional-core.md)
shows a publication decision, exhaustive handling, explicit persistence, and
behavioral tests. These Effect-inspired patterns use ordinary TypeScript and need
no Effect dependency. Existing Effect projects retain their own conventions.

## Compose UI Variants

`principle-compose-ui-variants` puts layout decisions in the consumer's component
tree. Keep useful appearance and behavior props. When flags select different trees,
use slots or cooperating components that share interaction behavior.

Its [component composition reference](https://github.com/alexanderop/aop-mode/blob/main/skills/principle-compose-ui-variants/references/component-composition.md)
shows confirm and edit dialogs, a typed local provider, and a convenience wrapper.
It covers styling and element composition while keeping simple components simple.
The provider example teaches state coordination, not production dialog accessibility.

## Design Calm Interfaces

`principle-design-calm-interfaces` gives the user's work the strongest visual
presence. Use neutral surfaces, semantic color tokens, consistent spacing, and
clear typography to establish hierarchy. Match density to each region's task,
and keep necessary information readable across selection and overlay states.
Keep interface copy purposeful: omit redundant introductions and explanations of
obvious controls, reveal optional detail on demand, and preserve labels, errors,
and decision consequences. Before finishing, remove explanatory sentences that
do not prevent a concrete misunderstanding.

Its [calm interface design reference](https://github.com/alexanderop/aop-mode/blob/main/skills/principle-design-calm-interfaces/references/calm-interface-design.md)
includes an illustrative CSS palette and navigation state example, practical
review guidance, and links to Linear's design writing. Preserve the product's
identity and verify interactions in the running app. Dark mode and Linear's
specific stack are not requirements.

## Design Mobile First

`principle-design-mobile-first` starts with the essential task under constraints
of space, attention, and connectivity. Prioritize useful content, reduce input
effort, and enhance the layout when more room becomes available. Preserve task
access and recovery across screen sizes and input methods.
Review copy at narrow widths so unnecessary prose does not push the task down
the screen. Preserve primary content and readable labels rather than enforcing
a word limit or replacing every action with an icon.

Its [mobile-first design reference](https://github.com/alexanderop/aop-mode/blob/main/skills/principle-design-mobile-first/references/mobile-first-design.md)
includes an appointment form, fluid CSS, and observable review criteria. It draws
on Luke Wroblewski's [Mobile First](https://mobile-first.abookapart.com/02-introduction/)
(2011), distinguishing the book's lasting ideas from historical device assumptions
and aop-mode implementation guidance.

## Verification status

Packaging checks cover all six principles, their references, explicit invocation
policy, and the unchanged upstream files for each harness. This is distribution
coverage, not evidence that a live agent follows these principles correctly.
See [the evaluation guide](/aop-mode/testing/) for how behavioral evidence is gathered.
