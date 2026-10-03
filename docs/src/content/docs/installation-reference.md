---
title: Installation reference
description: Package formats, updates, removal, and runtime invocation details.
---

## Package formats

`pnpm skills:build` creates `dist/claude`, `dist/codex`, and `dist/copilot`.
Each has an [Agent Plugins 1.0.0](https://agent-plugins.org/) `plugin.json` and
`skills/` at its root. Metadata comes from `packaging/plugin.json`, validated
against a locally pinned copy of the standard's JSON Schema.

Claude's package also has `.claude-plugin/plugin.json`, generated from the same
metadata. The skills and original pstack source stay at the plugin root, not
inside the manifest directory. Runtime instructions differ by client, so choose
the package built for your client.

`pnpm plugins:pack` builds a fresh archive and SHA-256 checksum in `dist/releases/`.
It includes the packages, installation instructions, LICENSE, NOTICE.md, and local
marketplace catalogs for each client. The original pstack license remains in each
package's `skills/aop-mode/.upstream/LICENSE`.

## Plugin updates and removal

Keep the extracted archive in a stable location. For a new release, extract it,
review it, and register the new folder as the local marketplace. Use the client's
update or reinstall command and start a fresh session. Replacing a downloaded
archive alone does not update an installed plugin.

The installation evaluation exercises an actual changed version and file, using
`claude plugin update aop-mode@aop-mode-local`,
`codex plugin add aop-mode@aop-mode-local`, and
`copilot plugin update aop-mode@aop-mode-local`.

Remove the plugin using the command for your client:

```sh
claude plugin uninstall aop-mode@aop-mode-local
codex plugin remove aop-mode@aop-mode-local
copilot plugin uninstall aop-mode@aop-mode-local
```

## Project-local skill copies

The project-local installer refuses existing skill-name collisions before writing
anything. Installed skills are copies: updating this checkout does not silently
change them. To update, inspect and replace the installed catalog entries with a
reviewed copy. To uninstall, remove only the installed catalog directories and
preserve unrelated skills.

Use `$aop-mode` in Codex and `/aop-mode` in Claude Code or interactive Copilot CLI
for project-local copies. Plugin skills can be namespaced; follow the
[plugin instructions](/aop-mode/plugin-installation/) instead for those installs.

For non-interactive Copilot runs using project-local copies, explicitly request
reading `.github/skills/aop-mode/SKILL.md`. The existing outcome suite establishes
installed-file execution, not native slash expansion. See
[the tested headless behavior](/aop-mode/testing/).

## References

- [Agent Plugins specification](https://agent-plugins.org/specification)
- [OpenAI plugin packaging](https://developers.openai.com/plugins/build/plugins)
- [Claude Code manifest reference](https://code.claude.com/docs/en/plugins-reference)
- [Copilot CLI plugin reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference)
