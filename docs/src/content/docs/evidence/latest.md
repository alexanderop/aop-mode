---
title: Latest local evidence
description: Recorded results from real CLI task runs.
---

Recorded starts: 2026-10-03T06:04:25.966Z through 2026-10-03T06:08:14.008Z. Each cell uses the newest supplied result for that harness and task. This is a snapshot, not a promise about other versions or tasks.

| Harness | CLI version | Task | Result | Duration |
| --- | --- | --- | --- | --- |
| claude | 2.1.288 (Claude Code) | explicit-only | blocked | 1.7s |
| claude | 2.1.288 (Claude Code) | repair | blocked | 1.9s |
| claude | 2.1.288 (Claude Code) | review | blocked | 1.8s |
| codex | codex-cli 0.138.0 | explicit-only | passed | 12.0s |
| codex | codex-cli 0.138.0 | repair | passed | 103.3s |
| codex | codex-cli 0.138.0 | review | passed | 124.8s |
| copilot | GitHub Copilot CLI 1.0.80. Run 'copilot update' to check for updates. | explicit-only | passed | 8.9s |
| copilot | GitHub Copilot CLI 1.0.80. Run 'copilot update' to check for updates. | repair | passed | 46.1s |
| copilot | GitHub Copilot CLI 1.0.80. Run 'copilot update' to check for updates. | review | passed | 42.0s |

## Blocked runs

- claude/explicit-only: authentication failed; renew the CLI login and rerun this case.
- claude/repair: authentication failed; renew the CLI login and rerun this case.
- claude/review: authentication failed; renew the CLI login and rerun this case.

Skill hashes: `b829b1d2d4323032cc67d3d2de5f22e4396a001fb7965bac538fae1f4f207ecf`, `e1c62e2668bed8cf68db738b5e1b30a42a636004b33b06a39ae47a6ed0efad9c`.

Raw transcripts and workspaces remain local. These tests cover project-local skill installation and task behavior, not marketplace installation, IDE integration, or multi-agent coordination. Copilot headless runs explicitly point to the installed skill file; this does not prove native slash-command expansion. See [the evaluation design](/aop-mode/testing/) for limitations.

## Scope of this snapshot

These runs installed the complete pinned pstack tree and the aop-mode router.
Codex and Copilot tool records show reads of the original poteto-mode SKILL.md;
repair runs also read its bug-fix playbook. The passing cells grade task outcomes,
not compliance with every upstream step. Model diversity, all other workflows,
Cursor cloud agents and automation services were not qualified by these cases.
Unused legacy reference files were removed after this run; the original upstream
files and runtime contracts exercised here are unchanged.
