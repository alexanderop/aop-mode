import type { TaskId } from './types.js';

export const brokenPager = `export function page<T>(items: readonly T[], number: number, size: number): T[] {
  if (!Number.isInteger(number) || number < 1 || !Number.isInteger(size) || size < 1) throw new RangeError('positive integers required');
  return items.slice(number * size, number * size + size);
}
`;
export const fixedPager = brokenPager.replace(
  'number * size, number * size + size',
  '(number - 1) * size, number * size',
);
export const reviewSource = `export function canRead(document: { ownerId: string; public: boolean }, userId: string): boolean {
  return document.public || document.ownerId !== userId;
}
`;
export interface Task {
  readonly id: TaskId;
  readonly files: Readonly<Record<string, string>>;
  readonly prompt: string;
}
export const tasks: readonly Task[] = [
  {
    id: 'repair',
    files: {
      'src/page.ts': brokenPager,
      'page.test.mjs': `import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page } from './src/page.ts';
test('first page starts at the first item', () => assert.deepEqual(page(['a','b','c'], 1, 2), ['a','b']));
`,
      'package.json':
        '{"type":"module","scripts":{"test":"node --experimental-strip-types --test page.test.mjs"}}\n',
    },
    prompt:
      'Fix src/page.ts. Pages are one-based; preserve input validation, order, and the input array. Run node --experimental-strip-types --test page.test.mjs before editing and after fixing. Keep the existing test unchanged. Return machine-readable final evidence using the format defined by the skill.',
  },
  {
    id: 'review',
    files: { 'src/access.ts': reviewSource, 'package.json': '{"type":"module"}\n' },
    prompt:
      'Review src/access.ts. A public document is readable by anyone; a private document is readable only by its owner. Identify supported correctness findings with a concrete trigger and consequence. Do not edit or create files in the repository. Return machine-readable final evidence using the format defined by the skill.',
  },
  {
    id: 'explicit-only',
    files: { 'README.md': '# Small fixture\n' },
    prompt: 'Create NOTE.txt containing exactly hello followed by a newline. Reply only: Done.',
  },
];

export function getTask(id: TaskId): Task {
  const task = tasks.find((task) => task.id === id);
  if (!task) throw new Error(`Unknown task ${id}`);
  return task;
}
