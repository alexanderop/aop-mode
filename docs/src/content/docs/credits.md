---
title: Credits & inspiration
description: Original pstack source by Lauren Tan, packaged with explicit runtime adaptations.
---

## Original ideas and workflows

The original workflow ideas, skills, principles, and playbooks come from
[pstack](https://github.com/cursor/plugins/tree/main/pstack), created by
[Lauren Tan (poteto)](https://github.com/poteto). This includes the poteto-mode
router that aop-mode uses to select a task's workflow.

aop-mode builds on Lauren's work. All original skills, playbooks, references,
scripts, agents, and automation files are included in the package.

## Source and license

The complete v0.15.6 tree is pinned at
`23e4138daa01c42d4969f7a5465f82704e64f798`. Its 160 files retain their original
bytes and executable modes. Copyright (c) 2026 Lauren Tan. The original MIT
license accompanies the vendor tree and every installation.

## What aop-mode adds

aop-mode is an independent project by Alexander Opalic, not a GitHub fork or an
official port. Its additions are explicit-only wrappers, runtime adaptations,
personal principles, installation, evaluation tooling, and these Astro Starlight docs. The adapters
change activation and host mechanics; they do not claim Cursor feature parity.

## Adaptation reference

[Michael Denyer's pstack-claude](https://github.com/michael-denyer/pstack-claude)
helped inform the research into cross-harness packaging. Its code and automatic
routing hook are not included. No endorsement by either upstream project is implied.

See `NOTICE.md`, `LICENSE`, `vendor/pstack/LICENSE`, and `upstream.lock.json` in
this checkout for attribution and reproducible provenance.
