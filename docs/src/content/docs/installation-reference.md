---
title: Installation reference
description: Update, remove, and package project-local skills, with runtime invocation details.
---

## Updates and removal

Install only the targets you use. The installer refuses to overwrite an existing
skill name, before writing any of the package. These are copies: updating this checkout does not silently change installed
skills. To update, inspect the existing target and replace the installed catalog entries with a reviewed copy. To uninstall, remove
only the 56 installed catalog directories, preserving unrelated skills.

## Plugin packaging

In Codex, use `$aop-mode` in place of `/aop-mode`. Prefer the explicit command:
with implicit invocation disabled, asking in prose alone may leave a skill
unavailable to the model's skill tool, as observed in Copilot CLI 1.0.80.
For non-interactive Copilot runs, explicitly ask it to read
`.github/skills/aop-mode/SKILL.md`; see [the tested headless behavior](/aop-mode/testing/).

Run `pnpm skills:build` to generate complete packages at `dist/claude`,
`dist/codex`, and `dist/copilot`. The Claude package includes its plugin manifest;
for local plugin loading use `claude --plugin-dir /absolute/path/to/aop-mode/dist/claude`.
Project-local installation is the tested path, **not marketplace installation**.
Do not interpret a passing task run as a marketplace compatibility claim.

Official references: [Codex skills](https://developers.openai.com/codex/skills/),
[Claude skills](https://code.claude.com/docs/en/skills), and
[Copilot skills](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills).
