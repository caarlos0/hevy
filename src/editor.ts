import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface EditResult<T> {
  edited: boolean;
  value: T;
  tempPath?: string;
}

export async function editJson<T>(initial: T, name = "payload.json"): Promise<EditResult<T>> {
  const dir = mkdtempSync(join(tmpdir(), "hevy-"));
  const file = join(dir, name);
  const original = JSON.stringify(initial, null, 2);
  writeFileSync(file, original + "\n");

  const editor = process.env.EDITOR ?? "vi";
  const res = spawnSync(editor, [file], { stdio: "inherit", shell: true });
  if (res.status !== 0) {
    throw new Error(`editor exited with status ${res.status}; edits saved at ${file}`);
  }

  const after = readFileSync(file, "utf8");
  if (after.trim() === original.trim()) {
    return { edited: false, value: initial };
  }
  let parsed: T;
  try {
    parsed = JSON.parse(after) as T;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`invalid JSON after edit (${msg}); edits saved at ${file}`);
  }
  return { edited: true, value: parsed, tempPath: file };
}
