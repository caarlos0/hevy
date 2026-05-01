import { readFile } from "node:fs/promises";
import type { Readable } from "node:stream";

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
  const fromStdin = file === undefined || file === "-";
  const raw = fromStdin ? await readStdin(stdin) : await readFile(file, "utf8");
  if (!raw.trim()) {
    throw new Error(`empty input; provide a JSON ${kind} on stdin or via --file`);
  }
  return parseJson<T>(raw, fromStdin ? "stdin" : file);
}
