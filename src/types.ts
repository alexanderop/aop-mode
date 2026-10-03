import { Schema } from 'effect';

export const Harness = Schema.Literals(['claude', 'codex', 'copilot']);
export type Harness = typeof Harness.Type;
export const TaskId = Schema.Literals(['repair', 'review', 'explicit-only']);
export type TaskId = typeof TaskId.Type;
const CheckState = Schema.Literals(['passed', 'failed', 'not-run']);
export const Evidence = Schema.Struct({
  workflow: Schema.Literal('aop-mode'),
  kind: Schema.Literals(['repair', 'change', 'review', 'explain']),
  summary: Schema.String,
  checks: Schema.Array(
    Schema.Struct({
      command: Schema.String,
      before: CheckState,
      after: CheckState,
      evidence: Schema.String,
    }),
  ),
  findings: Schema.Array(
    Schema.Struct({
      file: Schema.String,
      line: Schema.Number,
      trigger: Schema.String,
      consequence: Schema.String,
    }),
  ),
  limits: Schema.Array(Schema.String),
});
export type Evidence = typeof Evidence.Type;

export interface Command {
  readonly executable: string;
  readonly args: readonly string[];
  readonly stdin?: string;
}
export interface ProcessResult {
  readonly exitCode: number | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly timedOut: boolean;
  readonly overflow: boolean;
}
export interface Verdict {
  readonly passed: boolean;
  readonly checks: readonly {
    readonly name: string;
    readonly passed: boolean;
    readonly detail: string;
  }[];
}
export interface RunResult {
  readonly harness: Harness;
  readonly task: TaskId;
  readonly status: 'passed' | 'failed' | 'blocked';
  readonly startedAt: string;
  readonly durationMs: number;
  readonly cliVersion: string;
  readonly requestedModel: string | null;
  readonly workspace: string;
  readonly artifacts: string;
  readonly skillHash: string;
  readonly verdict: Verdict;
  readonly error: string | null;
}
