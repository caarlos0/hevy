import type { Readable } from "node:stream";
import { request } from "../api/client.js";
import {
  formatEventList,
  formatWorkout,
  formatWorkoutList,
  type WorkoutEvent,
} from "../format/workouts.js";
import { readJsonPayload, resolveEditPayload, writeJson } from "../io.js";

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
  const input = await readJsonPayload<Workout>(opts.file, opts.stdin, "workout");
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
  const next = await resolveEditPayload<Workout>(current, opts, "workout.json", "workout");
  if (next === null) {
    process.stderr.write("no changes; aborting\n");
    return;
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


