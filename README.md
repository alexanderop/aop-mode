# aop-mode

[Documentation](https://alexanderop.github.io/aop-mode/)

The complete original **[pstack by Lauren Tan](https://github.com/cursor/plugins/tree/main/pstack)**
skill set, packaged for explicit use in Claude Code, Codex, and GitHub Copilot CLI.
Independent project, not a GitHub fork or official port. See [NOTICE.md](NOTICE.md).

All **49 main skills + 3 automation skills**, **23 playbooks**, two agent prompts,
and every supporting file are pinned to pstack v0.15.6 at
`23e4138daa01c42d4969f7a5465f82704e64f798`. The 160 original files remain unchanged.
`aop-mode` adds an entrypoint to the full poteto-mode router. No startup hooks.

## Install the plugin

Ready-built packages contain all skills and require no pnpm on the user's machine.
The verification workflow produces the `aop-mode-plugins` download artifact. See
[plugin installation](https://alexanderop.github.io/aop-mode/plugin-installation/)
for Claude Code, Codex, and Copilot CLI instructions.

To build an archive locally:

```sh
pnpm install --frozen-lockfile
pnpm plugins:pack
```

Extract `dist/releases/aop-mode-0.1.0.tar.gz` and follow its `INSTALL.md`.
Every client package has a standard Agent Plugins manifest; the Claude package
also carries its compatibility manifest. The archive includes local marketplace
catalogs, attribution, and a SHA-256 checksum alongside it.

```sh
pnpm eval:plugins  # isolated CLI install, discovery, update and removal; no model calls
```

## Install project-local skills

```sh
pnpm install --frozen-lockfile
pnpm skills:install codex /absolute/path/to/your-project
pnpm dev
```

Use `claude` or `copilot` for the other targets. Installation copies all 57
entrypoints and the complete upstream tree into project-local skill directories.
Existing skill-name collisions abort before writing anything. No global settings
are changed. Invoke `$aop-mode` in Codex or `/aop-mode` in Claude Code/Copilot CLI.
Individual skills retain their original names: `$tdd`, `/interrogate`, `/how`, etc.
For headless Copilot, explicitly request reading the installed SKILL.md.

## Verify and build

```sh
pnpm verify                  # source integrity, packages, types, lint, tests, docs
pnpm test:docs               # Playwright documentation journeys
pnpm test:harnesses          # authenticated CLI task matrix; consumes usage
pnpm eval:workflows --list   # inspect Codex/Copilot workflow contracts; no model calls
pnpm eval:workflows --task investigation # live routing/delegation eval; consumes usage
pnpm skills:build            # dist/claude, dist/codex, dist/copilot
pnpm upstream:check          # hashes, file inventory, executable modes
pnpm report .eval-artifacts/<run>/summary.json
```

The source import is reproducible with
`pnpm exec tsx scripts/import-pstack.ts --source /path/to/cursor-plugins`.
`--check --source /path/to/cursor-plugins` also compares the import with Git objects.
See [the full catalog](docs/src/content/docs/catalog.md),
[compatibility limits](docs/src/content/docs/compatibility.md), and
[latest task evidence](docs/src/content/docs/evidence/latest.md).

**Content completeness is verified; universal runtime parity is not.** Cursor
cloud-agent lifecycle and Automation webhooks are not implemented for other hosts.
Multi-model panels, transcript mining, browser controls and external skills depend
on available host capabilities. Adapters report missing steps. All source remains
included, including make-bot-ui and Benny.

Live tests cover repair, read-only review and ordinary-task non-activation, not all
52 workflows or marketplace/IDE/cloud-agent installation. Each run uses a fresh
workspace; graders and raw logs remain outside it. Claude requires a working login.

Astro Starlight documentation. Strict TypeScript, pnpm, Effect evaluation lifecycle,
Vitest and Playwright. Requires Node.js 22.14+, Git and authenticated CLIs for live
runs. Original pstack MIT attribution accompanies every distribution.

[Workflow evaluations](docs/src/content/docs/workflow-evals.md) inspect actual skill
reads, playbook routing, native subagents, verification, and independent outcomes.
Compare explicit, installed-inactive, and baseline conditions; missing telemetry
remains unobservable. Private per-trial reports link verdicts to native event lines.
