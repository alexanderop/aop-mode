---
name: aop-mode
description: Explicitly invoke the complete original pstack workflow, adapted for Claude Code, Codex, or Copilot. Use only when the user requests aop-mode.
disable-model-invocation: true
---

# aop-mode

Read `runtime.md` fully, then read `.upstream/skills/poteto-mode/SKILL.md` fully.
Follow its routing, principles, and complete playbooks for the requested task,
using the runtime contract for platform mechanics and activation policy.

All 52 upstream skill entrypoints are listed in `catalog.json`. Preserve the
original workflow and follow its relative references from the original file's
directory. The runtime contract identifies dependencies that are not portable.
Do not substitute a shorter workflow for the original.

During this explicit invocation, also apply the relevant personal principles:

- For frontend test setup, feature verification, or coverage review, read
  `../principle-test-at-the-right-layer/SKILL.md`.
- When designing dependencies or replacing dependencies in tests, read
  `../principle-make-dependencies-explicit/SKILL.md`.
- When business decisions mix with I/O or need explicit outcomes and states, read
  `../principle-functional-core/SKILL.md`.
- When UI variants duplicate behavior or props select different component trees, read
  `../principle-compose-ui-variants/SKILL.md`.

- When designing, implementing, or reviewing UI appearance and interactions, read
  `../principle-design-calm-interfaces/SKILL.md`.
- When designing, implementing, or reviewing responsive web experiences, read
  `../principle-design-mobile-first/SKILL.md`.

- Only when building, improving, or reviewing a Progressive Web App or its app lifecycle, read
  `../principle-build-resilient-pwas/SKILL.md`. Do not load it for ordinary responsive
  websites, native apps, or unrelated work in a PWA repository.

These are aop-mode additions listed in `personal-catalog.json`, not upstream
pstack content. Load their supporting references only when needed.
