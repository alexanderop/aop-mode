import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { grade, parseEvidence, snapshot } from '../src/grade.js';
import { fixedPager, getTask } from '../src/tasks.js';
import type { TaskId } from '../src/types.js';

const directories: string[] = [];
async function fixture(id: TaskId) {
  const directory = await mkdtemp(join(tmpdir(), 'aop-grader-test-')); directories.push(directory);
  for (const [file, content] of Object.entries(getTask(id).files)) {
    await mkdir(dirname(join(directory, file)), { recursive: true });
    await writeFile(join(directory, file), content);
  }
  return directory;
}
afterEach(async () => { await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))); });
const repairEvidence = JSON.stringify({ workflow: 'aop-mode', kind: 'repair', summary: 'Fixed one-based pagination', checks: [{ command: 'node --experimental-strip-types --test page.test.mjs', before: 'failed', after: 'passed', evidence: 'Expected a,b; got c. Then 1 pass.' }], findings: [], limits: [] });
const transcript = 'node --experimental-strip-types --test page.test.mjs\nnot ok 1\nERR_ASSERTION\n';
describe('independent task qualification', () => {
  it('rejects the broken fixture even when an agent claims success', async () => {
    const workspace = await fixture('repair');
    const result = await grade(getTask('repair'), workspace, repairEvidence, transcript, await snapshot(workspace));
    expect(result.passed).toBe(false);
    expect(result.checks.find((check) => check.name === 'independent behavior')?.passed).toBe(false);
  });
  it('accepts the reference solution and preserved tests', async () => {
    const workspace = await fixture('repair'); const before = await snapshot(workspace);
    await writeFile(join(workspace, 'src/page.ts'), fixedPager);
    expect((await grade(getTask('repair'), workspace, repairEvidence, transcript, before)).passed).toBe(true);
  });
  it('rejects a fix that changes the visible test', async () => {
    const workspace = await fixture('repair'); const before = await snapshot(workspace);
    await writeFile(join(workspace, 'src/page.ts'), fixedPager);
    await writeFile(join(workspace, 'page.test.mjs'), '// removed regression test\n');
    expect((await grade(getTask('repair'), workspace, repairEvidence, transcript, before)).passed).toBe(false);
  });
  it('rejects a review that edits code despite finding the bug', async () => {
    const workspace = await fixture('review'); const before = await snapshot(workspace);
    const evidence = JSON.stringify({ workflow: 'aop-mode', kind: 'review', summary: 'Ownership inverted', checks: [], findings: [{ file: 'src/access.ts', line: 2, trigger: 'A private document is requested by a non-owner', consequence: 'Unauthorized read access is allowed' }], limits: [] });
    expect((await grade(getTask('review'), workspace, evidence, '', before)).passed).toBe(true);
    await writeFile(join(workspace, 'src/access.ts'), 'fixed');
    expect((await grade(getTask('review'), workspace, evidence, '', before)).passed).toBe(false);
  });
  it('rejects an empty review', async () => {
    const workspace = await fixture('review');
    const evidence = JSON.stringify({ workflow: 'aop-mode', kind: 'review', summary: 'Looks good', checks: [], findings: [], limits: [] });
    expect((await grade(getTask('review'), workspace, evidence, '', await snapshot(workspace))).passed).toBe(false);
  });
  it('detects unwanted activation in an ordinary task', async () => {
    const workspace = await fixture('explicit-only'); const before = await snapshot(workspace);
    await writeFile(join(workspace, 'NOTE.txt'), 'hello\n');
    expect((await grade(getTask('explicit-only'), workspace, 'Done.', '', before)).passed).toBe(true);
    expect((await grade(getTask('explicit-only'), workspace, 'Done.', '{"type":"tool_use","skill":"aop-mode"}', before)).passed).toBe(false);
  });
  it('validates untrusted final evidence', () => {
    expect(parseEvidence('{"workflow":"aop-mode"}')).toBeNull();
    expect(parseEvidence('Done!')).toBeNull();
    expect(parseEvidence(repairEvidence)?.kind).toBe('repair');
    expect(parseEvidence(`Fixed the defect.\n\n\`\`\`json\n${repairEvidence}\n\`\`\``)?.kind).toBe('repair');
    expect(parseEvidence(`\`\`\`json\n${repairEvidence}\n\`\`\`\n\`\`\`json\n${repairEvidence}\n\`\`\``)).toBeNull();
  });
});
