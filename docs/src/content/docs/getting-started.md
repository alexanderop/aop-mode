---
title: Install aop-mode
description: Choose project-local skills or the Claude Code plugin, then invoke a workflow.
---

You can install project-local skills for Claude Code, Codex, or Copilot CLI,
or load the generated Claude Code plugin. You need Node.js 22.14 or newer, pnpm,
and a checkout of this repository.

## Install the dependencies

Run this from the aop-mode checkout:

```sh
pnpm install --frozen-lockfile
```

## Install project-local skills

Run the command for the agent you use, replacing the destination with your
project's absolute path:

```sh
# Claude Code
pnpm skills:install claude /absolute/path/to/your-project

# Codex
pnpm skills:install codex /absolute/path/to/your-project

# Copilot CLI
pnpm skills:install copilot /absolute/path/to/your-project
```

The installer copies the upstream skills, personal principles, and aop-mode
entrypoint into the target project. It refuses existing skill-name collisions
before writing the package. It does not change global instructions or install
a startup hook.

## Start a fresh session

Open a new coding-agent session in the target project so it discovers the skills.
Use the invocation for your agent:

| Agent | Installed location | Invocation |
| --- | --- | --- |
| Claude Code | `.claude/skills/aop-mode/` | `/aop-mode Fix the pagination bug` |
| Codex | `.agents/skills/aop-mode/` | `$aop-mode Fix the pagination bug` |
| Copilot CLI | `.github/skills/aop-mode/` | `/aop-mode Fix the pagination bug` |

Use the explicit command. A prose request alone may not activate the skill.
Some clients discover other clients' skill directories too; install only the
targets you need to avoid duplicate entries.

For non-interactive Copilot runs, explicitly request reading the installed
`.github/skills/aop-mode/SKILL.md`. See the
[installation reference](/aop-mode/installation-reference/) for tested invocation
limits, plugin packaging, updates, and removal.

## Load the Claude Code plugin

From the aop-mode checkout, build the packages:

```sh
pnpm skills:build
```

This generates `dist/claude`, including its `.claude-plugin/plugin.json` manifest
and bundled skills. Start Claude Code from the project where you want to work,
pointing it at the generated plugin:

```sh
claude --plugin-dir /absolute/path/to/aop-mode/dist/claude
```

This loads a local plugin for the session. It does not install the package from a
marketplace. The recorded live evaluation results cover project-local skill
installation; plugin loading has not been established by those runs.

The other build outputs, `dist/codex` and `dist/copilot`, are skill distributions.
The current builder emits a plugin manifest only for Claude Code.

## Try a bounded task

In Codex, for example:

```text
$aop-mode Fix the first page skipping items. Reproduce it before editing,
preserve the public API, and show the failing and passing checks.
```

Follow [Fix your first bug](/aop-mode/first-workflow/) for a complete example using
the evaluation suite, or read [how aop-mode works](/aop-mode/workflow/).
