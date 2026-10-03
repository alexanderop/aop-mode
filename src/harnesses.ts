import { cp, mkdir, lstat, readFile, readdir, mkdtemp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { writeDistribution } from './distribution.js';
import type { Command, Harness, ProcessResult } from './types.js';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));
export const skillSource = join(projectRoot, 'skills/aop-mode');
export const skillDirectories: Record<Harness, string> = {
  claude: '.claude/skills/aop-mode',
  codex: '.agents/skills/aop-mode',
  copilot: '.github/skills/aop-mode',
};

export async function installSkill(harness: Harness, workspace: string): Promise<string> {
  const parent = resolve(workspace, skillDirectories[harness], '..');
  const stage = await mkdtemp(join(tmpdir(), 'aop-package-'));
  const created: string[] = [];
  try {
    await writeDistribution(harness, stage);
    const names = (await readdir(join(stage, 'skills'))).sort();
    for (const name of names) {
      const target = join(parent, name);
      try {
        await lstat(target);
        throw new Error(`Refusing to overwrite ${target}`);
      } catch (error) {
        if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
      }
    }
    await mkdir(parent, { recursive: true });
    for (const name of names) {
      const target = join(parent, name);
      await mkdir(target);
      created.push(target);
      for (const child of await readdir(join(stage, 'skills', name))) {
        await cp(join(stage, 'skills', name, child), join(target, child), {
          recursive: true,
          errorOnExist: true,
          force: false,
        });
      }
    }
    return join(parent, 'aop-mode');
  } catch (error) {
    for (const target of created) await rm(target, { recursive: true, force: true });
    throw error;
  } finally {
    await rm(stage, { recursive: true, force: true });
  }
}

export async function hashSkill(): Promise<string> {
  const hash = createHash('sha256');
  for (const directory of ['skills', 'runtime', 'vendor/pstack']) {
    const base = join(projectRoot, directory);
    for (const path of (await readdir(base, { recursive: true })).sort()) {
      if ((await lstat(join(base, path))).isFile())
        hash.update(`${directory}/${path}`).update(await readFile(join(base, path)));
    }
  }
  hash.update(await readFile(join(projectRoot, 'src/distribution.ts')));
  hash.update(await readFile(join(projectRoot, 'upstream.lock.json')));
  return hash.digest('hex');
}

export function invokeSkill(harness: Harness, prompt: string): string {
  if (harness === 'copilot')
    return `Use aop-mode for this task. Read the explicitly requested skill at .github/skills/aop-mode/SKILL.md and follow its relevant references. ${prompt}`;
  return `${harness === 'codex' ? '$aop-mode' : '/aop-mode'} ${prompt}`;
}

export function taskCommand(harness: Harness, prompt: string, model?: string): Command {
  const modelArgs = model ? ['--model', model] : [];
  switch (harness) {
    case 'claude':
      return {
        executable: 'claude',
        args: [
          '-p',
          '--output-format',
          'stream-json',
          '--verbose',
          '--no-session-persistence',
          '--setting-sources',
          'project',
          '--strict-mcp-config',
          '--mcp-config',
          '{"mcpServers":{}}',
          '--permission-mode',
          'acceptEdits',
          '--allowedTools',
          'Read,Write,Edit,Glob,Grep,Bash(node *),Bash(git diff*),Skill',
          ...modelArgs,
        ],
        stdin: prompt,
      };
    case 'codex':
      return {
        executable: 'codex',
        args: [
          'exec',
          '--json',
          '--ephemeral',
          '--ignore-user-config',
          '-c',
          'approval_policy="never"',
          '--sandbox',
          'workspace-write',
          ...modelArgs,
          '-',
        ],
        stdin: prompt,
      };
    case 'copilot':
      return {
        executable: 'copilot',
        args: [
          '-p',
          prompt,
          '--output-format',
          'json',
          '--no-ask-user',
          '--no-auto-update',
          '--disable-builtin-mcps',
          '--allow-tool',
          'write',
          '--allow-tool',
          'shell(node:*)',
          '--allow-tool',
          'shell(git diff:*)',
          ...modelArgs,
        ],
      };
  }
}

type JsonRecord = Record<string, unknown>;
function record(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function events(text: string): readonly JsonRecord[] {
  return text.split('\n').flatMap((line) => {
    try {
      const value: unknown = JSON.parse(line);
      return record(value) ? [value] : [];
    } catch {
      return [];
    }
  });
}

export function finalResponse(
  harness: Harness,
  output: ProcessResult,
): { readonly success: boolean; readonly text: string } {
  const rows = events(output.stdout);
  const processOk = output.exitCode === 0 && !output.timedOut && !output.overflow;
  if (harness === 'claude') {
    const last = rows.findLast((row) => row.type === 'result');
    return {
      success: processOk && last?.subtype === 'success' && last.is_error === false,
      text: typeof last?.result === 'string' ? last.result : '',
    };
  }
  if (harness === 'codex') {
    const messages = rows.flatMap((row) =>
      record(row.item) && row.item.type === 'agent_message' && typeof row.item.text === 'string'
        ? [row.item.text]
        : [],
    );
    return {
      success:
        processOk &&
        rows.some((row) => row.type === 'turn.completed') &&
        !rows.some((row) => row.type === 'turn.failed' || row.type === 'error'),
      text: messages.at(-1) ?? '',
    };
  }
  const messages = rows.flatMap((row) => {
    const data = record(row.data) ? row.data : row;
    return row.type === 'assistant.message' && typeof data.content === 'string'
      ? [data.content]
      : [];
  });
  const terminal = rows.findLast((row) => row.type === 'result');
  return {
    success:
      processOk && terminal?.exitCode === 0 && !rows.some((row) => row.type === 'session.error'),
    text: messages.at(-1) ?? '',
  };
}
