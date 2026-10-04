import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm, mkdir, writeFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { checkImport } from '../scripts/import-pstack.js';
import { harnesses, writeDistribution } from '../src/distribution.js';
import { installSkill } from '../src/harnesses.js';

for (const harness of harnesses) {
  it(`${harness} packages every original skill and supporting file without changing bytes or modes`, async () => {
    const destination = await mkdtemp(join(tmpdir(), 'aop-parity-'));
    try {
      const lock = await checkImport();
      await writeDistribution(harness, destination);
      const root = join(destination, 'skills');
      const personal = [
        'asd',
        'improve-codebase-architecture',
        'principle-compose-ui-variants',
        'principle-design-calm-interfaces',
        'principle-functional-core',
        'principle-make-dependencies-explicit',
        'principle-test-at-the-right-layer',
        'visual',
      ];
      expect((await readdir(root)).sort()).toEqual(
        ['aop-mode', ...personal, ...lock.skills.map((skill) => skill.name)].sort(),
      );
      for (const name of personal) {
        const source = join('skills', name);
        for (const file of await readdir(source, { recursive: true })) {
          if (!(await stat(join(source, file))).isFile() || file === 'agents/openai.yaml') continue;
          expect(await readFile(join(root, name, file), 'utf8')).toBe(
            await readFile(join(source, file), 'utf8'),
          );
        }
        expect(await readFile(join(root, name, 'agents/openai.yaml'), 'utf8')).toContain(
          'allow_implicit_invocation: false',
        );
      }
      const catalog = JSON.parse(
        await readFile(join(root, 'aop-mode/personal-catalog.json'), 'utf8'),
      ) as { name: string; entrypoint: string }[];
      expect(catalog.map((skill) => skill.name)).toEqual(personal);
      for (const skill of catalog) {
        expect(await readFile(join(root, 'aop-mode', skill.entrypoint), 'utf8')).toContain(
          `name: ${skill.name}\n`,
        );
      }
      const discoverable = (await readdir(root, { recursive: true })).filter(
        (path) =>
          path.endsWith('/SKILL.md') && !path.split('/').some((part) => part.startsWith('.')),
      );
      expect(discoverable).toHaveLength(lock.skills.length + personal.length + 1);
      for (const skill of lock.skills) {
        const entry = await readFile(join(root, skill.name, 'SKILL.md'), 'utf8');
        expect(entry).toContain(`name: ${skill.name}\n`);
        expect(entry).toContain('disable-model-invocation: true');
        expect(entry).toContain(`../aop-mode/.upstream/${skill.entrypoint}`);
        expect(await readFile(join(root, skill.name, 'agents/openai.yaml'), 'utf8')).toContain(
          'allow_implicit_invocation: false',
        );
      }
      for (const file of lock.files) {
        const path = join(root, 'aop-mode/.upstream', file.path);
        expect(
          createHash('sha256')
            .update(await readFile(path))
            .digest('hex'),
          file.path,
        ).toBe(file.sha256);
        expect(Boolean((await stat(path)).mode & 0o111), file.path).toBe(file.mode === '100755');
      }
      expect(await readFile(join(root, 'aop-mode/runtime.md'), 'utf8')).toContain(
        "project's `.aop-mode/models.md`",
      );
      expect(
        (await readdir(destination, { recursive: true })).filter((path) =>
          /(^|\/)(hooks|settings\.json|AGENTS\.md|copilot-instructions\.md)(\/|$)/.test(path),
        ),
      ).toEqual([]);
    } finally {
      await rm(destination, { recursive: true, force: true });
    }
  });
}
it('preflights every skill collision before installing anything', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'aop-collision-'));
  try {
    await mkdir(join(workspace, '.agents/skills/tdd'), { recursive: true });
    await writeFile(join(workspace, '.agents/skills/tdd/SKILL.md'), 'user-owned');
    await expect(installSkill('codex', workspace)).rejects.toThrow('Refusing to overwrite');
    expect(await readdir(join(workspace, '.agents/skills'))).toEqual(['tdd']);
    expect(await readFile(join(workspace, '.agents/skills/tdd/SKILL.md'), 'utf8')).toBe(
      'user-owned',
    );
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
