import { mkdir, mkdtemp, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { distributionRoot, harnesses, writeDistribution } from '../src/distribution.js';

const output = join(distributionRoot, 'dist');
await mkdir(output, { recursive: true });
for (const harness of harnesses) {
  const stage = await mkdtemp(join(output, `.build-${harness}-`));
  try {
    await writeDistribution(harness, stage);
    await rm(join(output, harness), { recursive: true, force: true });
    await rename(stage, join(output, harness));
    console.log(`${harness}: 52 upstream skills + personal skills + aop-mode, ${join(output, harness)}`);
  } finally { await rm(stage, { recursive: true, force: true }); }
}
