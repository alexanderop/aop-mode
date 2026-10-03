---
title: Workflow pilot evidence
description: What the first Codex and Copilot workflow trials actually established.
---

Local trials on **2026-10-03** used **Codex CLI 0.160.0** and **GitHub Copilot CLI
1.0.80**. These are development pilots with host-default models, not a controlled
model comparison or a reliability estimate. Raw events and workspaces remain
private. Workflow checks were replayed after decoder fixes; original results were
preserved, and independent outcome checks were retained.

## Results

| Scenario | Codex | Copilot | What the evidence establishes |
| --- | --- | --- | --- |
| Ordinary task, three conditions | Passed 3/3 | Passed 3/3 | Exact requested artifact, no observed mode activation or native delegation, no unrelated workspace edits |
| Read-only investigation | Failed workflow; outcome passed | Failed workflow; outcome passed | Both diagnosed the shared deadline and preserved files; neither trace established the required delegation |
| Rate-limiter prototype, clarified contract | Failed workflow; outcome passed | Incomplete workflow; outcome passed | Both ran comparisons and passed independent policy checks; full required instruction loading was not established |
| Architecture with review checkpoint | Blocked | Blocked | Both reached the 180-second deadline; neither completed the required design artifacts |

The ordinary task ran once in each condition: package installed with the ordinary
prompt, installed-inactive, and package absent. It never requests mode activation.
The three engineering scenarios above each ran once per harness with explicit
invocation. Baseline and inactive engineering scenarios are available but were not
run in this pilot.

## Differences exposed by the traces

- Codex read a personal aop-mode installation during the engineering scenarios.
  The evaluator flags this as source contamination; it does not credit the personal
  copy as a successful read of the freshly installed project package.
- Copilot's investigation trace established reads of the project entrypoint,
  runtime contract, Investigation playbook, and `how` skill. Complete router and
  `unslop` content were not established.
- Copilot's corrected prototype trace established reads of the entrypoint,
  runtime contract, and Prototype playbook. Complete router and design-space
  principle content were not established.
- Copilot's architecture trace included two native candidate task calls. Their
  returned results, subsequent cross-judge, and verified design were not established
  before timeout. Launching tasks alone does not pass the delegation contract.
- Child model identities were not established. No model-diversity claim follows
  from these trials.

## An eval defect found during qualification

The first live prototype prompt did not specify whether rejected requests consume
quota. Copilot chose to count all attempts, while the grader counted admitted
requests. That mismatch was an underspecified task, not a confirmed coding defect.
Those two initial prototype trials are excluded from the table.

The corrected prompt specifies that only admitted requests consume capacity,
fixes window boundaries and event order, and retains the same public function
contract. Both harnesses were rerun against it. Calibration also rejects a
prototype that incorrectly counts denied requests.

## Reproduce and inspect

```sh
pnpm eval:workflows --list
pnpm eval:workflows --harness codex --task investigation --timeout 180
pnpm eval:workflows --harness copilot --task prototype --timeout 180
```

Live commands consume provider usage. For model-controlled comparisons, supply
`--model` with an identifier available to your account. Use `--condition all` and
`--attempts 3` to collect separate repeated observations, not replacement retries.
See [Workflow evaluations](/aop-mode/workflow-evals/) for contracts, observability
limits, private reports, and replay without model calls.
