import { readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { Schema } from 'effect';
import { decodeTrace } from '../src/workflows/trace.js';
import { gradeExecution, gradeWorkflow } from '../src/workflows/grade.js';
import { hashEvaluator, SnapshotSchema, WorkflowContractSchema, WorkflowResultSchema } from '../src/workflows/evidence.js';
import { renderTrial } from '../src/workflows/report.js';
import type { WorkflowResult } from '../src/workflows/types.js';

const [directory, ...extra] = process.argv.slice(2);
if (!directory || extra.length) throw new Error('Usage: pnpm eval:regrade .eval-artifacts/<run>/<trial>');
const root = resolve(directory);
const original = Schema.decodeUnknownSync(WorkflowResultSchema)(JSON.parse(await readFile(join(root, 'result.json'), 'utf8')));
const { task } = Schema.decodeUnknownSync(WorkflowContractSchema)(JSON.parse(await readFile(join(root, 'contract.json'), 'utf8')));
if (task.id !== original.task) throw new Error('Task and result do not match');
const before = Schema.decodeUnknownSync(SnapshotSchema)(JSON.parse(await readFile(join(root, 'baseline.json'), 'utf8')));
const installed = Object.fromEntries(Object.entries(before).filter(([path]) => path.startsWith('.agents/skills/') || path.startsWith('.github/skills/')).map(([path, body]) => [path, Buffer.from(body, 'base64').toString()]));
const trace = decodeTrace(original.harness, await readFile(join(root, 'stdout.jsonl'), 'utf8'), original.workspace);
// Regrade only recorded workflow evidence. Preserve original independent outcome checks;
// executing a changed candidate workspace would no longer grade the original run.
const execution = gradeExecution(task, trace);
const checks = [...execution, ...gradeWorkflow({ task, harness: original.harness, condition: original.condition, trace, installed }), ...original.checks.filter((check) => check.layer !== 'loading' && check.layer !== 'delegation' && check.name !== 'project-local mode source' && !execution.some((replacement) => replacement.name === check.name))];
const result: WorkflowResult = { ...original, evaluatorHash: await hashEvaluator(), checks,
  status: original.status === 'blocked' ? 'blocked' : checks.some((check) => check.status === 'failed') ? 'failed' : checks.some((check) => check.status !== 'passed') ? 'incomplete' : 'passed' };
const suffix = `regraded-${new Date().toISOString().replaceAll(':', '-')}`;
await writeFile(join(root, `${suffix}.json`), JSON.stringify(result, null, 2));
await writeFile(join(root, `${suffix}.md`), `Workflow evidence regraded locally. Original outcome checks retained; no model calls or candidate execution. Original result.json is unchanged.\n\n${renderTrial(result)}`);
console.log(`${result.status.toUpperCase()}: ${join(root, `${suffix}.md`)}`);
