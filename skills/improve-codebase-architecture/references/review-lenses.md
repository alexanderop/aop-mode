# Review lenses

Use these questions to test a suspected problem. They are not a checklist of
refactors every repository needs.

## Knowledge and ownership

Which caller must understand a rule that belongs to another module? Look for
repeated ordering constraints, state transitions, serialization details, and
failure handling. Trace actual call sites before proposing a new owner.

A useful boundary hides one coherent body of knowledge. It need not combine
storage, business rules, and rendering into one file. Pure domain functions can
stay separate while an application operation owns their coordination.

For example, suppose several callers each read a document, check a revision,
write changes, and update an index. A proposed operation could own that sequence:

```ts
// Before: each caller coordinates the same invariant.
const current = await documents.read(id);
assertRevision(current, expectedRevision);
const saved = await documents.write(applyEdit(current, edit));
await index.update(saved);

// Proposed: callers request an operation with an explicit outcome.
const result = await editor.apply({ id, expectedRevision, edit });
```

The signature alone solves nothing. Investigate what happens if indexing fails
after the write, whether edits can race, and which owner can enforce the required
consistency. Preserve those outcomes in the proposal. Use the project's existing
error and dependency conventions; do not introduce a new framework for this refactor.

## Interface cost

Compare what callers must know before and after. A renamed facade with the same
ordering requirements has not hidden complexity. A broad options object may
expose more decisions than the implementation it wraps.

For a thin wrapper, ask what disappears if it is removed. Keep it when it enforces
a meaningful policy, isolates an external system, or serves a real compatibility
boundary. Avoid interfaces justified only by an imagined second implementation.

## Test boundaries

Identify the behavior whose confidence would improve. Check whether current tests
miss coordination failures or merely repeat internal call sequences. Propose a
test through the operation callers use, at the smallest real layer that reaches
the risk. Keep focused tests for pure rules when they provide useful coverage.

For the document example, a meaningful check might exercise two conflicting edits
or an index failure after saving. A test that only asserts `index.update` was
called does not establish consistency. State any environment needed to verify
the outcome and distinguish existing coverage from proposed coverage.

## Cost and evidence

Recent churn helps choose where to look; it does not prove poor architecture.
Prefer a traced example of repeated edits, inconsistent behavior, or leaked
knowledge. Link the paths and symbols that support the finding.

Account for caller migration, compatibility, state ownership, and failure modes.
A cleaner diagram is not enough to justify disruption. Mark uncertain benefits
as speculative and explain what evidence would strengthen or reject them.
