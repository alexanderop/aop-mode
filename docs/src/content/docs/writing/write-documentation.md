---
title: Write documentation with aop-mode
description: Invoke technical-writing, scope a documentation change, and verify this Starlight site.
---

Use this guide to write or revise documentation in an existing project. First,
[install aop-mode](/aop-mode/getting-started/) for the coding agent you use.

## Choose the document and its reader

Name the target file, the intended reader, and the reader's task. Choose one
document type before drafting. See [the document types](/aop-mode/writing/technical-writing/#a-document-starts-with-the-readers-task)
if the choice is unclear.

For a how-to, give the agent a concrete request:

```text
$technical-writing Rewrite docs/src/content/docs/getting-started.md as a how-to
for developers installing aop-mode in an existing project. Check commands against
package.json and scripts/install.ts. Keep runtime limitations visible. Link to
background explanations instead of adding them to the installation steps.
```

Use `/technical-writing` in Claude Code or interactive Copilot CLI. For a headless
Copilot run, explicitly request reading
`.github/skills/technical-writing/SKILL.md` and following its references.

## Ground the draft in the implementation

Ask the agent to inspect the files that establish each claim. For these docs,
use `package.json` for commands, `src/harnesses.ts` for installation locations,
and `upstream.lock.json` for the skill inventory.

Separate observed results from untested behavior. A package containing a skill
is not evidence that every workflow succeeds on every coding agent.

For a review without edits, use:

```text
$technical-writing Review docs/src/content/docs/getting-started.md without
editing files. Check its document type, wording, command accuracy, and ambiguous
instructions. Compare claims with package.json and scripts/install.ts. Report
specific passages and proposed replacements. Apply unslop to the proposed text.
```

## Add a page to this Starlight site

Create a Markdown file under `docs/src/content/docs/`. Give it a title and a
specific description in its frontmatter:

```md
---
title: Install aop-mode in a project
description: Install the skills for one coding agent in an existing repository.
---
```

Add the page's slug to the sidebar in `docs/astro.config.mjs`. Link to it from the
existing page where readers would need it. Follow the existing content structure
when updating a page instead of creating one.

## Explain a mechanism with a diagram

Use a short introduction, one concrete example, and an explanation of its result.
Move packaging details and less common cases into reference pages. Give readers
a next step that follows naturally from the page they just read.

For a diagram, use an `.mdx` page and import the shared component. The import
below is relative to a page directly inside `docs/src/content/docs/`; a nested
page needs another `../`.

```mdx
import Diagram from '../../components/Diagram.astro';

<Diagram
  title="Independent verification"
  caption="The runner checks the files and behavior left by the agent."
  source={`flowchart TD
    A[Agent finishes] --> B[Runner grades outcome]
    B --> C[Record evidence]`}
/>
```

Give each diagram one teaching job and roughly four to seven nodes. Use short
labels and top-to-bottom flows that remain readable on a phone. Put the takeaway
in the caption and explain the same mechanism in the surrounding prose. The
component provides a text disclosure and follows the site's light or dark theme.
Check the rendered diagram in both themes; avoid relying on color alone.

## Verify the documentation change

Run the build from the repository root:

```sh
pnpm docs:build
```

Confirm that the command succeeds and emits the intended page under `docs/dist/`.
If the build reports a broken content entry, correct it before continuing.

Run the existing browser journeys:

```sh
pnpm test:docs
```

These tests exercise specific navigation and search paths on desktop and mobile.
A passing suite does not prove every link or code example works. Check new links
and run any commands whose behavior the change documents. Record commands that
need credentials or external services as unverified until you can run them.

To inspect the site during editing, run:

```sh
pnpm dev
```

Open the local URL printed by Astro. Check the new page, its navigation links,
and its layout at narrow and wide window sizes.

## Report the result

List the pages changed and the checks that ran. State any broken links, untested
examples, or unavailable services. Publishing the site is a separate action.
