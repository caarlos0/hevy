import { readFile } from "node:fs/promises";
import type { Readable } from "node:stream";
import { request } from "../api/client.js";
import { editJson } from "../editor.js";
import { formatRoutine, formatRoutineList } from "../format/routines.js";
import { readStdin, stdinIsTTY, writeJson } from "../io.js";

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
  folder_id: string | null;
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
  const input = await readPayload(opts.file, opts.stdin);
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
  let next: Routine;

  if (opts.file !== undefined) {
    next = await readPayload(opts.file, opts.stdin);
  } else if (!stdinIsTTY()) {
    next = parseJsonOrThrow<Routine>(await readStdin(opts.stdin), "stdin");
  } else {
    const result = await editJson<Routine>(current);
    if (!result.edited) {
      process.stderr.write("no changes; aborting\n");
      return;
    }
    next = result.value;
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

async function readPayload(
  file: string | undefined,
  stdin: Readable | undefined,
): Promise<Routine> {
  let raw: string;
  if (file === undefined || file === "-") {
    raw = await readStdin(stdin);
  } else {
    raw = await readFile(file, "utf8");
  }
  if (!raw.trim())
    throw new Error(
      "empty input; provide a JSON routine on stdin or via --file",
    );
  return parseJsonOrThrow<Routine>(raw, file === undefined || file === "-" ? "stdin" : file);
}

function parseJsonOrThrow<T>(raw: string, source: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`invalid JSON from ${source}: ${msg}`);
  }
}
