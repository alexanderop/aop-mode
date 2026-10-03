import { join } from 'node:path';
import { distributionRoot } from '../src/distribution.js';
import { buildPluginRelease } from '../src/plugin-release.js';

console.log(await buildPluginRelease(join(distributionRoot, 'dist/releases')));
