import { resolve } from 'node:path';
import { Schema } from 'effect';
import { Harness } from '../src/types.js';
import { installSkill } from '../src/harnesses.js';

const [harnessArg, destination, ...rest] = process.argv.slice(2);
if (!harnessArg || !destination || rest.length) throw new Error('Usage: pnpm skills:install <claude|codex|copilot> <project-directory>');
const harness = Schema.decodeUnknownSync(Harness)(harnessArg);
console.log(await installSkill(harness, resolve(destination)));
