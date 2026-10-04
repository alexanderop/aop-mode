# Calm interface design

Use this reference to turn the principle into concrete visual decisions. Linear's
product interface is the inspiration. These are aop-mode recommendations, not
Linear's internal specification or a requirement to copy its branding.

## Establish the hierarchy

For an issue detail screen, the issue title and description carry the main work.
Navigation helps users orient themselves. Activity metadata supplies context.
An auxiliary panel supports a separate action and needs a clear surface boundary.

| Role         | Treatment                                                  | Check                                   |
| ------------ | ---------------------------------------------------------- | --------------------------------------- |
| Main content | Strong readable text, clear title, comfortable line length | Does the work draw attention first?     |
| Navigation   | Compact rows, quieter surface, recognizable active state   | Can users locate themselves?            |
| Metadata     | Smaller or lighter emphasis, consistent placement          | Can users still read necessary details? |
| Status       | Small semantic color cue plus label or symbol              | Does meaning survive without color?     |
| Overlay      | Distinct surface, restrained border or shadow              | Is its boundary clear against content?  |

A dense list benefits from aligned columns and repeated row geometry. A reading
view benefits from room around paragraphs. Choose density per region, then adapt
for touch and narrow widths. Avoid shrinking every element to make a layout fit.

## Remove interface text that does no work

Keep the title, real content, current state, and clear actions prominent. Do not
give every screen a welcome paragraph or every heading a subtitle. A sentence
that merely restates a button label adds reading without resolving uncertainty.

For an empty task list:

| Draft                                                               | Revised                   |
| ------------------------------------------------------------------- | ------------------------- |
| Welcome to your task dashboard                                      | Tasks                     |
| Here you can create, organize, and track your daily tasks.          | Remove this introduction. |
| You currently have no tasks. Create your first task to get started. | No tasks yet              |
| Create a new task                                                   | Add task                  |

Keep help when it prevents a specific mistake: accepted file formats, ambiguous
choices, or the consequences of deletion. Put optional background behind a
clearly labeled details control that works by touch and keyboard. Do not hide
information required to make the current decision or rely on hover-only tooltips.

Review each explanatory sentence by asking what a user could get wrong without
it. Remove text with no concrete purpose, and fix ambiguous labels or structure
before compensating with more prose. Preserve persistent field labels, useful
visible action labels, errors with recovery steps, and consequential action
details. This is not a word quota or a reason to truncate the user's documents,
messages, or other primary content.

## Start with semantic tokens

The following CSS is an illustrative dark palette, not sampled Linear colors or
a verified accessible theme. Preserve an existing project's theme conventions.
For a new visual direction, try tokens on a small editable board with a navigation
row, content section, button, and selected state before spreading them across views.

```css
:root {
  color-scheme: dark;
  --surface-canvas: #141414;
  --surface-panel: #1b1b1b;
  --surface-hover: #242424;
  --surface-selected: #303030;
  --text-primary: #ededed;
  --text-secondary: #b4b4b4;
  --text-muted: #999999;
  --border-subtle: #383838;
  --accent: #aaa3ff;
  --focus-ring: #c2bdff;
  --status-warning: #f0ce55;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --radius-control: 0.375rem;
  --radius-panel: 0.75rem;
}

.issue-link {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-control);
  color: var(--text-secondary);
  text-decoration: none;
}

.issue-link:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.issue-link[aria-current='page'] {
  background: var(--surface-selected);
  color: var(--text-primary);
  font-weight: 600;
}

.issue-link:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
```

Use the row class on a real link with a descriptive label. Set `aria-current="page"`
only on the current destination. Keep native keyboard behavior. Selection and
focus remain independently visible when a current link receives keyboard focus.

The subtle border token is for optional grouping, not the sole cue identifying an
input or keyboard focus. Check necessary control boundaries separately. Test
secondary text and status icons on hover, selection, and overlay backgrounds,
not just on the canvas. An accent used for text may need a different token from
an accent used as a filled button background.

For generated palettes, a perceptual color space such as LCH or OKLCH can help
organize lightness and chroma. It does not guarantee readable contrast. A small
app can use a fixed semantic palette; a theme generator is not required. If both
light and dark themes are supported, map the same roles intentionally in each.

## Refine a screen

Start with realistic content: long titles, wrapped labels, populated lists, and
missing optional metadata. Remove repeated decoration where spacing already
communicates the relationship. Reserve stronger boundaries for controls or layers
that otherwise become ambiguous.

Keep page and section titles proportionate to the work. Choose the project's
existing typeface where it works, align icon and text baselines, and make repeated
control sizes consistent. Larger typography and extra whitespace belong where
they improve reading or orientation.

Check empty, loading, failure, and completion states within the same layout.
Keep supporting actions discoverable on touch and keyboard; hover alone must not
be their only route. Use existing accessible primitives for menus and dialogs,
including focus management and dismissal behavior.

Review a representative task in the running app at desktop and narrow widths.
Check supported themes, keyboard focus, zoom, and reduced-motion behavior where
motion exists. Save screenshots when useful for comparing visual changes, and
report interaction checks separately. Fix recurring problems in shared tokens or
components instead of accumulating page-specific overrides.

## Sources and interpretation

- [Progressive Disclosure, Nielsen Norman Group](https://www.nngroup.com/articles/progressive-disclosure/): defer secondary options until needed; the UI-copy example and reduction check above are aop-mode guidance.
- [How we redesigned the Linear UI, March 2024](https://linear.app/now/how-we-redesigned-the-linear-ui): hierarchy, alignment, cross-view testing, and LCH theme generation from base color, accent, and contrast.
- [A calmer interface for a product in motion, March 2026](https://linear.app/now/behind-the-latest-design-refresh): quieter navigation, fewer decorative icons and separators, and a warmer neutral palette.
- [A design reset, March 2024](https://linear.app/now/a-design-reset): accumulated design debt as a product grows.
- [Styling Linear for the future with StyleX](https://linear.app/now/styling-linear-for-the-future-stylex): theme colors derived in the context of selected and elevated surfaces.

The token example, accessibility checks, and implementation guidance above are
our own applications of these ideas. They do not require adopting Linear's
framework, styling library, exact colors, or theme-generation architecture.
