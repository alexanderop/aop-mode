# aop-mode

Independent workflow project inspired by Lauren Tan's pstack. See NOTICE.md.
No startup hooks, global instruction edits, or implicit activation. Preserve explicit invocation.

- Pinned original source: `vendor/pstack/`, never hand-edit. Entry alias: `skills/aop-mode/`. Personal principles and their references: sibling directories under `skills/`. Runtime translations: `runtime/`. Full packaging: `src/distribution.ts`. Harness-specific mechanics: `src/harnesses.ts`.
- Evaluation lifecycle: `src/runner.ts`; independent outcome checks: `src/grade.ts`.
- Keep logs and graders outside candidate workspaces. A zero exit is not a pass.
- Each task must reject the broken fixture and accept its reference solution before live runs.
- `pnpm format`: Oxfmt for first-party files. `pnpm lint` / `pnpm lint:fix`: Oxlint checks / safe fixes.
- Never format `vendor/pstack/`, upstream locks, pinned schemas, or generated evidence.
- `pnpm verify`: types, lint, formatting, offline tests, Starlight build.
- `pnpm test:docs`: Playwright documentation journeys.
- `pnpm test:harnesses`: live authenticated CLI calls; consumes provider usage.
- Report tested CLI versions, tasks, and outcomes. Never turn blocked or untested into passing.
- Use pnpm, strict TypeScript, Effect for the evaluation lifecycle, Vitest for runner behavior.
- Do not publish raw evaluation transcripts or credentials. Do not install globally as part of testing.
