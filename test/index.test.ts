import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import pkg from "../package.json" with { type: "json" };

const execFileAsync = promisify(execFile);
const repoRoot = fileURLToPath(new URL("..", import.meta.url));

async function runCli(args: string[]) {
  const env = { ...process.env };
  delete env.HEVY_API_KEY;
  return await execFileAsync(
    process.execPath,
    ["--import", "tsx", "src/index.ts", ...args],
    { cwd: repoRoot, env },
  );
}

describe("index", () => {
  it("prints help without HEVY_API_KEY", async () => {
    const { stdout, stderr } = await runCli(["--help"]);

    expect(stdout).toContain("Usage: hevy");
    expect(stderr).toBe("");
  });

  it("prints version without HEVY_API_KEY", async () => {
    const { stdout, stderr } = await runCli(["--version"]);

    expect(stdout.trim()).toBe(pkg.version);
    expect(stderr).toBe("");
  });
});
