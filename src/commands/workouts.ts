import type { Readable } from "node:stream";
import type { Client } from "../api/client.js";
import { toRequest, unwrap, type RequestKeys } from "../api/payload.js";
import {
  formatEventList,
  formatWorkout,
  formatWorkoutList,
  type WorkoutEvent,
} from "../format/workouts.js";
import { emitDryRun, readJsonPayload, resolveEditPayload, writeJson } from "../io.js";
import { validateWorkout } from "../validate.js";

interface SetIn {
  type?: string;
  weight_kg?: number | null;
  reps?: number | null;
  distance_meters?: number | null;
  duration_seconds?: number | null;
  custom_metric?: number | null;
  rpe?: number | null;
}

interface ExerciseIn {
  exercise_template_id: string;
  superset_id?: number | null;
  notes?: string | null;
  sets: SetIn[];
}

export interface Workout {
  id?: string;
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  is_private?: boolean;
  routine_id?: string;
  updated_at?: string;
  created_at?: string;
  exercises: ExerciseIn[];
}

interface ListResponse {
  page: number;
  page_count: number;
  workouts: Workout[];
}

interface CountResponse {
  workout_count: number;
}

interface EventsResponse {
  page: number;
  page_count: number;
  events: WorkoutEvent[];
}

// Keys accepted by POST /v1/workouts and PUT /v1/workouts/{id}. Everything
// else a GET returns (`id`, `updated_at`, `created_at`, `routine_id`,
// exercise `index` and `title`, set `index`) is rejected with a 400, so a
// `get | create` round-trip only works if we send exactly these.
const REQUEST_KEYS: RequestKeys = {
  top: ["title", "description", "start_time", "end_time", "is_private"],
  exercise: ["exercise_template_id", "superset_id", "notes"],
  set: [
    "type",
    "weight_kg",
    "reps",
    "distance_meters",
    "duration_seconds",
    "custom_metric",
    "rpe",
  ],
};

export async function listWorkouts(
  client: Client,
  opts: { page?: number; pageSize?: number; json?: boolean },
): Promise<void> {
  const data = await client.request<ListResponse>("GET", "/v1/workouts", {
    query: { page: opts.page, pageSize: opts.pageSize },
  });
  if (opts.json) {
    writeJson(data);
    return;
  }
  process.stdout.write(formatWorkoutList(data.workouts) + "\n");
}

export async function getWorkout(
  client: Client,
  id: string,
  opts: { json?: boolean },
): Promise<void> {
  const workout = await fetchWorkout(client, id);
  if (opts.json) {
    writeJson(workout);
    return;
  }
  process.stdout.write(formatWorkout(workout) + "\n");
}

export async function createWorkout(
  client: Client,
  opts: { file?: string; json?: boolean; stdin?: Readable; dryRun?: boolean },
): Promise<void> {
  const input = await readJsonPayload<Workout>(opts.file, opts.stdin, "workout");
  if (opts.dryRun) {
    emitDryRun(validateWorkout(input), "workout", opts.json);
    return;
  }
  const created = unwrap<Workout>(
    await client.request<unknown>("POST", "/v1/workouts", {
      body: { workout: toRequest(input, REQUEST_KEYS) },
    }),
    "workout",
  );
  if (opts.json) writeJson(created);
  else process.stdout.write(formatWorkout(created) + "\n");
}

export async function editWorkout(
  client: Client,
  id: string,
  opts: { file?: string; json?: boolean; stdin?: Readable; dryRun?: boolean },
): Promise<void> {
  // `--dry-run --file` short-circuits before the GET: the user supplied a
  // complete payload, no merge with current state is required.
  if (opts.dryRun && opts.file !== undefined) {
    const input = await readJsonPayload<Workout>(opts.file, opts.stdin, "workout");
    emitDryRun(validateWorkout(input), "workout", opts.json);
    return;
  }

  const current = await fetchWorkout(client, id);
  const next = await resolveEditPayload<Workout>(current, opts, "workout.json", "workout");
  if (next === null) {
    process.stderr.write("no changes; aborting\n");
    return;
  }

  if (opts.dryRun) {
    emitDryRun(validateWorkout(next), "workout", opts.json);
    return;
  }

  const updated = unwrap<Workout>(
    await client.request<unknown>(
      "PUT",
      `/v1/workouts/${encodeURIComponent(id)}`,
      { body: { workout: toRequest(next, REQUEST_KEYS) } },
    ),
    "workout",
  );
  if (opts.json) writeJson(updated);
  else process.stdout.write(formatWorkout(updated) + "\n");
}

export async function countWorkouts(
  client: Client,
  opts: { json?: boolean },
): Promise<void> {
  const data = await client.request<CountResponse>("GET", "/v1/workouts/count");
  if (opts.json) {
    writeJson(data);
    return;
  }
  process.stdout.write(`${data.workout_count} workouts\n`);
}

export async function listWorkoutEvents(
  client: Client,
  opts: { page?: number; pageSize?: number; since?: string; json?: boolean },
): Promise<void> {
  const data = await client.request<EventsResponse>("GET", "/v1/workouts/events", {
    query: { page: opts.page, pageSize: opts.pageSize, since: opts.since },
  });
  if (opts.json) {
    writeJson(data);
    return;
  }
  process.stdout.write(formatEventList(data.events) + "\n");
}

async function fetchWorkout(client: Client, id: string): Promise<Workout> {
  return await client.request<Workout>(
    "GET",
    `/v1/workouts/${encodeURIComponent(id)}`,
  );
}
