import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { describe, expect, it, vi } from "vitest";
import { buildProgram } from "../src/cli.js";
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

  it("workouts create --dry-run --file <valid> makes no API request", async () => {
    // Use a mock Client so the smoke test never touches the network.
    const request = vi.fn();
    const mockClient = { request } as unknown as Parameters<typeof buildProgram>[0];
    const out = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const program = buildProgram(mockClient);
    await program.parseAsync([
      "node",
      "hevy",
      "workouts",
      "create",
      "--dry-run",
      "--file",
      "examples/workout.json",
    ]);
    expect(request).not.toHaveBeenCalled();
    expect(out.mock.calls.join("")).toContain("workout payload is valid");
  });

  it("create --dry-run validates without HEVY_API_KEY", async () => {
    const { stdout } = await runCli([
      "workouts", "create", "--dry-run", "--file", "examples/workout.json",
    ]);
    expect(stdout).toContain("workout payload is valid");
  });

  it("edit --dry-run --file validates without HEVY_API_KEY (GET skipped)", async () => {
    const { stdout } = await runCli([
      "measurements", "edit", "2026-05-02", "--dry-run", "--file", "examples/measurement.json",
    ]);
    expect(stdout).toContain("body measurement payload is valid");
  });

  it("still requires HEVY_API_KEY for a non-dry-run write", async () => {
    await expect(
      runCli(["workouts", "create", "--file", "examples/workout.json"]),
    ).rejects.toMatchObject({ stderr: expect.stringContaining("HEVY_API_KEY is not set") });
  });

  it("still requires HEVY_API_KEY for edit --dry-run without --file (needs GET)", async () => {
    await expect(
      runCli(["workouts", "edit", "w1", "--dry-run"]),
    ).rejects.toMatchObject({ stderr: expect.stringContaining("HEVY_API_KEY is not set") });
  });
});
