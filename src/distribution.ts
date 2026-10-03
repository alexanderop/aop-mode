import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkImport } from '../scripts/import-pstack.js';
import type { Harness } from './types.js';

export const distributionRoot = fileURLToPath(new URL('../', import.meta.url));
export const harnesses: readonly Harness[] = ['claude', 'codex', 'copilot'];
const policy = 'interface:\n  display_name: "aop-mode skill"\npolicy:\n  allow_implicit_invocation: false\n';

/** Build into a caller-owned empty directory; never mutate the pinned source. */
export async function writeDistribution(harness: Harness, destination: string): Promise<void> {
  const lock = await checkImport();
  const skills = join(destination, 'skills');
  const bundle = join(skills, 'aop-mode');
  await mkdir(bundle, { recursive: true });
  await cp(join(distributionRoot, 'skills/aop-mode'), bundle, { recursive: true });
  await cp(join(distributionRoot, 'vendor/pstack'), join(bundle, '.upstream'), { recursive: true });
  await writeFile(join(bundle, 'catalog.json'), `${JSON.stringify(lock.skills, null, 2)}\n`);
  await cp(join(distributionRoot, 'upstream.lock.json'), join(bundle, 'upstream.lock.json'));
  await cp(join(distributionRoot, 'NOTICE.md'), join(bundle, 'NOTICE.md'));
  const common = await readFile(join(distributionRoot, 'runtime/common.md'), 'utf8');
  const adapter = await readFile(join(distributionRoot, `runtime/${harness}.md`), 'utf8');
  await writeFile(join(bundle, 'runtime.md'), `${common}\n${adapter}`);
  for (const skill of lock.skills) {
    const target = join(skills, skill.name);
    const source = await readFile(join(distributionRoot, 'vendor/pstack', skill.entrypoint), 'utf8');
    const description = /^description: ([^\n]+(?:\n[ \t]+[^\n]*)*)/m.exec(source)?.[1];
    if (!description || description === '>' || description === '|') throw new Error(`Unsupported description: ${skill.name}`);
    await mkdir(target, { recursive: true });
    await writeFile(join(target, 'SKILL.md'), `---\nname: ${skill.name}\ndescription: ${description}\ndisable-model-invocation: true\n---\n\n# ${skill.name}\n\nRead ../aop-mode/runtime.md fully, then read ../aop-mode/.upstream/${skill.entrypoint} fully.\nFollow that original skill for this explicit task, using the runtime contract for\nplatform mechanics. Resolve all relative references and scripts from the original\nfile's directory, not this wrapper. Do not substitute a summary of the workflow.\n`);
  }
  for (const name of ['aop-mode', ...lock.skills.map((skill) => skill.name)]) {
    await mkdir(join(skills, name, 'agents'), { recursive: true });
    await writeFile(join(skills, name, 'agents/openai.yaml'), policy);
  }
  await writeFile(join(destination, 'distribution.json'), `${JSON.stringify({ harness, upstream: lock.revision, version: lock.version, skillCount: lock.skills.length + 1, activation: 'explicit-only' }, null, 2)}\n`);
  if (harness === 'claude') {
    await mkdir(join(destination, '.claude-plugin'), { recursive: true });
    await cp(join(distributionRoot, 'packaging/claude-plugin.json'), join(destination, '.claude-plugin/plugin.json'));
  }
}
