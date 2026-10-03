import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { Ajv2020 } from 'ajv/dist/2020.js';
import { expect, it } from 'vitest';
import { harnesses } from '../src/distribution.js';
import { readPluginManifest } from '../src/plugin-manifest.js';
import { buildPluginRelease } from '../src/plugin-release.js';
import { checkImport } from '../scripts/import-pstack.js';

const execute = promisify(execFile);

it('validates portable metadata against the pinned standard and rejects legacy root keys', async () => {
  const schema = JSON.parse(await readFile('packaging/schemas/agent-plugins-1.0.0.json', 'utf8'));
  const validate = new Ajv2020().compile(schema);
  const manifest = await readPluginManifest();
  expect(validate(manifest)).toBe(true);
  expect(validate({ ...manifest, skills: './skills/' })).toBe(false);
  expect(validate({ ...manifest, $schema: undefined })).toBe(false);
  expect(validate({ ...manifest, name: '../unsafe' })).toBe(false);
  const pkg = JSON.parse(await readFile('package.json', 'utf8')) as { version: string };
  expect(manifest.version).toBe(pkg.version);
});

it('ships an extractable release with complete skills, attribution, working marketplace paths and checksum', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'aop-release-test-'));
  try {
    const archive = await buildPluginRelease(directory);
    const manifest = await readPluginManifest();
    const filename = `aop-mode-${manifest.version}.tar.gz`;
    expect(await readFile(`${archive}.sha256`, 'utf8')).toBe(
      `${createHash('sha256').update(await readFile(archive)).digest('hex')}  ${filename}\n`,
    );
    const extracted = join(directory, 'extracted');
    await mkdir(extracted);
    await execute('tar', ['-xzf', archive, '-C', extracted]);
    const root = join(extracted, `aop-mode-${manifest.version}`);
    expect((await readdir(root)).sort()).toEqual(['.agents', '.claude-plugin', '.plugin', 'INSTALL.md', 'LICENSE', 'NOTICE.md', 'plugins']);
    const lock = await checkImport();
    for (const harness of harnesses) {
      const plugin = join(root, 'plugins', harness);
      expect(JSON.parse(await readFile(join(plugin, 'plugin.json'), 'utf8'))).toEqual(manifest);
      expect(await readFile(join(plugin, 'NOTICE.md'), 'utf8')).toContain('Lauren Tan');
      expect(await readFile(join(plugin, 'LICENSE'), 'utf8')).toBe(await readFile('LICENSE', 'utf8'));
      expect(await readFile(join(plugin, 'skills/aop-mode/runtime.md'), 'utf8')).toContain(
        await readFile(`runtime/${harness}.md`, 'utf8'),
      );
      for (const file of lock.files) {
        const path = join(plugin, 'skills/aop-mode/.upstream', file.path);
        expect(createHash('sha256').update(await readFile(path)).digest('hex'), file.path).toBe(file.sha256);
        expect(Boolean((await stat(path)).mode & 0o111), file.path).toBe(file.mode === '100755');
      }
      for (const name of await readdir(join(plugin, 'skills'))) {
        expect(await readFile(join(plugin, 'skills', name, 'SKILL.md'), 'utf8')).toContain('disable-model-invocation: true');
        expect(await readFile(join(plugin, 'skills', name, 'agents/openai.yaml'), 'utf8')).toContain('allow_implicit_invocation: false');
      }
    }
    const claudeManifest = JSON.parse(await readFile(join(root, 'plugins/claude/.claude-plugin/plugin.json'), 'utf8'));
    const { $schema: _schema, ...metadata } = manifest;
    expect(claudeManifest).toEqual({ ...metadata, skills: './skills/' });
    const codex = JSON.parse(await readFile(join(root, '.agents/plugins/marketplace.json'), 'utf8'));
    const claude = JSON.parse(await readFile(join(root, '.claude-plugin/marketplace.json'), 'utf8'));
    expect(codex.plugins[0].source.path).toBe('./plugins/codex');
    expect(claude.plugins[0].source).toBe('./plugins/claude');
    for (const path of [codex.plugins[0].source.path, claude.plugins[0].source]) {
      expect(JSON.parse(await readFile(join(root, path, 'plugin.json'), 'utf8')).name).toBe('aop-mode');
    }
    const instructions = await readFile(join(root, 'INSTALL.md'), 'utf8');
    expect(instructions).not.toContain('{{version}}');
    expect(instructions).toContain(`aop-mode-${manifest.version}/plugins/claude`);
    expect((await readdir(directory)).some((name) => name.startsWith('.pack-'))).toBe(false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
