import { describe, expect, it, vi } from "vitest";
import { editJson } from "../src/editor.js";

vi.mock("node:child_process", () => ({
  spawnSync: vi.fn(() => ({ status: 0 })),
}));

describe("editJson", () => {
  it("writes value to a temp file, invokes $EDITOR, reads it back", async () => {
    const { spawnSync } = await import("node:child_process");
    const { readFileSync, writeFileSync } = await import("node:fs");
    (spawnSync as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (_cmd: string, args: string[]) => {
        const file = args[args.length - 1]!;
        const original = JSON.parse(readFileSync(file, "utf8")) as { name: string };
        writeFileSync(file, JSON.stringify({ ...original, name: "edited" }));
        return { status: 0 };
      },
    );
    const result = await editJson<{ name: string }>({ name: "orig" });
    expect(result).toMatchObject({ edited: true, value: { name: "edited" } });
  });

  it("returns edited:false when content is unchanged", async () => {
    const { spawnSync } = await import("node:child_process");
    (spawnSync as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({ status: 0 }));
    const result = await editJson({ name: "orig" });
    expect(result).toMatchObject({ edited: false, value: { name: "orig" } });
  });

  it("throws when editor exits non-zero", async () => {
    const { spawnSync } = await import("node:child_process");
    (spawnSync as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({ status: 1 }));
    await expect(editJson({})).rejects.toThrow(/editor exited/i);
  });

  it("throws with temp path on invalid JSON", async () => {
    const { spawnSync } = await import("node:child_process");
    const { writeFileSync } = await import("node:fs");
    (spawnSync as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (_cmd: string, args: string[]) => {
        writeFileSync(args[args.length - 1]!, "not json");
        return { status: 0 };
      },
    );
    await expect(editJson({})).rejects.toThrow(/invalid json/i);
  });
});
