import type { Readable } from "node:stream";
import { request } from "../api/client.js";
import { formatRoutine, formatRoutineList } from "../format/routines.js";
import { readJsonPayload, resolveEditPayload, writeJson } from "../io.js";

interface SetIn {
  type?: string;
  weight_kg?: number | null;
  reps?: number | null;
  duration_seconds?: number | null;
  rpe?: number | null;
  custom_metric?: number | null;
}

interface ExerciseIn {
  title: string;
  exercise_template_id: string;
  superset_id?: number | null;
  rest_seconds?: number | null;
  notes?: string;
  sets: SetIn[];
}

export interface Routine {
  id: string;
  title: string;
  folder_id: number | null;
  updated_at?: string;
  notes?: string;
  exercises: ExerciseIn[];
}

interface ListResponse {
  page: number;
  page_count: number;
  routines: Routine[];
}

interface GetSingleResponse {
  routine?: Routine;
}

export async function listRoutines(opts: {
  page?: number;
  pageSize?: number;
  json?: boolean;
}): Promise<void> {
  const data = await request<ListResponse>("GET", "/v1/routines", {
    query: { page: opts.page, pageSize: opts.pageSize },
  });
  if (opts.json) {
    writeJson(data);
    return;
  }
  process.stdout.write(formatRoutineList(data.routines) + "\n");
}

export async function getRoutine(
  id: string,
  opts: { json?: boolean },
): Promise<void> {
  const routine = await fetchRoutine(id);
  if (opts.json) {
    writeJson(routine);
    return;
  }
  process.stdout.write(formatRoutine(routine) + "\n");
}

export async function createRoutine(opts: {
  file?: string;
  json?: boolean;
  stdin?: Readable;
}): Promise<void> {
  const input = await readJsonPayload<Routine>(opts.file, opts.stdin, "routine");
  const created = await request<Routine>("POST", "/v1/routines", {
    body: { routine: input },
  });
  if (opts.json) writeJson(created);
  else process.stdout.write(formatRoutine(created) + "\n");
}

export async function editRoutine(
  id: string,
  opts: { file?: string; json?: boolean; stdin?: Readable },
): Promise<void> {
  const current = await fetchRoutine(id);
  const next = await resolveEditPayload<Routine>(current, opts, "routine.json", "routine");
  if (next === null) {
    process.stderr.write("no changes; aborting\n");
    return;
  }

  const updated = await request<Routine>(
    "PUT",
    `/v1/routines/${encodeURIComponent(id)}`,
    { body: { routine: next } },
  );
  if (opts.json) writeJson(updated);
  else process.stdout.write(formatRoutine(updated) + "\n");
}

async function fetchRoutine(id: string): Promise<Routine> {
  const data = await request<GetSingleResponse>(
    "GET",
    `/v1/routines/${encodeURIComponent(id)}`,
  );
  if (!data.routine) throw new Error(`routine ${id} not found in response`);
  return data.routine;
}


