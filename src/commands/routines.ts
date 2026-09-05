import type { Readable } from "node:stream";
import type { Client } from "../api/client.js";
import { toRequest, unwrap, type RequestKeys } from "../api/payload.js";
import { formatRoutine, formatRoutineList } from "../format/routines.js";
import { emitDryRun, readJsonPayload, resolveEditPayload, writeJson } from "../io.js";
import { validateRoutine } from "../validate.js";

interface SetIn {
  type?: string;
  weight_kg?: number | null;
  reps?: number | null;
  duration_seconds?: number | null;
  rpe?: number | null;
  custom_metric?: number | null;
}

interface ExerciseIn {
  // Read-only: the API returns it on GET but rejects it on POST/PUT.
  title?: string;
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
  created_at?: string;
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

// Keys accepted by POST /v1/routines and PUT /v1/routines/{id}. Everything
// else a GET returns (`id`, `updated_at`, `created_at`, exercise `index` and
// `title`, set `index`) is rejected with a 400, so a `get | create`
// round-trip only works if we send exactly these.
const REQUEST_KEYS: RequestKeys = {
  top: ["title", "folder_id", "notes"],
  exercise: ["exercise_template_id", "superset_id", "rest_seconds", "notes"],
  set: [
    "type",
    "weight_kg",
    "reps",
    "distance_meters",
    "duration_seconds",
    "custom_metric",
    "rep_range",
  ],
};

export async function listRoutines(
  client: Client,
  opts: { page?: number; pageSize?: number; json?: boolean },
): Promise<void> {
  const data = await client.request<ListResponse>("GET", "/v1/routines", {
    query: { page: opts.page, pageSize: opts.pageSize },
  });
  if (opts.json) {
    writeJson(data);
    return;
  }
  process.stdout.write(formatRoutineList(data.routines) + "\n");
}

export async function getRoutine(
  client: Client,
  id: string,
  opts: { json?: boolean },
): Promise<void> {
  const routine = await fetchRoutine(client, id);
  if (opts.json) {
    writeJson(routine);
    return;
  }
  process.stdout.write(formatRoutine(routine) + "\n");
}

export async function createRoutine(
  client: Client,
  opts: { file?: string; json?: boolean; stdin?: Readable; dryRun?: boolean },
): Promise<void> {
  const input = await readJsonPayload<Routine>(opts.file, opts.stdin, "routine");
  if (opts.dryRun) {
    emitDryRun(validateRoutine(input), "routine", opts.json);
    return;
  }
  const created = unwrap<Routine>(
    await client.request<unknown>("POST", "/v1/routines", {
      body: { routine: toRequest(input, REQUEST_KEYS) },
    }),
    "routine",
  );
  if (opts.json) writeJson(created);
  else process.stdout.write(formatRoutine(created) + "\n");
}

export async function editRoutine(
  client: Client,
  id: string,
  opts: { file?: string; json?: boolean; stdin?: Readable; dryRun?: boolean },
): Promise<void> {
  if (opts.dryRun && opts.file !== undefined) {
    const input = await readJsonPayload<Routine>(opts.file, opts.stdin, "routine");
    emitDryRun(validateRoutine(input), "routine", opts.json);
    return;
  }

  const current = await fetchRoutine(client, id);
  const next = await resolveEditPayload<Routine>(current, opts, "routine.json", "routine");
  if (next === null) {
    process.stderr.write("no changes; aborting\n");
    return;
  }

  if (opts.dryRun) {
    emitDryRun(validateRoutine(next), "routine", opts.json);
    return;
  }

  const updated = unwrap<Routine>(
    await client.request<unknown>(
      "PUT",
      `/v1/routines/${encodeURIComponent(id)}`,
      { body: { routine: toRequest(next, REQUEST_KEYS) } },
    ),
    "routine",
  );
  if (opts.json) writeJson(updated);
  else process.stdout.write(formatRoutine(updated) + "\n");
}

async function fetchRoutine(client: Client, id: string): Promise<Routine> {
  const data = await client.request<GetSingleResponse>(
    "GET",
    `/v1/routines/${encodeURIComponent(id)}`,
  );
  if (!data.routine) throw new Error(`routine ${id} not found in response`);
  return data.routine;
}
