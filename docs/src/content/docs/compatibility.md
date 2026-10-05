---
title: Runtime compatibility
description: What is packaged, what is translated, and what still depends on external capabilities.
---

All three distributions contain the exact same original pstack source. Their
entrypoints differ only in which runtime contract they load.

| Capability                                        | Claude Code                                | Codex                                      | Copilot CLI                                   |
| ------------------------------------------------- | ------------------------------------------ | ------------------------------------------ | --------------------------------------------- |
| All 53 original skills and supporting files       | Packaged, hash checked                     | Packaged, hash checked                     | Packaged, hash checked                        |
| Explicit entrypoints                              | `/skill-name`                              | `$skill-name`                              | `/skill-name`; file request in headless tests |
| Native subagents                                  | Available host Agent/Task tool             | Exposed collaboration tool                 | Available task/subagent tool                  |
| Original two agent roles                          | Delegate instructions                      | Delegate instructions                      | Delegate instructions                         |
| Model selection                                   | Host-supported IDs                         | Host-supported overrides                   | Host-supported IDs                            |
| Mixed-model panels                                | Depends on host access                     | Depends on host access                     | Depends on host access                        |
| Cursor cloud-agent lifecycle                      | Not implemented                            | Not implemented                            | Not implemented                               |
| Cursor Automation webhooks / Benny scheduling     | External setup required                    | External setup required                    | External setup required                       |
| Cursor transcript mining                          | Supplied or host-exposed workspace history | Supplied or host-exposed workspace history | Supplied or host-exposed workspace history    |
| External control/deslop/create-skill dependencies | Explicit equivalent or blocked step        | Explicit equivalent or blocked step        | Explicit equivalent or blocked step           |

Bun-backed scripts, GitHub CLI, Tailscale, browser drivers, and MCP sources retain
their upstream prerequisites. Including the source does not install or authenticate
those services. make-bot-ui and Benny are included with these limits, not removed.

A missing native subagent cannot be replaced by a serial self-review and called
independent verification. Same-model reviewers cannot be called a multi-model
panel. If the required capability is missing, that step is blocked and reported.

The installer changes no global instruction files or provider configuration.
It never adds the automatic pstack startup hook found in some other ports.

Runtime references checked while building this port:
[Claude skills](https://code.claude.com/docs/en/skills),
[Claude subagents](https://code.claude.com/docs/en/sub-agents),
[Codex skills](https://developers.openai.com/codex/skills), and
[Copilot CLI skills](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills).
The [task evidence](/aop-mode/evidence/latest/) records what was actually exercised.
