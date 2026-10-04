---
name: asd
description: Restate the last answer using ASD-STE100 Simplified Technical English principles.
disable-model-invocation: true
---

Rewrite your last answer using ASD-STE100 writing principles.

When another explicitly invoked skill uses `asd` for writing, apply the rules
below to that skill's target text. Keep its requested artifact format and
delivery workflow. The previous-answer and rewrite-only defaults apply when
`asd` is invoked on its own.

- Preserve facts, conditions, warnings, and uncertainty.
- Use short sentences with one topic per sentence.
- Use no more than 20 words per instruction and 25 words per descriptive sentence.
- Use active voice and address the reader as "you."
- Use the same term for the same thing throughout.
- Replace unnecessary jargon with familiar words.
- Keep necessary technical terms. Explain unfamiliar terms.
- Avoid idioms, figurative language, and contractions.
- Use numbered steps for procedures.
- Preserve commands, code, file paths, and identifiers exactly.
- Do not add facts or remove details necessary for correctness.

When invoked on its own, return only the rewritten answer.

Do not claim full ASD-STE100 compliance unless you checked the applicable writing
rules and official dictionary.
