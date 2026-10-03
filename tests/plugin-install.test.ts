import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import { Effect } from 'effect';
import { snapshot } from '../src/grade.js';
import { writeDistribution } from '../src/distribution.js';
import { gradePluginInstallation } from '../src/plugin-install-grade.js';
import { buildPluginRelease } from '../src/plugin-release.js';
import { evaluatePluginInstall } from '../src/plugin-install-eval.js';
import { runProcess } from '../src/process.js';

vi.mock('../src/process.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/process.js')>();
  return { ...actual, runProcess: vi.fn(actual.runProcess) };
});
afterEach(() => vi.mocked(runProcess).mockRestore());

it('accepts a complete reference and rejects missing, modified, extra, and implicit skills', async () => {
  const root = await mkdtemp(join(tmpdir(), 'aop-install-grade-'));
  try {
    const reference = join(root, 'reference');
    await mkdir(reference);
    await writeDistribution('codex', reference);
    const expected = await snapshot(reference);
    expect((await gradePluginInstallation(expected, reference)).passed).toBe(true);
    for (const kind of ['missing', 'modified', 'extra', 'implicit']) {
      const candidate = join(root, kind);
      await cp(reference, candidate, { recursive: true });
      if (kind === 'missing') await rm(join(candidate, 'skills/aop-mode/SKILL.md'));
      if (kind === 'modified') await writeFile(join(candidate, 'skills/aop-mode/runtime.md'), 'incorrect runtime');
      if (kind === 'extra') await writeFile(join(candidate, 'unexpected-hook.js'), 'auto activate');
      if (kind === 'implicit') await writeFile(join(candidate, 'skills/aop-mode/agents/openai.yaml'), 'policy:\n  allow_implicit_invocation: true\n');
      expect((await gradePluginInstallation(expected, candidate)).passed, kind).toBe(false);
    }
    expect((await gradePluginInstallation(expected, join(root, 'absent'))).passed).toBe(false);
  } finally { await rm(root, { recursive: true, force: true }); }
});

it('rejects zero-exit install claims when no files were installed', async () => {
  const root = await mkdtemp(join(tmpdir(), 'aop-install-empty-'));
  let workspace: string | undefined;
  try {
    const original = await vi.importActual<typeof import('../src/process.js')>('../src/process.js');
    vi.mocked(runProcess).mockImplementation((command, cwd, timeout, logs) => {
      if (command.executable === 'tar') return original.runProcess(command, cwd, timeout, logs);
      return Effect.succeed({ exitCode: 0, stdout: 'aop-mode 0.1.0 0.1.0-installation-eval', stderr: '', timedOut: false, overflow: false });
    });
    const archive = await buildPluginRelease(join(root, 'release'));
    const result = await Effect.runPromise(evaluatePluginInstall({ harness: 'claude', archive, artifactsRoot: root, timeoutMs: 1000 }));
    workspace = result.workspace;
    expect(result.status).toBe('failed');
    expect(result.checks.find((check) => check.name === 'grader qualification')?.passed).toBe(true);
    expect(result.checks.find((check) => check.name === 'install: complete installed package')?.passed).toBe(false);
  } finally {
    await rm(root, { recursive: true, force: true });
    if (workspace) await rm(workspace, { recursive: true, force: true });
  }
});

it('records unavailable CLIs as blocked instead of passing', async () => {
  const root = await mkdtemp(join(tmpdir(), 'aop-install-blocked-'));
  let workspace: string | undefined;
  try {
    vi.mocked(runProcess).mockImplementation(() => Effect.succeed({ exitCode: 127, stdout: '', stderr: 'not found', timedOut: false, overflow: false }));
    const result = await Effect.runPromise(evaluatePluginInstall({ harness: 'codex', archive: 'unused', artifactsRoot: root, timeoutMs: 1000 }));
    workspace = result.workspace;
    expect(result.status).toBe('blocked');
    expect(result.cliVersion).toBe('unavailable');
    expect(result.error).toContain('exit 127');
  } finally {
    await rm(root, { recursive: true, force: true });
    if (workspace) await rm(workspace, { recursive: true, force: true });
  }
});
