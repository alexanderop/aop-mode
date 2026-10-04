---
name: visual
description: Turn the previous answer or a requested topic into a dark HTML blog-style explainer with diagrams and Shiki-highlighted code, then open it in the browser.
disable-model-invocation: true
---

# Visual

Create a complete, readable HTML article that helps the user understand something.
With no topic supplied, explain the previous answer. Otherwise use the supplied
subject, files, or URL. Keep the requested scope and depth.

## Ground the explanation

Read the relevant source before making implementation claims. For repository
questions, follow one concrete example through the actual code. For outside
subjects, use primary sources and link claims to them. Preserve uncertainty,
conditions, and warnings. Label illustrative code and simplified models clearly.
Never invent an author, publication date, benchmark, or verified result.

## Use asd for the writing

Read [../asd/SKILL.md](../asd/SKILL.md) fully before drafting. Use its writing
rules for the article's prose, headings, captions, and control labels. Review the
finished text with those same rules. Keep writing guidance in `asd`; this skill
owns the article structure, HTML presentation, interactions, and browser delivery.

Apply `asd` to the article being created, including when the user supplies a new
topic. Its standalone instruction to rewrite the previous answer and return only
that rewrite does not replace this skill's HTML artifact and delivery workflow.

Lead with what the thing does and the problem it solves. Develop one running
example through connected paragraphs, diagrams, and small code samples. Explain
what each example shows.
Choose section names for the topic, not a fixed report format. Include a short
contents tree when the article is long enough to need navigation.

Use a figure to clarify a mechanism, relationship, or change of state. Prefer
inline SVG or HTML/CSS diagrams. Add a stepper or slider only when manipulating
it answers a real reader question. Keep the complete explanation understandable
without interaction. Do not turn the article into a dashboard or a wall of cards.

## Build the HTML

Read and adapt [assets/article.html](assets/article.html). It is a working example,
not article content to retain: replace its title, navigation, prose, figures,
code, example-specific controls/scripts, and source links for the user's topic.
Keep its layout and useful general behavior. Remove components the topic does
not need. Do not execute code examples from the material being explained.

Visual direction: near-black canvas, warm off-white text, muted gray secondary
text, restrained terracotta accents, thin borders, generous space, large title,
readable sans-serif prose, and monospace labels/code. Use a narrow reading column
with a sticky contents tree on wide screens and a single column on mobile.
Figures have explanatory captions. Code panels have a language label and a copy
button. No unrelated marketing navigation, signup forms, or decorative metrics.

Produce one HTML file with inline CSS, SVG, and application JavaScript. Default
to `dist/visual/<topic-slug>.html` in the current project unless the user names a
destination. Do not overwrite an unrelated artifact. No app scaffold or package
installation is needed. Shiki loads through an exact-version CDN module; do not
use an unpinned `latest` URL. The template uses the browser pattern documented by
[Shiki](https://shiki.style/guide/install#cdn-usage).

Keep escaped code in ordinary `pre > code` elements first. Highlight their
`textContent` progressively, preserving the original text for copying. Catch CDN
and unsupported-language failures without hiding the code. Highlighting needs
network access; the article, diagrams, and local controls must work without it.
Use semantic headings, labeled native controls, visible focus, sufficient
contrast, and reduced-motion support. Avoid page-level horizontal overflow.

## Check and open

Open the finished file with available browser tools or the platform file opener
(macOS `open`, Linux `xdg-open`, Windows `Start-Process`, with a safely quoted
absolute path). Prefer direct local-file viewing. If a host requires HTTP, serve
only the output directory on loopback and open its URL; do not expose the repo.
Do not publish or upload the page unless asked.

Inspect it at desktop and narrow widths. Check navigation, copy buttons,
interactive figures, code highlighting, and the readable fallback when the CDN
is unavailable. Check that source links resolve to the material used. Fix
clipping, unreadable labels, and controls that do not explain anything. An opener
exit code alone is not visual verification. If browser inspection is unavailable,
say which checks remain unverified and still provide the file.

Return a clickable artifact link and a short sentence about what it explains.
State whether it opened and identify any material verification limit.

## Design references

- [Claude developer article](https://claude.dev/blog/getting-started-with-claude-code-mods/): dark editorial layout, contents tree, code panels, and captioned figures. Use the visual direction, not its branding or article text.
- [visual-explainer](https://github.com/nicobailon/visual-explainer): inspiration for delivering explanations as browser artifacts. This skill and template are original aop-mode files, not a vendored copy of that project.
