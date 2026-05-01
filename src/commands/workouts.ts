import { readFile } from "node:fs/promises";
import type { Readable } from "node:stream";
import { request } from "../api/client.js";
import { editJson } from "../editor.js";
import {
  formatEventList,
  formatWorkout,
  formatWorkoutList,
  type WorkoutEvent,
} from "../format/workouts.js";
import { readStdin, stdinIsTTY, writeJson } from "../io.js";

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

export async function listWorkouts(opts: {
  page?: number;
  pageSize?: number;
  json?: boolean;
}): Promise<void> {
  const data = await request<ListResponse>("GET", "/v1/workouts", {
    query: { page: opts.page, pageSize: opts.pageSize },
  });
  if (opts.json) {
    writeJson(data);
    return;
  }
  process.stdout.write(formatWorkoutList(data.workouts) + "\n");
}

export async function getWorkout(
  id: string,
  opts: { json?: boolean },
): Promise<void> {
  const workout = await request<Workout>(
    "GET",
    `/v1/workouts/${encodeURIComponent(id)}`,
  );
  if (opts.json) {
    writeJson(workout);
    return;
  }
  process.stdout.write(formatWorkout(workout) + "\n");
}

export async function createWorkout(opts: {
  file?: string;
  json?: boolean;
  stdin?: Readable;
}): Promise<void> {
  const input = await readPayload(opts.file, opts.stdin);
  const created = await request<Workout>("POST", "/v1/workouts", {
    body: { workout: input },
  });
  if (opts.json) writeJson(created);
  else process.stdout.write(formatWorkout(created) + "\n");
}

export async function editWorkout(
  id: string,
  opts: { file?: string; json?: boolean; stdin?: Readable },
): Promise<void> {
  const current = await fetchWorkout(id);
  let next: Workout;

  if (opts.file !== undefined) {
    next = await readPayload(opts.file, opts.stdin);
  } else if (!stdinIsTTY()) {
    next = parseJsonOrThrow<Workout>(await readStdin(opts.stdin), "stdin");
  } else {
    const result = await editJson<Workout>(current, "workout.json");
    if (!result.edited) {
      process.stderr.write("no changes; aborting\n");
      return;
    }
    next = result.value;
  }

  const updated = await request<Workout>(
    "PUT",
    `/v1/workouts/${encodeURIComponent(id)}`,
    { body: { workout: next } },
  );
  if (opts.json) writeJson(updated);
  else process.stdout.write(formatWorkout(updated) + "\n");
}

export async function countWorkouts(opts: { json?: boolean }): Promise<void> {
  const data = await request<CountResponse>("GET", "/v1/workouts/count");
  if (opts.json) {
    writeJson(data);
    return;
  }
  process.stdout.write(`${data.workout_count} workouts\n`);
}

export async function listWorkoutEvents(opts: {
  page?: number;
  pageSize?: number;
  since?: string;
  json?: boolean;
}): Promise<void> {
  const data = await request<EventsResponse>("GET", "/v1/workouts/events", {
    query: { page: opts.page, pageSize: opts.pageSize, since: opts.since },
  });
  if (opts.json) {
    writeJson(data);
    return;
  }
  process.stdout.write(formatEventList(data.events) + "\n");
}

async function fetchWorkout(id: string): Promise<Workout> {
  return await request<Workout>(
    "GET",
    `/v1/workouts/${encodeURIComponent(id)}`,
  );
}

async function readPayload(
  file: string | undefined,
  stdin: Readable | undefined,
): Promise<Workout> {
  let raw: string;
  if (file === undefined || file === "-") {
    raw = await readStdin(stdin);
  } else {
    raw = await readFile(file, "utf8");
  }
  if (!raw.trim())
    throw new Error("empty input; provide a JSON workout on stdin or via --file");
  return parseJsonOrThrow<Workout>(
    raw,
    file === undefined || file === "-" ? "stdin" : file,
  );
}

function parseJsonOrThrow<T>(raw: string, source: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`invalid JSON from ${source}: ${msg}`);
  }
}
