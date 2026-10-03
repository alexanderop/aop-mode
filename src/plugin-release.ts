import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { distributionRoot, harnesses, writeDistribution } from './distribution.js';
import { readPluginManifest } from './plugin-manifest.js';

const execute = promisify(execFile);

export async function buildPluginRelease(output: string): Promise<string> {
  const manifest = await readPluginManifest();
  if (!/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(manifest.version)) {
    throw new Error('Plugin release requires a valid version in packaging/plugin.json');
  }
  await mkdir(output, { recursive: true });
  const stage = await mkdtemp(join(output, '.pack-'));
  const name = `aop-mode-${manifest.version}`;
  try {
    const root = join(stage, name);
    for (const harness of harnesses) {
      const destination = join(root, 'plugins', harness);
      await mkdir(destination, { recursive: true });
      await writeDistribution(harness, destination);
    }
    await mkdir(join(root, '.agents/plugins'), { recursive: true });
    await writeFile(join(root, '.agents/plugins/marketplace.json'), `${JSON.stringify({
      name: 'aop-mode-local',
      plugins: [{ name: 'aop-mode', source: { source: 'local', path: './plugins/codex' },
        policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' }, category: 'Productivity' }],
    }, null, 2)}\n`);
    await mkdir(join(root, '.claude-plugin'), { recursive: true });
    await writeFile(join(root, '.claude-plugin/marketplace.json'), `${JSON.stringify({
      name: 'aop-mode-local', description: 'Explicit workflows adapted from pstack', owner: { name: 'Alexander Opalic' },
      plugins: [{ name: 'aop-mode', source: './plugins/claude' }],
    }, null, 2)}\n`);
    await mkdir(join(root, '.plugin'), { recursive: true });
    await writeFile(join(root, '.plugin/marketplace.json'), `${JSON.stringify({
      name: 'aop-mode-local', owner: { name: 'Alexander Opalic' },
      plugins: [{ name: 'aop-mode', source: './plugins/copilot' }],
    }, null, 2)}\n`);
    for (const file of ['LICENSE', 'NOTICE.md']) await cp(join(distributionRoot, file), join(root, file));
    const instructions = await readFile(join(distributionRoot, 'packaging/INSTALL.md'), 'utf8');
    await writeFile(join(root, 'INSTALL.md'), instructions.replaceAll('{{version}}', manifest.version));
    const archive = `${name}.tar.gz`;
    await execute('tar', ['-czf', join(stage, archive), '-C', stage, name], {
      env: { ...process.env, COPYFILE_DISABLE: '1' },
    });
    const digest = createHash('sha256').update(await readFile(join(stage, archive))).digest('hex');
    await writeFile(join(stage, `${archive}.sha256`), `${digest}  ${archive}\n`);
    await rename(join(stage, archive), join(output, archive));
    await rename(join(stage, `${archive}.sha256`), join(output, `${archive}.sha256`));
    return join(output, archive);
  } finally {
    await rm(stage, { recursive: true, force: true });
  }
}
