import { CommanderError } from "commander";
import pkg from "../package.json" with { type: "json" };
import { createClient, type Client } from "./api/client.js";
import { HevyError } from "./api/errors.js";
import { buildProgram } from "./cli.js";

async function main(): Promise<void> {
  const key = process.env.HEVY_API_KEY;
  const hasKey = key !== undefined && key.trim().length > 0;
  if (!hasKey && !allowsMissingApiKey(process.argv)) {
    process.stderr.write(
      "error: HEVY_API_KEY is not set. Get an API key at https://hevy.com/settings?api\n",
    );
    process.exit(1);
  }

  const client = hasKey
    ? createClient({
        apiKey: key,
        userAgent: `hevy-cli/${pkg.version}`,
      })
    : unavailableClient();

  const program = buildProgram(client);
  program.exitOverride();
  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    handle(err);
  }
}

function allowsMissingApiKey(argv: string[]): boolean {
  const args = argv.slice(2);
  return args.some((arg) => ["--help", "-h", "--version", "-V"].includes(arg))
    || args[0] === "help";
}

function unavailableClient(): Client {
  async function request(): Promise<never> {
    throw new Error("HEVY_API_KEY is not set");
  }
  return { request, requestMaybe: request };
}

function handle(err: unknown): never {
  if (err instanceof HevyError) {
    if (err.status === 401) {
      process.stderr.write(
        "error: 401 Unauthorized. Check HEVY_API_KEY at https://hevy.com/settings?api\n",
      );
    } else {
      process.stderr.write(`error: ${err.status} ${err.message}\n`);
    }
    process.exit(1);
  }
  if (err instanceof CommanderError) {
    if (err.exitCode !== 0 && err.message) {
      process.stderr.write(`${err.message}\n`);
    }
    process.exit(err.exitCode);
  }
  const msg = err instanceof Error ? err.message : String(err);
  process.stderr.write(`error: ${msg}\n`);
  process.exit(2);
}

main();
