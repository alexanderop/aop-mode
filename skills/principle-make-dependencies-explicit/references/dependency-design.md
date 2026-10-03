# Dependency design

## Values before capabilities

If the caller already knows the time, accept `now: number` rather than a clock.
If an operation must obtain time during execution, inject `now: () => number`.
The same distinction applies to an already-loaded collection versus a repository.
Avoid threading an application-wide services object through every function.

## One operation, two adapters

This example exposes only the storage capabilities the operation needs. The
in-memory implementation exercises the same public contract without `vi.mock`,
`vi.fn`, a global clock replacement, or implementation-call assertions.

```ts
type SavedPackage = Readonly<{ name: string; savedAt: number }>
type Collection = Readonly<{
  put: (entry: SavedPackage) => Promise<void>
  list: () => Promise<readonly SavedPackage[]>
}>
type Dependencies = Readonly<{
  collection: Collection
  now: () => number
}>

const createSavePackage = ({ collection, now }: Dependencies) =>
  async (name: string): Promise<void> => {
    await collection.put({ name, savedAt: now() })
  }

function createMemoryCollection(): Collection {
  const entries = new Map<string, SavedPackage>()
  return {
    put: async (entry) => { entries.set(entry.name, { ...entry }) },
    list: async () => [...entries.values()].map((entry) => ({ ...entry })),
  }
}
```

A Vitest unit test can exercise this operation:

```ts
import { expect, test } from 'vitest'

test('saving a package records its name and the supplied time', async () => {
  const collection = createMemoryCollection()
  const savePackage = createSavePackage({ collection, now: () => 100 })

  await savePackage('vitest')

  expect(await collection.list()).toEqual([{ name: 'vitest', savedAt: 100 }])
})
```

The example's contained mutation implements storage; it does not expose mutable
state to callers. In production, compose the operation with an IndexedDB, HTTP,
or other concrete adapter and a real clock at the application boundary. Keep
Vue injection keys or Effect layers in the wiring appropriate to that project.

## Where the remaining proof belongs

- The test above proves the operation supplies the package and time to storage. It does not prove IndexedDB durability or an HTTP endpoint.
- Run reusable behavioral contract cases against both an in-memory implementation and the real adapter where practical: overwrite semantics, missing records, and isolation must agree.
- For an HTTP adapter, use MSW integration tests to exercise real serialization, validation, and error mapping.
- For IndexedDB, use real browser storage tests; reset databases between tests. Add an application reload journey to prove startup restores persisted data.
- Simulate dependency failure through its public contract and assert the operation's documented outcome. Keep expected domain errors distinct from unexpected defects using the repository's error model.

Do not replace an adapter with a fake in a test claiming to verify that adapter.
An abstraction is justified by a meaningful boundary, not by a desire to mock
another helper. Do not refactor unrelated architecture just to apply this example.
