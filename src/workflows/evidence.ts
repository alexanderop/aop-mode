import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Schema } from 'effect';
import { projectRoot } from '../harnesses.js';

export async function hashEvaluator(): Promise<string> {
  const hash = createHash('sha256');
  for (const path of [
    'src/workflows/cases.ts',
    'src/workflows/types.ts',
    'src/workflows/trace.ts',
    'src/workflows/grade.ts',
    'src/workflows/runner.ts',
    'src/workflows/evidence.ts',
    'src/harnesses.ts',
    'src/process.ts',
    'src/grade.ts',
  ]) {
    hash.update(path).update(await readFile(join(projectRoot, path)));
  }
  return hash.digest('hex');
}
export const WorkflowResultSchema = Schema.Struct({
  harness: Schema.Literals(['codex', 'copilot']),
  task: Schema.Literals(['investigation', 'prototype', 'architecture', 'ordinary']),
  condition: Schema.Literals(['explicit', 'inactive', 'baseline']),
  attempt: Schema.Number,
  invocation: Schema.Literals(['dollar', 'file-path', 'none']),
  cliVersion: Schema.String,
  requestedModel: Schema.NullOr(Schema.String),
  skillHash: Schema.String,
  evaluatorHash: Schema.optionalKey(Schema.String),
  startedAt: Schema.String,
  durationMs: Schema.Number,
  workspace: Schema.String,
  artifacts: Schema.String,
  status: Schema.Literals(['passed', 'failed', 'blocked', 'incomplete']),
  error: Schema.NullOr(Schema.String),
  checks: Schema.Array(
    Schema.Struct({
      name: Schema.String,
      layer: Schema.Literals(['loading', 'delegation', 'verification', 'outcome', 'boundary']),
      status: Schema.Literals(['passed', 'failed', 'unobservable', 'unsupported']),
      detail: Schema.String,
      evidence: Schema.Array(Schema.Number),
    }),
  ),
});
export const WorkflowContractSchema = Schema.Struct({
  task: Schema.Struct({
    id: Schema.Literals(['investigation', 'prototype', 'architecture', 'ordinary']),
    title: Schema.String,
    prompt: Schema.String,
    requiredFiles: Schema.Array(Schema.String),
    sources: Schema.Array(Schema.String),
    delegation: Schema.Literals(['explore', 'arena', 'none', 'optional']),
  }),
});
export const SnapshotSchema = Schema.Record(Schema.String, Schema.String);
