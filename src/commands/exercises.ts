import { request } from "../api/client.js";
import { formatExerciseList } from "../format/exercises.js";
import { writeJson } from "../io.js";

interface Template {
  id: string;
  title: string;
  primary_muscle_group?: string;
  equipment?: string;
}

interface ApiResponse {
  page: number;
  page_count: number;
  exercise_templates: Template[];
}

export async function listExercises(opts: {
  page?: number;
  pageSize?: number;
  search?: string;
  json?: boolean;
}): Promise<void> {
  const data = await request<ApiResponse>("GET", "/v1/exercise_templates", {
    query: { page: opts.page, pageSize: opts.pageSize },
  });
  let items = data.exercise_templates;
  if (opts.search) {
    const needle = opts.search.toLowerCase();
    items = items.filter((e) => e.title.toLowerCase().includes(needle));
  }
  if (opts.json) {
    writeJson({ ...data, exercise_templates: items });
    return;
  }
  process.stdout.write(formatExerciseList(items) + "\n");
}
