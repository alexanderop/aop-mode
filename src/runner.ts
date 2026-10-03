import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { Effect, Schema } from 'effect';
import { finalResponse, hashSkill, installSkill, invokeSkill, taskCommand } from './harnesses.js';
import { grade, snapshot } from './grade.js';
import { runProcess } from './process.js';
import type { Task } from './tasks.js';
import type { Harness, RunResult } from './types.js';

class RunnerError extends Schema.TaggedError<RunnerError>()('RunnerError', { message: Schema.String }) {}
const io = <A>(operation: () => Promise<A>) => Effect.tryPromise({ try: operation, catch: (error) => new RunnerError({ message: String(error) }) });

export const runTask = Effect.fn('Evaluation.runTask')(function* (input: {
  readonly harness: Harness;
  readonly task: Task;
  readonly artifactsRoot: string;
  readonly timeoutMs: number;
  readonly model?: string;
}) {
  const startedAt = new Date().toISOString();
  const start = Date.now();
  const directory = yield* io(() => mkdtemp(join(input.artifactsRoot, `${input.harness}-${input.task.id}-`)));
  const workspace = yield* io(() => mkdtemp(join(tmpdir(), 'aop-candidate-')));
  let cliVersion = 'unavailable';
  const skillHash = yield* io(hashSkill);
  const prompt = input.task.id === 'explicit-only' ? input.task.prompt : invokeSkill(input.harness, input.task.prompt);
  const base = { harness: input.harness, task: input.task.id, startedAt, requestedModel: input.model ?? null, workspace, artifacts: directory, skillHash };
  const execution = Effect.gen(function* () {
    const version = yield* runProcess({ executable: input.harness, args: ['--version'] }, workspace, 10000);
    cliVersion = version.stdout.trim();
    if (version.exitCode !== 0) return yield* Effect.fail(new RunnerError({ message: `CLI unavailable: ${version.stderr}` }));
    yield* io(async () => {
      for (const [file, content] of Object.entries(input.task.files)) {
        await mkdir(dirname(join(workspace, file)), { recursive: true });
        await writeFile(join(workspace, file), content);
      }
      await installSkill(input.harness, workspace);
      await writeFile(join(directory, 'prompt.txt'), prompt);
    });
    const git = yield* runProcess({ executable: 'git', args: ['init', '-q'] }, workspace, 10000);
    if (git.exitCode !== 0) return yield* Effect.fail(new RunnerError({ message: git.stderr }));
    const before = yield* io(() => snapshot(workspace));
    yield* io(() => writeFile(join(directory, 'baseline.json'), JSON.stringify(before, null, 2)));
    const command = taskCommand(input.harness, prompt, input.model);
    yield* io(() => writeFile(join(directory, 'command.json'), JSON.stringify(command, null, 2)));
    const output = yield* runProcess(command, workspace, input.timeoutMs, directory);
    const final = finalResponse(input.harness, output);
    yield* io(() => writeFile(join(directory, 'final.txt'), final.text));
    if (!final.success) {
      return { ...base, cliVersion, durationMs: Date.now() - start, status: 'blocked' as const,
        error: output.timedOut ? 'Harness timed out' : `No successful terminal event (exit ${output.exitCode})${final.text ? `: ${final.text.slice(0, 300)}` : '; inspect stdout.jsonl and stderr.log'}`,
        verdict: { passed: false, checks: [{ name: 'harness completed', passed: false, detail: output.stderr.slice(-1500) }] },
      };
    }
    const verdict = yield* io(() => grade(input.task, workspace, final.text, output.stdout, before));
    return { ...base, cliVersion, durationMs: Date.now() - start, status: verdict.passed ? 'passed' as const : 'failed' as const, verdict, error: null };
  });
  const result: RunResult = yield* execution.pipe(Effect.onInterrupt(() => io(() => writeFile(join(directory, 'result.json'), JSON.stringify({
    ...base, cliVersion, durationMs: Date.now() - start, status: 'blocked',
    verdict: { passed: false, checks: [] }, error: 'Interrupted; see partial process logs',
  }, null, 2) + '\n'))), Effect.catch((error) => Effect.succeed({
    ...base, cliVersion, durationMs: Date.now() - start, status: 'blocked' as const,
    verdict: { passed: false, checks: [] }, error: String(error),
  })));
  yield* io(() => writeFile(join(directory, 'result.json'), JSON.stringify(result, null, 2) + '\n'));
  return result;
});
