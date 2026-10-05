import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmod, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const repository = 'https://github.com/cursor/plugins.git';
export const pinnedRevision = 'e43c7ee26e0038c6c1fa8380dd34ce86ff94cb2a';
export interface UpstreamFile {
  path: string;
  sha256: string;
  mode: '100644' | '100755';
}
export interface UpstreamSkill {
  name: string;
  directory: string;
  entrypoint: string;
  category: 'skill' | 'automation';
}
export interface UpstreamLock {
  schemaVersion: 1;
  repository: string;
  revision: string;
  subdirectory: 'pstack';
  version: string;
  files: UpstreamFile[];
  skills: UpstreamSkill[];
}
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hash = (data: Buffer) => createHash('sha256').update(data).digest('hex');
function git(source: string, ...args: string[]): Buffer {
  return execFileSync('git', ['-C', source, ...args], { maxBuffer: 32 * 1024 * 1024 });
}
async function listFiles(directory: string, prefix = ''): Promise<string[]> {
  const output: string[] = [];
  for (const item of await readdir(join(directory, prefix), { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.isDirectory()) output.push(...(await listFiles(directory, relative)));
    else if (item.isFile()) output.push(relative);
    else throw new Error(`Non-regular upstream file: ${relative}`);
  }
  return output.sort();
}
export function inventorySkills(paths: readonly string[]): UpstreamSkill[] {
  return paths
    .filter((path) => /^(skills\/[^/]+|automations\/[^/]+\/skills\/[^/]+)\/SKILL\.md$/.test(path))
    .map((entrypoint) => {
      const directory = dirname(entrypoint);
      const name = directory.split('/').at(-1);
      if (!name) throw new Error(`Invalid skill entrypoint: ${entrypoint}`);
      return {
        name,
        directory,
        entrypoint,
        category: entrypoint.startsWith('skills/') ? 'skill' : 'automation',
      };
    });
}
export function readGitImport(
  source: string,
  revision: string,
): { lock: UpstreamLock; blobs: Map<string, Buffer> } {
  if (!/^[a-f0-9]{40}$/.test(revision))
    throw new Error('Use a full immutable 40-character Git commit SHA.');
  const resolved = git(source, 'rev-parse', `${revision}^{commit}`).toString().trim();
  if (resolved !== revision) throw new Error('Git did not resolve the requested commit.');
  const records = git(source, 'ls-tree', '-r', '-z', revision, '--', 'pstack/')
    .toString()
    .split('\0')
    .filter(Boolean);
  const blobs = new Map<string, Buffer>();
  const files: UpstreamFile[] = records
    .map((record): UpstreamFile => {
      const match = /^(100644|100755) blob ([a-f0-9]{40})\tpstack\/(.+)$/.exec(record);
      if (!match) throw new Error(`Unsupported upstream tree entry: ${record}`);
      const [, mode, object, path] = match;
      if (
        !path ||
        !object ||
        (mode !== '100644' && mode !== '100755') ||
        path.split('/').includes('..')
      )
        throw new Error('Invalid tree entry');
      const data = git(source, 'cat-file', 'blob', object);
      blobs.set(path, data);
      return { path, sha256: hash(data), mode };
    })
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  const plugin = blobs.get('.cursor-plugin/plugin.json');
  if (!plugin) throw new Error('Missing upstream plugin manifest');
  const metadata: unknown = JSON.parse(plugin.toString());
  if (
    typeof metadata !== 'object' ||
    metadata === null ||
    !('version' in metadata) ||
    typeof metadata.version !== 'string'
  )
    throw new Error('Missing upstream version');
  return {
    lock: {
      schemaVersion: 1,
      repository,
      revision,
      subdirectory: 'pstack',
      version: metadata.version,
      files,
      skills: inventorySkills(files.map((file) => file.path)),
    },
    blobs,
  };
}
export async function checkImport(directory = root, source?: string): Promise<UpstreamLock> {
  const lock: UpstreamLock = JSON.parse(
    await readFile(join(directory, 'upstream.lock.json'), 'utf8'),
  );
  if (
    lock.schemaVersion !== 1 ||
    lock.repository !== repository ||
    lock.subdirectory !== 'pstack' ||
    !/^[a-f0-9]{40}$/.test(lock.revision)
  )
    throw new Error('Invalid upstream provenance');
  const vendor = join(directory, 'vendor/pstack');
  const paths = await listFiles(vendor);
  if (JSON.stringify(paths) !== JSON.stringify(lock.files.map((file) => file.path)))
    throw new Error('Upstream file scope differs from lock');
  if (JSON.stringify(inventorySkills(paths)) !== JSON.stringify(lock.skills))
    throw new Error('Upstream skill inventory differs from lock');
  for (const file of lock.files) {
    if (hash(await readFile(join(vendor, file.path))) !== file.sha256)
      throw new Error(`Upstream bytes changed: ${file.path}`);
    const mode = (await stat(join(vendor, file.path))).mode;
    if (Boolean(mode & 0o111) !== (file.mode === '100755'))
      throw new Error(`Upstream executable mode changed: ${file.path}`);
  }
  if (source && JSON.stringify(readGitImport(source, lock.revision).lock) !== JSON.stringify(lock))
    throw new Error('Lock differs from pinned upstream Git tree');
  return lock;
}
export async function importUpstream(
  source: string,
  revision = pinnedRevision,
  directory = root,
): Promise<UpstreamLock> {
  const { lock, blobs } = readGitImport(source, revision);
  const vendor = join(directory, 'vendor/pstack');
  // Refuse to overwrite edited vendored files; upstream updates may replace only a verified import.
  try {
    await stat(vendor);
    await checkImport(directory);
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
    try {
      await stat(vendor);
      throw new Error('Existing vendor directory has no valid lock; preserve it before importing.');
    } catch (inner) {
      if (!(inner instanceof Error && 'code' in inner && inner.code === 'ENOENT')) throw inner;
    }
  }
  await rm(vendor, { recursive: true, force: true });
  for (const file of lock.files) {
    const data = blobs.get(file.path);
    if (!data) throw new Error(`Missing imported blob: ${file.path}`);
    const destination = join(vendor, file.path);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, data);
    await chmod(destination, file.mode === '100755' ? 0o755 : 0o644);
  }
  await writeFile(join(directory, 'upstream.lock.json'), `${JSON.stringify(lock, null, 2)}\n`);
  return checkImport(directory, source);
}
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const value = (flag: string) => {
    const index = args.indexOf(flag);
    return index < 0 ? undefined : args[index + 1];
  };
  const source = value('--source');
  if (!args.includes('--check') && !source)
    throw new Error(
      'Usage: pnpm exec tsx scripts/import-pstack.ts --source <cursor/plugins checkout> [--revision <full SHA>] | --check [--source <checkout>]',
    );
  const lock = args.includes('--check')
    ? await checkImport(root, source)
    : await importUpstream(source!, value('--revision') ?? pinnedRevision);
  console.log(
    `Verified pstack ${lock.version} at ${lock.revision}: ${lock.files.length} files, ${lock.skills.filter((skill) => skill.category === 'skill').length} skills, ${lock.skills.filter((skill) => skill.category === 'automation').length} automation skills.`,
  );
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
