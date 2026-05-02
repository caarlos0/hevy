import { readFile } from "node:fs/promises";
import type { Readable } from "node:stream";
import { editJson } from "./editor.js";

export async function readStdin(stream: Readable = process.stdin): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export function writeJson(value: unknown): void {
  process.stdout.write(JSON.stringify(value, null, 2) + "\n");
}

export function stdinIsTTY(): boolean {
  return Boolean(process.stdin.isTTY);
}

export function parseJson<T>(raw: string, source: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`invalid JSON from ${source}: ${msg}`);
  }
}

export async function readJsonPayload<T>(
  file: string | undefined,
  stdin: Readable | undefined,
  kind: string,
): Promise<T> {
  if (file === undefined && streamIsTTY(stdin)) {
    throw new Error("provide JSON via --file <path> or pipe stdin");
  }
  const fromStdin = file === undefined || file === "-";
  const raw = fromStdin ? await readStdin(stdin) : await readFile(file, "utf8");
  if (!raw.trim()) {
    throw new Error(`empty input; provide a JSON ${kind} on stdin or via --file`);
  }
  return parseJson<T>(raw, fromStdin ? "stdin" : file);
}

/**
 * Resolve the next value for an edit command:
 *   - --file <path> or --file -  → read JSON from file/stdin
 *   - piped stdin (non-TTY)      → read JSON from stdin
 *   - interactive TTY            → open $EDITOR with `current` as a starting point
 *
 * Returns null when the user opened $EDITOR and made no changes (caller should abort).
 */
export async function resolveEditPayload<T>(
  current: T,
  opts: { file?: string; stdin?: Readable },
  tempName: string,
  kind: string,
): Promise<T | null> {
  if (opts.file !== undefined) {
    return readJsonPayload<T>(opts.file, opts.stdin, kind);
  }
  if (!stdinIsTTY()) {
    return parseJson<T>(await readStdin(opts.stdin), "stdin");
  }
  const result = await editJson<T>(current, tempName);
  return result.edited ? result.value : null;
}

function streamIsTTY(stream: Readable | undefined): boolean {
  const s = (stream ?? process.stdin) as Readable & { isTTY?: boolean };
  return Boolean(s.isTTY);
}
