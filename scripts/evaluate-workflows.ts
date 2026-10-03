import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Effect } from 'effect';
import { workflowCases } from '../src/workflows/cases.js';
import { runWorkflow } from '../src/workflows/runner.js';
import { renderSummary } from '../src/workflows/report.js';
import type { Condition, WorkflowHarness, WorkflowResult } from '../src/workflows/types.js';

const args = process.argv.slice(2);
const options = new Map<string, string>();
let list = false;
for (let i = 0; i < args.length; i++) {
  const flag = args[i];
  if (flag === '--list') { list = true; continue; }
  const value = args[++i];
  if (!flag || !value || !['--harness', '--task', '--condition', '--attempts', '--timeout', '--model'].includes(flag)) throw new Error('Usage: pnpm eval:workflows [--list] [--harness all|codex|copilot] [--task all|investigation|prototype|architecture|ordinary] [--condition all|explicit|inactive|baseline] [--attempts 1..10] [--timeout 1..900] [--model id]');
  options.set(flag, value);
}
function select<A extends string>(flag: string, values: readonly A[], fallback: string): readonly A[] {
  const value = options.get(flag) ?? fallback;
  if (value === 'all') return values;
  const selected = values.find((candidate) => candidate === value);
  if (!selected) throw new Error(`Invalid ${flag}: ${value}`);
  return [selected];
}
const harnesses = select<WorkflowHarness>('--harness', ['codex', 'copilot'], 'all');
const tasks = select('--task', workflowCases.map((task) => task.id), 'all');
const conditions = select<Condition>('--condition', ['explicit', 'inactive', 'baseline'], 'explicit');
const attempts = Number(options.get('--attempts') ?? '1');
const timeoutMs = Number(options.get('--timeout') ?? '300') * 1000;
if (!Number.isSafeInteger(attempts) || attempts < 1 || attempts > 10) throw new Error('Attempts must be 1..10');
if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 900000) throw new Error('Timeout must be 1..900 seconds');
const model = options.get('--model');
if (model && harnesses.length !== 1) throw new Error('Choose one harness for a provider-specific model');
const trials = harnesses.flatMap((harness) => workflowCases.filter((task) => tasks.includes(task.id)).flatMap((task) => conditions.flatMap((condition) => Array.from({ length: attempts }, (_, index) => ({ harness, task, condition, attempt: index + 1 })))));
if (list) {
  for (const trial of trials) console.log(`${trial.harness}/${trial.task.id}/${trial.condition}/${trial.attempt}\n  ${trial.task.title}\n  required: ${trial.condition === 'explicit' ? trial.task.requiredFiles.join(', ') : 'no activation'}\n  delegation contract: ${trial.task.delegation}`);
} else {
  const artifactsRoot = resolve('.eval-artifacts', `workflows-${new Date().toISOString().replaceAll(':', '-')}`);
  await mkdir(artifactsRoot, { recursive: true });
  console.log(`Private evidence: ${artifactsRoot}`);
  const results: WorkflowResult[] = [];
  const controller = new AbortController();
  const cancel = () => controller.abort();
  process.once('SIGINT', cancel); process.once('SIGTERM', cancel);
  try {
    await Effect.runPromise(Effect.forEach(trials, (trial) => Effect.gen(function* () {
      console.log(`Starting ${trial.harness}/${trial.task.id}/${trial.condition}/${trial.attempt}`);
      const result = yield* runWorkflow({ ...trial, artifactsRoot, timeoutMs, ...(model ? { model } : {}) });
      results.push(result);
      console.log(`${result.status.toUpperCase()} ${trial.harness}/${trial.task.id}: ${result.checks.filter((c) => c.status === 'passed').length}/${result.checks.length} checks passed${result.error ? ` (${result.error})` : ''}`);
      // Persist after every trial so interruptions never discard completed attempts.
      yield* Effect.promise(async () => {
        await writeFile(resolve(artifactsRoot, 'summary.json'), JSON.stringify(results, null, 2));
        await writeFile(resolve(artifactsRoot, 'summary.md'), renderSummary(results));
      });
    }), { concurrency: 1 }), { signal: controller.signal });
  } catch (error) {
    if (!controller.signal.aborted) throw error;
    process.exitCode = 130;
    console.error('Interrupted; completed and partial evidence retained.');
  } finally {
    process.removeListener('SIGINT', cancel); process.removeListener('SIGTERM', cancel);
  }
  if (!process.exitCode && results.some((result) => result.status !== 'passed')) process.exitCode = 1;
}
