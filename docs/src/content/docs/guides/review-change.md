---
title: Review a change
description: Ask for concrete findings while keeping the working tree unchanged.
---

Use a review workflow when you want findings before making edits. First,
[install the skills](/aop-mode/getting-started/) in your project and start a fresh
coding-agent session.

## Define the scope and intended behavior

Name the changed file or revision and explain what should happen. For example,
in Codex:

```text
$aop-mode Review src/access.ts. A public document is readable by anyone;
a private document is readable only by its owner. Report correctness defects
with a concrete trigger, consequence, and file location. Do not modify or
create files in the repository.
```

Use `/aop-mode` in Claude Code or interactive Copilot CLI.

## Check each finding

For the access-control example, a useful finding identifies the inverted owner
comparison, shows a non-owner reading a private document, and points to the
condition responsible. A broad recommendation to improve security does not
establish that defect.

Compare each reported trigger with the implementation. Check your working tree
against its state before the review to confirm the agent left files unchanged.

## Reproduce the evaluation example

The suite includes this access-control task. From the aop-mode checkout, with an
authenticated Codex CLI, run:

```sh
pnpm test:harnesses --harness codex --task review
```

This consumes provider usage. The runner creates a separate task workspace and
checks both the finding and whether candidate files changed. Read
[the evaluation guide](/aop-mode/testing/) to inspect the result and understand
what this task establishes.
