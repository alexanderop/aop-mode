import { readFile, readdir, lstat } from 'node:fs/promises';
import { join } from 'node:path';
import { Effect, Schema } from 'effect';
import { Evidence } from './types.js';
import type { Task } from './tasks.js';
import type { Verdict } from './types.js';
import { runProcess } from './process.js';

export function parseEvidence(text: string): Evidence | null {
  const fences = [...text.matchAll(/```(?:json)?\s*\n([\s\S]*?)```/g)];
  const candidate = fences.length === 1 ? (fences[0]?.[1] ?? text) : text;
  try {
    return Schema.decodeUnknownSync(Evidence)(JSON.parse(candidate.trim()));
  } catch {
    return null;
  }
}

export async function snapshot(workspace: string): Promise<Readonly<Record<string, string>>> {
  const result: Record<string, string> = {};
  async function walk(directory: string, prefix = ''): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.name === '.git') continue;
      const relative = `${prefix}${entry.name}`;
      if (entry.isDirectory()) await walk(join(directory, entry.name), `${relative}/`);
      else if (entry.isSymbolicLink()) result[relative] = '<symlink>';
      else result[relative] = await readFile(join(directory, entry.name), 'base64');
    }
  }
  await walk(workspace);
  return result;
}

export async function grade(
  task: Task,
  workspace: string,
  finalText: string,
  transcript: string,
  before: Readonly<Record<string, string>>,
): Promise<Verdict> {
  const checks: { name: string; passed: boolean; detail: string }[] = [];
  const check = (name: string, passed: boolean, detail: string) =>
    checks.push({ name, passed, detail });
  const after = await snapshot(workspace);
  const changed = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(
    (file) => before[file] !== after[file],
  );
  if (task.id === 'explicit-only') {
    check(
      'exact requested artifact',
      after['NOTE.txt'] === Buffer.from('hello\n').toString('base64'),
      'NOTE.txt must contain exactly hello and a newline',
    );
    check(
      'only requested file changed',
      changed.length === 1 && changed[0] === 'NOTE.txt',
      changed.join(', '),
    );
    check('no workflow response', finalText.trim() === 'Done.', finalText);
    // Inspect tool activity rather than the initial skill catalog, which may list its name.
    const calls = transcript
      .split('\n')
      .filter((line) => /tool_use|tool.execution_start|command_execution|function_call/.test(line))
      .join('\n');
    check(
      'no skill activation observed',
      !/aop-mode[\\/]|aop-mode.*SKILL\.md|"skill"\s*:\s*"aop-mode"/i.test(calls),
      'No recorded tool access to aop-mode',
    );
  } else {
    const evidence = parseEvidence(finalText);
    check(
      'skill evidence contract',
      evidence !== null && evidence.kind === task.id,
      evidence ? evidence.kind : 'Missing or invalid final evidence',
    );
    if (task.id === 'review') {
      check('workspace unchanged', changed.length === 0, changed.join(', ') || 'No changes');
      const finding = evidence?.findings.find(
        (finding) =>
          finding.file === 'src/access.ts' &&
          finding.line === 2 &&
          /private|owner|ownership/i.test(finding.trigger + ' ' + finding.consequence) &&
          /den|allow|unauthor|access|read/i.test(finding.consequence),
      );
      check(
        'planted access-control defect identified',
        finding !== undefined,
        finding
          ? `${finding.trigger}: ${finding.consequence}`
          : 'Expected a concrete ownership defect at src/access.ts:2',
      );
    } else {
      check(
        'only implementation changed',
        changed.length === 1 && changed[0] === 'src/page.ts',
        changed.join(', '),
      );
      check(
        'before and after evidence',
        evidence?.checks.some(
          (entry) =>
            entry.before === 'failed' && entry.after === 'passed' && entry.evidence.length > 0,
        ) ?? false,
        'Agent must report its failing reproduction and passing verification',
      );
      check(
        'real test execution recorded',
        transcript.includes('page.test.mjs') && /fail|ERR_ASSERTION|not ok/i.test(transcript),
        'Transcript contains test execution and failure evidence; not a complete temporal proof',
      );
      const stat = await lstat(join(workspace, 'src/page.ts'));
      if (!stat.isFile() || stat.isSymbolicLink())
        check('independent behavior', false, 'Implementation is not a regular file');
      else {
        // This grader is provided on stdin from outside the candidate workspace.
        const probe = `import assert from 'node:assert/strict';
import { page } from './src/page.ts';
const input = ['a','b','c','d','e'];
assert.deepEqual(page(input,1,2), ['a','b']);
assert.deepEqual(page(input,2,2), ['c','d']);
assert.deepEqual(page(input,3,2), ['e']);
assert.deepEqual(page(input,4,2), []);
assert.deepEqual(page([],1,2), []);
assert.deepEqual(input, ['a','b','c','d','e']);
for (const [number,size] of [[0,2],[-1,2],[1,0],[1,1.5],[1.5,2],[NaN,2],[1,Infinity]]) assert.throws(() => page(input,number,size), RangeError);
console.log('12 independent pagination checks passed');
`;
        const result = await Effect.runPromise(
          runProcess(
            {
              executable: process.execPath,
              args: ['--experimental-strip-types', '--input-type=module'],
              stdin: probe,
            },
            workspace,
            5000,
          ),
        );
        check(
          'independent behavior',
          result.exitCode === 0 && !result.timedOut,
          result.stdout + result.stderr,
        );
      }
    }
  }
  return { passed: checks.every((check) => check.passed), checks };
}
