import { setApiKey } from "./api/client.js";
import { HevyError, UsageError } from "./api/errors.js";
import { buildProgram } from "./cli.js";

async function main(): Promise<void> {
  const key = process.env.HEVY_API_KEY;
  if (!key || key.trim().length === 0) {
    process.stderr.write(
      "error: HEVY_API_KEY is not set. Get an API key at https://hevy.com/settings?api\n",
    );
    process.exit(1);
  }
  setApiKey(key);

  const program = buildProgram();
  program.exitOverride();
  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    handle(err);
  }
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
  if (err instanceof UsageError) {
    process.stderr.write(`error: ${err.message}\n`);
    process.exit(64);
  }
  // commander.exitOverride throws CommanderError on usage problems
  if (err && typeof err === "object" && "code" in err && typeof (err as { code: unknown }).code === "string") {
    const ce = err as { exitCode?: number; message?: string };
    if (ce.message) process.stderr.write(`${ce.message}\n`);
    process.exit(ce.exitCode ?? 64);
  }
  const msg = err instanceof Error ? err.message : String(err);
  process.stderr.write(`error: ${msg}\n`);
  process.exit(2);
}

main();
