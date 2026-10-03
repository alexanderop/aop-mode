# GitHub Copilot CLI adapter

Use Copilot's available task/subagent tool with a supported agent type and bundled
role instructions. Check the tool schema before selecting a model or background
option. If subagents or model overrides are unavailable, report that limit. Use
native file and shell tools and ask-user tools when available. Browser automation
and external MCP sources must be connected before workflows requiring them run.

Project installation is `.github/skills/`. Interactive invocation is
`/<skill-name>`. In headless `copilot -p`, explicitly request reading
`.github/skills/<skill-name>/SKILL.md`; a slash command passed as prose has not
reliably loaded explicit-only skills in our tests. Frontmatter sets
`disable-model-invocation: true`. No copilot-instructions.md or hooks are installed.
CLI tests do not establish VS Code or Copilot cloud-agent compatibility.
