import type { WorkflowCase } from './types.js';

const upstream = '.upstream/skills/';
const entry = ['SKILL.md', 'runtime.md', `${upstream}poteto-mode/SKILL.md`];
const skill = (name: string) => `${upstream}${name}/SKILL.md`;
const playbook = (name: string) => `${upstream}poteto-mode/playbooks/${name}.md`;

export const workflowCases: readonly WorkflowCase[] = [
  {
    id: 'investigation', title: 'Investigate webhook timeouts without changing production',
    prompt: 'Investigate the intermittent webhook timeout incident in evidence/incident.md. Explain how delivery, retries, and transport interact, what the evidence establishes, and what remains uncertain. Do not edit or create any files. Give a cited explanation in your final response.',
    requiredFiles: [...entry, playbook('investigation'), skill('how'), skill('unslop')],
    sources: ['vendor/pstack/skills/poteto-mode/playbooks/investigation.md', 'vendor/pstack/skills/how/SKILL.md'],
    delegation: 'explore',
  },
  {
    id: 'prototype', title: 'Compare two rate limiting policies with executable evidence',
    prompt: 'Prototype fixed-window and sliding-window rate limiting for our webhook service. Compare their decisions at the window boundary for a limit of 2 requests per 1000ms per tenant. Keep everything throwaway under scratch/, preserve existing files, and recommend an approach from observed behavior. Provide scratch/compare.mjs exporting decide(policy, events, limit, windowMs), where events are {tenant, at} objects, policy is "fixed" or "sliding", and the result is an array of booleans. Process events in their given nondecreasing timestamp order and isolate tenants. Fixed windows start at multiples of windowMs. A sliding window retains previously admitted events strictly after at - windowMs. Only admitted requests consume capacity; rejected requests must not consume capacity. The script must also run directly with node scratch/compare.mjs to show both variants on the same workload. Do not integrate a production implementation.',
    requiredFiles: [...entry, playbook('prototype'), skill('principle-exhaust-the-design-space')],
    sources: ['vendor/pstack/skills/poteto-mode/playbooks/prototype.md'],
    delegation: 'optional',
  },
  {
    id: 'architecture', title: 'Design a rate limiter and stop at the review boundary',
    prompt: 'We need per-tenant rate limiting for external webhook deliveries. Architect this first against the existing delivery and retry boundaries. Put the proposed public interface and caller usage in scratch/design.ts, and the alternatives, tradeoffs, and recommendation in scratch/rationale.md. Keep candidate artifacts under scratch/ too. Production implementation bodies must remain placeholders. Let me review before proceeding; preserve all existing files.',
    requiredFiles: [...entry, skill('architect'), skill('how'), skill('arena'), `${upstream}architect/references/design-red-flags.md`, `${upstream}architect/references/rationale-template.md`],
    sources: ['vendor/pstack/skills/architect/SKILL.md', 'vendor/pstack/skills/arena/SKILL.md', 'vendor/pstack/skills/how/SKILL.md'],
    delegation: 'arena',
  },
  {
    id: 'ordinary', title: 'Complete a small task without activation or delegation',
    prompt: 'Create NOTE.txt containing exactly hello followed by a newline. Reply only: Done.',
    requiredFiles: [], sources: ['runtime/common.md'], delegation: 'none',
  },
];

// The fixture exposes evidence, never expected workflow paths or grader answers.
export const webhookFiles: Readonly<Record<string, string>> = {
  'package.json': '{"type":"module","scripts":{"repro":"node scripts/repro.mjs"}}\n',
  'README.md': '# Webhook service\nRun node scripts/repro.mjs for a deterministic incident replay. No network or dependencies required.\n',
  'src/delivery.mjs': `import { retry } from './retry.mjs';
import { send } from './transport.mjs';
export function deliver(clock, outcomes) {
  const deadline = clock.now() + 100;
  return retry(() => send(clock, deadline, outcomes.shift()), clock);
}
`,
  'src/retry.mjs': `export function retry(attempt, clock) {
  const results = [];
  for (let i = 0; i < 2; i++) {
    const result = attempt();
    results.push(result);
    if (result === 'ok') break;
    clock.advance(80);
  }
  return results;
}
`,
  'src/transport.mjs': `export function send(clock, deadline, outcome) {
  if (clock.now() >= deadline) return 'timeout';
  clock.advance(30);
  return outcome ?? 'ok';
}
`,
  'scripts/repro.mjs': `import { deliver } from '../src/delivery.mjs';
let time = 0;
const clock = { now: () => time, advance: ms => { time += ms; } };
console.log(JSON.stringify({ results: deliver(clock, ['transient', 'ok']), elapsed: time }));
`,
  'evidence/incident.md': '# Incident thread\nSupport: deliveries fail intermittently after a transient error.\nEngineer: perhaps the HTTP client upgrade caused it? That is a hypothesis, not confirmed.\nOps: replay data is in evidence/attempts.json. Please investigate before changing production.\n',
  'evidence/attempts.json': '[{"attempt":1,"start":0,"deadline":100,"result":"transient","duration":30},{"attempt":2,"start":110,"deadline":100,"result":"timeout"}]\n',
};
