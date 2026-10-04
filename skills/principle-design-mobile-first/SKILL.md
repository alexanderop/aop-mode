---
name: principle-design-mobile-first
description: 'Apply when designing, implementing, or reviewing responsive web experiences. Start with the essential task under mobile constraints, then enhance for space and capabilities.'
disable-model-invocation: true
---

# Design Mobile First

Make the essential task work on a small screen with limited attention and an
unreliable connection. Expand from that foundation as space and capabilities allow.

**Why:** Starting with constraints exposes competing priorities early. The result
can improve every screen size: clearer content, fewer unnecessary inputs, and a
shorter path to the user's goal.

- Name the task before arranging the screen. Give its content and primary action priority over navigation and secondary tools. Preserve required functionality; a narrow viewport does not imply simpler needs.
- Review interface copy at narrow widths. Remove introductions, repeated subtitles, and explanations of obvious controls that push the task down the screen. For each explanatory sentence, name the mistake it prevents; omit it when there is none. Keep required labels, actionable errors, and decision consequences visible, and expose optional detail on demand. Do not shrink text, replace clear labels with icons, or truncate primary content to meet an arbitrary word limit. See [Calm interface design](../principle-design-calm-interfaces/references/calm-interface-design.md#remove-interface-text-that-does-no-work) for an example.
- Design the complete narrow-screen journey first, including errors and recovery. Support direct links into content and useful next steps. Keep secondary actions discoverable without forcing people through a wall of navigation.
- Reduce input effort. Ask only for information the task needs, reuse known values appropriately, and use persistent labels, suitable native inputs, and editable defaults. Support creating and editing on mobile, not just reading. Keep entered values when validation or a request fails.
- Make actions usable by touch and keyboard. Size the actual hit area, allow room between targets, keep focus visible, and provide explicit controls for actions otherwise exposed through hover or gestures.
- Treat delivery cost as part of the design. Prioritize useful content, avoid unnecessary initial assets and requests, and measure the real task on a constrained connection. Hiding an element does not establish that its code or media stopped downloading.
- Enhance layout when content needs room. Start with a fluid baseline; add columns or supporting context at content-driven breakpoints. Keep reading order, focus order, and the user's current work coherent across changes.
- Use capabilities to remove effort when they serve the task. Location or camera input should have a useful fallback when unavailable or declined. Screen width alone does not establish input method or device capabilities.
- Prototype the essential interaction early and try it on a real device when available. Check the running journey at narrow and wide widths, with long content, zoom, keyboard navigation, and request failure. Check the software keyboard and browser chrome on an actual mobile browser when available; report emulation separately.
- Preserve the requested scope and existing stack. This principle does not require a separate mobile site, native app, offline mode, or removal of desktop tools. Adapt complex work deliberately when its spatial needs differ.

**The test:** Can someone complete the essential task on a narrow screen, recover
from a failed action, and continue at a larger size without losing access or work?

Read [Mobile-first design](references/mobile-first-design.md) for a concrete
before/after decision, a responsive HTML/CSS example, chapter-specific design decisions, and review guidance.
Inspired by Luke Wroblewski's _Mobile First_ (2011); the reference distinguishes
book ideas from aop-mode implementation guidance.
