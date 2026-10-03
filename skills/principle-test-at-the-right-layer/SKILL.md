---
name: principle-test-at-the-right-layer
description: 'Apply when setting up frontend testing, implementing a feature, fixing a bug, or reviewing coverage. Choose tests by the behavior and failure they must expose.'
disable-model-invocation: true
---

# Test at the Right Layer

Name the failure a test must catch. Choose the smallest test scope and environment
that can expose that failure.

**Why:** A green test is useful only when it exercises the behavior you claim works.
A simulated browser cannot prove real browser behavior, and an isolated component
cannot prove application wiring.

## Choose by responsibility

- Use Vitest in Node for pure rules, transformations, validation, and explicit state transitions.
- Use Vitest Browser Mode for components and integrations that depend on rendering, interaction, focus, browser APIs, or lifecycle. Prefer `vitest-browser-vue` for Vue.
- Use Playwright for journeys through the running application: routing, application wiring, persistence across reloads, and critical acceptance behavior.
- Express new E2E acceptance scenarios in Gherkin using product language and executable Playwright step definitions. Preserve existing test conventions unless migration is requested.

## Control dependencies at their boundaries

Unit tests use real domain code and explicit inputs. Do not use module mocks,
global replacements, or spies on internal functions. Supply required capabilities
through dependency injection, using small deterministic implementations.
See [Make Dependencies Explicit](../principle-make-dependencies-explicit/SKILL.md)
when designing those boundaries.

Use MSW for HTTP-dependent component/browser and API-client integration tests.
Keep the request, response parsing, and error handling code real. An HTTP adapter
test is an integration test even when Vitest runs it in Node; pure unit tests need
no HTTP mocking.

For E2E, keep the application and backend real when their integration is under
test. Replace external services with controlled fixtures when needed and state
which boundaries were replaced. Never replace the mechanism a test claims to prove.

## Keep the proof honest

Exercise public interfaces and assert observable results with semantic locators.
Cover rule combinations in lower layers; use browser and E2E tests for their
additional integration risks instead of repeating every case at every layer.

Functional assertions do not prove visual appearance or complete accessibility.
Add focused checks when those are acceptance criteria. For regressions, show the
test failing for the original defect and passing with the fix when practical.

Preserve repository conventions. In new frontend projects, provide separate unit,
browser, and E2E commands, isolated fixtures, and CI execution. Read
[Frontend testing](references/frontend-testing.md) for setup, layer selection,
MSW lifecycle, and Gherkin examples. Do not add this whole stack to unrelated tasks.
