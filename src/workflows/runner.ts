import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { Effect, Schema } from 'effect';
import { finalResponse, hashSkill, installSkill, invokeSkill, taskCommand } from '../harnesses.js';
import { snapshot } from '../grade.js';
import { runProcess } from '../process.js';
import { webhookFiles } from './cases.js';
import { gradeOutcome, gradeWorkflow } from './grade.js';
import { decodeTrace } from './trace.js';
import { hashEvaluator } from './evidence.js';
import { renderTrial } from './report.js';
import type { Condition, WorkflowCase, WorkflowHarness, WorkflowResult } from './types.js';

class WorkflowError extends Schema.TaggedError<WorkflowError>()('WorkflowError', { message: Schema.String }) {}
const io = <A>(operation: () => Promise<A>) => Effect.tryPromise({ try: operation, catch: (error) => new WorkflowError({ message: String(error) }) });

export const runWorkflow = Effect.fn('Evaluation.runWorkflow')(function* (input: {
  readonly harness: WorkflowHarness; readonly task: WorkflowCase; readonly condition: Condition;
  readonly attempt: number; readonly artifactsRoot: string; readonly timeoutMs: number; readonly model?: string;
}) {
  const startedAt = new Date().toISOString();
  const start = Date.now();
  const artifacts = yield* io(() => mkdtemp(join(input.artifactsRoot, `${input.harness}-${input.task.id}-${input.condition}-${input.attempt}-`)));
  const workspace = yield* io(() => mkdtemp(join(tmpdir(), 'aop-workflow-')));
  const skillHash = yield* io(hashSkill);
  const evaluatorHash = yield* io(hashEvaluator);
  let cliVersion = 'unavailable';
  const active = input.condition === 'explicit' && input.task.id !== 'ordinary';
  const base = { harness: input.harness, task: input.task.id, condition: input.condition, attempt: input.attempt,
    invocation: active ? input.harness === 'codex' ? 'dollar' as const : 'file-path' as const : 'none' as const,
    requestedModel: input.model ?? null, skillHash, evaluatorHash, startedAt, workspace, artifacts };
  const blocked = (message: string): WorkflowResult => ({ ...base, cliVersion, durationMs: Date.now() - start, status: 'blocked', checks: [], error: message });
  const execute = Effect.gen(function* () {
    const version = yield* runProcess({ executable: input.harness, args: ['--version'] }, workspace, 10000);
    cliVersion = version.stdout.trim();
    if (version.exitCode !== 0) return blocked(`CLI unavailable: ${version.stderr}`);
    const installed: Record<string, string> = {};
    yield* io(async () => {
      for (const [path, body] of Object.entries(webhookFiles)) {
        await mkdir(dirname(join(workspace, path)), { recursive: true });
        await writeFile(join(workspace, path), body);
      }
      if (input.condition !== 'baseline') {
        await installSkill(input.harness, workspace);
        const files = await snapshot(workspace);
        for (const [path, encoded] of Object.entries(files)) if (path.startsWith('.agents/skills/') || path.startsWith('.github/skills/')) installed[path] = Buffer.from(encoded, 'base64').toString();
      }
      const contracts = Object.fromEntries(await Promise.all(input.task.sources.map(async (path) => [path, await readFile(new URL(`../../${path}`, import.meta.url), 'utf8')])));
      await writeFile(join(artifacts, 'contract.json'), JSON.stringify({ task: input.task, sources: contracts }, null, 2));
    });
    const git = yield* runProcess({ executable: 'git', args: ['init', '-q'] }, workspace, 10000);
    if (git.exitCode !== 0) return blocked(git.stderr);
    const before = yield* io(() => snapshot(workspace));
    const prompt = active ? invokeSkill(input.harness, input.task.prompt) : input.task.prompt;
    const original = taskCommand(input.harness, prompt, input.model);
    // Permit native task delegation in Copilot without granting unrestricted shell or network access.
    const command = input.harness === 'copilot' ? { ...original, args: [...original.args, '--allow-tool', 'task'] } : original;
    yield* io(async () => {
      await writeFile(join(artifacts, 'baseline.json'), JSON.stringify(before, null, 2));
      await writeFile(join(artifacts, 'prompt.txt'), prompt);
      await writeFile(join(artifacts, 'command.json'), JSON.stringify(command, null, 2));
    });
    const output = yield* runProcess(command, workspace, input.timeoutMs, artifacts);
    const final = finalResponse(input.harness, output);
    const trace = decodeTrace(input.harness, output.stdout, workspace);
    yield* io(async () => {
      await writeFile(join(artifacts, 'final.txt'), final.text);
      await writeFile(join(artifacts, 'trace.json'), JSON.stringify(trace, null, 2));
    });
    const checks = [
      ...gradeWorkflow({ task: input.task, harness: input.harness, condition: input.condition, trace, installed }),
      ...(yield* io(() => gradeOutcome({ task: input.task, workspace, before, finalText: final.text, trace }))),
    ];
    const status = !final.success ? 'blocked' : checks.some((check) => check.status === 'failed') ? 'failed' : checks.some((check) => check.status !== 'passed') ? 'incomplete' : 'passed';
    return { ...base, cliVersion, durationMs: Date.now() - start, status, checks,
      error: final.success ? null : output.timedOut ? 'Harness timed out; partial evidence retained.' : `No successful terminal event (exit ${output.exitCode}); inspect private logs.` } satisfies WorkflowResult;
  });
  const result = yield* execute.pipe(
    Effect.onInterrupt(() => io(() => writeFile(join(artifacts, 'result.json'), JSON.stringify(blocked('Interrupted; partial logs retained.'), null, 2)))),
    Effect.catch((error) => Effect.succeed(blocked(String(error)))),
  );
  yield* io(async () => {
    await writeFile(join(artifacts, 'result.json'), JSON.stringify(result, null, 2));
    await writeFile(join(artifacts, 'report.md'), renderTrial(result));
  });
  return result;
});
