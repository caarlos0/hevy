import { Command, InvalidArgumentError } from "commander";
import pkg from "../package.json" with { type: "json" };
import type { Client } from "./api/client.js";
import {
  createCustomExercise,
  EQUIPMENT_CATEGORIES,
  EXERCISE_TYPES,
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

interface PageOpts { page?: number; pageSize?: number }
interface JsonOpt { json: boolean }
type ListOpts = PageOpts & JsonOpt;
interface FileOpts { file?: string }

function withJson(cmd: Command): Command {
  return cmd.option("--json", "emit raw JSON", false);
}

function withPaging(cmd: Command): Command {
  return cmd
    .option("--page <n>", "page number", parseIntOpt)
    .option("--page-size <n>", "page size", parseIntOpt);
}

function withFile(cmd: Command): Command {
  return cmd.option("--file <path>", "read JSON from file (use - for stdin)");
}

export function buildProgram(client: Client): Command {
  const program = new Command();
  program
    .name("hevy")
    .description("CLI for the Hevy API")
    .version(pkg.version)
    .showHelpAfterError();

  withJson(program.command("whoami").description("Show the authenticated user"))
    .action(async (opts: JsonOpt) => {
      await whoami(client, opts);
    });

  const routines = program.command("routines").description("Manage routines");

  withJson(withPaging(routines.command("list").description("List your routines")))
    .action(async (opts: ListOpts) => {
      await listRoutines(client, opts);
    });

  withJson(routines.command("get <id>").description("Show a single routine"))
    .action(async (id: string, opts: JsonOpt) => {
      await getRoutine(client, id, opts);
    });

  withJson(withFile(
    routines.command("create").description("Create a routine from JSON (stdin or --file)"),
  )).action(async (opts: FileOpts & JsonOpt) => {
    await createRoutine(client, opts);
  });

  withJson(withFile(
    routines.command("edit <id>").description("Edit a routine (opens $VISUAL/$EDITOR if no --file/stdin)"),
  )).action(async (id: string, opts: FileOpts & JsonOpt) => {
    await editRoutine(client, id, opts);
  });

  const folders = program.command("folders").description("Manage routine folders");

  withJson(withPaging(folders.command("list").description("List your routine folders")))
    .action(async (opts: ListOpts) => {
      await listFolders(client, opts);
    });

  withJson(folders.command("get <id>").description("Show a single routine folder"))
    .action(async (id: string, opts: JsonOpt) => {
      await getFolder(client, id, opts);
    });

  withJson(folders.command("create <title...>").description("Create a routine folder with the given title"))
    .action(async (title: string[], opts: JsonOpt) => {
      await createFolder(client, { title: title.join(" "), json: opts.json });
    });

  const exercises = program.command("exercises").description("Browse exercise templates");

  withJson(withPaging(exercises.command("list").description("List exercise templates")))
    .action(async (opts: ListOpts) => {
      await listExercises(client, opts);
    });

  withJson(exercises.command("get <id>").description("Show a single exercise template"))
    .action(async (id: string, opts: JsonOpt) => {
      await getExercise(client, id, opts);
    });

  withJson(
    exercises
      .command("create")
      .description("Create a custom exercise template")
      .requiredOption("--title <title>", "exercise title")
      .requiredOption(
        "--type <type>",
        EXERCISE_TYPES.join("|"),
        choices(EXERCISE_TYPES, "--type"),
      )
      .requiredOption(
        "--equipment <category>",
        EQUIPMENT_CATEGORIES.join("|"),
        choices(EQUIPMENT_CATEGORIES, "--equipment"),
      )
      .requiredOption("--muscle <group>", "primary muscle group")
      .option("--other-muscles <list>", "comma-separated muscle groups", csvList),
  ).action(
    async (opts: {
      title: string;
      type: string;
      equipment: string;
      muscle: string;
      otherMuscles?: string[];
      json: boolean;
    }) => {
      await createCustomExercise(client, opts);
    },
  );

  withJson(
    exercises
      .command("history <id>")
      .description("Show history entries for an exercise template")
      .option("--start <date>", "start date (ISO 8601)")
      .option("--end <date>", "end date (ISO 8601)"),
  ).action(
    async (id: string, opts: { start?: string; end?: string; json: boolean }) => {
      await getExerciseHistory(client, id, {
        startDate: opts.start,
        endDate: opts.end,
        json: opts.json,
      });
    },
  );

  const workouts = program.command("workouts").description("Manage workouts");

  withJson(withPaging(workouts.command("list").description("List your workouts")))
    .action(async (opts: ListOpts) => {
      await listWorkouts(client, opts);
    });

  withJson(workouts.command("get <id>").description("Show a single workout"))
    .action(async (id: string, opts: JsonOpt) => {
      await getWorkout(client, id, opts);
    });

  withJson(withFile(
    workouts.command("create").description("Create a workout from JSON (stdin or --file)"),
  )).action(async (opts: FileOpts & JsonOpt) => {
    await createWorkout(client, opts);
  });

  withJson(withFile(
    workouts.command("edit <id>").description("Edit a workout (opens $VISUAL/$EDITOR if no --file/stdin)"),
  )).action(async (id: string, opts: FileOpts & JsonOpt) => {
    await editWorkout(client, id, opts);
  });

  withJson(workouts.command("count").description("Show the total number of workouts"))
    .action(async (opts: JsonOpt) => {
      await countWorkouts(client, opts);
    });

  withJson(
    withPaging(workouts.command("events").description("Show workout update/delete events since a date"))
      .option("--since <date>", "ISO 8601 timestamp (default: 1970-01-01)"),
  ).action(
    async (opts: ListOpts & { since?: string }) => {
      await listWorkoutEvents(client, opts);
    },
  );

  const measurements = program
    .command("measurements")
    .description("Manage body measurements");

  withJson(withPaging(measurements.command("list").description("List your body measurements")))
    .action(async (opts: ListOpts) => {
      await listMeasurements(client, opts);
    });

  withJson(measurements.command("get <date>").description("Show a body measurement (date as YYYY-MM-DD)"))
    .action(async (date: string, opts: JsonOpt) => {
      await getMeasurement(client, date, opts);
    });

  withJson(withFile(
    measurements.command("create").description("Create a body measurement from JSON (stdin or --file)"),
  )).action(async (opts: FileOpts & JsonOpt) => {
    await createMeasurement(client, opts);
  });

  withJson(withFile(
    measurements
      .command("edit <date>")
      .description("Edit a body measurement (opens $VISUAL/$EDITOR if no --file/stdin)"),
  )).action(async (date: string, opts: FileOpts & JsonOpt) => {
    await editMeasurement(client, date, opts);
  });

  return program;
}

function parseIntOpt(value: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) {
    throw new InvalidArgumentError(`expected positive integer, got "${value}"`);
  }
  return n;
}

function csvList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function choices<T extends string>(allowed: readonly T[], flag: string) {
  return (value: string): T => {
    if (!(allowed as readonly string[]).includes(value)) {
      throw new InvalidArgumentError(
        `${flag} must be one of: ${allowed.join(", ")}`,
      );
    }
    return value as T;
  };
}
