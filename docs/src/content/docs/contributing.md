---
title: Contributing
description: Improve aop-mode with small changes backed by reproducible evidence.
---

```sh
pnpm install --frozen-lockfile
pnpm verify
pnpm test:docs
```

For adapter or skill changes, run the affected live tasks and include the CLI
version, task, and sanitized outcome in your change description. A broken workflow
should first become a reproducible task. Keep the task small enough to diagnose.

Keep explicit activation intact. Do not add startup hooks, global instruction
mutations, or a hidden automatic mode. New capabilities need their own evidence;
a repair fixture cannot establish multi-agent or browser compatibility.

The initial tests are local. CI runs offline checks and documentation browser tests;
live provider calls are separate because they require authenticated CLIs and usage.

The skill uses the documented `disable-model-invocation` frontmatter extension and
Codex's `agents/openai.yaml` policy. Older generic skill validators may reject that
extension; do not remove explicit-invocation controls to satisfy an outdated
allowlist. Verify behavior in the supported harnesses.

See [credits](/credits/) before reusing upstream material. Preserve author notices
and describe adaptations. aop-mode is independently maintained and has no automatic
sync relationship with pstack.

## Updating original pstack

Do not edit `vendor/pstack`. Import a reviewed immutable upstream commit using
`pnpm exec tsx scripts/import-pstack.ts --source /path/to/cursor-plugins --revision <40-character-sha>`.
The importer refuses to replace modified vendored files. Review the lock and source
diff, update the catalog and attribution revision, then run `pnpm verify`. Put
platform adaptations in `runtime/`, not in original workflow text.
