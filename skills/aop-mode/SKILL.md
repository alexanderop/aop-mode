---
name: aop-mode
description: Explicitly invoke the complete original pstack workflow, adapted for Claude Code, Codex, or Copilot. Use only when the user requests aop-mode.
disable-model-invocation: true
---

# aop-mode

Read `runtime.md` fully, then read `upstream/skills/poteto-mode/SKILL.md` fully.
Follow its routing, principles, and complete playbooks for the requested task,
using the runtime contract for platform mechanics and activation policy.

All 52 upstream skill entrypoints are listed in `catalog.json`. Preserve the
original workflow and follow its relative references from the original file's
directory. The runtime contract identifies dependencies that are not portable.
Do not substitute a shorter workflow for the original.
