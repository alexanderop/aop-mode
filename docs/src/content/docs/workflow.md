---
title: The workflow
description: Full upstream playbooks with explicit activation and transparent runtime adaptations.
---

Invoke `aop-mode` to load the original **poteto-mode** router, its principle index,
and its full task playbooks. Invoke an individual skill such as `tdd`, `how`,
`interrogate`, `architect`, or `unslop` to use that workflow directly.

The package contains all 49 main skills, including 24 principle skills, plus all
three Benny automation skills. Nothing from the pinned upstream tree is omitted.
See the [complete catalog](/catalog/) for names and the 23 playbooks.

## Explicit activation

No session-start hook enables the mode. Entry wrappers disable implicit invocation
and Codex wrappers also include `allow_implicit_invocation: false`. During an
explicit task, a workflow can read the other upstream skills it depends on.
Original Cursor `mode` and `reminder` metadata do not create a standing mode here.

## What the adapter changes

Wrappers first load the target runtime contract, then the original skill in full.
Relative links and scripts resolve from the original file. Tool names and delegate
roles map to the tools actually exposed by the host. Default models inherit the
parent; configured roles use verified available model IDs. `setup-pstack` writes
project-local `.aop-mode/models.md`, not a global Cursor rule.

The original two agent role prompts are bundled and supplied to native delegates
when requested. They are not automatically registered as always-available agents.

## Content parity is not runtime parity

All original content is present and verified by hashes. Cursor cloud agents,
webhook automations, transcript storage, mixed-model availability, and external
`cursor-team-kit` dependencies still require host capabilities or configuration.
The adapter reports unsupported steps instead of pretending they ran.

Read the [compatibility limits](/compatibility/) and [live evidence](/evidence/latest/).
A small task suite cannot establish end-to-end success for all 52 workflows.
