import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { workflowCases, webhookFiles } from '../src/workflows/cases.js';
import { decodeTrace, loadedFile } from '../src/workflows/trace.js';
import { gradeOutcome, gradeWorkflow } from '../src/workflows/grade.js';
import { snapshot } from '../src/grade.js';
import { installSkill } from '../src/harnesses.js';
import type { Trace, WorkflowCase, WorkflowHarness } from '../src/workflows/types.js';

const directories: string[] = [];
const task = (id: string): WorkflowCase => {
  const found = workflowCases.find((value) => value.id === id);
  if (!found) throw new Error(id);
  return found;
};
async function fixture() {
  const workspace = await mkdtemp(join(tmpdir(), 'aop-workflow-test-'));
  directories.push(workspace);
  for (const [path, body] of Object.entries(webhookFiles)) {
    await mkdir(dirname(join(workspace, path)), { recursive: true });
    await writeFile(join(workspace, path), body);
  }
  return workspace;
}
afterEach(async () => { await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))); });
const empty: Trace = { workspace: null, calls: [], delegates: [], problems: [], finalLine: null };
const jsonl = (rows: readonly unknown[]) => rows.map((row) => JSON.stringify(row)).join('\n');
function readEvents(harness: WorkflowHarness, path: string, output: string, success = true): unknown[] {
  return harness === 'codex'
    ? [{ type: 'item.completed', item: { id: path, type: 'command_execution', command: `cat ${path}`, aggregated_output: output, exit_code: success ? 0 : 1 } }]
    : [{ type: 'tool.execution_start', data: { toolCallId: path, toolName: 'view', arguments: { path } } }, { type: 'tool.execution_complete', data: { toolCallId: path, success, result: { content: output } } }];
}

// Synthetic native envelopes, modeled on local CLI captures; not evidence of a live run.
describe.each(['codex', 'copilot'] as const)('%s workflow evidence decoder', (harness) => {
  it('requires successful file content, not a mention, catalog entry, or failed read', () => {
    const path = '.agents/skills/aop-mode/SKILL.md';
    const body = '# Mode\nRead the runtime.\n';
    expect(loadedFile(decodeTrace(harness, jsonl(readEvents(harness, path, body))), path, body)).not.toEqual([]);
    expect(loadedFile(decodeTrace(harness, jsonl(readEvents(harness, path, body, false))), path, body)).toEqual([]);
    expect(loadedFile(decodeTrace(harness, jsonl(readEvents(harness, path, '# Mode'))), path, body)).toEqual([]);
    const mention = harness === 'codex' ? { type: 'item.completed', item: { type: 'agent_message', text: `I read ${path}: ${body}` } } : { type: 'assistant.message', data: { content: `I read ${path}: ${body}` } };
    expect(loadedFile(decodeTrace(harness, jsonl([mention, { type: 'session.skills_loaded', data: { skills: [path] } }])), path, body)).toEqual([]);
  });
  it('does not confuse a personal installation with the project copy', () => {
    const path = `${harness === 'codex' ? '.agents' : '.github'}/skills/aop-mode/SKILL.md`;
    const body = '# Mode\n';
    const trace = decodeTrace(harness, jsonl(readEvents(harness, `/home/person/${path}`, body)), '/tmp/candidate');
    expect(loadedFile(trace, path, body)).toEqual([]);
    const checks = gradeWorkflow({ task: task('ordinary'), harness, condition: 'inactive', installed: { [path]: body }, trace });
    expect(checks.find((check) => check.name === 'project-local mode source')?.status).toBe('failed');
    const local = decodeTrace(harness, jsonl(readEvents(harness, `/tmp/candidate/${path}`, body)), '/tmp/candidate');
    expect(loadedFile(local, path, body)).not.toEqual([]);
  });
  it('qualifies every installed routing contract and rejects missing reads', async () => {
    const workspace = await fixture();
    await installSkill(harness, workspace);
    const root = harness === 'codex' ? '.agents/skills/aop-mode' : '.github/skills/aop-mode';
    for (const scenario of workflowCases.filter((value) => value.id !== 'ordinary')) {
      const installed: Record<string, string> = {};
      const rows: unknown[] = [];
      for (const file of scenario.requiredFiles) {
        const path = `${root}/${file}`;
        installed[path] = await readFile(join(workspace, path), 'utf8');
        rows.push(...readEvents(harness, path, installed[path]));
      }
      const loading = (trace: Trace) => gradeWorkflow({ task: scenario, harness, condition: 'explicit', trace, installed }).filter((check) => check.layer === 'loading');
      expect(loading(decodeTrace(harness, jsonl(rows))).every((check) => check.status === 'passed')).toBe(true);
      expect(loading(empty).every((check) => check.status !== 'passed')).toBe(true);
      expect(loading(decodeTrace(harness, jsonl(rows.slice(harness === 'codex' ? 1 : 2)))).some((check) => check.status === 'unobservable')).toBe(true);
    }
  });
  it('rejects implicit activation and never passes malformed traces', () => {
    const path = `${harness === 'codex' ? '.agents' : '.github'}/skills/aop-mode/SKILL.md`;
    const installed = { [path]: '# Mode\n' };
    const checks = gradeWorkflow({ task: task('ordinary'), harness, condition: 'inactive', installed, trace: decodeTrace(harness, jsonl(readEvents(harness, path, installed[path] ?? ''))) });
    expect(checks.find((check) => check.name === 'no observed mode activation')?.status).toBe('failed');
    expect(gradeWorkflow({ task: task('ordinary'), harness, condition: 'inactive', installed, trace: decodeTrace(harness, 'not json') }).some((check) => check.status === 'unobservable')).toBe(true);
  });
});

function codexDelegation(serial = false, omitReturn = false) {
  const spawn = (id: string, prompt: string) => ({ type: 'item.completed', item: { type: 'collab_tool_call', tool: 'spawn_agent', status: 'completed', receiver_thread_ids: [id], prompt } });
  const returned = (id: string) => ({ type: 'item.completed', item: { type: 'collab_tool_call', tool: 'wait', status: 'completed', agents_states: { [id]: { status: 'completed', message: `${id} evidence-backed findings` } } } });
  const rows = serial ? [spawn('a', 'Explore delivery'), returned('a'), spawn('b', 'Explore transport'), returned('b')] : [spawn('a', 'Explore delivery'), spawn('b', 'Explore transport'), ...omitReturn ? [] : [returned('a'), returned('b')]];
  return decodeTrace('codex', jsonl([...rows, spawn('s', 'Synthesize: a evidence-backed findings; b evidence-backed findings'), returned('s'), { type: 'item.completed', item: { type: 'agent_message', text: 'Answer' } }]));
}
it('rejects echo masquerading as a read and decodes numbered Copilot view output', () => {
  const path = '.agents/skills/aop-mode/SKILL.md';
  const body = '# Mode\n1. Read the runtime.\n';
  const fake = decodeTrace('codex', jsonl([{ type: 'item.completed', item: { id: 'fake', type: 'command_execution', command: `echo "cat ${path}"`, aggregated_output: body, exit_code: 0 } }]));
  expect(loadedFile(fake, path, body)).toEqual([]);
  const compound = decodeTrace('codex', jsonl([{ type: 'item.completed', item: { id: 'read', type: 'command_execution', command: `/bin/zsh -lc 'ls .agents; echo ---; cat ${path}'`, aggregated_output: body, exit_code: 0 } }]));
  expect(loadedFile(compound, path, body)).not.toEqual([]);
  const elsewhere = decodeTrace('codex', jsonl([{ type: 'item.completed', item: { id: 'read', type: 'command_execution', command: `cd /home/elsewhere && cat ${path}`, aggregated_output: body, exit_code: 0 } }]));
  expect(loadedFile(elsewhere, path, body)).toEqual([]);
  const view = decodeTrace('copilot', jsonl(readEvents('copilot', path, '1. # Mode\n2. 1. Read the runtime.\n')));
  expect(loadedFile(view, path, body)).not.toEqual([]);
});

describe('delegation contracts', () => {
  const checks = (trace: Trace) => gradeWorkflow({ task: task('investigation'), harness: 'codex', condition: 'explicit', trace, installed: {} }).filter((check) => check.layer === 'delegation');
  it('accepts actual parallel agents, returned results and a later synthesizer', () => {
    expect(checks(codexDelegation()).every((check) => check.status === 'passed')).toBe(true);
  });
  it('rejects sequential execution, spawn-only calls and a claimed swarm', () => {
    expect(checks(codexDelegation(true)).find((check) => check.name === 'parallel fan-out observed')?.status).toBe('failed');
    expect(checks(codexDelegation(false, true)).find((check) => check.name === 'delegates returned before final answer')?.status).toBe('unobservable');
    expect(checks(decodeTrace('codex', jsonl([{ type: 'item.completed', item: { type: 'agent_message', text: 'Three agents explored and synthesized.' } }]))).every((check) => check.status !== 'passed')).toBe(true);
  });
  it.each(['codex', 'copilot'] as const)('qualifies an architecture arena on %s and rejects judging before candidates return', (harness) => {
    const candidateA = 'Candidate A: fixed-window design evidence';
    const candidateB = 'Candidate B: sliding-window design evidence';
    const start = (id: string, prompt: string) => harness === 'codex'
      ? { type: 'item.completed', item: { type: 'collab_tool_call', tool: 'spawn_agent', status: 'completed', receiver_thread_ids: [id], prompt } }
      : { type: 'tool.execution_start', data: { toolCallId: id, toolName: 'task', arguments: { prompt } } };
    const end = (id: string, message: string) => harness === 'codex'
      ? { type: 'item.completed', item: { type: 'collab_tool_call', tool: 'wait', status: 'completed', agents_states: { [id]: { status: 'completed', message } } } }
      : { type: 'tool.execution_complete', data: { toolCallId: id, success: true, result: { content: message } } };
    const a = start('a', 'Produce design candidate A');
    const b = start('b', 'Produce design candidate B');
    const judge = start('j', `Cross-judge and score the rubric. ${candidateA}; ${candidateB}`);
    const final = harness === 'codex' ? { type: 'item.completed', item: { type: 'agent_message', text: 'Review the design.' } } : { type: 'assistant.message', data: { content: 'Review the design.' } };
    const grade = (rows: unknown[]) => gradeWorkflow({ task: task('architecture'), harness, condition: 'explicit', installed: {}, trace: decodeTrace(harness, jsonl(rows)) }).filter((check) => check.layer === 'delegation');
    const good = grade([a, b, end('a', candidateA), end('b', candidateB), judge, end('j', 'Choose B'), final]);
    expect(good.filter((check) => check.name !== 'candidate model diversity').every((check) => check.status === 'passed')).toBe(true);
    expect(good.find((check) => check.name === 'candidate model diversity')?.status).toBe('unobservable');
    const early = grade([a, b, judge, end('j', 'Choose B'), end('a', candidateA), end('b', candidateB), final]);
    expect(early.find((check) => check.name === 'cross-judge after candidates')?.status).toBe('failed');
  });
  it('pairs Copilot native task calls and does not mistake a background handle for a result', () => {
    const rows = [{ type: 'tool.execution_start', data: { toolCallId: 'a', toolName: 'task', arguments: { prompt: 'Explore delivery', mode: 'background' } } }, { type: 'tool.execution_complete', data: { toolCallId: 'a', success: true, result: { content: 'Task running' } } }];
    expect(decodeTrace('copilot', jsonl(rows)).delegates[0]?.endLine).toBeNull();
    const sync = decodeTrace('copilot', jsonl([{ type: 'tool.execution_start', data: { toolCallId: 'a', toolName: 'task', arguments: { prompt: 'Explore delivery' } } }, rows[1]]));
    expect(sync.delegates[0]?.id).toBe('a');
  });
});

const prototypeReference = `export function decide(policy, events, limit, windowMs) {
 const buckets = new Map();
 return events.map(({tenant,at}) => {
  let history = buckets.get(tenant) ?? [];
  history = history.filter(previous => policy === 'fixed' ? Math.floor(previous/windowMs) === Math.floor(at/windowMs) : previous > at-windowMs);
  const allowed = history.length < limit;
  if (allowed) history.push(at);
  buckets.set(tenant,history);
  return allowed;
 });
}
console.log('fixed sliding comparison');\n`;
const designReference = `export interface Limiter { allow(tenant: string, at: number): boolean }
export declare function createLimiter(limit: number, windowMs: number): Limiter;
// Caller usage example. Implementation is not implemented pending review.
const limiter = createLimiter(2, 1000);
limiter.allow('tenant-a', 100);
`;

describe('independent outcome qualification', () => {
  it('rejects the empty investigation and accepts the grounded reference without edits', async () => {
    const workspace = await fixture(); const before = await snapshot(workspace);
    const trace = decodeTrace('codex', jsonl(readEvents('codex', 'src/delivery.mjs', webhookFiles['src/delivery.mjs'] ?? '')));
    const grade = (finalText: string) => gradeOutcome({ task: task('investigation'), workspace, before, trace, finalText });
    expect((await grade('The HTTP client upgrade is definitely broken.')).some((check) => check.status === 'failed')).toBe(true);
    const reference = 'src/delivery.mjs creates one deadline at 100ms. src/retry.mjs advances the clock so the retry starts at 110ms. evidence/attempts.json corroborates this. The HTTP upgrade remains an unconfirmed hypothesis.';
    expect((await grade(reference)).every((check) => check.status === 'passed')).toBe(true);
    await writeFile(join(workspace, 'src/delivery.mjs'), '// fixed');
    expect((await grade(reference)).find((check) => check.layer === 'boundary')?.status).toBe('failed');
  });
  it('rejects missing and broken prototypes, accepts the reference, and rejects fabricated execution', async () => {
    const workspace = await fixture(); const before = await snapshot(workspace);
    const trace = decodeTrace('codex', jsonl([{ type: 'item.completed', item: { id: 'compare', type: 'command_execution', command: '/bin/zsh -lc "node scratch/compare.mjs; git status --short"', aggregated_output: 'fixed [true,true,true]\nsliding [true,true,false]', exit_code: 0 } }]));
    const grade = (observed = trace) => gradeOutcome({ task: task('prototype'), workspace, before, trace: observed, finalText: 'Recommend sliding over fixed for predictable bursts. This is a throwaway prototype.' });
    expect((await grade()).some((check) => check.status === 'failed')).toBe(true);
    await mkdir(join(workspace, 'scratch'));
    await writeFile(join(workspace, 'scratch/compare.mjs'), 'export const decide = (_, events) => events.map(() => true);');
    expect((await grade()).find((check) => check.name === 'independent policy behavior')?.status).toBe('failed');
    await writeFile(join(workspace, 'scratch/compare.mjs'), prototypeReference.replace('if (allowed) history.push(at);', 'history.push(at);'));
    expect((await grade()).find((check) => check.name === 'independent policy behavior')?.status).toBe('failed');
    await writeFile(join(workspace, 'scratch/compare.mjs'), prototypeReference);
    expect((await grade()).every((check) => check.status === 'passed')).toBe(true);
    expect((await grade(empty)).find((check) => check.layer === 'verification')?.status).toBe('failed');
  });
  it('rejects absent and ill-typed designs, accepts a reference sketch, and enforces the review boundary', async () => {
    const workspace = await fixture(); const before = await snapshot(workspace);
    const grade = () => gradeOutcome({ task: task('architecture'), workspace, before, trace: empty, finalText: 'Ready for your review before implementation.' });
    expect((await grade()).some((check) => check.status === 'failed')).toBe(true);
    await mkdir(join(workspace, 'scratch'));
    await writeFile(join(workspace, 'scratch/design.ts'), designReference);
    await writeFile(join(workspace, 'scratch/rationale.md'), 'Fixed and sliding windows have a memory tradeoff. Recommend sliding as the base.');
    expect((await grade()).every((check) => check.status === 'passed')).toBe(true);
    await writeFile(join(workspace, 'scratch/design.ts'), designReference + '\nconst broken: number = "text";');
    expect((await grade()).find((check) => check.name === 'design typechecks independently')?.status).toBe('failed');
    await writeFile(join(workspace, 'src/rate-limit.mjs'), 'export const allow = () => true;');
    expect((await grade()).find((check) => check.layer === 'boundary')?.status).toBe('failed');
  });
  it('rejects an empty ordinary task and accepts the exact reference artifact', async () => {
    const workspace = await fixture(); const before = await snapshot(workspace);
    const grade = () => gradeOutcome({ task: task('ordinary'), workspace, before, trace: empty, finalText: 'Done.' });
    expect((await grade()).some((check) => check.status === 'failed')).toBe(true);
    await writeFile(join(workspace, 'NOTE.txt'), 'hello\n');
    expect((await grade()).every((check) => check.status === 'passed')).toBe(true);
  });
});
