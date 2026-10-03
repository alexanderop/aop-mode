import { afterEach, expect, it } from 'vitest';
import { Effect } from 'effect';
import { watch } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runProcess } from '../src/process.js';

const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))); });
it('times out a real process and retains its partial output', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'aop-process-test-')); directories.push(directory);
  const result = await Effect.runPromise(runProcess({ executable: process.execPath, args: ['-e', "console.log('started'); process.on('SIGTERM', () => {}); setInterval(() => {}, 1000)"] }, directory, 300, directory));
  expect(result.timedOut).toBe(true);
  expect(result.exitCode).not.toBe(0);
  expect(await readFile(join(directory, 'stdout.jsonl'), 'utf8')).toContain('started');
});
it('fails a missing executable and still finalizes logs', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'aop-process-test-')); directories.push(directory);
  await expect(Effect.runPromise(runProcess({ executable: '/does-not-exist-aop', args: [] }, directory, 1000, directory))).rejects.toThrow();
  expect(await readFile(join(directory, 'stdout.jsonl'), 'utf8')).toBe('');
});
it('kills a SIGTERM-ignoring descendant before returning', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'aop-process-test-')); directories.push(directory);
  const program = `const {spawn} = require('node:child_process'); const child=spawn(process.execPath,['-e',"process.on('SIGTERM',()=>{});setInterval(()=>{},1000)"],{stdio:'ignore'}); console.log(child.pid); setInterval(()=>{},1000);`;
  const result = await Effect.runPromise(runProcess({ executable: process.execPath, args: ['-e', program] }, directory, 400));
  const pid = Number(result.stdout.trim());
  expect(pid).toBeGreaterThan(0);
  expect(() => process.kill(pid, 0)).toThrow();
});

it('awaits process cleanup and log finalization when the Effect is interrupted', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'aop-process-test-')); directories.push(directory);
  const controller = new AbortController();
  const watcher = watch(directory);
  const ready = new Promise<void>((resolve) => watcher.on('change', (_event, file) => { if (file === 'ready') resolve(); }));
  const program = "const fs=require('node:fs'); process.on('SIGTERM',()=>{}); console.log('ready'); fs.writeFileSync('ready',String(process.pid)); setInterval(()=>{},1000)";
  const running = Effect.runPromise(runProcess({ executable: process.execPath, args: ['-e', program] }, directory, 10000, directory), { signal: controller.signal })
    .then(() => 'completed', () => 'interrupted');
  try {
    await ready;
    const pid = Number(await readFile(join(directory, 'ready'), 'utf8'));
    controller.abort();
    expect(await running).toBe('interrupted');
    expect(() => process.kill(pid, 0)).toThrow();
    expect(await readFile(join(directory, 'stdout.jsonl'), 'utf8')).toContain('ready');
  } finally {
    controller.abort();
    await running;
    watcher.close();
  }
});
