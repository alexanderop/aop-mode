import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Ajv2020 } from 'ajv/dist/2020.js';

export interface PluginManifest {
  readonly $schema: string;
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly author: { readonly name: string };
  readonly homepage: string;
  readonly repository: string;
  readonly license: string;
  readonly keywords: readonly string[];
}

export async function readPluginManifest(): Promise<PluginManifest> {
  const schema = JSON.parse(await readFile(fileURLToPath(new URL('../packaging/schemas/agent-plugins-1.0.0.json', import.meta.url)), 'utf8'));
  const validate = new Ajv2020({ allErrors: true }).compile<PluginManifest>({
    ...schema,
    required: ['$schema', 'name', 'version', 'description', 'author', 'homepage', 'repository', 'license', 'keywords'],
  });
  const manifest: unknown = JSON.parse(await readFile(fileURLToPath(new URL('../packaging/plugin.json', import.meta.url)), 'utf8'));
  if (!validate(manifest)) throw new Error(`Invalid plugin manifest: ${JSON.stringify(validate.errors)}`);
  return manifest;
}
