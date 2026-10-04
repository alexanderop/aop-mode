---
name: improve-codebase-architecture
description: Find architectural friction in an existing codebase and present ranked improvements in a visual report. Use when explicitly asked to survey the architecture or find refactoring opportunities.
disable-model-invocation: true
---

# Improve Codebase Architecture

Find changes that make real work easier. Prefer modules that hide substantial
behavior behind a small interface. Judge the complexity callers must understand,
not the number of files or lines.

This is a survey. Produce recommendations without changing application code.
If the user also requests implementation, carry the selected change through
verification within that scope.

## Find the friction

Start with the area the user names. Otherwise, use recent changes to find parts
of the codebase people repeatedly work on. Read repository instructions and
existing domain documentation and decision records. Respect their vocabulary
and constraints; no glossary or setup command is required.

Trace a concrete operation through callers, state owners, dependencies, and
tests. Look for knowledge callers must repeat, rules scattered across modules,
pass-through layers, and boundaries that make real behavior hard to test.
Follow enough of the path to distinguish necessary coordination from accidental
complexity. Read [Review lenses](references/review-lenses.md) when assessing
candidate changes.

For each candidate, identify the source locations and a real change or failure
that exposes the cost. Explain what knowledge moves behind the proposed
interface and what becomes simpler at the call site. If removing a wrapper only
moves its complexity to callers, removing it is not an improvement.

Prefer the smallest change that resolves the observed friction. Keep useful
pure functions, explicit dependencies, and established framework conventions.
A small module, a test double, or an extra file alone is not evidence of a flaw.
Skip speculative extension points and refactors whose benefit you cannot show.
An empty shortlist is a valid result.

## Show the useful changes

Rank candidates by expected benefit, confidence in the evidence, migration cost,
and behavior at risk. Mark each as **Strong**, **Worth exploring**, or
**Speculative**. Separate observed problems from predicted benefits. Surface a
conflict with a recorded decision only when current evidence warrants revisiting it.

Read [../visual/SKILL.md](../visual/SKILL.md) and use its HTML delivery workflow,
including its `asd` writing rules. Write a fresh report in the OS temporary
directory unless the user names a destination. This destination overrides
`visual`'s default. Use connected sections rather than a dashboard.

For each candidate, show:

- The affected paths and concrete evidence of friction.
- The proposed ownership or interface change, with a before/after diagram.
- The caller behavior that becomes simpler and the tradeoffs that remain.
- The migration risk and the observable check that would verify the change.

Label the proposed structure as proposed. Link source evidence and explain the
diagrams in prose. Include only enough signature or call-site detail to make the
recommendation reviewable; save full design work for a selected candidate.

Open and inspect the report as `visual` specifies. Return its path, the strongest
recommendation, and any verification limit. If no candidate earns a recommendation,
say so and state the area examined. When implementation was not requested, let
the user choose what to explore next.

Adapted from [Matt Pocock's skill](https://github.com/mattpocock/skills/blob/d81f3a183412e71a5b1e84ca21bc1a35eea03a60/skills/engineering/improve-codebase-architecture/SKILL.md).
See [LICENSE](LICENSE) for the retained MIT license.
