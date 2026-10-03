import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Effect, Schema } from 'effect';
import { buildPluginRelease } from '../src/plugin-release.js';
import { evaluatePluginInstall, type PluginInstallResult } from '../src/plugin-install-eval.js';
import { Harness } from '../src/types.js';

const args = process.argv.slice(2);
const options = new Map<string, string>();
for (let index = 0; index < args.length; index += 2) {
  const flag = args[index];
  const value = args[index + 1];
  if (!flag || !value || !['--harness', '--timeout'].includes(flag))
    throw new Error(
      'Usage: pnpm eval:plugins [--harness all|claude|codex|copilot] [--timeout seconds]',
    );
  options.set(flag, value);
}
const selection = options.get('--harness') ?? 'all';
const harnesses =
  selection === 'all' ? Harness.literals : [Schema.decodeUnknownSync(Harness)(selection)];
const timeoutMs = Number(options.get('--timeout') ?? '30') * 1000;
if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 120000)
  throw new Error('Timeout must be 1–120 seconds');
const artifactsRoot = resolve(
  '.eval-artifacts',
  `plugin-install-${new Date().toISOString().replaceAll(':', '-')}`,
);
await mkdir(artifactsRoot, { recursive: true });
const archive = await buildPluginRelease(resolve(artifactsRoot, 'release'));
console.log(`Evidence: ${artifactsRoot}`);
const completed: PluginInstallResult[] = [];
const controller = new AbortController();
const cancel = () => controller.abort();
process.once('SIGINT', cancel);
process.once('SIGTERM', cancel);
try {
  await Effect.runPromise(
    Effect.forEach(
      harnesses,
      (harness) =>
        Effect.gen(function* () {
          console.log(
            `Starting ${harness} plugin installation evaluation (isolated configuration; no model calls)`,
          );
          const result = yield* evaluatePluginInstall({
            harness,
            archive,
            artifactsRoot,
            timeoutMs,
          });
          completed.push(result);
          console.log(`${result.status.toUpperCase()} ${harness}: ${result.cliVersion}`);
          for (const check of result.checks.filter((item) => !item.passed))
            console.log(`  ${check.name}: ${check.detail}`);
          if (result.error) console.log(result.error);
        }),
      { concurrency: 1 },
    ),
    { signal: controller.signal },
  );
} catch (error) {
  if (!controller.signal.aborted) throw error;
  console.error('Interrupted; partial evidence retained.');
  process.exitCode = 130;
} finally {
  process.removeListener('SIGINT', cancel);
  process.removeListener('SIGTERM', cancel);
  await writeFile(resolve(artifactsRoot, 'summary.json'), JSON.stringify(completed, null, 2));
}
console.log(
  `${completed.filter((result) => result.status === 'passed').length}/${harnesses.length} installation evaluations passed`,
);
if (
  !process.exitCode &&
  (completed.length !== harnesses.length || completed.some((result) => result.status !== 'passed'))
)
  process.exitCode = 1;
