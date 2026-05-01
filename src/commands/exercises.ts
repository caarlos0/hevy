import { request } from "../api/client.js";
import {
  formatExerciseDetail,
  formatExerciseList,
  formatHistoryList,
  type HistoryEntry,
} from "../format/exercises.js";
import { writeJson } from "../io.js";

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

export async function listExercises(opts: {
  page?: number;
  pageSize?: number;
  search?: string;
  json?: boolean;
}): Promise<void> {
  if (opts.search) {
    const needle = opts.search.toLowerCase();
    const all: Template[] = [];
    let page = 1;
    let pageCount = 1;
    do {
      const data = await request<ApiResponse>("GET", "/v1/exercise_templates", {
        query: { page, pageSize: opts.pageSize },
      });
      all.push(...data.exercise_templates);
      pageCount = data.page_count;
      page++;
    } while (page <= pageCount);
    const items = all.filter((e) => e.title.toLowerCase().includes(needle));
    if (opts.json) {
      writeJson({ page: 1, page_count: 1, exercise_templates: items });
      return;
    }
    process.stdout.write(formatExerciseList(items) + "\n");
    return;
  }

  const data = await request<ApiResponse>("GET", "/v1/exercise_templates", {
    query: { page: opts.page, pageSize: opts.pageSize },
  });
  if (opts.json) {
    writeJson(data);
    return;
  }
  process.stdout.write(formatExerciseList(data.exercise_templates) + "\n");
}

export async function getExercise(
  id: string,
  opts: { json?: boolean },
): Promise<void> {
  const tmpl = await request<Template>(
    "GET",
    `/v1/exercise_templates/${encodeURIComponent(id)}`,
  );
  if (opts.json) {
    writeJson(tmpl);
    return;
  }
  process.stdout.write(formatExerciseDetail(tmpl) + "\n");
}

export async function createCustomExercise(opts: {
  title: string;
  type: string;
  equipment: string;
  muscle: string;
  otherMuscles?: string[];
  json?: boolean;
}): Promise<void> {
  const title = opts.title.trim();
  if (!title) throw new Error("exercise title cannot be empty");
  const exercise = {
    title,
    exercise_type: opts.type,
    equipment_category: opts.equipment,
    muscle_group: opts.muscle,
    other_muscles: opts.otherMuscles ?? [],
  };
  const created = await request<{ id: number }>(
    "POST",
    "/v1/exercise_templates",
    { body: { exercise } },
  );
  if (opts.json) writeJson(created);
  else process.stdout.write(`created exercise template id=${created.id}\n`);
}

export async function getExerciseHistory(
  id: string,
  opts: { startDate?: string; endDate?: string; json?: boolean },
): Promise<void> {
  const data = await request<HistoryResponse>(
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
