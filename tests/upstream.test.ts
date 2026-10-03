import { afterEach, describe, expect, it } from 'vitest';
import { chmod, cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { checkImport, inventorySkills, pinnedRevision } from '../scripts/import-pstack.js';

const root = resolve(import.meta.dirname, '..');
const temporary: string[] = [];
async function copyImport(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'aop-upstream-test-'));
  temporary.push(directory);
  await cp(join(root, 'vendor'), join(directory, 'vendor'), { recursive: true });
  await cp(join(root, 'upstream.lock.json'), join(directory, 'upstream.lock.json'));
  return directory;
}
afterEach(async () => {
  await Promise.all(
    temporary.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('immutable upstream provenance', () => {
  it('retains the entire pinned original including automation skills, references, scripts, agents, and license', async () => {
    const lock = await checkImport(root);
    expect(lock.revision).toBe(pinnedRevision);
    expect(lock.version).toBe('0.15.6');
    expect(lock.files).toHaveLength(160);
    expect(lock.skills.filter((skill) => skill.category === 'skill')).toHaveLength(49);
    expect(
      lock.skills.filter((skill) => skill.category === 'automation').map((skill) => skill.name),
    ).toEqual(['reproduce-and-fix-issues', 'setup-benny', 'triage-issue-reports']);
    expect(lock.files.map((file) => file.path)).toEqual(
      expect.arrayContaining([
        'LICENSE',
        'agents/comment-sicko.md',
        'agents/poteto-agent.md',
        'skills/poteto-mode/playbooks/orchestrate.md',
        'skills/poteto-mode/scripts/orch/orch.ts',
        'skills/poteto-mode/scripts/watch-pr/watch-pr',
        'skills/why/references/sources/slack.md',
        'automations/benny/templates/configuration.example.yaml',
      ]),
    );
    expect(await readFile(join(root, 'vendor/pstack/LICENSE'), 'utf8')).toContain('Lauren Tan');
  });
  it('rejects an edited source even if every original filename is present', async () => {
    const directory = await copyImport();
    await writeFile(join(directory, 'vendor/pstack/skills/swarm/SKILL.md'), 'replaced workflow');
    await expect(checkImport(directory)).rejects.toThrow(
      'Upstream bytes changed: skills/swarm/SKILL.md',
    );
  });
  it('rejects missing source files', async () => {
    const directory = await copyImport();
    await rm(join(directory, 'vendor/pstack/agents/comment-sicko.md'));
    await expect(checkImport(directory)).rejects.toThrow('Upstream file scope differs');
  });
  it('rejects additional untracked source files', async () => {
    const directory = await copyImport();
    await writeFile(join(directory, 'vendor/pstack/extra.md'), 'unexpected file');
    await expect(checkImport(directory)).rejects.toThrow('Upstream file scope differs');
  });
  it('rejects losing executable permissions on shipped helpers', async () => {
    const directory = await copyImport();
    await chmod(
      join(directory, 'vendor/pstack/skills/poteto-mode/scripts/watch-pr/watch-pr'),
      0o644,
    );
    await expect(checkImport(directory)).rejects.toThrow('Upstream executable mode changed');
  });
  it('inventories both user skills and separately supplied automation workflows', () => {
    expect(
      inventorySkills([
        'skills/bro/SKILL.md',
        'skills/bro/references/example.md',
        'automations/benny/skills/setup-benny/SKILL.md',
      ]),
    ).toEqual([
      {
        name: 'bro',
        directory: 'skills/bro',
        entrypoint: 'skills/bro/SKILL.md',
        category: 'skill',
      },
      {
        name: 'setup-benny',
        directory: 'automations/benny/skills/setup-benny',
        entrypoint: 'automations/benny/skills/setup-benny/SKILL.md',
        category: 'automation',
      },
    ]);
  });
});
