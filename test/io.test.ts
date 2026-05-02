import { Readable } from "node:stream";
import { describe, expect, it, vi } from "vitest";
import { readJsonPayload, readStdin, writeJson } from "../src/io.js";

describe("readStdin", () => {
  it("reads UTF-8 text from a stream", async () => {
    const stream = Readable.from([Buffer.from("hello "), Buffer.from("world")]);
    await expect(readStdin(stream)).resolves.toBe("hello world");
  });

  it("returns empty string for empty stream", async () => {
    await expect(readStdin(Readable.from([]))).resolves.toBe("");
  });
});

describe("readJsonPayload", () => {
  it("fails fast when no file is provided and stdin is a TTY", async () => {
    const stdin = Readable.from([]) as Readable & { isTTY?: boolean };
    stdin.isTTY = true;

    await expect(readJsonPayload(undefined, stdin, "workout")).rejects.toThrow(
      "provide JSON via --file <path> or pipe stdin",
    );
  });
});

describe("writeJson", () => {
  it("prints JSON with 2-space indent and trailing newline", () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    writeJson({ a: 1 });
    expect(spy).toHaveBeenCalledWith('{\n  "a": 1\n}\n');
    spy.mockRestore();
  });
});
