---
title: Install the plugin
description: Install the ready-built aop-mode package in Claude Code, Codex, or Copilot CLI.
---

The plugin archive contains the complete skills and runtime instructions for all
three coding agents. You need your coding agent's CLI; installing the archive
requires no Node.js, pnpm, or source build.

## Get the package

The repository's verification workflow produces an **aop-mode-plugins** artifact
containing `aop-mode-0.1.0.tar.gz` and its SHA-256 checksum. Download the artifact
from a successful run in [GitHub Actions](https://github.com/alexanderop/aop-mode/actions).
This is a CI download, not a listing in a public plugin directory.

If you are working from a checkout before an artifact has been published, build it:

```sh
pnpm install --frozen-lockfile
pnpm plugins:pack
```

The archive and checksum appear in `dist/releases/`. Extract the archive to a
stable location:

```sh
tar -xzf aop-mode-0.1.0.tar.gz
```

The extracted folder includes `INSTALL.md`, attribution, three plugin packages,
and local marketplace catalogs. Choose your coding agent below. Replace the
example absolute path with the extracted folder's actual path.

## Claude Code

```sh
claude plugin marketplace add /absolute/path/to/aop-mode-0.1.0
claude plugin install aop-mode@aop-mode-local
claude plugin details aop-mode
```

For a single session without a persistent installation, start Claude Code in your
project with:

```sh
claude --plugin-dir /absolute/path/to/aop-mode-0.1.0/plugins/claude
```

Plugin skills are namespaced. In a fresh session, use
`/aop-mode:aop-mode Fix the pagination bug` or select `/aop-mode:tdd`.

## Codex

```sh
codex plugin marketplace add /absolute/path/to/aop-mode-0.1.0
codex plugin add aop-mode@aop-mode-local
codex plugin list --marketplace aop-mode-local
```

Start a fresh session. Codex 0.160.0 exposes names such as `aop-mode:aop-mode` and
`aop-mode:tdd` in its native skill inventory. Select the namespaced skill in the
client's skill picker. Project-local skill copies use different names.

## Copilot CLI

```sh
copilot plugin marketplace add /absolute/path/to/aop-mode-0.1.0
copilot plugin install aop-mode@aop-mode-local
copilot plugin list
```

Start a fresh session and explicitly select the installed skill. Prefer the
marketplace route: the tested CLI warns that direct directory installation is
deprecated. Headless slash expansion is not established by this installation test.

## What installation establishes

The [installation evaluation](/aop-mode/plugin-evaluation/) checks registration,
installed files, skill discovery, changed-version updates, and removal in isolated
client configuration directories. It does not call a model or claim that every
workflow executes correctly through the plugin.

All packages retain explicit-only skill metadata. They include no startup hooks,
MCP servers, or global instruction files. Avoid installing duplicate project-local
copies of the same skills alongside the plugin.

For updates, removal, and the standard manifest layout, see the
[installation reference](/aop-mode/installation-reference/).
