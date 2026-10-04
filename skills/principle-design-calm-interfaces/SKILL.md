---
name: principle-design-calm-interfaces
description: 'Apply when designing, implementing, or reviewing UI appearance and interactions. Build calm interfaces with deliberate hierarchy, restrained color, and consistent spacing and states.'
disable-model-invocation: true
---

# Design Calm Interfaces

Give the user's work the strongest visual presence.
Create hierarchy through consistent spacing, typography, and layered surfaces.
Use color and stronger contrast deliberately for meaning, orientation, and action.

**Why:** Competing accents and inconsistent layouts make users work to understand
an interface. A restrained, coherent system helps them recognize what matters
and act confidently as the product grows.

- Start with the task. Identify the main content, primary action, navigation, and supporting information. Give each an intentional level of emphasis. Keep recurring actions in predictable places near the content they affect.
- Use neutral surfaces and a limited accent palette. Assign semantic tokens to surfaces, text, borders, selection, focus, and status. Let color communicate meaning; pair status colors with text or recognizable symbols.
- Make hierarchy visible through lightness and weight. Distinguish primary content, supporting text, and metadata without making any necessary information unreadable. Check contrast against the actual background, including selected rows and elevated panels.
- Keep surface layers legible. Use small background differences, fine borders, and restrained shadows to explain navigation, content, and overlays. Add a card or separator when it clarifies a real grouping.
- Let spacing and alignment do structural work. Keep related elements close, separate distinct groups, and align labels, icons, and controls consistently. Reuse a small spacing scale.
- Match density to the task. Compact navigation and lists can coexist with a spacious reading or editing area. Preserve usable targets and adapt the layout for narrow screens and touch.
- Keep typography and icons disciplined. Use a small type scale, deliberate weights, and a coherent icon family. Add icons when they aid recognition or action; give icon-only controls accessible names.
- Design interaction states as part of the system. Make hover, keyboard focus, selection, disabled controls, and action feedback distinguishable. Cover loading, empty, error, and long-content states. Keep motion purposeful and respect reduced-motion preferences.
- Refine the shared system. Reuse existing tokens and components before adding local exceptions. Preserve the product's identity, supported themes, and requested scope; this principle does not require dark mode, a new font, a sidebar, or a redesign.
- Inspect the running interface with realistic content, supported themes, narrow layouts, and keyboard navigation. Check what users can see and do. A screenshot cannot prove interaction behavior.

**The test:** Can a user quickly identify where they are, what matters, and what
they can do next, even when the screen contains substantial information?

Read [Calm interface design](references/calm-interface-design.md) when choosing
visual tokens or reviewing a screen. It includes a CSS example, contextual state
rules, and Linear design references. This complements Compose UI Variants, which
covers component structure and shared behavior.
