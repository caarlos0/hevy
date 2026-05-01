import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { editJson } from "../src/editor.js";

vi.mock("node:child_process", () => ({
  spawnSync: vi.fn(() => ({ status: 0 })),
}));

const ORIGINAL_VISUAL = process.env.VISUAL;
const ORIGINAL_EDITOR = process.env.EDITOR;

beforeEach(async () => {
  delete process.env.VISUAL;
  delete process.env.EDITOR;
  const { spawnSync } = await import("node:child_process");
  (spawnSync as unknown as ReturnType<typeof vi.fn>).mockReset();
});

afterEach(() => {
  if (ORIGINAL_VISUAL !== undefined) process.env.VISUAL = ORIGINAL_VISUAL;
  if (ORIGINAL_EDITOR !== undefined) process.env.EDITOR = ORIGINAL_EDITOR;
});

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

  it("re-opens editor after an invalid JSON edit", async () => {
    const { spawnSync } = await import("node:child_process");
    const { writeFileSync } = await import("node:fs");
    let call = 0;
    (spawnSync as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (_cmd: string, args: string[]) => {
        const file = args[args.length - 1]!;
        call++;
        if (call === 1) {
          writeFileSync(file, "not json");
        } else {
          writeFileSync(file, JSON.stringify({ name: "fixed" }));
        }
        return { status: 0 };
      },
    );
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const result = await editJson<{ name: string }>({ name: "orig" });
    expect(call).toBe(2);
    expect(result).toMatchObject({ edited: true, value: { name: "fixed" } });
  });

  it("gives up if user exits without fixing invalid JSON", async () => {
    const { spawnSync } = await import("node:child_process");
    const { writeFileSync } = await import("node:fs");
    let call = 0;
    (spawnSync as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (_cmd: string, args: string[]) => {
        const file = args[args.length - 1]!;
        call++;
        // Always leave the same broken content.
        writeFileSync(file, "not json");
        return { status: 0 };
      },
    );
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    await expect(editJson({})).rejects.toThrow(/invalid JSON/i);
    expect(call).toBe(2);
  });

  it("prefers $VISUAL over $EDITOR", async () => {
    process.env.EDITOR = "ed-tool";
    process.env.VISUAL = "vis-tool";
    const { spawnSync } = await import("node:child_process");
    const mock = spawnSync as unknown as ReturnType<typeof vi.fn>;
    mock.mockImplementation(() => ({ status: 0 }));
    await editJson({ name: "orig" });
    expect(mock.mock.calls[0]![0]).toBe("vis-tool");
  });

  it("falls back to $EDITOR when $VISUAL is unset", async () => {
    process.env.EDITOR = "ed-tool";
    const { spawnSync } = await import("node:child_process");
    const mock = spawnSync as unknown as ReturnType<typeof vi.fn>;
    mock.mockImplementation(() => ({ status: 0 }));
    await editJson({ name: "orig" });
    expect(mock.mock.calls[0]![0]).toBe("ed-tool");
  });
});
