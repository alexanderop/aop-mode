import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Effect, Schema } from 'effect';
import type { Command, ProcessResult } from './types.js';

export class ProcessError extends Schema.TaggedError<ProcessError>()('ProcessError', {
  message: Schema.String,
}) {}

export const runProcess = Effect.fn('Process.run')(function* (
  command: Command,
  cwd: string,
  timeoutMs: number,
  logDirectory?: string,
) {
  return yield* Effect.scoped(
    Effect.gen(function* () {
      const handle = yield* Effect.acquireRelease(
        Effect.sync(() => {
          const child = spawn(command.executable, [...command.args], {
            cwd,
            detached: process.platform !== 'win32',
            stdio: ['pipe', 'pipe', 'pipe'],
          });
          let stdout = '';
          let stderr = '';
          let timedOut = false;
          let overflow = false;
          let failure: Error | undefined;
          let forceTimer: ReturnType<typeof setTimeout> | undefined;
          const signalGroup = (signal: NodeJS.Signals) => {
            try {
              if (child.pid !== undefined && process.platform !== 'win32')
                process.kill(-child.pid, signal);
              else child.kill(signal);
            } catch (error) {
              if (!(error instanceof Error && 'code' in error && error.code === 'ESRCH'))
                failure ??= error instanceof Error ? error : new Error(String(error));
            }
          };
          const stop = () => {
            signalGroup('SIGTERM');
            forceTimer ??= setTimeout(() => signalGroup('SIGKILL'), 200);
          };
          const append = (channel: 'stdout' | 'stderr', data: Buffer) => {
            if (stdout.length + stderr.length > 6_000_000) {
              overflow = true;
              stop();
              return;
            }
            if (channel === 'stdout') stdout += data.toString();
            else stderr += data.toString();
          };
          child.stdout.on('data', (data: Buffer) => append('stdout', data));
          child.stderr.on('data', (data: Buffer) => append('stderr', data));
          child.stdin.on('error', () => {});
          child.on('error', (error) => {
            failure = error;
          });
          const deadline = setTimeout(() => {
            timedOut = true;
            stop();
          }, timeoutMs);
          const completed = new Promise<ProcessResult>((resolve) => {
            child.once('close', (exitCode) => {
              clearTimeout(deadline);
              resolve({ exitCode, stdout, stderr, timedOut, overflow });
            });
          });
          child.stdin.end(command.stdin);
          return {
            completed,
            failure: () => failure,
            release: async () => {
              clearTimeout(deadline);
              stop();
              await completed;
              // The parent may exit before descendants; terminate the whole original group.
              await new Promise<void>((resolve) => setTimeout(resolve, 220));
              signalGroup('SIGKILL');
              if (forceTimer) clearTimeout(forceTimer);
              if (logDirectory)
                await Promise.all([
                  writeFile(join(logDirectory, 'stdout.jsonl'), stdout),
                  writeFile(join(logDirectory, 'stderr.log'), stderr),
                ]);
            },
          };
        }),
        (handle) => Effect.promise(() => handle.release()),
      );
      const result = yield* Effect.promise(() => handle.completed);
      const failure = handle.failure();
      if (failure) return yield* Effect.fail(new ProcessError({ message: failure.message }));
      return result;
    }),
  );
});
