import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Effect, Schema } from 'effect';
import { snapshot } from './grade.js';
import { gradePluginInstallation, installedPluginRoots } from './plugin-install-grade.js';
import { readPluginManifest } from './plugin-manifest.js';
import { runProcess } from './process.js';
import type { Harness, Verdict } from './types.js';

class InstallationError extends Schema.TaggedError<InstallationError>()('InstallationError', { message: Schema.String }) {}
const io = <A>(operation: () => Promise<A>) => Effect.tryPromise({ try: operation, catch: (error) => new InstallationError({ message: String(error) }) });
const CodexInventory = Schema.Struct({ installed: Schema.Array(Schema.Struct({ name: Schema.String, version: Schema.String, enabled: Schema.Boolean })) });

export interface PluginInstallResult {
  readonly harness: Harness;
  readonly cliVersion: string;
  readonly status: 'passed' | 'failed' | 'blocked';
  readonly checks: Verdict['checks'];
  readonly error: string | null;
  readonly workspace: string;
  readonly artifacts: string;
}

export const evaluatePluginInstall = Effect.fn('PluginInstallation.evaluate')(function* (input: {
  readonly harness: Harness;
  readonly archive: string;
  readonly artifactsRoot: string;
  readonly timeoutMs: number;
}) {
  const { harness } = input;
  const artifacts = yield* io(() => mkdtemp(join(input.artifactsRoot, `${harness}-`)));
  const workspace = yield* io(() => mkdtemp(join(tmpdir(), `aop-plugin-${harness}-`)));
  const state = join(workspace, 'client-state');
  const project = join(workspace, 'project');
  yield* io(async () => { await mkdir(state); await mkdir(project); });
  const isolation = harness === 'claude' ? `CLAUDE_CONFIG_DIR=${state}`
    : harness === 'codex' ? `CODEX_HOME=${state}` : `COPILOT_HOME=${state}`;
  const cache = harness === 'copilot' ? join(state, 'installed-plugins') : join(state, 'plugins/cache');
  const checks: { name: string; passed: boolean; detail: string }[] = [];
  let cliVersion = 'unavailable';
  let step = 0;
  const command = Effect.fn('PluginInstallation.command')(function* (args: readonly string[]) {
    const logs = join(artifacts, `${++step}-${args.slice(0, 3).join('-')}`);
    yield* io(() => mkdir(logs));
    yield* io(() => writeFile(join(logs, 'command.json'), JSON.stringify({ harness, args }, null, 2)));
    const result = yield* runProcess({ executable: 'env', args: [isolation, 'CI=true', 'COPILOT_AUTO_UPDATE=false', harness, ...args] }, project, input.timeoutMs, logs);
    if (result.exitCode !== 0 || result.timedOut || result.overflow) {
      return yield* Effect.fail(new InstallationError({ message: `${harness} ${args.join(' ')}: exit ${result.exitCode}, timedOut=${result.timedOut}; see ${logs}` }));
    }
    return result.stdout;
  });
  const check = (name: string, passed: boolean, detail: string) => checks.push({ name, passed, detail });
  const inventory = Effect.fn('PluginInstallation.inventory')(function* (version: string, phase: string) {
    const output = yield* command(harness === 'claude' ? ['plugin', 'details', 'aop-mode']
      : harness === 'codex' ? ['plugin', 'list', '--marketplace', 'aop-mode-local', '--json'] : ['plugin', 'list']);
    const visible = yield* io(async () => harness === 'codex'
      ? Schema.decodeUnknownSync(CodexInventory)(JSON.parse(output)).installed.some((plugin) => plugin.name === 'aop-mode' && plugin.version === version && plugin.enabled)
      : output.includes('aop-mode') && output.includes(version));
    check(`${phase}: native plugin inventory`, visible, `Expected aop-mode ${version}`);
  });
  const verifyFiles = Effect.fn('PluginInstallation.verifyFiles')(function* (expected: Readonly<Record<string, string>>, phase: string) {
    const roots = yield* io(() => installedPluginRoots(cache));
    const grades = yield* io(() => Promise.all(roots.map((root) => gradePluginInstallation(expected, root))));
    const match = grades.find((grade) => grade.passed);
    check(`${phase}: complete installed package`, match !== undefined,
      match ? match.checks.map((item) => item.detail).join('; ') : JSON.stringify(grades));
    check(`${phase}: installed cache populated`, roots.length > 0, roots.join(', ') || 'No installed plugin roots');
  });
  const work = Effect.gen(function* () {
    cliVersion = (yield* command(['--version'])).trim();
    const unpack = yield* runProcess({ executable: 'tar', args: ['-xzf', input.archive, '-C', workspace] }, project, input.timeoutMs);
    if (unpack.exitCode !== 0 || unpack.timedOut) return yield* Effect.fail(new InstallationError({ message: 'Could not extract release archive' }));
    const metadata = yield* io(readPluginManifest);
    const release = join(workspace, `aop-mode-${metadata.version}`);
    const source = join(release, 'plugins', harness);
    const expected = yield* io(() => snapshot(source));
    yield* io(() => writeFile(join(artifacts, 'reference.json'), JSON.stringify(expected)));
    const reference = yield* io(() => gradePluginInstallation(expected, source));
    const broken = join(workspace, 'broken-install-control');
    yield* io(async () => { await cp(source, broken, { recursive: true }); await rm(join(broken, 'skills/aop-mode/SKILL.md')); });
    const rejected = yield* io(() => gradePluginInstallation(expected, broken));
    check('grader qualification', reference.passed && !rejected.passed, 'Accept the complete reference and reject a missing entrypoint');
    if (!reference.passed || rejected.passed) return yield* Effect.fail(new InstallationError({ message: 'Installation grader did not qualify' }));

    yield* command(['plugin', 'marketplace', 'add', release]);
    const selector = 'aop-mode@aop-mode-local';
    const installation = yield* command(['plugin', harness === 'codex' ? 'add' : 'install', selector]);
    yield* inventory(metadata.version, 'install');
    yield* verifyFiles(expected, 'install');
    const names = Object.keys(expected).filter((path) => /^skills\/[^/]+\/SKILL\.md$/.test(path)).map((path) => path.split('/')[1]);
    if (harness === 'copilot') {
      check('native skill discovery', installation.includes(`Installed ${names.length} skills`), `${names.length} expected skills reported by installer`);
    } else if (harness === 'claude') {
      const details = yield* command(['plugin', 'details', 'aop-mode']);
      check('native skill discovery', details.includes(`Skills (${names.length})`) && names.every((name) => name !== undefined && details.includes(name)), `${names.length} expected skills`);
    } else if (harness === 'codex') {
      const logs = join(artifacts, 'skill-discovery');
      yield* io(() => mkdir(logs));
      const result = yield* runProcess({ executable: 'env', args: [isolation, process.execPath, '--import', import.meta.resolve('tsx'), fileURLToPath(new URL('../scripts/inspect-plugin-skills.ts', import.meta.url))] }, project, input.timeoutMs, logs);
      if (result.exitCode !== 0 || result.timedOut || result.overflow) return yield* Effect.fail(new InstallationError({ message: `Native skill discovery unavailable; see ${logs}` }));
      const discovered = yield* io(async () => Schema.decodeUnknownSync(Schema.Struct({ data: Schema.Array(Schema.Struct({
        skills: Schema.Array(Schema.Struct({ name: Schema.String, pluginId: Schema.NullOr(Schema.String), enabled: Schema.Boolean })),
        errors: Schema.Array(Schema.Unknown),
      })) }))(JSON.parse(result.stdout)));
      const owned = discovered.data.flatMap((entry) => entry.skills).filter((skill) => skill.pluginId === 'aop-mode@aop-mode-local' && skill.enabled);
      check('native skill discovery', discovered.data.every((entry) => entry.errors.length === 0) && owned.length === names.length && names.every((name) => owned.some((skill) => skill.name === `aop-mode:${name}`)), `${owned.length}/${names.length} enabled plugin skills`);
    }

    // Exercise a real content/version change, not an update that leaves the same bytes.
    const nextVersion = `${metadata.version}-installation-eval`;
    yield* io(async () => {
      await writeFile(join(source, 'plugin.json'), `${JSON.stringify({ ...metadata, version: nextVersion }, null, 2)}\n`);
      if (harness === 'claude') {
        const { $schema: _schema, ...legacy } = metadata;
        await writeFile(join(source, '.claude-plugin/plugin.json'), `${JSON.stringify({ ...legacy, version: nextVersion, skills: './skills/' }, null, 2)}\n`);
      }
      await writeFile(join(source, 'installation-eval-marker.txt'), 'updated package\n');
    });
    const updated = yield* io(() => snapshot(source));
    yield* io(() => writeFile(join(artifacts, 'updated-reference.json'), JSON.stringify(updated)));
    yield* command(['plugin', harness === 'codex' ? 'add' : 'update', selector]);
    yield* inventory(nextVersion, 'update');
    yield* verifyFiles(updated, 'update');
    yield* command(['plugin', harness === 'codex' ? 'remove' : 'uninstall', selector]);
    const remaining = yield* command(harness === 'codex' ? ['plugin', 'list', '--marketplace', 'aop-mode-local', '--json'] : ['plugin', 'list']);
    const removed = yield* io(async () => harness === 'codex'
      ? !Schema.decodeUnknownSync(CodexInventory)(JSON.parse(remaining)).installed.some((plugin) => plugin.name === 'aop-mode')
      : !remaining.includes('aop-mode'));
    check('uninstall: absent from installed inventory', removed, 'The plugin must no longer be enabled or listed as installed');
    check('project unchanged', Object.keys(yield* io(() => snapshot(project))).length === 0, 'No project instructions or hooks written');
    return null;
  });
  let error: string | null = null;
  yield* work.pipe(Effect.catch((failure) => Effect.sync(() => { error = String(failure); })), Effect.onInterrupt(() => io(() => writeFile(join(artifacts, 'result.json'), JSON.stringify({
    harness, cliVersion, status: 'blocked', checks, error: 'Interrupted', workspace, artifacts,
  }, null, 2)))));
  const result: PluginInstallResult = {
    harness, cliVersion, status: error ? 'blocked' : checks.length > 0 && checks.every((item) => item.passed) ? 'passed' : 'failed',
    checks, error, workspace, artifacts,
  };
  yield* io(() => writeFile(join(artifacts, 'result.json'), JSON.stringify(result, null, 2)));
  return result;
});
