---
title: Workflow evaluations
description: Inspect which skills, playbooks, and native subagents Codex and Copilot actually use.
---

A successful answer does not establish that aop-mode's workflow ran. These evals
separate instruction loading, native delegation, verification, task outcomes,
and scope boundaries. They exercise Codex CLI and GitHub Copilot CLI against the
same small webhook service.

The [first local pilot](/aop-mode/evidence/workflows/) records actual results,
including workflow failures, incomplete evidence, and timeouts.

## Start with discovery

Listing makes no model calls and needs no authentication:

```sh
pnpm eval:workflows --list
pnpm eval:workflows --list --condition all --attempts 3
```

Run the offline qualification suite before using provider usage:

```sh
pnpm exec vitest run tests/workflows.test.ts
```

The suite accepts reference outcomes and rejects deliberate defects. Synthetic
native event fixtures qualify the event decoder; they are not live compatibility
evidence. Existing installer tests cover package completeness and collisions.

## Run a real workflow

Authenticate each CLI normally, then start with one scenario:

```sh
pnpm eval:workflows --harness codex --task investigation --timeout 300
pnpm eval:workflows --harness copilot --task investigation --timeout 300
```

These commands consume provider usage. Use `--model <available-model-id>` with one
harness to control its model. Without it, the CLI default is recorded as
uncontrolled. Parent defaults and requested child models do not prove which model
actually ran each child.

The default suite has four scenarios and only Codex and Copilot. Trials run
sequentially. The default is one attempt per scenario, a 300-second deadline,
and the explicit condition. A timeout limits time, not spend.

## Scenario contracts

| Scenario      | Natural task                                          | Required workflow evidence                                                                                               | Independent outcome                                                                               |
| ------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Investigation | Explain intermittent webhook timeouts without editing | Entry, runtime, router, Investigation playbook, `how`, `unslop`; parallel explorers, returned results, then an explainer | Shared deadline diagnosis grounded in fixture evidence; repository unchanged                      |
| Prototype     | Compare fixed and sliding window limiting             | Entry, runtime, router, Prototype playbook, design-space principle; actual comparison command                            | Executable policies checked on multiple limits, windows, tenant combinations and boundaries       |
| Architecture  | Architect a limiter and stop for review               | Entry, runtime, router, `architect`, `how`, `arena`, design references; independent candidates followed by a judge       | Exported interface and caller sketch typecheck; rationale compares policies; production unchanged |
| Ordinary      | Create an exact text file                             | No observed activation or native delegation                                                                              | Exact file and response; no unrelated edits                                                       |

Architecture routes through a skill, not a fictional architecture playbook.
Prototyping does not unconditionally require subagents. Investigation does here
because the requested runtime trace crosses delivery, retry, and transport modules.
The contracts are grounded in the pinned upstream files, and each run saves their
contents in its private `contract.json` alongside the package hash.

These are selected mandatory steps, not exhaustive checks of every instruction.
The architecture outcome grader checks concrete artifacts and type correctness;
it does not establish that one architecture is universally better. Read the
rationale when assessing design quality.

## Compare activation conditions

```sh
pnpm eval:workflows --harness codex --task investigation --condition all --attempts 3
```

- `explicit`: install the full package and explicitly invoke it. Enforce the
  workflow contract and the outcome contract.
- `inactive`: install the package but send the ordinary task prompt. Check for
  unwanted activation and grade the same outcome. Do not require mode delegation.
- `baseline`: omit the package. Grade the same outcome and retain the tool trace.

The ordinary scenario never invokes the mode, including in the explicit matrix.
Repeated attempts remain separate rows. There are no retries that replace failures
and no leaderboard or statistical effectiveness claim from this small sample.
Keep models, CLI versions, permissions, task fixtures, and trial counts fixed when
comparing conditions. Cross-harness differences are not automatically caused by
the harness; models and local configuration also differ.

## Read the evidence

Each run creates a private directory under `.eval-artifacts/workflows-<timestamp>/`:

```text
summary.md                 Every completed attempt, linked to its report
summary.json               Structured completed results
codex-investigation-…/
  report.md                Separate verdicts with native event line references
  result.json              Versions, condition, invocation, hashes, checks
  contract.json            Scenario and pinned source instructions
  stdout.jsonl             Native CLI events
  trace.json               Decoded calls and native delegates
  command.json             Exact invocation
  baseline.json            Original workspace snapshot
  final.txt                Agent's final answer
```

Reports retain all completed attempts. An interrupted trial saves its own blocked
`result.json` and partial process logs. The workspace path is recorded in the
result. Graders, contracts, and raw transcripts live outside the candidate
workspace. Keep this evidence private; it can contain local context.

A loading check requires a successful native read, the installed path, and the
complete file content in tool output. Catalog listings, final-answer claims,
failed reads and partial excerpts do not pass. The matched path must belong to the candidate workspace. Reading a personal copy
of aop-mode fails a separate source-isolation check. Reads split across several known
tools can establish content coverage. Relative paths are interpreted from the initial workspace; explicit shell directory
changes, indirect scripts, and injected context can make reads unobservable.
The CLI stream may omit tool working-directory changes, so use absolute paths
when inspecting a disputed read.

Codex collaboration events and Copilot native `task` calls establish delegation.
A spawn acknowledgement is not a completed agent result. Overlapping native agent
lifetimes establish observed fan-out, not simultaneous CPU scheduling. The
follow-up judge or explainer must start after candidate results return. A separate
check looks for returned evidence in the follow-up prompt; rewritten summaries
and artifact-only handoffs remain unobservable rather than being accepted on faith.
Copilot background task handles are not treated as completed findings.

Child model identity is currently unobservable in these adapters. A requested
model or the model attached to a parent tool call cannot establish model diversity.

## Replay the workflow grading without model calls

```sh
pnpm eval:regrade .eval-artifacts/workflows-<timestamp>/<trial-directory>
```

This decodes the saved native events against the original installed snapshot and
scenario contract. It writes timestamped `regraded-*.json` and `regraded-*.md`
files, preserving the original result. Workflow and recorded execution checks are
recomputed; independent outcome checks are retained. It does not rerun candidate
code or assume the retained workspace is unchanged. Reports record the evaluator
hash separately from the skill hash.

## Interpret verdicts

Individual checks use `passed`, `failed`, `unobservable`, or `unsupported`.
`unsupported` is reserved for established capability limitations; a model saying
"I cannot do that" is not sufficient proof. The current decoder conservatively
uses unobservable when evidence is missing.

A trial is `passed` only when every required check passes. A definite check failure
makes it `failed`. Otherwise missing evidence makes it `incomplete`. CLI errors,
authentication problems, timeouts, and unsuccessful terminal events make it
`blocked`, retaining any partial checks. No missing evidence becomes green.

Codex invocation uses `$aop-mode`. Copilot's headless adapter explicitly names the
installed `SKILL.md`; its reports label invocation `file-path`. This does not test
native slash-command expansion, IDEs, or cloud agents.

The runner reuses the existing process lifecycle and installer. It grants Copilot
its native task tool in addition to the existing limited tool permissions. It does
not install globally or edit personal configuration. Temporary workspaces are not
hostile-agent sandboxes: existing authentication, personal skills and managed
configuration can still affect a trial. Use a dedicated account or container for
controlled comparisons. Hidden reasoning is outside this suite's claims.

## Add a scenario

Add its natural prompt and pinned requirements in `src/workflows/cases.ts`.
Specify delegation only when the workflow and fixture scope require it. Add
independent outcome checks in `src/workflows/grade.ts`, then qualify them with both
a reference artifact and deliberate failures in `tests/workflows.test.ts` before
running a live trial. Do not put expected skill paths or grading answers in the
candidate prompt just to make routing checks pass.
