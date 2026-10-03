export type WorkflowHarness = 'codex' | 'copilot';
export type Condition = 'explicit' | 'inactive' | 'baseline';
export type WorkflowId = 'investigation' | 'prototype' | 'architecture' | 'ordinary';
export type CheckStatus = 'passed' | 'failed' | 'unobservable' | 'unsupported';
export interface WorkflowCheck {
  readonly name: string;
  readonly layer: 'loading' | 'delegation' | 'verification' | 'outcome' | 'boundary';
  readonly status: CheckStatus;
  readonly detail: string;
  readonly evidence: readonly number[];
}
export interface ToolCall {
  readonly id: string;
  readonly name: string;
  readonly input: Readonly<Record<string, unknown>>;
  readonly output: string;
  readonly startLine: number;
  readonly endLine: number | null;
  readonly success: boolean | null;
}
export interface Delegate {
  readonly id: string;
  readonly prompt: string;
  readonly startLine: number;
  readonly endLine: number | null;
  readonly result: string;
  readonly model: string | null;
}
export interface Trace {
  readonly workspace: string | null;
  readonly calls: readonly ToolCall[];
  readonly delegates: readonly Delegate[];
  readonly problems: readonly string[];
  readonly finalLine: number | null;
}
export interface WorkflowCase {
  readonly id: WorkflowId;
  readonly title: string;
  readonly prompt: string;
  readonly requiredFiles: readonly string[];
  readonly sources: readonly string[];
  readonly delegation: 'explore' | 'arena' | 'none' | 'optional';
}
export interface WorkflowResult {
  readonly harness: WorkflowHarness;
  readonly task: WorkflowId;
  readonly condition: Condition;
  readonly attempt: number;
  readonly invocation: 'dollar' | 'file-path' | 'none';
  readonly cliVersion: string;
  readonly requestedModel: string | null;
  readonly skillHash: string;
  readonly evaluatorHash?: string;
  readonly startedAt: string;
  readonly durationMs: number;
  readonly workspace: string;
  readonly artifacts: string;
  readonly status: 'passed' | 'failed' | 'blocked' | 'incomplete';
  readonly checks: readonly WorkflowCheck[];
  readonly error: string | null;
}
