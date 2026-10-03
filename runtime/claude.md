# Claude Code adapter

Use Claude Code's available Agent/Task tool for delegation. Select an exposed
general-purpose agent and supply bundled role instructions, unless a matching
custom agent is explicitly available. Use supported model aliases or configured
IDs, never Cursor model slugs. Use background execution only when supported and
collect every result. Use native Read, Glob, Grep, Edit, Write and Bash operations,
AskUserQuestion when available, and the session's task/todo tools for steps.

Project installation is `.claude/skills/`. Invoke `/aop-mode` or `/<skill-name>`.
Plugin commands may be namespaced as `/aop-mode:<skill-name>`.
`disable-model-invocation: true` keeps entrypoints explicit-only. No hooks or
settings.json modifications are installed.
