import { renderTable } from "./table.js";

interface SetLike {
  index?: number;
  type?: string;
  weight_kg?: number | null;
  reps?: number | null;
  duration_seconds?: number | null;
  distance_meters?: number | null;
  rpe?: number | null;
  custom_metric?: number | null;
}
interface ExerciseLike {
  index?: number;
  title?: string;
  notes?: string | null;
  exercise_template_id?: string;
  supersets_id?: number | null;
  sets?: SetLike[];
}
interface WorkoutLike {
  id?: string;
  title?: string;
  routine_id?: string;
  description?: string | null;
  start_time?: string;
  end_time?: string;
  updated_at?: string;
  created_at?: string;
  exercises?: ExerciseLike[];
}

export function formatWorkoutList(workouts: WorkoutLike[]): string {
  if (workouts.length === 0) return "no workouts";
  const rows = workouts.map((w) => [
    w.id ?? "",
    w.title ?? "",
    w.start_time ?? "",
    String(w.exercises?.length ?? 0),
  ]);
  return renderTable(["ID", "TITLE", "START", "EXERCISES"], rows);
}

export function formatWorkout(w: WorkoutLike): string {
  const lines = [`${w.title ?? "(untitled)"}  (${w.id ?? "?"})`];
  if (w.start_time) lines.push(`start: ${w.start_time}`);
  if (w.end_time) lines.push(`end: ${w.end_time}`);
  if (w.routine_id) lines.push(`routine: ${w.routine_id}`);
  if (w.description) lines.push(`description: ${w.description}`);
  lines.push("");
  for (const ex of w.exercises ?? []) {
    lines.push(`• ${ex.title ?? "(unknown)"} — ${ex.sets?.length ?? 0} sets`);
    for (const s of ex.sets ?? []) lines.push(`    ${formatSet(s)}`);
  }
  return lines.join("\n");
}

export type WorkoutEvent =
  | { type: "updated"; workout: WorkoutLike }
  | { type: "deleted"; id: string; deleted_at?: string };

export function formatEventList(events: WorkoutEvent[]): string {
  if (events.length === 0) return "no events";
  const rows = events.map((e) => {
    if (e.type === "deleted") {
      return ["deleted", e.id ?? "", e.deleted_at ?? "", ""];
    }
    return [
      "updated",
      e.workout.id ?? "",
      e.workout.updated_at ?? "",
      e.workout.title ?? "",
    ];
  });
  return renderTable(["TYPE", "ID", "AT", "TITLE"], rows);
}

function formatSet(s: SetLike): string {
  const parts: string[] = [];
  if (s.weight_kg != null) parts.push(`${s.weight_kg}kg`);
  if (s.reps != null) parts.push(`${s.reps} reps`);
  if (s.duration_seconds != null) parts.push(`${s.duration_seconds}s`);
  if (s.distance_meters != null) parts.push(`${s.distance_meters}m`);
  if (parts.length === 0) parts.push("—");
  if (s.type && s.type !== "normal") parts.push(`(${s.type})`);
  if (s.rpe != null) parts.push(`rpe ${s.rpe}`);
  return parts.join(" × ");
}


