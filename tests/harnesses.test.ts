import { expect, it } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { finalResponse, installSkill } from '../src/harnesses.js';
import type { ProcessResult } from '../src/types.js';

const output = (rows: unknown[]): ProcessResult => ({ exitCode: 0, stdout: rows.map((row) => JSON.stringify(row)).join('\n'), stderr: '', timedOut: false, overflow: false });
it('does not equate process success with Claude turn success', () => {
  expect(finalResponse('claude', output([{ type: 'result', subtype: 'error_max_turns', is_error: true, result: 'done' }])).success).toBe(false);
  expect(finalResponse('claude', output([{ type: 'result', subtype: 'success', is_error: false, result: 'done' }]))).toEqual({ success: true, text: 'done' });
});
it('rejects a failed Codex turn even if a final message exists', () => {
  expect(finalResponse('codex', output([{ type: 'item.completed', item: { type: 'agent_message', text: 'done' } }, { type: 'turn.failed' }])).success).toBe(false);
});
it('requires a Copilot terminal event', () => {
  expect(finalResponse('copilot', output([{ type: 'assistant.message', data: { content: 'done' } }])).success).toBe(false);
  expect(finalResponse('copilot', output([{ type: 'assistant.message', data: { content: 'done' } }, { type: 'result', exitCode: 0 }]))).toEqual({ success: true, text: 'done' });
  expect(finalResponse('copilot', output([{ type: 'result', exitCode: 1 }])).success).toBe(false);
});
it('installs a project skill without replacing an existing copy', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'aop-install-test-'));
  try {
    const destination = await installSkill('codex', workspace);
    expect(await readFile(join(destination, 'agents/openai.yaml'), 'utf8')).toContain('allow_implicit_invocation: false');
    await expect(installSkill('codex', workspace)).rejects.toThrow('Refusing to overwrite');
    expect(await readFile(join(destination, 'SKILL.md'), 'utf8')).toContain('name: aop-mode');
  } finally { await rm(workspace, { recursive: true, force: true }); }
});
