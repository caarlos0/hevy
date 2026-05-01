import { setApiKey } from "./api/client.js";
import { HevyError } from "./api/errors.js";
import { buildProgram } from "./cli.js";

async function main(): Promise<void> {
  const program = buildProgram();
  program.exitOverride();
  program.hook("preAction", () => {
    const key = process.env.HEVY_API_KEY;
    if (!key || key.trim().length === 0) {
      process.stderr.write(
        "error: HEVY_API_KEY is not set. Get an API key at https://hevy.com/settings?api\n",
      );
      process.exit(1);
    }
    setApiKey(key);
  });
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
  // commander.exitOverride throws CommanderError on usage problems, --help, --version
  if (err && typeof err === "object" && "code" in err && typeof (err as { code: unknown }).code === "string") {
    const ce = err as { exitCode?: number; message?: string };
    const code = ce.exitCode ?? 64;
    if (code !== 0 && ce.message) process.stderr.write(`${ce.message}\n`);
    process.exit(code);
  }
  const msg = err instanceof Error ? err.message : String(err);
  process.stderr.write(`error: ${msg}\n`);
  process.exit(2);
}

main();
