# Functional core in TypeScript

Use Effect-inspired ideas through plain TypeScript: explicit inputs, immutable
data, typed outcomes, and composition. Adopt the patterns that clarify the domain
without introducing an Effect dependency or recreating its runtime.

## Make a decision without performing it

A document can be a draft or published. A published document always has a
publication timestamp; a draft cannot accidentally carry one. Publication checks
return domain outcomes rather than throwing expected rejections.

```ts
// publication.ts
export type Document =
  | Readonly<{ _tag: 'Draft'; id: string; body: string }>
  | Readonly<{ _tag: 'Published'; id: string; body: string; publishedAt: string }>;

export type PublicationDecision =
  | Readonly<{ _tag: 'Ready'; document: Extract<Document, { _tag: 'Published' }> }>
  | Readonly<{ _tag: 'EmptyBody' }>
  | Readonly<{ _tag: 'AlreadyPublished'; publishedAt: string }>;

export function assertNever(value: never): never {
  throw new Error(`Unhandled variant: ${JSON.stringify(value)}`);
}

export function preparePublication(document: Document, publishedAt: string): PublicationDecision {
  switch (document._tag) {
    case 'Published':
      return { _tag: 'AlreadyPublished', publishedAt: document.publishedAt };
    case 'Draft': {
      const body = document.body.trim();
      if (body.length === 0) return { _tag: 'EmptyBody' };
      return {
        _tag: 'Ready',
        document: { _tag: 'Published', id: document.id, body, publishedAt },
      };
    }
    default:
      return assertNever(document);
  }
}
```

The function receives time as a value. It does not read the clock, mutate the
document, or save anything. `Ready` describes an intended state; it does not mean
that persistence has succeeded. Validate external documents and timestamps at the
application boundary before passing them here; TypeScript types do not validate JSON.

## Connect effects in the outer workflow

The caller handles every decision explicitly. This example operates on a supplied
snapshot. Its persistence capability atomically checks that the snapshot's revision
is still current, so a concurrent edit cannot silently be overwritten.

```ts
// publish-document.ts
import { assertNever, preparePublication, type Document } from './publication';

type CommitResult = Readonly<{ _tag: 'Saved' }> | Readonly<{ _tag: 'Conflict' }>;

type Dependencies = Readonly<{
  now: () => string;
  commit: (
    document: Extract<Document, { _tag: 'Published' }>,
    expectedRevision: number,
  ) => Promise<CommitResult>;
}>;

export async function publishDocument(
  document: Document,
  revision: number,
  dependencies: Dependencies,
): Promise<string> {
  const decision = preparePublication(document, dependencies.now());

  switch (decision._tag) {
    case 'EmptyBody':
      return 'Write something before publishing.';
    case 'AlreadyPublished':
      return `Already published at ${decision.publishedAt}.`;
    case 'Ready': {
      const result = await dependencies.commit(decision.document, revision);
      switch (result._tag) {
        case 'Saved':
          return 'Published.';
        case 'Conflict':
          return 'The document changed. Reload before publishing.';
        default:
          return assertNever(result);
      }
    }
    default:
      return assertNever(decision);
  }
}
```

Connect a clock and a persistence adapter at application startup or another clear
composition boundary. The adapter must implement the atomic revision check; a
separate read followed by an unconditional write does not satisfy that contract.
Adapter integration tests must prove it.

Unexpected persistence exceptions propagate to the application's error boundary.
If callers need to recover from a known storage failure, add a specific typed
outcome at the adapter boundary. Do not catch every thrown value and label it a
conflict or validation failure. `Promise<T>` does not type its rejection channel.

The workflow returns text because this caller needs a user-facing message. Shared
application operations can return a domain outcome and leave wording to the UI.

## Test the decision through values

```ts
// publication.test.ts
import { expect, it } from 'vitest';
import { preparePublication, type Document } from './publication';

it('prepares a trimmed publication without changing the draft', () => {
  const draft = { _tag: 'Draft', id: 'intro', body: '  Hello  ' } as const;
  const publishedAt = '2026-10-03T10:00:00.000Z';

  expect(preparePublication(draft, publishedAt)).toEqual({
    _tag: 'Ready',
    document: { _tag: 'Published', id: 'intro', body: 'Hello', publishedAt },
  });
  expect(draft).toEqual({ _tag: 'Draft', id: 'intro', body: '  Hello  ' });
});

it('rejects a whitespace-only draft', () => {
  expect(
    preparePublication({ _tag: 'Draft', id: 'intro', body: ' \n ' }, '2026-10-03T10:00:00.000Z'),
  ).toEqual({ _tag: 'EmptyBody' });
});

it('preserves the original publication time when asked to publish again', () => {
  const document: Document = {
    _tag: 'Published',
    id: 'intro',
    body: 'Hello',
    publishedAt: '2026-10-02T10:00:00.000Z',
  };

  expect(preparePublication(document, '2026-10-03T10:00:00.000Z')).toEqual({
    _tag: 'AlreadyPublished',
    publishedAt: '2026-10-02T10:00:00.000Z',
  });
});
```

Workflow tests can inject a fixed clock and a small in-memory commit implementation
to check saved state, rejection paths, and conflict messages. Keep production
adapter tests separate. Pure tests do not prove persistence or application wiring.

## Choose the smallest useful abstraction

- A domain union such as `PublicationDecision` often explains more than a generic `Result<T, E>`. Extract a shared result type only when repeated call sites benefit from common operations.
- Use `undefined` for simple absence. Use distinct variants when missing, loading, failed, and available require different behavior.
- A series of named `const` values is composition. Add a pipe helper only when it makes real transformations easier to follow.
- Readonly collections protect against mutation through that type, not through other aliases. Copy shared mutable data where ownership requires it; do not assume shallow readonly provides deep immutability.
- Keep temporary mutation inside a function when it makes an algorithm clearer or faster. The important boundary is observable mutation of caller-owned state.
- Native promises and `try/finally` remain useful for straightforward async work and resource cleanup. This pattern does not provide Effect's cancellation, resource scopes, or structured concurrency.
