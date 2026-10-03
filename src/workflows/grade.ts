import { join } from 'node:path';
import { Effect } from 'effect';
import { snapshot } from '../grade.js';
import { runProcess } from '../process.js';
import { projectRoot, skillDirectories } from '../harnesses.js';
import { loadedFile, requestedReadPaths, shellCommands } from './trace.js';
import type {
  Condition,
  Delegate,
  Trace,
  WorkflowCase,
  WorkflowCheck,
  WorkflowHarness,
} from './types.js';

export function gradeWorkflow(input: {
  readonly task: WorkflowCase;
  readonly harness: WorkflowHarness;
  readonly condition: Condition;
  readonly trace: Trace;
  readonly installed: Readonly<Record<string, string>>;
}): WorkflowCheck[] {
  const { task, harness, condition, trace, installed } = input;
  const checks: WorkflowCheck[] = [];
  const add = (
    name: string,
    layer: WorkflowCheck['layer'],
    status: WorkflowCheck['status'],
    detail: string,
    evidence: readonly number[] = [],
  ) => checks.push({ name, layer, status, detail, evidence });
  const external = trace.calls.filter((call) => {
    if (!call.success) return false;
    const paths = requestedReadPaths(call).filter((path) =>
      /(?:^|\/)\.(?:agents|github|claude)\/skills\/aop-mode\//.test(path),
    );
    return paths.some(
      (path) =>
        !/^(?:\.\/)?\.(?:agents|github|claude)\//.test(path) &&
        (trace.workspace === null ||
          !path
            .replace(/^\/private\/var\//, '/var/')
            .startsWith(trace.workspace.replace(/^\/private\/var\//, '/var/') + '/')),
    );
  });
  add(
    'project-local mode source',
    'boundary',
    external.length ? 'failed' : 'passed',
    external.length
      ? 'Observed access to aop-mode outside the candidate workspace; this trial is contaminated by another installation.'
      : 'No external aop-mode path access observed; this is not a guarantee of host isolation.',
    external.flatMap((call) => (call.endLine === null ? [] : [call.endLine])),
  );
  if (trace.problems.length)
    add('trace coverage', 'loading', 'unobservable', trace.problems.join('; '));
  if (condition !== 'explicit' || task.id === 'ordinary') {
    const reads = Object.entries(installed).flatMap(([path, body]) =>
      loadedFile(trace, path, body),
    );
    add(
      'no observed mode activation',
      'loading',
      reads.length ? 'failed' : trace.problems.length ? 'unobservable' : 'passed',
      'Checks decoded read activity only; implicit context injection is not visible in CLI events.',
      reads,
    );
  } else {
    for (const file of task.requiredFiles) {
      const path = `${skillDirectories[harness]}/${file}`;
      const body = installed[path];
      const evidence = body === undefined ? [] : loadedFile(trace, path, body);
      add(
        `loaded ${file}`,
        'loading',
        body === undefined ? 'failed' : evidence.length ? 'passed' : 'unobservable',
        body === undefined
          ? 'Required installed file is missing.'
          : evidence.length
            ? 'Complete installed content observed in successful read results.'
            : 'No complete successful read observed. Mentions, partial reads and catalog entries do not establish loading.',
        evidence,
      );
    }
  }
  // Baselines measure outcomes and expose traces; they are not required to follow a mode they lack.
  if (task.delegation === 'none') {
    add(
      'no unnecessary delegation',
      'delegation',
      trace.delegates.length ? 'failed' : trace.problems.length ? 'unobservable' : 'passed',
      `${trace.delegates.length} native delegates observed`,
      trace.delegates.map((d) => d.startLine),
    );
  } else if (condition === 'explicit' && task.delegation !== 'optional') {
    const returned = (d: Delegate) =>
      d.endLine !== null &&
      d.result.trim().length > 0 &&
      trace.finalLine !== null &&
      d.endLine < trace.finalLine;
    const candidates = trace.delegates.filter((d) =>
      task.delegation === 'explore'
        ? /explor|investigat|trace|read.only/i.test(d.prompt) &&
          !/synthesi|explainer/i.test(d.prompt)
        : /candidate|design|sketch|alternative/i.test(d.prompt) &&
          !/cross.judge|score.*rubric/i.test(d.prompt),
    );
    const lines = candidates.flatMap((d) =>
      d.endLine === null ? [d.startLine] : [d.startLine, d.endLine],
    );
    add(
      'independent delegates',
      'delegation',
      candidates.length >= 2 ? 'passed' : 'failed',
      `${candidates.length} distinct native agents with relevant task prompts; expected at least two.`,
      lines,
    );
    add(
      'delegates returned before final answer',
      'delegation',
      candidates.length >= 2 && candidates.every(returned)
        ? 'passed'
        : candidates.some((d) => d.endLine === null)
          ? 'unobservable'
          : 'failed',
      'Requires actual returned results, not spawn acknowledgements or self-reports.',
      lines,
    );
    const overlap = candidates.some((a) =>
      candidates.some(
        (b) =>
          a.id !== b.id &&
          a.startLine < b.startLine &&
          a.endLine !== null &&
          b.startLine < a.endLine,
      ),
    );
    add(
      'parallel fan-out observed',
      'delegation',
      overlap ? 'passed' : candidates.some((d) => d.endLine === null) ? 'unobservable' : 'failed',
      'A second native agent must start before the first result is collected. This proves overlapping lifetimes, not simultaneous CPU execution.',
      lines,
    );
    const last = Math.max(...candidates.map((d) => d.endLine ?? Infinity));
    const next = trace.delegates.find(
      (d) =>
        d.startLine > last &&
        (task.delegation === 'arena'
          ? /judge|rubric|scor/i.test(d.prompt)
          : /synthesi|explain/i.test(d.prompt)) &&
        returned(d),
    );
    add(
      task.delegation === 'arena' ? 'cross-judge after candidates' : 'explainer after explorers',
      'delegation',
      next ? 'passed' : 'failed',
      'A separate native agent must receive the follow-up role after candidate results return.',
      next ? [next.startLine, ...(next.endLine === null ? [] : [next.endLine])] : [],
    );
    const supplied =
      next &&
      candidates.every(
        (candidate) =>
          candidate.result.trim().length > 0 &&
          next.prompt.includes(candidate.result.trim().slice(0, 80)),
      );
    add(
      'returned evidence supplied to synthesis',
      'delegation',
      supplied ? 'passed' : 'unobservable',
      'Requires returned content in the follow-up prompt. Rewritten summaries and artifact-only handoffs need manual trace review.',
      next ? [next.startLine] : [],
    );
    if (task.delegation === 'arena') {
      const models = new Set(candidates.map((d) => d.model).filter((model) => model !== null));
      add(
        'candidate model diversity',
        'delegation',
        models.size >= 2
          ? 'passed'
          : models.size === 0 || candidates.some((d) => d.model === null)
            ? 'unobservable'
            : 'failed',
        'These CLI adapters do not expose verified child model identities. A requested model or parent model does not prove child model diversity.',
        lines,
      );
    }
  }
  return checks;
}

export function gradeExecution(task: WorkflowCase, trace: Trace): WorkflowCheck[] {
  const checks: WorkflowCheck[] = [];
  const check = (
    name: string,
    layer: WorkflowCheck['layer'],
    passed: boolean,
    detail: string,
    evidence: readonly number[] = [],
  ) => checks.push({ name, layer, status: passed ? 'passed' : 'failed', detail, evidence });
  const commands = trace.calls.filter(
    (call) => call.success && typeof call.input.command === 'string',
  );
  if (task.id === 'investigation') {
    const reads = trace.calls.filter(
      (call) =>
        call.success &&
        /src\/(delivery|retry|transport)\.mjs|evidence\/(incident\.md|attempts\.json)/.test(
          JSON.stringify(call.input),
        ),
    );
    check(
      'investigation used repository evidence',
      'verification',
      reads.length > 0,
      'Successful tool activity must access the fixture evidence.',
      reads.flatMap((call) => (call.endLine === null ? [] : [call.endLine])),
    );
  } else if (task.id === 'prototype') {
    const observed = commands.filter(
      (call) =>
        shellCommands(String(call.input.command)).some(
          (words) =>
            words[0] === 'node' &&
            (words[1] === 'scratch/compare.mjs' ||
              words[1] === './scratch/compare.mjs' ||
              (trace.workspace !== null &&
                words[1]?.replace(/^\/private\/var\//, '/var/') ===
                  `${trace.workspace}/scratch/compare.mjs`.replace(/^\/private\/var\//, '/var/'))),
        ) &&
        /fixed/i.test(call.output) &&
        /sliding/i.test(call.output),
    );
    check(
      'ran comparison and observed both variants',
      'verification',
      observed.length > 0,
      'Requires successful native command output for both policies.',
      observed.flatMap((call) => (call.endLine === null ? [] : [call.endLine])),
    );
  }
  return checks;
}

export async function gradeOutcome(input: {
  readonly task: WorkflowCase;
  readonly workspace: string;
  readonly before: Readonly<Record<string, string>>;
  readonly finalText: string;
  readonly trace: Trace;
}): Promise<WorkflowCheck[]> {
  const { task, workspace, before, finalText, trace } = input;
  const after = await snapshot(workspace);
  const changed = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(
    (file) => before[file] !== after[file],
  );
  const checks: WorkflowCheck[] = gradeExecution(task, trace);
  const check = (
    name: string,
    layer: WorkflowCheck['layer'],
    passed: boolean,
    detail: string,
    evidence: readonly number[] = [],
  ) => checks.push({ name, layer, status: passed ? 'passed' : 'failed', detail, evidence });
  const read = (file: string) =>
    after[file] && after[file] !== '<symlink>' ? Buffer.from(after[file], 'base64').toString() : '';
  check(
    'preserved existing files and scope',
    'boundary',
    changed.every((file) =>
      task.id === 'ordinary'
        ? file === 'NOTE.txt'
        : task.id !== 'investigation' && file.startsWith('scratch/') && before[file] === undefined,
    ),
    changed.join(', ') || 'No files changed.',
  );
  if (task.id === 'ordinary') {
    check(
      'requested artifact',
      'outcome',
      read('NOTE.txt') === 'hello\n' && finalText.trim() === 'Done.',
      'Exact file and response contract.',
    );
  } else if (task.id === 'investigation') {
    check(
      'grounded diagnosis',
      'outcome',
      /deadline/i.test(finalText) &&
        /retry|retries|attempt/i.test(finalText) &&
        /110/.test(finalText) &&
        /100/.test(finalText) &&
        /src\/delivery\.mjs/.test(finalText) &&
        /src\/retry\.mjs/.test(finalText) &&
        /evidence\/(attempts\.json|incident\.md)/.test(finalText),
      'Must locate the shared deadline, connect the 110ms retry to the 100ms deadline, and cite code and incident evidence. This is a targeted content check, not a general prose judge.',
    );
    check(
      'uncertainty acknowledged',
      'outcome',
      /hypothes|unconfirmed|not (?:established|confirmed|proven)|cannot (?:conclude|prove)|no evidence|unknown/i.test(
        finalText,
      ),
      'The HTTP upgrade explanation is unconfirmed.',
    );
  } else if (task.id === 'prototype') {
    if (read('scratch/compare.mjs')) {
      const probe = `import assert from 'node:assert/strict';
import { decide } from './scratch/compare.mjs';
for (const limit of [1,2,3]) for (const windowMs of [100,1000]) {
 const events = [0,0,windowMs-1,windowMs,windowMs+1,2*windowMs,2*windowMs+1].flatMap(at => [{tenant:'a',at},{tenant:'b',at}]);
 for (const policy of ['fixed','sliding']) {
  const accepted = new Map();
  const expected = events.map(({tenant,at}) => {
   const previous = accepted.get(tenant) ?? [];
   const active = previous.filter(t => policy === 'fixed' ? Math.floor(t/windowMs) === Math.floor(at/windowMs) : t > at-windowMs);
   const allow = active.length < limit;
   accepted.set(tenant, allow ? [...active,at] : active);
   return allow;
  });
  assert.deepEqual(decide(policy,structuredClone(events),limit,windowMs), expected);
 }
}
console.log('Independent policy checks passed');`;
      const result = await Effect.runPromise(
        runProcess(
          { executable: process.execPath, args: ['--input-type=module'], stdin: probe },
          workspace,
          10000,
        ),
      );
      check(
        'independent policy behavior',
        'outcome',
        result.exitCode === 0 && !result.timedOut && !result.overflow,
        result.stdout + result.stderr,
      );
    } else
      check(
        'independent policy behavior',
        'outcome',
        false,
        'Missing regular scratch/compare.mjs artifact.',
      );
    check(
      'decision with tradeoffs',
      'outcome',
      /fixed/i.test(finalText) &&
        /sliding/i.test(finalText) &&
        /recommend|prefer|choose/i.test(finalText) &&
        /throwaway|prototype/i.test(finalText),
      'Must explain the choice and identify the artifact as a prototype.',
    );
  } else {
    const design = read('scratch/design.ts');
    const rationale = read('scratch/rationale.md');
    check(
      'public interface and caller sketch',
      'outcome',
      /export\s/.test(design) && /tenant/i.test(design) && /(?:usage|example|caller)/i.test(design),
      'Requires exported types or signatures and a caller usage sketch.',
    );
    check(
      'review checkpoint',
      'boundary',
      /review|approval|sign.off/i.test(finalText) &&
        /not implemented|declare\s|interface\s/.test(design),
      'Design stays a sketch and is presented for review. Production files must be unchanged.',
    );
    check(
      'alternatives and synthesis rationale',
      'outcome',
      /fixed/i.test(rationale) &&
        /sliding/i.test(rationale) &&
        /tradeoff|trade-off/i.test(rationale) &&
        /recommend|select|choose|base/i.test(rationale),
      'Requires a concrete comparison and synthesis decision. Quality beyond these structural checks needs human review.',
    );
    if (design) {
      const result = await Effect.runPromise(
        runProcess(
          {
            executable: join(projectRoot, 'node_modules/.bin/tsc'),
            args: [
              '--strict',
              '--noEmit',
              '--skipLibCheck',
              '--target',
              'ES2023',
              '--module',
              'NodeNext',
              join(workspace, 'scratch/design.ts'),
            ],
          },
          workspace,
          15000,
        ),
      );
      check(
        'design typechecks independently',
        'verification',
        result.exitCode === 0 && !result.timedOut,
        result.stdout + result.stderr,
      );
    } else
      check('design typechecks independently', 'verification', false, 'Missing design artifact.');
  }
  return checks;
}
