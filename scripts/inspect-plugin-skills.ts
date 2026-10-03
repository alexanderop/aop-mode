import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { Schema } from 'effect';

// Read-only app-server discovery: no session or model turn is started.
const Response = Schema.Struct({
  id: Schema.optionalKey(Schema.Number),
  result: Schema.optionalKey(Schema.Unknown),
  error: Schema.optionalKey(Schema.Unknown),
});
const child = spawn('codex', ['app-server', '--stdio'], { stdio: ['pipe', 'pipe', 'pipe'] });
const lines = createInterface({ input: child.stdout });
child.stderr.pipe(process.stderr);
let received = false;
child.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
child.on('close', () => { if (!received) process.exitCode = 1; lines.close(); });
child.stdin.on('error', () => {});
const send = (message: unknown) => child.stdin.write(`${JSON.stringify(message)}\n`);
lines.on('line', (line) => {
  try {
    const response = Schema.decodeUnknownSync(Response)(JSON.parse(line));
    if (response.error !== undefined) throw new Error(JSON.stringify(response.error));
    if (response.id === 1) {
      send({ method: 'initialized', params: {} });
      send({ id: 2, method: 'skills/list', params: { cwds: [process.cwd()], forceReload: true } });
    } else if (response.id === 2) {
      console.log(JSON.stringify(response.result));
      received = true;
      child.stdin.end();
      child.kill('SIGTERM');
    }
  } catch (error) {
    console.error(String(error));
    process.exitCode = 1;
    child.kill('SIGTERM');
  }
});
send({ id: 1, method: 'initialize', params: { clientInfo: { name: 'aop-plugin-install-eval', version: '0.1.0' }, capabilities: { experimentalApi: true } } });
