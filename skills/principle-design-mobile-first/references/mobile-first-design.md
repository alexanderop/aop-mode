# Mobile-first design

Luke Wroblewski's _Mobile First_ (A Book Apart, 2011) argues for starting with
mobile constraints and opportunities. Use its prioritization lens; its market
figures, device examples, and browser support descriptions are historical.
The code and verification choices below are aop-mode applications of the ideas,
not excerpts or code supplied by the book.

## Make a product decision before a breakpoint

Consider a service appointment page. The immediate task is finding the appointment
and changing its date. A desktop-first draft might devote the opening screen to
a global sidebar, promotional banner, account details, and several summary cards.
Shrinking all of those elements leaves the actual appointment far down the page.

Begin instead with appointment details and the change action. Keep account and
other destinations available through concise, labeled navigation. Show secondary
information after the task; place it alongside the task when enough room exists.
Both sizes retain the same appointment and available operations.

This is a prioritization decision before it is a CSS decision. For a specialist
workspace, such as a timeline editor, identify which workflows can adapt and
which need a purpose-built interaction. Do not silently discard operations to
make a screenshot fit.

## Decisions that a responsive layout alone misses

### Reach and usage context

[Growth](https://mobile-first.abookapart.com/03-chapter-1/) makes access part of
the mobile opportunity. For web content intended to be linked, test entering a
detail page directly from a shared URL, including when a native app also exists.
Preserve the destination through required sign-in. The last check is our
implementation guidance; native-versus-web decisions still depend on the product.
Do not use the book's 2010–2011 adoption figures as current market evidence.

[Organization](https://mobile-first.abookapart.com/06-chapter-4/) distinguishes
finding information, exploring, checking changes, and creating or editing.
Choose the relevant behavior before choosing a screen structure. Mobile use can
be relaxed and lengthy as well as hurried. Offer a relevant next step after
content, and place contextual actions near the material they affect.

### Touch geometry and affordances

[Actions](https://mobile-first.abookapart.com/07-chapter-5/) distinguishes the
visible icon from its touch target. Expand the clickable element with padding;
empty margin separates targets but does not enlarge their hit areas. Check reach
with different grips and hands. Separate destructive actions from frequent ones;
do not rely on an awkward corner alone to prevent mistakes.

When an object looks draggable or swipeable, make that interaction work or change
the cue. Keep a visible alternative for gesture shortcuts and preserve browser
scrolling and zoom. These are interaction checks, not merely icon-size checks.

### Forms as conversations

[Inputs](https://mobile-first.abookapart.com/08-chapter-6/) calls for different
structures for related questions, independent edits, and immediate contributions.
Use a focused sequence for an appointment booking, edit a profile value without
opening every field, and let a short reply happen in context. Support substantive
creation too; reducing effort does not mean removing authoring features.

Keep labels visible after entry. Start with native controls and editable defaults;
choose alternatives when long options or excessive tapping obstruct the task.
Explain required formats before typing. If a mask is needed, keep its behavior
predictable. Our additional checks: pasting, correcting the middle of a value,
and preserving valid international input must work without silent data loss.

### Density and delivery

[Layout](https://mobile-first.abookapart.com/09-chapter-7/) treats display density
separately from layout width. Check image sharpness at the rendered size without
sending the largest asset to everyone. Our implementation guidance is to use the
project's responsive-image pipeline and inspect which resource actually loads.
Retain browser zoom; the example's viewport declaration intentionally does not
restrict it.

[Constraints](https://mobile-first.abookapart.com/04-chapter-2/) includes both
transfer and rendering costs. In our performance review, inspect repeat-visit
caching, avoidable dependencies, and interaction delays as well as initial load.
Choose optimizations from measurements on the supported platform; historical
advice about bundling, sprites, or particular browser technologies is not a
universal recipe.

### Early physical prototypes

The [conclusion](https://mobile-first.abookapart.com/10-conclusion/) emphasizes
putting prototypes in people's hands early. Try the smallest complete interaction
before polishing every screen. Real-device checks can expose reach, occlusion,
and keyboard issues that desktop resizing misses. Record unavailable device
checks explicitly rather than treating emulation as equivalent evidence.

## A fluid baseline with one deliberate enhancement

This static example can be placed in an HTML document. The form expects an
application-owned `/appointments/reschedule` endpoint; it demonstrates layout
and native form semantics, not a working scheduling service. In an existing app,
connect its established submission, authorization, validation, and error handling.

```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
<nav aria-label="Main">
  <a href="/appointments">Appointments</a>
  <a href="/account">Account</a>
</nav>
<main class="appointment">
  <section aria-labelledby="appointment-title">
    <h1 id="appointment-title">Change your appointment</h1>
    <p>Current appointment: 12 October, 10:00</p>
    <form action="/appointments/reschedule" method="post">
      <label for="appointment-date">Preferred date</label>
      <input id="appointment-date" name="date" type="date" required />
      <p>We will check availability before confirming the change.</p>
      <button type="submit">Check availability</button>
    </form>
  </section>
  <aside aria-labelledby="help-title">
    <h2 id="help-title">Need help?</h2>
    <p>Keep your current appointment until a new time is confirmed.</p>
    <a href="/support">Contact support</a>
  </aside>
</main>
```

```css
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  font-family: system-ui, sans-serif;
  line-height: 1.5;
}
nav,
.appointment {
  max-inline-size: 70rem;
  margin-inline: auto;
  padding: 1rem;
}
nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.appointment {
  display: grid;
  gap: 2rem;
  overflow-wrap: anywhere;
}
.appointment > * {
  min-inline-size: 0;
}
form {
  display: grid;
  gap: 0.75rem;
  max-inline-size: 32rem;
}
input,
button {
  font: inherit;
  min-inline-size: 0;
  max-inline-size: 100%;
  min-block-size: 2.75rem;
  padding: 0.625rem;
}
a {
  display: inline-block;
  padding-block: 0.625rem;
}
:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}
@media (min-width: 52rem) {
  .appointment {
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  }
}
```

The example's breakpoint and control sizes are design starting points, not device
categories or a claim of accessibility compliance. Choose the breakpoint by
checking where the actual content can use two columns. The DOM order stays stable;
there are no duplicate forms to synchronize. Vertical scrolling remains available,
and no fixed footer competes with the software keyboard.

## Verify decisions in the actual product

| Situation                                | Observable outcome                                                                                                                                                      |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Narrow screen and long localized labels  | Details and actions remain readable; ordinary content does not require sideways scrolling.                                                                              |
| Interface copy before the main task      | No redundant introduction or subtitle delays the task; each explanation prevents a concrete mistake. Required labels, errors, and decision consequences remain visible. |
| Touch and keyboard                       | The same action is reachable without hover or an undisclosed gesture; focus remains visible.                                                                            |
| Direct link to a detail page             | The intended content is reached, including after any required sign-in.                                                                                                  |
| Form defaults and formatting             | Defaults can be changed; labels persist; pasted and edited valid values survive.                                                                                        |
| Touch hit area                           | Taps near the icon edge activate the intended action without overlapping a neighboring target.                                                                          |
| Dense display and constrained connection | Images are legible at their rendered size and the loaded asset is appropriate.                                                                                          |
| Software keyboard open                   | The active field and next action can be reached without getting trapped behind an overlay.                                                                              |
| Request fails after input                | Entered values remain available; retry has a clear result and does not duplicate a completed action.                                                                    |
| Resize or orientation change             | The current selection, entered values, and task survive.                                                                                                                |
| Larger screen                            | Extra space improves context or efficiency without introducing a different required workflow.                                                                           |
| Optional capability declined             | The user can complete the task through an explicit fallback.                                                                                                            |

For delivery performance, inspect the requests needed before the primary task is
usable. Set a budget appropriate to the product and compare measurements under
the same throttling conditions. Optimize measured blockers rather than treating
a narrow screenshot or a small CSS bundle as performance evidence.

Use existing browser journeys to exercise the task and recovery. Emulation helps
check viewport behavior; actual mobile-browser checks provide evidence about the
software keyboard and browser chrome. Record which checks ran. This reference's
static example alone proves neither server behavior nor device compatibility.

## Sources and interpretation

- [Introduction](https://mobile-first.abookapart.com/02-introduction/): starting with mobile changes prioritization and creates opportunities beyond a smaller layout.
- [Growth](https://mobile-first.abookapart.com/03-chapter-1/): reach through web links and new usage opportunities; adoption figures are historical.
- [Constraints](https://mobile-first.abookapart.com/04-chapter-2/): limited space, network conditions, and attention shape product choices.
- [Capabilities](https://mobile-first.abookapart.com/05-chapter-3/): device features matter when they help people achieve a goal.
- [Organization](https://mobile-first.abookapart.com/06-chapter-4/): foreground content and tasks while retaining useful navigation.
- [Actions](https://mobile-first.abookapart.com/07-chapter-5/): design interactions for touch rather than assuming mouse precision or hover.
- [Inputs](https://mobile-first.abookapart.com/08-chapter-6/): reduce questions and make entering answers easier.
- [Layout](https://mobile-first.abookapart.com/09-chapter-7/): adapt fluidly to available space and different interaction contexts.

- [Conclusion](https://mobile-first.abookapart.com/10-conclusion/): prototype early and test on actual devices.

Error recovery, capability fallbacks, the CSS implementation, and the verification
matrix are our engineering guidance. The book's historical recommendations about
fixed navigation and browser APIs should not become unconditional rules for a
current product. Verify support against its actual browser targets.
