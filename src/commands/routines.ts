import type { Readable } from "node:stream";
import type { Client } from "../api/client.js";
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

const SERVER_FIELDS = ["id", "updated_at", "created_at"] as const;

function stripServerFields(routine: Routine): Omit<Routine, "id" | "updated_at" | "created_at"> {
  const copy: Record<string, unknown> = { ...routine };
  for (const f of SERVER_FIELDS) delete copy[f];
  return copy as Omit<Routine, "id" | "updated_at" | "created_at">;
}

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
  opts: { file?: string; json?: boolean; stdin?: Readable },
): Promise<void> {
  const input = await readJsonPayload<Routine>(opts.file, opts.stdin, "routine");
  const created = await client.request<Routine>("POST", "/v1/routines", {
    body: { routine: stripServerFields(input) },
  });
  if (opts.json) writeJson(created);
  else process.stdout.write(formatRoutine(created) + "\n");
}

export async function editRoutine(
  client: Client,
  id: string,
  opts: { file?: string; json?: boolean; stdin?: Readable },
): Promise<void> {
  const current = await fetchRoutine(client, id);
  const next = await resolveEditPayload<Routine>(current, opts, "routine.json", "routine");
  if (next === null) {
    process.stderr.write("no changes; aborting\n");
    return;
  }

  const updated = await client.request<Routine>(
    "PUT",
    `/v1/routines/${encodeURIComponent(id)}`,
    { body: { routine: stripServerFields(next) } },
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
