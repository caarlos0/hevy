import type { Client } from "../api/client.js";
import {
  formatExerciseDetail,
  formatExerciseList,
  formatHistoryList,
  type HistoryEntry,
} from "../format/exercises.js";
import { writeJson } from "../io.js";

export const EXERCISE_TYPES = [
  "weight_reps",
  "reps_only",
  "bodyweight_reps",
  "bodyweight_assisted_reps",
  "duration",
  "weight_duration",
  "distance_duration",
  "short_distance_weight",
] as const;

export const EQUIPMENT_CATEGORIES = [
  "none",
  "barbell",
  "dumbbell",
  "kettlebell",
  "machine",
  "plate",
  "resistance_band",
  "suspension",
  "other",
] as const;

interface Template {
  id: string;
  title: string;
  type?: string;
  primary_muscle_group?: string;
  secondary_muscle_groups?: string[];
  is_custom?: boolean;
  equipment?: string;
}

interface ApiResponse {
  page: number;
  page_count: number;
  exercise_templates: Template[];
}

interface HistoryResponse {
  exercise_history: HistoryEntry[];
}

export async function listExercises(
  client: Client,
  opts: { page?: number; pageSize?: number; json?: boolean },
): Promise<void> {
  const data = await client.request<ApiResponse>("GET", "/v1/exercise_templates", {
    query: { page: opts.page, pageSize: opts.pageSize },
  });
  if (opts.json) {
    writeJson(data);
    return;
  }
  process.stdout.write(formatExerciseList(data.exercise_templates) + "\n");
}

export async function getExercise(
  client: Client,
  id: string,
  opts: { json?: boolean },
): Promise<void> {
  const tmpl = await client.request<Template>(
    "GET",
    `/v1/exercise_templates/${encodeURIComponent(id)}`,
  );
  if (opts.json) {
    writeJson(tmpl);
    return;
  }
  process.stdout.write(formatExerciseDetail(tmpl) + "\n");
}

export async function createCustomExercise(
  client: Client,
  opts: {
    title: string;
    type: string;
    equipment: string;
    muscle: string;
    otherMuscles?: string[];
    json?: boolean;
  },
): Promise<void> {
  const title = opts.title.trim();
  if (!title) throw new Error("exercise title cannot be empty");
  const exercise = {
    title,
    exercise_type: opts.type,
    equipment_category: opts.equipment,
    muscle_group: opts.muscle,
    other_muscles: opts.otherMuscles ?? [],
  };
  const created = await client.request<{ id: number }>(
    "POST",
    "/v1/exercise_templates",
    { body: { exercise } },
  );
  if (opts.json) writeJson(created);
  else process.stdout.write(`created exercise template id=${created.id}\n`);
}

export async function getExerciseHistory(
  client: Client,
  id: string,
  opts: { startDate?: string; endDate?: string; json?: boolean },
): Promise<void> {
  const data = await client.request<HistoryResponse>(
    "GET",
    `/v1/exercise_history/${encodeURIComponent(id)}`,
    { query: { start_date: opts.startDate, end_date: opts.endDate } },
  );
  if (opts.json) {
    writeJson(data);
    return;
  }
  process.stdout.write(formatHistoryList(data.exercise_history) + "\n");
}
