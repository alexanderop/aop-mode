import { readdir, lstat } from 'node:fs/promises';
import { join } from 'node:path';
import { snapshot } from './grade.js';
import type { Verdict } from './types.js';

export async function gradePluginInstallation(
  expected: Readonly<Record<string, string>>,
  installed: string,
): Promise<Verdict> {
  let actual: Readonly<Record<string, string>>;
  try {
    actual = await snapshot(installed);
  } catch {
    return {
      passed: false,
      checks: [{ name: 'installed package exists', passed: false, detail: installed }],
    };
  }
  const different = Object.keys(expected).filter((file) => actual[file] !== expected[file]);
  const unexpected = Object.keys(actual).filter((file) => !(file in expected));
  const skills = (await readdir(join(installed, 'skills'))).sort();
  const explicit = skills.every((name) => {
    const frontmatter = Buffer.from(actual[`skills/${name}/SKILL.md`] ?? '', 'base64').toString();
    const policy = Buffer.from(
      actual[`skills/${name}/agents/openai.yaml`] ?? '',
      'base64',
    ).toString();
    return (
      frontmatter.includes('disable-model-invocation: true') &&
      policy.includes('allow_implicit_invocation: false')
    );
  });
  const checks = [
    {
      name: 'installed files match reference',
      passed: different.length === 0,
      detail: different.join(', ') || `${Object.keys(expected).length} files match`,
    },
    {
      name: 'no unexpected installed files',
      passed: unexpected.length === 0,
      detail: unexpected.join(', ') || 'No extra files',
    },
    {
      name: 'explicit-only skill metadata',
      passed: skills.length > 0 && explicit,
      detail: `${skills.length} skills inspected`,
    },
  ];
  return { passed: checks.every((check) => check.passed), checks };
}

// Search only the client's install cache, never its marketplace/source cache.
export async function installedPluginRoots(cache: string): Promise<readonly string[]> {
  const found: string[] = [];
  async function walk(directory: string): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.name === 'plugin.json' && entry.isFile()) found.push(directory);
      if (entry.isDirectory() && !['skills', '.claude-plugin'].includes(entry.name))
        await walk(join(directory, entry.name));
    }
  }
  try {
    if ((await lstat(cache)).isDirectory()) await walk(cache);
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
  }
  return found;
}
