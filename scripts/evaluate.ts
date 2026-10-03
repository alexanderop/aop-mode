import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Effect, Schema } from 'effect';
import { runTask } from '../src/runner.js';
import { Harness, TaskId } from '../src/types.js';
import type { RunResult } from '../src/types.js';
import { getTask } from '../src/tasks.js';

const args = process.argv.slice(2);
const options = new Map<string, string>();
for (let i = 0; i < args.length; i += 2) {
  const flag = args[i]; const value = args[i + 1];
  if (!flag || !value || !['--harness', '--task', '--timeout', '--model'].includes(flag)) throw new Error('Usage: pnpm test:harnesses [--harness all|claude|codex|copilot] [--task all|repair|review|explicit-only] [--timeout seconds] [--model id]');
  options.set(flag, value);
}
const harnessArg = options.get('--harness') ?? 'all';
const taskArg = options.get('--task') ?? 'all';
const harnesses = harnessArg === 'all' ? Harness.literals : [Schema.decodeUnknownSync(Harness)(harnessArg)];
const taskIds = taskArg === 'all' ? TaskId.literals : [Schema.decodeUnknownSync(TaskId)(taskArg)];
const timeoutMs = Number(options.get('--timeout') ?? '180') * 1000;
if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 900000) throw new Error('Timeout must be 1–900 seconds');
const model = options.get('--model');
if (model && harnesses.length !== 1) throw new Error('Select one harness when specifying a provider-specific model');
const artifactsRoot = resolve('.eval-artifacts', new Date().toISOString().replaceAll(':', '-'));
await mkdir(artifactsRoot, { recursive: true });
console.log(`Evidence: ${artifactsRoot}`);
const completed: RunResult[] = [];
const controller = new AbortController();
const cancel = () => controller.abort();
process.once('SIGINT', cancel);
process.once('SIGTERM', cancel);
try {
await Effect.runPromise(Effect.forEach(harnesses, (harness) => Effect.forEach(taskIds, (taskId) => Effect.gen(function* () {
  console.log(`Starting ${harness}/${taskId}`);
  const result = yield* runTask({ harness, task: getTask(taskId), artifactsRoot, timeoutMs, ...(model ? { model } : {}) });
  console.log(`${result.status.toUpperCase()} ${harness}/${taskId} (${Math.round(result.durationMs / 1000)}s)${result.error ? `: ${result.error}` : ''}`);
  for (const check of result.verdict.checks.filter((check) => !check.passed)) console.log(`  ${check.name}: ${check.detail}`);
  completed.push(result);
  return result;
})), { concurrency: 3 }), { signal: controller.signal });
} catch (error) {
  if (!controller.signal.aborted) throw error;
  console.error('Interrupted. Child processes stopped; partial evidence retained.');
  process.exitCode = 130;
} finally {
  process.removeListener('SIGINT', cancel);
  process.removeListener('SIGTERM', cancel);
  await writeFile(resolve(artifactsRoot, 'summary.json'), JSON.stringify(completed, null, 2) + '\n');
}
console.log(`${completed.filter((result) => result.status === 'passed').length}/${harnesses.length * taskIds.length} planned tasks passed`);
if (!process.exitCode && completed.some((result) => result.status !== 'passed')) process.exitCode = 1;
