import type { Delegate, ToolCall, Trace, WorkflowHarness } from './types.js';

export function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
const string = (value: unknown): string => typeof value === 'string' ? value : '';
const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
function content(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!record(value)) return '';
  return string(value.content) || string(value.text) || string(value.message);
}

/** Decode tool envelopes only. Prose and text that merely resembles JSON are never events. */
export function decodeTrace(harness: WorkflowHarness, text: string, workspace: string | null = null): Trace {
  const calls = new Map<string, ToolCall>();
  const delegates = new Map<string, Delegate>();
  const problems: string[] = [];
  let finalLine: number | null = null;
  const finishDelegate = (id: string, line: number, result: string) => {
    const previous = delegates.get(id);
    if (previous && previous.endLine === null && result) delegates.set(id, { ...previous, endLine: line, result });
  };
  for (const [index, line] of text.split('\n').entries()) {
    if (!line.trim()) continue;
    const at = index + 1;
    let row: unknown;
    try { row = JSON.parse(line); } catch { problems.push(`Invalid JSON at line ${at}`); continue; }
    if (!record(row) || typeof row.type !== 'string') { problems.push(`Invalid envelope at line ${at}`); continue; }
    if (harness === 'codex') {
      if (!record(row.item)) continue;
      const item = row.item;
      if (row.type === 'item.completed' && item.type === 'agent_message') finalLine = at;
      if (!['item.started', 'item.completed'].includes(row.type)) continue;
      const id = string(item.id);
      if (item.type === 'command_execution') {
        const previous = calls.get(id);
        const completed = row.type === 'item.completed';
        calls.set(id, { id, name: 'shell', input: { command: item.command }, output: string(item.aggregated_output), startLine: previous?.startLine ?? at,
          endLine: completed ? at : null, success: completed && typeof item.exit_code === 'number' ? item.exit_code === 0 : null });
      } else if (item.type === 'collab_tool_call') {
        if (row.type !== 'item.completed') continue;
        const tool = string(item.tool);
        const ids = strings(item.receiver_thread_ids);
        if (tool === 'spawn_agent' && item.status === 'completed') {
          for (const child of ids) if (!delegates.has(child)) delegates.set(child, {
            id: child, prompt: string(item.prompt), startLine: at, endLine: null, result: '', model: null,
          });
        }
        if (['wait', 'wait_agent', 'close_agent'].includes(tool) && record(item.agents_states)) {
          for (const [child, state] of Object.entries(item.agents_states)) {
            if (record(state) && state.status === 'completed') finishDelegate(child, at, string(state.message));
          }
        }
      } else if (item.type === 'mcp_tool_call') {
        // MCP results aren't native delegation evidence. Retain their presence as an observability limit.
        problems.push(`MCP activity is not decoded at line ${at}`);
      } else if (item.type !== 'agent_message' && item.type !== 'reasoning' && item.type !== 'todo_list' && item.type !== 'file_change') {
        problems.push(`Unknown Codex item ${String(item.type)} at line ${at}`);
      }
    } else {
      const data = record(row.data) ? row.data : {};
      if (row.type === 'assistant.message' && typeof data.content === 'string') finalLine = at;
      if (row.type === 'tool.execution_start') {
        const id = string(data.toolCallId);
        const name = string(data.toolName);
        if (!id || !name || !record(data.arguments)) { problems.push(`Incomplete tool start at line ${at}`); continue; }
        calls.set(id, { id, name, input: data.arguments, output: '', startLine: at, endLine: null, success: null });
        if (name === 'task') delegates.set(id, { id, prompt: string(data.arguments.prompt), startLine: at, endLine: null, result: '', model: null });
      }
      if (row.type === 'tool.execution_complete') {
        const id = string(data.toolCallId);
        const previous = calls.get(id);
        if (!previous) { problems.push(`Unpaired tool completion at line ${at}`); continue; }
        const output = content(data.result);
        calls.set(id, { ...previous, output, endLine: at, success: typeof data.success === 'boolean' ? data.success : null });
        if (previous.name === 'task' && data.success === true) {
          // Synchronous task results are observable; a background task handle alone is not a returned result.
          if (previous.input.mode !== 'background' && previous.input.background !== true && !/(?:task (?:running|started)|"status"\s*:\s*"(?:running|pending)")/i.test(output)) finishDelegate(id, at, output);
        }
      }
    }
  }
  for (const call of calls.values()) if (call.endLine === null) problems.push(`Incomplete tool call ${call.id}`);
  return { workspace, calls: [...calls.values()], delegates: [...delegates.values()], problems, finalLine };
}

function normalizeLines(text: string): string[] {
  return text.split('\n').map((line) => line.trim()).filter(Boolean);
}

type ShellToken = { readonly kind: 'word' | 'separator'; readonly value: string };
function shellTokens(command: string): readonly ShellToken[] | null {
  const tokens: ShellToken[] = [];
  let word = '';
  let quote = '';
  const flush = () => { if (word) tokens.push({ kind: 'word', value: word }); word = ''; };
  for (let index = 0; index < command.length; index++) {
    const character = command[index] ?? '';
    if (character === '\\' && quote !== "'") { word += command[++index] ?? ''; continue; }
    if (quote) { if (character === quote) quote = ''; else word += character; continue; }
    if (character === "'" || character === '"') { quote = character; continue; }
    if (/[;|&\n]/.test(character)) { flush(); tokens.push({ kind: 'separator', value: character }); continue; }
    if (/\s/.test(character)) { flush(); continue; }
    word += character;
  }
  if (quote) return null;
  flush();
  return tokens;
}

/** Conservative shell syntax support, not a general shell interpreter. */
export function shellCommands(command: string): readonly (readonly string[])[] {
  let tokens = shellTokens(command);
  if (!tokens) return [];
  if (/^(?:\/bin\/)?(?:ba|z)?sh$/.test(tokens[0]?.value ?? '')) {
    const flag = tokens.findIndex((token) => token.value === '-lc' || token.value === '-c');
    const script = tokens[flag + 1];
    if (flag < 0 || !script) return [];
    tokens = shellTokens(script.value);
    if (!tokens) return [];
  }
  const commands: string[][] = [[]];
  for (const token of tokens) {
    if (token.kind === 'separator') commands.push([]);
    else commands.at(-1)?.push(token.value);
  }
  return commands.filter((words) => words.length > 0);
}

export function requestedReadPaths(call: ToolCall): readonly string[] {
  if (!call.success || call.endLine === null) return [];
  if (['view', 'read_file', 'Read'].includes(call.name)) {
    const path = string(call.input.path) || string(call.input.file_path);
    return path ? [path] : [];
  }
  if (!['shell', 'bash'].includes(call.name)) return [];
  const paths: string[] = [];
  let changedDirectory = false;
  for (const words of shellCommands(string(call.input.command))) {
    if (words[0] === 'cd') changedDirectory = true;
    if (!['cat', 'sed', 'head', 'tail'].includes(words[0] ?? '') || words.some((word) => word.includes('<<'))) continue;
    for (const path of words.slice(1)) if (!changedDirectory || path.startsWith('/')) paths.push(path);
  }
  return paths;
}

/** Requires a successful read tool, a matching installed path, and the complete file body. */
export function loadedFile(trace: Trace, installedPath: string, body: string): readonly number[] {
  const evidence: number[] = [];
  const observed = new Set<string>();
  for (const call of trace.calls) {
    const tokens = requestedReadPaths(call);
    const canonical = (path: string) => path.replace(/^\/private\/var\//, '/var/');
    const matches = tokens.some((token) => token === installedPath || token === `./${installedPath}` || (trace.workspace !== null && canonical(token) === canonical(`${trace.workspace}/${installedPath}`)));
    if (!matches || call.endLine === null || !call.output.trim()) continue;
    const fileRead = ['view', 'read_file', 'Read'].includes(call.name);
    const numbered = fileRead && call.output.split('\n').filter((line) => line.trim()).every((line) => /^\s*(?:\d+\. |L\d+:)/.test(line));
    const rendered = numbered ? call.output.replace(/^\s*\d+\. /gm, '').replace(/^L\d+:\s?/gm, '') : call.output;
    normalizeLines(rendered).forEach((line) => observed.add(line));
    evidence.push(call.endLine);
  }
  const expected = normalizeLines(body);
  return expected.length > 0 && expected.every((line) => observed.has(line)) ? evidence : [];
}
