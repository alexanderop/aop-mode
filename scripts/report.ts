import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Schema } from 'effect';
import { Harness, TaskId } from '../src/types.js';

const summaryPaths = process.argv.slice(2);
if (!summaryPaths.length) throw new Error('Usage: pnpm report .eval-artifacts/<run>/summary.json [more-summary-files...]');
const Report = Schema.Array(Schema.Struct({
  harness: Harness, task: TaskId, status: Schema.Literals(['passed','failed','blocked']),
  startedAt: Schema.String, cliVersion: Schema.String, durationMs: Schema.Number, skillHash: Schema.String,
  error: Schema.NullOr(Schema.String),
}));
const resultsByTask = new Map<string, typeof Report.Type[number]>();
for (const summaryPath of summaryPaths) {
  const rows = Schema.decodeUnknownSync(Report)(JSON.parse(await readFile(resolve(summaryPath), 'utf8')));
  for (const row of rows) {
    const key = `${row.harness}/${row.task}`;
    const previous = resultsByTask.get(key);
    if (!previous || row.startedAt > previous.startedAt) resultsByTask.set(key, row);
  }
}
const results = [...resultsByTask.values()].sort((a, b) => `${a.harness}/${a.task}`.localeCompare(`${b.harness}/${b.task}`));
const safeCell = (value: string) => value.replaceAll('|', '\\|').replaceAll('\n', ' ');
const rows = results.map((result) => `| ${result.harness} | ${safeCell(result.cliVersion)} | ${result.task} | ${result.status} | ${(result.durationMs / 1000).toFixed(1)}s |`);
const notRun = Harness.literals.flatMap((harness) => TaskId.literals.filter((task) => !resultsByTask.has(`${harness}/${task}`)).map((task) => `| ${harness} | — | ${task} | not run | — |`));
const earliest = results.map((row) => row.startedAt).sort().at(0) ?? 'unknown';
const latest = results.map((row) => row.startedAt).sort().at(-1) ?? 'unknown';
const blocked = results.filter((row) => row.status === 'blocked').map((row) => `- ${row.harness}/${row.task}: ${/authenticat|OAuth/i.test(row.error ?? '') ? 'authentication failed; renew the CLI login and rerun this case.' : 'the harness did not complete successfully; inspect the local run evidence.'}`).join('\n');
await writeFile(resolve('docs/src/content/docs/evidence/latest.md'), `---\ntitle: Latest local evidence\ndescription: Recorded results from real CLI task runs.\n---\n\nRecorded starts: ${earliest} through ${latest}. Each cell uses the newest supplied result for that harness and task. This is a snapshot, not a promise about other versions or tasks.\n\n| Harness | CLI version | Task | Result | Duration |\n| --- | --- | --- | --- | --- |\n${[...rows, ...notRun].join('\n')}\n\n${blocked ? '## Blocked runs\n\n' + blocked + '\n\n' : ''}Skill hashes: ${[...new Set(results.map((result) => result.skillHash))].map((hash) => '`' + hash + '`').join(', ')}.\n\nRaw transcripts and workspaces remain local. These tests cover project-local skill installation and task behavior, not marketplace installation, IDE integration, or multi-agent coordination. Copilot headless runs explicitly point to the installed skill file; this does not prove native slash-command expansion. See [the evaluation design](/testing/) for limitations.\n`);
console.log('Wrote sanitized results to the docs; raw transcripts were not copied.');
