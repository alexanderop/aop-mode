---
title: Choose a workflow
description: Trigger phrases, when to use each playbook, and how to choose between autopilot-full and autopilot-stack.
---

After you explicitly invoke `aop-mode`, describe the work you want done. Its router
uses your request to choose a playbook. Phrases such as **full autopilot**,
**autopilot-stack**, and **get it green** are supported routing cues in the bundled
instructions. You can also describe the task in ordinary language.

These phrases do not activate the plugin on their own. They are instructions for
the agent to interpret, not commands parsed by a keyword engine. The requested
task and your constraints determine the route.

## Invoke the entrypoint first

With the Codex plugin, select **`aop-mode:aop-mode`** in the client's skill picker,
then enter one of the example requests below. With the Claude Code plugin, prefix
the request with `/aop-mode:aop-mode`. For Copilot, explicitly select the installed
skill using the client interface; headless slash expansion has not been established.

For project-local skill copies, use `$aop-mode` in Codex or `/aop-mode` in Claude
Code and interactive Copilot CLI. See [plugin installation](/aop-mode/plugin-installation/)
and [project-local installation](/aop-mode/getting-started/) for setup.

Name the scope, the completion check, and any limits in your request. For example,
after selecting the entrypoint:

```text
Autopilot-stack these changes: validate the import format, add an import preview,
and save confirmed imports. Build and verify one PR per change, in that order.
Keep the existing public API. Do not merge or arm auto-merge; I'll land the stack.
```

The mode applies to that requested task. It does not become a permanent session
setting or enable startup hooks.

## Choose the amount of autonomy

| Request or phrase                                                                  | Use it when                                                          | Intended result                                                                                                                       |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Run until done**                                                                 | One bounded task needs sustained work and a clear completion check.  | Autonomous run: continue until the condition is met or a real blocker is reported.                                                    |
| **Run this whole project**, **own this migration until it lands**                  | A standing project needs coordination across many phases and PRs.    | Orchestrate: one coordinator manages the program and verified delivery. A task that fits one session still belongs in Autonomous run. |
| **Full autopilot**, **autopilot this queue**                                       | You have independent PRs and explicitly authorize their landing.     | Autopilot-full: one owner builds each PR through merge, subject to independent verification and your gates.                           |
| **Autopilot-stack**, **stack them, don't ship**, **build the stack, I'll land it** | Changes depend on one another, or you want to review before landing. | Autopilot-stack: deliver one linear, verified PR stack. You retain landing authority.                                                 |

**Autopilot-full can merge authorized PRs. Autopilot-stack does not merge, arm
auto-merge, or close them.** Asking to state a plan is not permission to execute it.
Operator-owned items and explicit review checkpoints remain with you.

For one task with no publishing authority:

```text
Run until done: fix CSV imports with quoted commas and embedded newlines.
Done means the regression cases and existing import tests pass. Keep all work
local; do not commit, push, or open a PR.
```

For independent changes with landing authority:

```text
Full autopilot this queue: fix the pagination boundary, correct the broken
documentation link, and add the missing empty-state label. Use one PR per item.
You may merge each after independent verification and required checks pass.
```

## Choose a task workflow

| Request or phrase                                                           | Use it when                                                                | Playbook and deliverable                                                         |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **How does this work?**, **should we do X or Y?**                           | You need an evidence-based answer before changing code.                    | Investigation: a read-only analysis.                                             |
| **Fix this bug**                                                            | Behavior is wrong and can be reproduced.                                   | Bug fix: reproduction, root cause, repair, and runtime verification.             |
| **Improve this slow operation**                                             | You have a performance problem to measure against a baseline.              | Perf issue: one measured improvement.                                            |
| **Hillclimb this metric**                                                   | You want repeated experiments toward a measurable target.                  | Hillclimb: before/after measurements and a decision log for accepted changes.    |
| **Diagnose this leak or idle CPU spin**                                     | The symptom is available in a running process.                             | Runtime forensics: an instrumented diagnosis.                                    |
| **Analyze this trace or heap snapshot**                                     | You already captured a profiling artifact.                                 | Trace forensics: a diagnosis from the capture.                                   |
| **Add this feature**                                                        | You want new or changed behavior.                                          | Feature: implementation and verification from a defined data shape.              |
| **Refactor this module**                                                    | Structure should change while observable behavior stays the same.          | Refactoring: a behavior-preserving change.                                       |
| **Prototype**, **mock it up**, **try this layout**, **sketch it to decide** | A small experiment can settle a design question.                           | Prototype: a disposable sketch and a decision based on what it shows.            |
| **Match this UI exactly**                                                   | Two implementations or a styling migration need visual equivalence.        | Visual parity: comparison against the reference surface.                         |
| **Write or update this skill**                                              | You need to create or change a `SKILL.md`.                                 | Authoring a skill: a scoped skill change.                                        |
| **Evaluate this prompt or skill change**                                    | You need evidence about agent behavior before adopting a change.           | Eval: a behavioral evaluation.                                                   |
| **Plan this multi-phase change**                                            | Work needs explicit phases or stacked PRs.                                 | Multi-phase plan: sequencing and verification checkpoints.                       |
| **Pick up this session**                                                    | Another session left work in a transcript or pushed branch.                | Session pickup: reconstruct state and continue from evidence.                    |
| **Pause safely**                                                            | You explicitly want to suspend work and resume later.                      | Pause safely: preserve the handoff state.                                        |
| **Clean up worktrees**, **free up space**, **delete old simulators**        | You want to reclaim space from eligible worktrees or stale iOS simulators. | Worktree and simulator cleanup: inventory candidates and respect deletion scope. |
| **Open a PR**                                                               | A completed change needs a reviewable handoff.                             | Opening a PR: a scoped PR with verification evidence.                            |

These examples express intent; you do not need to memorize exact wording. Large,
cross-cutting tasks or tasks that do not fit a bundled playbook can route to
`figure-it-out`, which designs a task-specific plan. A standing project uses
Orchestrate instead.

## Check, prepare, or ship a PR

PR status phrases have different scopes. A status question does not grant merge
authority, and opening a PR alone does not start an ongoing babysitting loop.

| Phrase                                                              | When to use it                                        | Scope                                                                                                                                                                    |
| ------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Check on PR X**, **is it green?**, **anything outstanding on X?** | You want a current status report.                     | Babysit in `check` mode: one status pass and report.                                                                                                                     |
| **Address the bugbot comments**                                     | You want review findings assessed and addressed.      | Babysit in `threads-only` mode: review comments only.                                                                                                                    |
| **Babysit this**, **get it green**, **make it merge-ready**         | You want active work toward merge readiness.          | Babysit in `drive` mode: triage blockers and fix owned issues. Conflicts needing a rebase are reported to the branch or stack owner. Small or docs-only PRs use `check`. |
| **Ship this stack**, **land these PRs**                             | You authorize landing after independent verification. | Shipping: verify each PR and land only the contiguous verified sequence from the bottom of the stack.                                                                    |

For example:

```text
Check on PR 42. Report failed checks, unresolved review threads, and mergeability.
Do not edit files or merge anything.
```

## What is supported and what is verified

The routing cues and playbooks above are included in the plugin. The
[bundled router](https://github.com/alexanderop/aop-mode/blob/main/vendor/pstack/skills/poteto-mode/SKILL.md)
defines their selection; the
[runtime contract](https://github.com/alexanderop/aop-mode/blob/main/runtime/common.md)
defines how they run on each host. They do not grant tools or permissions that the
host lacks, and user constraints remain authoritative.

Autopilot playbooks include cloud-agent and scheduled-audit steps. The package does
not supply a persistent background service, a scheduler, or Cursor cloud agents.
Local worktrees can substitute only when the task does not require cloud execution
or persistence, and the agent must disclose the substitution. `/loop` requires an
available scheduler and explicit authorization; a foreground session does not keep
running after it exits. Independent reviews require native delegation, and
multi-model reviews require access to the requested models.

Packaging and discovery checks establish that these instructions are available.
They do not establish that every workflow completes correctly on every host.
Full autopilot execution is not established by the published workflow pilots.
Read [workflow pilot evidence](/aop-mode/evidence/workflows/) for actual results
and [runtime compatibility](/aop-mode/compatibility/) for prerequisites and blocked
steps. An unavailable step must be reported as unavailable, never as passing.
