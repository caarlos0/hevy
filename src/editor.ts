import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface EditResult<T> {
  edited: boolean;
  value: T;
}

export async function editJson<T>(initial: T, name = "payload.json"): Promise<EditResult<T>> {
  const dir = mkdtempSync(join(tmpdir(), "hevy-"));
  const file = join(dir, name);
  const original = JSON.stringify(initial, null, 2) + "\n";
  writeFileSync(file, original);

  const editorEnv = process.env.VISUAL ?? process.env.EDITOR ?? "vi";
  const [editor, ...editorArgs] = editorEnv.split(/\s+/).filter((s) => s.length > 0);
  if (!editor) throw new Error("VISUAL/EDITOR is set but empty");

  let lastContent = original;
  for (;;) {
    const res = spawnSync(editor, [...editorArgs, file], { stdio: "inherit" });
    if (res.status !== 0) {
      throw new Error(`editor exited with status ${res.status}; edits saved at ${file}`);
    }

    const after = readFileSync(file, "utf8");
    if (after.trim() === original.trim()) {
      rmSync(dir, { recursive: true, force: true });
      return { edited: false, value: initial };
    }

    try {
      const parsed = JSON.parse(after) as T;
      rmSync(dir, { recursive: true, force: true });
      return { edited: true, value: parsed };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // If the user exited without making any change since the last failed attempt,
      // give up so we don't loop forever.
      if (after === lastContent) {
        throw new Error(`invalid JSON after edit (${msg}); edits saved at ${file}`);
      }
      lastContent = after;
      process.stderr.write(`invalid JSON (${msg}); reopening editor...\n`);
    }
  }
}
