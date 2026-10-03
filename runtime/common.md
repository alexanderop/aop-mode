# aop-mode runtime contract

Read this contract before executing an upstream skill. Upstream files are an
unmodified reference distribution. Translate platform mechanics while preserving
workflow steps, prompts, rubrics, and output contracts. User instructions and the
host's permissions remain authoritative.

## Activation and navigation

Apply only to the explicitly requested task. Do not install startup hooks, inject
global rules, or persist a mode reminder. Upstream `mode`, `reminder`, `paths`, and
presentation frontmatter are Cursor metadata, not activation instructions here.
Read upstream SKILL.md bodies fully, including leaf principles when applied.
Resolve relative links and scripts from the original upstream file's directory.
All upstream files are together under this skill's `.upstream/` directory.
Personal principles live beside `aop-mode`; resolve their entrypoints through
`personal-catalog.json` and their references from their own directories.
When another upstream bundled skill is named, read its original entrypoint directly from
`catalog.json`; disabled implicit invocation does not prevent reads needed for
an explicit request. Do not invoke unrelated installed skills with the same name.
`aop-mode` routes to `poteto-mode` without rewriting its playbooks. Stop the mode
when the requested task ends or the user opts out.

## Models and configuration

Translate every reference to `~/.cursor/rules/pstack-models.mdc` to the current
project's `.aop-mode/models.md`. Load it only during an explicit invocation.
`setup-pstack` writes this project-local file, retaining upstream role labels and
budget selection but omitting `alwaysApply` frontmatter. Do not edit Cursor rules.
Use only model identifiers actually exposed by the current host. No config means
inherit the parent model, not an invented equivalent of a Cursor model slug.
Preserve requested reviewer counts. Report when all reviewers share a model;
independent same-model reviews do not establish multi-model diversity. If a task
requires unavailable model diversity, mark that portion blocked.

## Delegation and tools

Translate `Task`, `generalPurpose`, `AskQuestion`, and todo tools into the actual
tools available in this session. Read `.upstream/agents/poteto-agent.md` or
`.upstream/agents/comment-sicko.md` into delegate instructions for the requested
role. Use fresh delegates with explicit scope, ownership, and the same upstream
rubric. Preserve read-only restrictions and parent permissions. If the host has
no delegation facility, identify the blocked parallel step; never present a
serial self-review as independent agents.

## Platform-dependent workflows

- Cursor cloud agents, cloud base branches, persistent background turns, and
  Cursor Automation webhooks are not supplied by this package. Local worktrees
  may substitute only when the task does not require cloud execution or persistence;
  label the substitution. Otherwise report the missing capability before that step.
- `/loop` requires an available scheduler and explicit task authorization. A
  foreground loop does not survive session exit. Do not silently install a daemon.
- Benny's complete automation pack and make-bot-ui are included. Running them
  requires documented external triggers, credentials, services and tools. There
  is no native Claude, Codex, or Copilot replacement for a Cursor webhook here.
- For recall, reflect, automate-me, and session pickup, use a supplied transcript
  or host-exposed current-workspace history location. Cursor paths are not valid
  defaults here. Never scan unrelated project histories. If no transcript is
  available, report that evidence gap and use only the available record.
- `cursor-team-kit` skills (`deslop`, `control-cli`, `control-ui`) and Cursor's
  built-in `create-skill` are external dependencies, not bundled pstack skills.
  Use an explicitly available equivalent and name it; otherwise mark the step
  unavailable. A browser build is not browser interaction evidence.
- Inspect usage and prerequisites before running bundled scripts. Bun, GitHub
  CLI, Tailscale and authenticated connectors are not installed automatically.
- Upstream `origin/main:pstack/...` examples refer to the original repository.
  This independent project uses the bundled pinned source. Do not assume the
  consuming project's origin contains pstack.

## Evidence

Report actual tools, models, substitutions, skipped or blocked steps, and observed
results. Never turn an unavailable capability into a passing result. When the user
explicitly requests aop-mode machine-readable evaluation evidence, read
`references/evidence.md` beside this file. That optional report format does not
replace upstream workflows in ordinary use.
