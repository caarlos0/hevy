import { renderTable } from "./table.js";

interface SetLike { type?: string; weight_kg?: number | null; reps?: number | null; duration_seconds?: number | null }
interface ExerciseLike { title: string; sets: SetLike[] }
interface RoutineLike {
  id: string;
  title: string;
  folder_id?: number | null;
  updated_at?: string;
  exercises: ExerciseLike[];
}

export function formatRoutineList(routines: RoutineLike[]): string {
  if (routines.length === 0) return "no routines";
  const rows = routines.map((r) => [
    r.id,
    r.title,
    r.folder_id != null ? String(r.folder_id) : "",
    String(r.exercises.length),
    r.updated_at ?? "",
  ]);
  return renderTable(["ID", "TITLE", "FOLDER", "EXERCISES", "UPDATED"], rows);
}

export function formatRoutine(r: RoutineLike): string {
  const lines = [`${r.title}  (${r.id})`];
  if (r.folder_id != null) lines.push(`folder: ${r.folder_id}`);
  if (r.updated_at) lines.push(`updated: ${r.updated_at}`);
  lines.push("");
  for (const ex of r.exercises) {
    lines.push(`• ${ex.title} — ${ex.sets.length} sets`);
    for (const s of ex.sets) lines.push(`    ${formatSet(s)}`);
  }
  return lines.join("\n");
}

function formatSet(s: SetLike): string {
  const parts: string[] = [];
  if (s.weight_kg != null) parts.push(`${s.weight_kg}kg`);
  if (s.reps != null) parts.push(`${s.reps} reps`);
  if (s.duration_seconds != null) parts.push(`${s.duration_seconds}s`);
  if (parts.length === 0) parts.push("—");
  if (s.type && s.type !== "normal") parts.push(`(${s.type})`);
  return parts.join(" × ");
}


