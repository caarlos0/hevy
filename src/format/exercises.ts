import { renderTable } from "./table.js";

interface ExerciseLike {
  id?: string;
  title?: string;
  primary_muscle_group?: string;
  secondary_muscle_groups?: string[];
  type?: string;
  is_custom?: boolean;
}

export interface HistoryEntry {
  workout_id?: string;
  workout_title?: string;
  workout_start_time?: string;
  weight_kg?: number | null;
  reps?: number | null;
  duration_seconds?: number | null;
  distance_meters?: number | null;
  rpe?: number | null;
  set_type?: string;
}

export function formatExerciseList(items: ExerciseLike[]): string {
  if (items.length === 0) return "no exercises";
  const rows = items.map((e) => [
    e.id ?? "",
    e.title ?? "",
    e.primary_muscle_group ?? "",
    e.type ?? "",
    e.is_custom ? "yes" : "",
  ]);
  return renderTable(["ID", "TITLE", "MUSCLE", "TYPE", "CUSTOM"], rows);
}

export function formatExerciseDetail(e: ExerciseLike): string {
  const lines = [`${e.title ?? "(unknown)"}  (${e.id ?? "?"})`];
  if (e.type) lines.push(`type: ${e.type}`);
  if (e.primary_muscle_group) lines.push(`primary: ${e.primary_muscle_group}`);
  if (e.secondary_muscle_groups && e.secondary_muscle_groups.length > 0) {
    lines.push(`secondary: ${e.secondary_muscle_groups.join(", ")}`);
  }
  if (e.is_custom != null) lines.push(`custom: ${e.is_custom ? "yes" : "no"}`);
  return lines.join("\n");
}

export function formatHistoryList(items: HistoryEntry[]): string {
  if (items.length === 0) return "no history";
  const rows = items.map((h) => [
    h.workout_start_time ?? "",
    h.workout_title ?? "",
    h.weight_kg != null ? `${h.weight_kg}kg` : "",
    h.reps != null ? `${h.reps}` : "",
    h.set_type ?? "",
  ]);
  return renderTable(["DATE", "WORKOUT", "WEIGHT", "REPS", "SET"], rows);
}


