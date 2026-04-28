import { Command } from "commander";
import { listExercises } from "./commands/exercises.js";
import { createRoutine, editRoutine, getRoutine, listRoutines } from "./commands/routines.js";
import { whoami } from "./commands/whoami.js";

export function buildProgram(): Command {
  const program = new Command();
  program
    .name("hevy")
    .description("CLI for managing Hevy routines")
    .showHelpAfterError();

  program
    .command("whoami")
    .description("Show the authenticated user")
    .option("--json", "emit raw JSON", false)
    .action(async (opts: { json: boolean }) => {
      await whoami(opts);
    });

  const routines = program.command("routines").description("Manage routines");

  routines
    .command("list")
    .description("List your routines")
    .option("--page <n>", "page number", parseIntOpt)
    .option("--page-size <n>", "page size", parseIntOpt)
    .option("--json", "emit raw JSON", false)
    .action(async (opts: { page?: number; pageSize?: number; json: boolean }) => {
      await listRoutines(opts);
    });

  routines
    .command("get <id>")
    .description("Show a single routine")
    .option("--json", "emit raw JSON", false)
    .action(async (id: string, opts: { json: boolean }) => {
      await getRoutine(id, opts);
    });

  routines
    .command("create")
    .description("Create a routine from JSON (stdin or --file)")
    .option("--file <path>", "read JSON from file (use - for stdin)")
    .option("--json", "emit raw JSON", false)
    .action(async (opts: { file?: string; json: boolean }) => {
      await createRoutine(opts);
    });

  routines
    .command("edit <id>")
    .description("Edit a routine (opens $EDITOR if no --file/stdin)")
    .option("--file <path>", "read JSON from file (use - for stdin)")
    .option("--json", "emit raw JSON", false)
    .action(async (id: string, opts: { file?: string; json: boolean }) => {
      await editRoutine(id, opts);
    });

  const exercises = program.command("exercises").description("Browse exercise templates");
  exercises
    .command("list")
    .description("List exercise templates")
    .option("--search <term>", "filter by title (case-insensitive substring)")
    .option("--page <n>", "page number", parseIntOpt)
    .option("--page-size <n>", "page size", parseIntOpt)
    .option("--json", "emit raw JSON", false)
    .action(
      async (opts: { search?: string; page?: number; pageSize?: number; json: boolean }) => {
        await listExercises(opts);
      },
    );

  return program;
}

function parseIntOpt(value: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`expected positive integer, got "${value}"`);
  }
  return n;
}
