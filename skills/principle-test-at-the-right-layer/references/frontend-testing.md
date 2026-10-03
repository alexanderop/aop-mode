# Frontend testing

Use this reference for layer selection, project setup, dependency control, and
executable acceptance scenarios. Preserve an existing repository's package
manager and test conventions; these are defaults for new frontend projects.

## Choose the proof before the tool

| Failure to catch                                              | Scope and environment         | Dependency strategy                                   |
| ------------------------------------------------------------- | ----------------------------- | ----------------------------------------------------- |
| Wrong rule, transformation, or state transition               | Vitest unit, Node             | Concrete inputs and real functions                    |
| Wrong orchestration of domain capabilities                    | Vitest unit, Node             | DI with deterministic implementations                 |
| Broken serialization, response parsing, or HTTP error mapping | Vitest integration, Node      | Real HTTP adapter with MSW                            |
| Broken component rendering, interaction, focus, or lifecycle  | Vitest Browser Mode           | Real components and state; MSW for HTTP               |
| Broken IndexedDB adapter behavior                             | Vitest Browser Mode           | Real browser storage, isolated per test               |
| Broken routing, app wiring, or restore after reload           | Playwright E2E                | Running application; declare external replacements    |
| Broken SSR hydration                                          | Playwright E2E in an SSR app  | Direct navigation and post-hydration interaction      |
| Wrong appearance or viewport fit                              | Focused browser visual checks | Stable data, viewport, fonts, and screenshot baseline |

Node is an environment, not a synonym for unit testing. Browser Mode provides a
real browser, not automatically the whole application. A component interaction
proves neither production backend integration nor complete accessibility.
Use role/name locators, real keyboard actions, and web-first assertions. Avoid
arbitrary sleeps and CSS selectors coupled to internal markup.

## One feature across layers

For a saved-package collection:

- Unit: adding an existing package does not create a duplicate; invalid package names are rejected by the domain rule.
- Browser: activating Save updates the visible component state. Test keyboard access and loading/error states here when relevant.
- E2E: save a package, navigate to the collection, reload, and observe the saved entry. Keep persistence real in this journey.

Each layer catches a distinct failure. Do not repeat every validation permutation
through E2E or invent fixed unit/browser/E2E coverage percentages.

## Set up a new Vue/Vite project

1. Inspect scripts, lockfile, Vite plugins, aliases, and existing tests first. Keep compatible versions of Vitest and its browser provider. Add only missing development dependencies: `vitest`, `@vitest/browser-playwright`, `vitest-browser-vue`, `@playwright/test`, `playwright-bdd`, and `msw` where HTTP tests need it. Use the app's Vue plugin.
2. Define separate Vitest projects named `unit` and `browser`, with non-overlapping includes such as `test/unit/**/*.test.ts` and `test/browser/**/*.test.ts`. Unit uses `environment: 'node'`. Browser uses `browser.enabled: true`, `provider: playwright()` from `@vitest/browser-playwright`, and a headless Chromium instance. Share relevant application aliases, plugins, and styles instead of creating a second implementation of the app configuration.
3. If HTTP adapters need Node integration coverage, add an `integration` project with its own MSW setup file. Do not attach HTTP mocking to the pure unit project.
4. For Nuxt, use its supported test-utils configuration for Nuxt-aware tests; do not copy plain Vue setup over generated imports or framework context. npmx's Nuxt configuration is an example, not a generic starter template.
5. Configure Playwright with an isolated context per scenario, a `baseURL`, and a `webServer` command that starts the application. For release confidence, build first and test the served build. Make the server command, port, and readiness URL agree. Retain traces on failure; forbid focused tests in CI.
6. Connect Gherkin files and step definitions using `playwright-bdd`'s `defineBddConfig`; use its generated directory as Playwright's `testDir`. Ignore generated specs and regenerate before every E2E run. Define steps with `createBdd()` (or the project's extended Playwright test fixture).
7. Expose clear commands and run each applicable suite in CI after a frozen-lockfile install. Install the selected Playwright browsers and Linux dependencies in CI. Keep database, account, and fixture state isolated across parallel tests. Upload reports and traces on failures.

Suggested scripts, once the corresponding projects and configuration exist:

```json
{
  "test:unit": "vitest run --project unit",
  "test:browser": "vitest run --project browser",
  "test:integration": "vitest run --project integration",
  "test:e2e": "bddgen && playwright test"
}
```

Omit the optional integration command when there is no separate integration
project. The E2E command assumes the Playwright web server handles build/start,
or that CI builds before invoking it. Do not claim setup works until representative
unit, browser, and E2E behavior has actually executed. A test runner discovering
zero tests is not a successful layer setup.

## MSW at the HTTP boundary

Share handlers that describe realistic HTTP responses, including validation
failures, empty results, and service errors. Use `http` and `HttpResponse` from
MSW; keep application fetch/client modules real. Match the application's actual
origin, path, method, and response shape. Do not return already-parsed domain
objects when the adapter is supposed to parse a wire response.

In Node integration tests, use `setupServer` from `msw/node`. Start interception
before tests, reset overrides after each test, and close after the suite. Fail
unhandled API requests so an incomplete fixture cannot silently use a live API.

In Browser Mode, use `setupWorker` from `msw/browser`. Generate and serve the
worker script from the configured public directory; await startup before requests
or component mounting. Reset overrides between tests and stop at teardown.
Do not activate test mocking in production. Permit legitimate asset/tooling
requests while treating unhandled requests to API origins under test as errors.

Browser interception does not cover SSR requests running in a separate Node
process. Initialize interception inside that server process in a test-only setup,
or use a controlled upstream service. An MSW server created in the Playwright
test process does not intercept a separately started application server.

For E2E, document the boundary: a real frontend using an MSW API fixture proves
frontend behavior against that fixture. Keep the actual backend in tests that
claim frontend/backend integration. When offline/PWA behavior is under test,
ensure a test worker is not replacing the production service-worker mechanism.

## Gherkin describes the outcome

```gherkin
Feature: Saved packages

  Scenario: A saved package survives a reload
    Given I am viewing the package "vitest"
    When I save the package to my collection
    And I reload the application
    And I open my collection
    Then my collection contains "vitest"
```

Implement every step using Playwright fixtures, locators, and assertions. Keep
selectors inside step definitions; avoid steps such as "click .save-button".
The final step must assert the rendered collection after reload, not seeded data
or the fixture's own response. Use scenario outlines for meaningful acceptance
variants, not for moving an entire unit-test matrix into the browser.

Given steps may arrange prerequisites through a test API. When login or saving
is the behavior under test, perform that behavior through its real user path.
Keep step reuse domain-specific instead of creating a universal click/fill DSL.
Feature files without executed step definitions are specifications, not evidence.

## Report the boundary of confidence

Report the commands run, outcomes, and meaningful omissions. Distinguish real
browser execution, full-application execution, mocked external APIs, backend
integration, and visual checks. Assert hydration errors if collecting them;
a console listener alone does not make a test fail.

## Sources and inspiration

- [npmx Vitest configuration](https://github.com/npmx-dev/npmx.dev/blob/75329352ee47ef6d641ba547bc382b91ef73c68f/vitest.config.ts) and [Playwright configuration](https://github.com/npmx-dev/npmx.dev/blob/75329352ee47ef6d641ba547bc382b91ef73c68f/playwright.config.ts): Node unit, Nuxt-aware Browser Mode, and application E2E. The inspected E2E suite uses TypeScript specs; Gherkin and the MSW policy here are aop-mode choices, not claims about npmx.
- [Vitest Browser Mode](https://vitest.dev/guide/browser/): provider and project setup.
- [Playwright best practices](https://playwright.dev/docs/best-practices): observable behavior, isolation, and locators.
- [Playwright-BDD](https://github.com/vitalets/playwright-bdd): executable Gherkin on the Playwright runner.
- [MSW Node integration](https://mswjs.io/guides/integrations/node) and [browser integration](https://mswjs.io/guides/integrations/browser): process-specific interception and lifecycle.

Consult the installed versions and current official documentation when creating
configuration; this reference describes the setup contract rather than pinning
every consuming project to one version.
