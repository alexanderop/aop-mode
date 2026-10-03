---
title: Getting started
description: Install aop-mode into one project and invoke it explicitly.
---

aop-mode installs 52 upstream skills, two personal principles, and its own project-local entrypoint. It does not change your global instructions or
register a startup hook. Use Node.js 22.14 or newer and pnpm.

## Install from this checkout

```sh
pnpm install --frozen-lockfile
pnpm skills:install claude /absolute/path/to/your-project
pnpm skills:install codex /absolute/path/to/your-project
pnpm skills:install copilot /absolute/path/to/your-project
```

Install only the targets you use. The installer refuses to overwrite an existing
skill name, before writing any of the package. These are copies: updating this checkout does not silently change installed
skills. To update, inspect the existing target and replace the installed catalog entries with a reviewed copy. To uninstall, remove
only the 55 installed catalog directories, preserving unrelated skills.

| Harness | Installed location | Invocation |
| --- | --- | --- |
| Claude Code | `.claude/skills/aop-mode/` | `/aop-mode Fix the pagination bug` |
| Codex | `.agents/skills/aop-mode/` | `$aop-mode Fix the pagination bug` |
| Copilot CLI | `.github/skills/aop-mode/` | `/aop-mode Fix the pagination bug` |

Start a fresh session after installation so discovery reflects the new files.
Some clients also discover another client's skill directories; avoid duplicate
copies in a shared project if they produce duplicate entries.

## Ask for a bounded outcome

```text
/aop-mode Fix the first page skipping items. Reproduce it before
editing, preserve the public API, and show the failing and passing checks.
```

```text
/aop-mode Review the access-control change. Report concrete defects
with triggers and file locations. Do not modify files.
```

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
