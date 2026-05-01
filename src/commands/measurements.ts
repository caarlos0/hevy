import type { Readable } from "node:stream";
import type { Client } from "../api/client.js";
import { formatMeasurement, formatMeasurementList } from "../format/measurements.js";
import { readJsonPayload, resolveEditPayload, writeJson } from "../io.js";

export interface BodyMeasurement {
  date: string;
  weight_kg?: number | null;
  lean_mass_kg?: number | null;
  fat_percent?: number | null;
  neck_cm?: number | null;
  shoulder_cm?: number | null;
  chest_cm?: number | null;
  left_bicep_cm?: number | null;
  right_bicep_cm?: number | null;
  left_forearm_cm?: number | null;
  right_forearm_cm?: number | null;
  abdomen?: number | null;
  waist?: number | null;
  hips?: number | null;
  left_thigh?: number | null;
  right_thigh?: number | null;
  left_calf?: number | null;
  right_calf?: number | null;
}

interface ListResponse {
  page: number;
  page_count: number;
  body_measurements: BodyMeasurement[];
}

export async function listMeasurements(
  client: Client,
  opts: { page?: number; pageSize?: number; json?: boolean },
): Promise<void> {
  const data = await client.request<ListResponse>("GET", "/v1/body_measurements", {
    query: { page: opts.page, pageSize: opts.pageSize },
  });
  if (opts.json) {
    writeJson(data);
    return;
  }
  process.stdout.write(formatMeasurementList(data.body_measurements) + "\n");
}

export async function getMeasurement(
  client: Client,
  date: string,
  opts: { json?: boolean },
): Promise<void> {
  const m = await client.request<BodyMeasurement>(
    "GET",
    `/v1/body_measurements/${encodeURIComponent(date)}`,
  );
  if (opts.json) {
    writeJson(m);
    return;
  }
  process.stdout.write(formatMeasurement(m) + "\n");
}

export async function createMeasurement(
  client: Client,
  opts: { file?: string; json?: boolean; stdin?: Readable },
): Promise<void> {
  const input = await readJsonPayload<BodyMeasurement>(opts.file, opts.stdin, "body measurement");
  const created = await client.requestMaybe<BodyMeasurement>(
    "POST",
    "/v1/body_measurements",
    { body: input },
  );
  if (opts.json) writeJson(created ?? input);
  else process.stdout.write(formatMeasurement(created ?? input) + "\n");
}

export async function editMeasurement(
  client: Client,
  date: string,
  opts: { file?: string; json?: boolean; stdin?: Readable },
): Promise<void> {
  const current = await client.request<BodyMeasurement>(
    "GET",
    `/v1/body_measurements/${encodeURIComponent(date)}`,
  );
  const next = await resolveEditPayload<BodyMeasurement>(
    current,
    opts,
    "measurement.json",
    "body measurement",
  );
  if (next === null) {
    process.stderr.write("no changes; aborting\n");
    return;
  }

  const body: Record<string, unknown> = { ...next };
  delete body.date;
  const updated = await client.requestMaybe<BodyMeasurement>(
    "PUT",
    `/v1/body_measurements/${encodeURIComponent(date)}`,
    { body },
  );
  if (opts.json) writeJson(updated ?? { ...next, date });
  else process.stdout.write(formatMeasurement(updated ?? { ...next, date }) + "\n");
}
