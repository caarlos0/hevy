import { Command } from "commander";
import {
  createCustomExercise,
  getExercise,
  getExerciseHistory,
  listExercises,
} from "./commands/exercises.js";
import { createFolder, getFolder, listFolders } from "./commands/folders.js";
import {
  createMeasurement,
  editMeasurement,
  getMeasurement,
  listMeasurements,
} from "./commands/measurements.js";
import { createRoutine, editRoutine, getRoutine, listRoutines } from "./commands/routines.js";
import { whoami } from "./commands/whoami.js";
import {
  countWorkouts,
  createWorkout,
  editWorkout,
  getWorkout,
  listWorkoutEvents,
  listWorkouts,
} from "./commands/workouts.js";

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

  const folders = program.command("folders").description("Manage routine folders");

  folders
    .command("list")
    .description("List your routine folders")
    .option("--page <n>", "page number", parseIntOpt)
    .option("--page-size <n>", "page size", parseIntOpt)
    .option("--json", "emit raw JSON", false)
    .action(async (opts: { page?: number; pageSize?: number; json: boolean }) => {
      await listFolders(opts);
    });

  folders
    .command("get <id>")
    .description("Show a single routine folder")
    .option("--json", "emit raw JSON", false)
    .action(async (id: string, opts: { json: boolean }) => {
      await getFolder(id, opts);
    });

  folders
    .command("create <title...>")
    .description("Create a routine folder with the given title")
    .option("--json", "emit raw JSON", false)
    .action(async (title: string[], opts: { json: boolean }) => {
      await createFolder({ title: title.join(" "), json: opts.json });
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

  exercises
    .command("get <id>")
    .description("Show a single exercise template")
    .option("--json", "emit raw JSON", false)
    .action(async (id: string, opts: { json: boolean }) => {
      await getExercise(id, opts);
    });

  exercises
    .command("create")
    .description("Create a custom exercise template")
    .requiredOption("--title <title>", "exercise title")
    .requiredOption(
      "--type <type>",
      "weight_reps|reps_only|bodyweight_reps|bodyweight_assisted_reps|duration|weight_duration|distance_duration|short_distance_weight",
    )
    .requiredOption(
      "--equipment <category>",
      "none|barbell|dumbbell|kettlebell|machine|plate|resistance_band|suspension|other",
    )
    .requiredOption("--muscle <group>", "primary muscle group")
    .option("--other-muscles <list>", "comma-separated muscle groups", csvList)
    .option("--json", "emit raw JSON", false)
    .action(
      async (opts: {
        title: string;
        type: string;
        equipment: string;
        muscle: string;
        otherMuscles?: string[];
        json: boolean;
      }) => {
        await createCustomExercise(opts);
      },
    );

  exercises
    .command("history <id>")
    .description("Show history entries for an exercise template")
    .option("--start <date>", "start date (ISO 8601)")
    .option("--end <date>", "end date (ISO 8601)")
    .option("--json", "emit raw JSON", false)
    .action(
      async (
        id: string,
        opts: { start?: string; end?: string; json: boolean },
      ) => {
        await getExerciseHistory(id, {
          startDate: opts.start,
          endDate: opts.end,
          json: opts.json,
        });
      },
    );

  const workouts = program.command("workouts").description("Manage workouts");

  workouts
    .command("list")
    .description("List your workouts")
    .option("--page <n>", "page number", parseIntOpt)
    .option("--page-size <n>", "page size", parseIntOpt)
    .option("--json", "emit raw JSON", false)
    .action(async (opts: { page?: number; pageSize?: number; json: boolean }) => {
      await listWorkouts(opts);
    });

  workouts
    .command("get <id>")
    .description("Show a single workout")
    .option("--json", "emit raw JSON", false)
    .action(async (id: string, opts: { json: boolean }) => {
      await getWorkout(id, opts);
    });

  workouts
    .command("create")
    .description("Create a workout from JSON (stdin or --file)")
    .option("--file <path>", "read JSON from file (use - for stdin)")
    .option("--json", "emit raw JSON", false)
    .action(async (opts: { file?: string; json: boolean }) => {
      await createWorkout(opts);
    });

  workouts
    .command("edit <id>")
    .description("Edit a workout (opens $EDITOR if no --file/stdin)")
    .option("--file <path>", "read JSON from file (use - for stdin)")
    .option("--json", "emit raw JSON", false)
    .action(async (id: string, opts: { file?: string; json: boolean }) => {
      await editWorkout(id, opts);
    });

  workouts
    .command("count")
    .description("Show the total number of workouts")
    .option("--json", "emit raw JSON", false)
    .action(async (opts: { json: boolean }) => {
      await countWorkouts(opts);
    });

  workouts
    .command("events")
    .description("Show workout update/delete events since a date")
    .option("--page <n>", "page number", parseIntOpt)
    .option("--page-size <n>", "page size", parseIntOpt)
    .option("--since <date>", "ISO 8601 timestamp (default: 1970-01-01)")
    .option("--json", "emit raw JSON", false)
    .action(
      async (opts: {
        page?: number;
        pageSize?: number;
        since?: string;
        json: boolean;
      }) => {
        await listWorkoutEvents(opts);
      },
    );

  const measurements = program
    .command("measurements")
    .description("Manage body measurements");

  measurements
    .command("list")
    .description("List your body measurements")
    .option("--page <n>", "page number", parseIntOpt)
    .option("--page-size <n>", "page size", parseIntOpt)
    .option("--json", "emit raw JSON", false)
    .action(async (opts: { page?: number; pageSize?: number; json: boolean }) => {
      await listMeasurements(opts);
    });

  measurements
    .command("get <date>")
    .description("Show a body measurement (date as YYYY-MM-DD)")
    .option("--json", "emit raw JSON", false)
    .action(async (date: string, opts: { json: boolean }) => {
      await getMeasurement(date, opts);
    });

  measurements
    .command("create")
    .description("Create a body measurement from JSON (stdin or --file)")
    .option("--file <path>", "read JSON from file (use - for stdin)")
    .option("--json", "emit raw JSON", false)
    .action(async (opts: { file?: string; json: boolean }) => {
      await createMeasurement(opts);
    });

  measurements
    .command("edit <date>")
    .description("Edit a body measurement (opens $EDITOR if no --file/stdin)")
    .option("--file <path>", "read JSON from file (use - for stdin)")
    .option("--json", "emit raw JSON", false)
    .action(async (date: string, opts: { file?: string; json: boolean }) => {
      await editMeasurement(date, opts);
    });

  return program;
}

function parseIntOpt(value: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`expected positive integer, got "${value}"`);
  }
  return n;
}

function csvList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
