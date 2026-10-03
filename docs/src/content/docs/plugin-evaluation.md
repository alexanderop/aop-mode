---
title: Plugin installation evaluation
description: Verify real CLI plugin installation, discovery, updates, and removal without model calls.
---

Run the same installation contract against Claude Code, Codex, and Copilot CLI:

```sh
pnpm eval:plugins
pnpm eval:plugins --harness codex
```

The evaluation builds a fresh release archive, extracts a separate copy for each
client, and invokes the installed CLI with a temporary configuration directory.
It makes no model calls and does not install plugins into your normal client
configuration. Each command has a deadline; `--timeout 30` sets it to 30 seconds.

## What must pass

Before installation, the grader must accept the complete reference package and
reject a copy missing the aop-mode entrypoint. The live evaluation then checks:

1. Register the archive's local marketplace and install its plugin.
2. Confirm the plugin's name and version through the client's native inventory.
3. Compare the installed cache with the reference, including every bundled skill,
   runtime instruction, attribution file, and explicit-only policy file.
4. Confirm native skill discovery: Claude's component inventory, Codex's
   `skills/list` app-server response, or Copilot's installed-skill count.
5. Change the source version and add a marker file, then run the client's update
   or reinstall command. Check the new native version and installed bytes.
6. Uninstall and require the plugin to disappear from installed inventory.
7. Confirm that the test project acquired no instruction files or hooks.

A zero exit or an install success message alone cannot pass. Offline tests also
reject modified runtimes, extra files, implicit activation metadata, and an
installer that reports success without installing files.

## Read the result

Each run writes `summary.json` and per-client results under
`.eval-artifacts/plugin-install-<timestamp>/`. Command logs and reference snapshots
stay outside the temporary client workspaces. The results retain workspace paths
for inspection. Raw logs stay local and are not included in release archives.

`passed` means every recorded assertion succeeded. `failed` means an assertion
did not hold. `blocked` means a CLI command or prerequisite prevented completion,
such as a missing executable, timeout, unsupported command, or invalid response.
An interrupted or unstarted client does not count as passing.

## Tested clients

The local run on 2026-10-03 tested:

| CLI | Version | Install, update, removal | Skill discovery |
| --- | --- | --- | --- |
| Claude Code | 2.1.288 | Passed | 56 skills in native component inventory |
| Codex | 0.160.0 | Passed | 56 enabled, namespaced plugin skills via app-server |
| Copilot CLI | 1.0.77 | Passed | Installer reported 56 skills |

The version comes from each isolated CLI process. A CLI launcher can resolve a
different installed version under CI configuration than in an interactive shell.
Rerun this evaluation after changing packages or upgrading a client.

These results establish local marketplace installation and registration. They do
not establish public marketplace publication, model-driven invocation, workflow
quality, or runtime non-activation. Those behaviors require the separate
[outcome tests](/aop-mode/testing/) and [workflow evaluations](/aop-mode/workflow-evals/).
The metadata check confirms explicit-only flags are packaged; it does not inspect
an agent's hidden reasoning.
