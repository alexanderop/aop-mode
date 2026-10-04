---
title: Complete skill catalog
description: Every skill and playbook from the pinned original pstack source.
---

Pinned pstack v0.15.6 at `23e4138daa01c42d4969f7a5465f82704e64f798`.

49 main skills, three automation skills, five personal principles, three local workflow skills, and the additional `aop-mode` entrypoint
are installed for each harness. Original source is byte-for-byte preserved.
This inventory proves inclusion, not end-to-end execution of every workflow.

| Skill                                                | Source category    |
| ---------------------------------------------------- | ------------------ |
| `asd`                                                | aop-mode skill     |
| `improve-codebase-architecture`                      | aop-mode skill     |
| `visual`                                             | aop-mode skill     |
| `principle-compose-ui-variants`                      | aop-mode principle |
| `principle-design-calm-interfaces`                   | aop-mode principle |
| `principle-functional-core`                          | aop-mode principle |
| `principle-test-at-the-right-layer`                  | aop-mode principle |
| `principle-make-dependencies-explicit`               | aop-mode principle |
| `reproduce-and-fix-issues`                           | automation         |
| `setup-benny`                                        | automation         |
| `triage-issue-reports`                               | automation         |
| `architect`                                          | skill              |
| `arena`                                              | skill              |
| `automate-me`                                        | skill              |
| `benchmark-checklist`                                | skill              |
| `blast-radius`                                       | skill              |
| `bro`                                                | skill              |
| `create-verification-skill`                          | skill              |
| `figure-it-out`                                      | skill              |
| `how`                                                | skill              |
| `interrogate`                                        | skill              |
| `maintain-verification-skill`                        | skill              |
| `make-bot-ui`                                        | skill              |
| `no-comments`                                        | skill              |
| `poteto-mode`                                        | skill              |
| `principle-attack-the-premise`                       | skill              |
| `principle-boundary-discipline`                      | skill              |
| `principle-build-the-lever`                          | skill              |
| `principle-encode-lessons-in-structure`              | skill              |
| `principle-exhaust-the-design-space`                 | skill              |
| `principle-experience-first`                         | skill              |
| `principle-explain-the-number`                       | skill              |
| `principle-fix-root-causes`                          | skill              |
| `principle-foundational-thinking`                    | skill              |
| `principle-guard-the-context-window`                 | skill              |
| `principle-laziness-protocol`                        | skill              |
| `principle-make-operations-idempotent`               | skill              |
| `principle-migrate-callers-then-delete-legacy-apis`  | skill              |
| `principle-minimize-reader-load`                     | skill              |
| `principle-model-the-domain`                         | skill              |
| `principle-never-block-on-the-human`                 | skill              |
| `principle-outcome-oriented-execution`               | skill              |
| `principle-prove-it-works`                           | skill              |
| `principle-redesign-from-first-principles`           | skill              |
| `principle-separate-before-serializing-shared-state` | skill              |
| `principle-sequence-verifiable-units`                | skill              |
| `principle-subtract-before-you-add`                  | skill              |
| `principle-test-behavior-not-implementation`         | skill              |
| `principle-type-system-discipline`                   | skill              |
| `recall`                                             | skill              |
| `reflect`                                            | skill              |
| `setup-pstack`                                       | skill              |
| `show-me-your-work`                                  | skill              |
| `swarm`                                              | skill              |
| `tdd`                                                | skill              |
| `teach`                                              | skill              |
| `technical-writing`                                  | skill              |
| `typescript-best-practices`                          | skill              |
| `unslop`                                             | skill              |
| `why`                                                | skill              |

Read [Personal principles](/aop-mode/principles/) for frontend testing, explicit dependencies, functional core design, UI composition, and calm interface design.

## Architecture survey

Invoke `$improve-codebase-architecture` in Codex or
`/improve-codebase-architecture` in Claude Code/Copilot CLI. Name a subsystem to
focus the review, or let recent changes guide the survey. It traces real behavior
and opens a visual report with ranked proposals, before/after diagrams, migration
risks, and verification needs. Reports go to the OS temporary directory by default.

Use this skill to choose useful changes in an existing codebase. Use `architect`
to design a chosen change. The survey leaves application code unchanged unless
you also request implementation. It uses `visual` and `asd` for presentation.

## Original playbooks

- `authoring-a-skill`
- `autonomous-run`
- `autopilot-full`
- `autopilot-stack`
- `babysit`
- `bug-fix`
- `eval`
- `feature`
- `hillclimb`
- `investigation`
- `multi-phase-plan`
- `opening-a-pr`
- `orchestrate`
- `pause-safely`
- `perf-issue`
- `prototype`
- `refactoring`
- `runtime-forensics`
- `session-pickup`
- `shipping`
- `trace-forensics`
- `visual-parity`
- `worktree-cleanup`

The complete pack also contains two agent prompts, 35 reference files, and 21
script files. See [runtime compatibility](/aop-mode/compatibility/) for external dependencies.
