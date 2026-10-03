# Install aop-mode

Original workflow ideas, skills, and playbooks: [pstack by Lauren Tan (poteto)](https://github.com/cursor/plugins/tree/main/pstack).
See NOTICE.md for attribution and the bundled original MIT license under each
plugin's `skills/aop-mode/.upstream/LICENSE`.

This archive is ready to use: no Node.js, pnpm, or build step is needed to install
it. You still need the coding agent's CLI. Keep the extracted folder in a stable
location; local marketplace sources may refer to it after installation.

Run the following commands from the extracted folder. Choose one client.

## Claude Code

Load for a single session, from your project:

```sh
claude --plugin-dir /absolute/path/to/aop-mode-{{version}}/plugins/claude
```

Or register the extracted folder and install persistently:

```sh
claude plugin marketplace add /absolute/path/to/aop-mode-{{version}}
claude plugin install aop-mode@aop-mode-local
```

Start a fresh session. Plugin skills use namespaced commands, for example
`/aop-mode:aop-mode Fix the pagination bug` or `/aop-mode:tdd`.
Project-local skill copies use `/aop-mode` instead.

## Codex

```sh
codex plugin marketplace add /absolute/path/to/aop-mode-{{version}}
codex plugin add aop-mode@aop-mode-local
codex plugin list --marketplace aop-mode-local
```

Start a fresh session. Codex 0.160.0 exposes plugin skills with names such as
`aop-mode:aop-mode` and `aop-mode:tdd`. Select the namespaced skill in the skill
picker; project-local `$aop-mode` names are different.

## Copilot CLI

```sh
copilot plugin marketplace add /absolute/path/to/aop-mode-{{version}}
copilot plugin install aop-mode@aop-mode-local
copilot plugin list
```

Start a fresh session. Select the installed skill explicitly. Headless slash
expansion is not established by the existing project-local evaluation results.
For a temporary load, use `copilot --plugin-dir /absolute/path/to/aop-mode-{{version}}/plugins/copilot`.

## Update or remove

For a new release, extract it to a new folder and inspect its NOTICE.md and
checksums. Point the local marketplace or installation at the reviewed new folder.
Re-register the source and use the client's plugin update/reinstall controls;
start a new session and check the listed version. Replacing the archive alone
does not update an installed copy. Do not install project-local copies of the
same skills alongside the plugin if that creates duplicate entries.

To uninstall, use the client's plugin manager:

```sh
claude plugin uninstall aop-mode@aop-mode-local
codex plugin remove aop-mode@aop-mode-local
copilot plugin uninstall aop-mode@aop-mode-local
```

These are skills-only plugins. They install no startup hooks, MCP servers, or
global instruction files. Installing a plugin does not invoke its workflows.

The package format is Agent Plugins 1.0.0 (`plugin.json` at each plugin root).
The Claude package also includes `.claude-plugin/plugin.json` for compatibility.
Runtime instructions differ by client; use the package for your client.

See https://alexanderop.github.io/aop-mode/installation-reference/ for recorded
validation and runtime evidence. Manifest validation and installation alone do
not establish successful workflow execution.
