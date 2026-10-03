# Codex adapter

Use the exposed spawn_agent / collaboration API for delegation, then its wait,
message and close operations. Supported agent types vary by host; use a supported
worker with the bundled role instructions. Do not pass Cursor `subagent_type`,
`readonly`, `cloud_base_branch`, or background fields to tools without those
parameters. Enforce read-only scope and use a read-only sandbox where available.
Use supported model overrides; inherit the parent when overrides are unavailable.
Use the host's shell/file tools, plan tool, and request-user-input tool if present.

Project installation is `.agents/skills/`. Invoke `$aop-mode` or `$<skill-name>`.
Every entrypoint has agents/openai.yaml with
`policy.allow_implicit_invocation: false`. No global AGENTS.md or config.toml
changes are installed.
