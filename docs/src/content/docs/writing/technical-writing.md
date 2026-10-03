---
title: About the technical-writing skill
description: How aop-mode structures technical documents and makes their sentences clear.
---

The `technical-writing` skill guides the agent when it writes or reviews docs,
READMEs, RFCs, PR descriptions, and commit messages. It gives the agent rules for
choosing a document's purpose, addressing its reader, and removing ambiguity.

aop-mode includes Lauren Tan's original pstack skill. Its stated goal is writing
that a tired engineer understands on the first read.

## A document starts with the reader's task

The skill uses Diátaxis to distinguish four kinds of documentation. Each kind
answers a different reader need.

| Kind        | Reader's need                         | Example for aop-mode                                             |
| ----------- | ------------------------------------- | ---------------------------------------------------------------- |
| Tutorial    | Learn by completing a guided exercise | Install aop-mode in a sample project and complete a first repair |
| How-to      | Complete a specific task              | Install aop-mode in an existing project                          |
| Reference   | Look up a fact                        | Find a skill name or supported installation location             |
| Explanation | Understand a decision                 | Understand why activation is explicit                            |

A tutorial should give the learner visible results as they work. A how-to assumes
the reader knows the basics and needs steps toward a goal. Reference material
records facts for lookup. An explanation develops a bounded question and can
weigh alternatives.

The skill keeps these purposes separate. A long explanation inside installation
steps makes readers search for the next command. A separate page lets them choose
whether they need that background.

## Four layers shape the text

Diátaxis supplies the document structure. The other layers apply to its sentences.

| Layer                        | Rule applied to the document                                                    |
| ---------------------------- | ------------------------------------------------------------------------------- |
| Diátaxis                     | Choose tutorial, how-to, reference, or explanation before drafting              |
| Google developer style       | Address the reader directly, use active voice, and give links descriptive names |
| Simplified Technical English | Give one instruction at a time and use consistent terms                         |
| Global English               | Remove ambiguous pronouns, misplaced qualifiers, and idioms                     |

The skill favors everyday words and removes words that add no meaning. It also
asks for varied sentence lengths. A longer sentence can stay when it carries one
clear idea. The reader's understanding takes priority over a mechanical word limit.

## Real commands make instructions useful

The skill treats the codebase as its vocabulary. A document should use the actual
command, filename, or symbol instead of inventing another name for it.

For example, a vague instruction might say:

> Configuration of the documentation generation process should be performed
> through the relevant package manager command.

A version grounded in this repository says:

> Run `pnpm docs:build` from the repository root. Astro writes the site to
> `docs/dist/`.

The second version identifies an action and its result. Verifying that command
still requires running it against the current checkout.

## Writing rules and delivery checks have different roles

The skill applies `unslop` to the text it touches. That skill removes filler,
vague claims, invented jargon, and repetitive AI phrasing.

PR descriptions and commit messages use the sentence rules without the Diátaxis
document categories. Product UI text follows the product's own copy guidelines.

The imported skill does not define a complete documentation delivery playbook.
It does not automatically build Starlight, execute every example, or check every
link. Those checks belong in the requested task and the repository's verification
commands.

[Write documentation with the skill](/aop-mode/writing/write-documentation/) gives concrete
prompts and the commands used to verify these Starlight docs.

## Original source

The bundled source is
`vendor/pstack/skills/technical-writing/SKILL.md`. The public
[original skill at the pinned revision](https://github.com/cursor/plugins/blob/23e4138daa01c42d4969f7a5465f82704e64f798/pstack/skills/technical-writing/SKILL.md)
contains the full rules. See [credits](/aop-mode/credits/) for authorship and licensing.
