// Structural, dependency-free validators for create/edit payloads.
//
// These are intentionally *partial* and *best-effort*: the goal is to catch
// the realistic failure modes in a hand-edited JSON payload before we POST
// it. Server-side rules (unknown exercise template IDs, account-tier limits,
// the exact Joi schema) are not — and cannot — be reproduced here without an
// official schema or a "validate-only" endpoint. See the issue #8 plan for
// the full rationale.

export interface ValidationIssue {
  path: string; // e.g. "exercises[0].sets[1].reps"
  message: string; // e.g. "must be a non-negative number"
}

export type ValidationResult =
  | { ok: true }
  | { ok: false; issues: ValidationIssue[] };

// --- small helpers ---
const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === "string";
const isNullableNum = (v: unknown): boolean => v === null || v === undefined || isNum(v);
const isNullableStr = (v: unknown): boolean => v === null || v === undefined || isStr(v);

// Accept anything Date.parse() accepts that *looks* like an ISO datetime
// ("YYYY-MM-DDTHH:MM:SS" prefix). Trailing timezone is optional — we have no
// confirmation from the API docs that it is required, and a strict regex
// here would produce false positives on otherwise-valid payloads.
function looksLikeIsoDateTime(v: unknown): v is string {
  if (!isStr(v)) return false;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v)) return false;
  return !Number.isNaN(Date.parse(v));
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Same idea as looksLikeIsoDateTime, but for a date-only "YYYY-MM-DD". The
// Date.parse guard rejects impossible values (month 13, day 45) that a
// format-only regex would wave through.
function looksLikeIsoDate(v: unknown): v is string {
  if (!isStr(v)) return false;
  if (!ISO_DATE.test(v)) return false;
  return !Number.isNaN(Date.parse(v));
}

function push(issues: ValidationIssue[], path: string, message: string): void {
  issues.push({ path, message });
}

// --- workout ---
export function validateWorkout(input: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];
  if (!isObject(input)) {
    return { ok: false, issues: [{ path: "$", message: "must be a JSON object" }] };
  }
  if (!isStr(input.title) || input.title.trim() === "")
    push(issues, "title", "is required and must be a non-empty string");
  if (!looksLikeIsoDateTime(input.start_time))
    push(issues, "start_time", "is required and must be an ISO-8601 datetime string");
  if (!looksLikeIsoDateTime(input.end_time))
    push(issues, "end_time", "is required and must be an ISO-8601 datetime string");
  if (
    isStr(input.start_time) &&
    isStr(input.end_time) &&
    !Number.isNaN(Date.parse(input.start_time)) &&
    !Number.isNaN(Date.parse(input.end_time)) &&
    Date.parse(input.end_time) < Date.parse(input.start_time)
  )
    push(issues, "end_time", "must be at or after start_time");
  if (!isNullableStr(input.description))
    push(issues, "description", "must be a string or null");
  if (input.is_private !== undefined && typeof input.is_private !== "boolean")
    push(issues, "is_private", "must be a boolean");
  if (input.routine_id !== undefined && input.routine_id !== null && !isStr(input.routine_id))
    push(issues, "routine_id", "must be a string or null");

  validateExercises(input.exercises, issues, /*requireTitle*/ false, /*allowDistance*/ true, /*allowRest*/ false);
  return issues.length === 0 ? { ok: true } : { ok: false, issues };
}

// --- routine ---
export function validateRoutine(input: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];
  if (!isObject(input))
    return { ok: false, issues: [{ path: "$", message: "must be a JSON object" }] };
  if (!isStr(input.title) || input.title.trim() === "")
    push(issues, "title", "is required and must be a non-empty string");

  // Routine.folder_id is `number | null` (REQUIRED key) per the TS type.
  if (!("folder_id" in input))
    push(issues, "folder_id", "is required (use null for no folder)");
  else if (input.folder_id !== null && !isNum(input.folder_id))
    push(issues, "folder_id", "must be a number or null");

  // notes is typed `string | undefined`, but a GET round-trip commonly
  // returns `null`. Accept null defensively to avoid false positives.
  if (!isNullableStr(input.notes))
    push(issues, "notes", "must be a string or null");

  validateExercises(input.exercises, issues, /*requireTitle*/ true, /*allowDistance*/ false, /*allowRest*/ true);
  return issues.length === 0 ? { ok: true } : { ok: false, issues };
}

// --- measurement ---
const MEASUREMENT_NUMERIC_FIELDS = [
  "weight_kg", "lean_mass_kg", "fat_percent",
  "neck_cm", "shoulder_cm", "chest_cm",
  "left_bicep_cm", "right_bicep_cm", "left_forearm_cm", "right_forearm_cm",
  "abdomen", "waist", "hips",
  "left_thigh", "right_thigh", "left_calf", "right_calf",
] as const;

export function validateMeasurement(
  input: unknown,
  opts: { requireDate?: boolean } = {},
): ValidationResult {
  const { requireDate = true } = opts;
  const issues: ValidationIssue[] = [];
  if (!isObject(input))
    return { ok: false, issues: [{ path: "$", message: "must be a JSON object" }] };
  // On `edit`, the record is keyed by the URL date and the body `date` is
  // stripped before the request, so it is neither required nor validated.
  if (requireDate && !looksLikeIsoDate(input.date))
    push(issues, "date", "is required and must be a valid YYYY-MM-DD date");

  let anyNumeric = false;
  for (const f of MEASUREMENT_NUMERIC_FIELDS) {
    const v = (input as Record<string, unknown>)[f];
    if (v === undefined || v === null) continue;
    if (!isNum(v) || v < 0) push(issues, f, "must be a non-negative number");
    else anyNumeric = true;
  }
  if (!anyNumeric)
    push(issues, "$", "at least one measurement field must be provided");
  return issues.length === 0 ? { ok: true } : { ok: false, issues };
}

// --- shared ---
function validateExercises(
  exercises: unknown,
  issues: ValidationIssue[],
  requireTitle: boolean,
  allowDistance: boolean,
  allowRest: boolean,
): void {
  if (!Array.isArray(exercises) || exercises.length === 0) {
    push(issues, "exercises", "is required and must be a non-empty array");
    return;
  }
  exercises.forEach((ex, i) => {
    const base = `exercises[${i}]`;
    if (!isObject(ex)) { push(issues, base, "must be an object"); return; }
    if (!isStr(ex.exercise_template_id) || ex.exercise_template_id.trim() === "")
      push(issues, `${base}.exercise_template_id`, "is required and must be a string");
    if (requireTitle && (!isStr(ex.title) || ex.title.trim() === ""))
      push(issues, `${base}.title`, "is required and must be a non-empty string");
    if (ex.superset_id !== undefined && ex.superset_id !== null && !isNum(ex.superset_id))
      push(issues, `${base}.superset_id`, "must be a number or null");
    if (!isNullableStr(ex.notes))
      push(issues, `${base}.notes`, "must be a string or null");
    if (allowRest && !isNullableNum(ex.rest_seconds))
      push(issues, `${base}.rest_seconds`, "must be a number or null");
    if (!Array.isArray(ex.sets) || ex.sets.length === 0) {
      push(issues, `${base}.sets`, "is required and must be a non-empty array");
      return;
    }
    ex.sets.forEach((s, j) => {
      const sb = `${base}.sets[${j}]`;
      if (!isObject(s)) { push(issues, sb, "must be an object"); return; }
      // Set `type` accepts any non-empty string. Tightening to an explicit
      // enum is deferred until the real list is confirmed against the API.
      if (s.type !== undefined && (!isStr(s.type) || s.type.trim() === ""))
        push(issues, `${sb}.type`, "must be a non-empty string");
      for (const k of ["weight_kg", "reps", "duration_seconds", "custom_metric", "rpe"] as const)
        if (!isNullableNum((s as Record<string, unknown>)[k]))
          push(issues, `${sb}.${k}`, "must be a number or null");
      if (allowDistance && !isNullableNum((s as Record<string, unknown>).distance_meters))
        push(issues, `${sb}.distance_meters`, "must be a number or null");
      // No range check on rpe — legacy exports may contain values >10 and we
      // have no proof the server caps it.
    });
  });
}

// Convenience: format a failure for stderr (used by the CLI).
export function formatValidationFailure(kind: string, issues: ValidationIssue[]): string {
  const lines = [
    `✗ ${kind} payload failed validation (${issues.length} issue${issues.length === 1 ? "" : "s"}):`,
  ];
  for (const i of issues) lines.push(`  - ${i.path}: ${i.message}`);
  return lines.join("\n") + "\n";
}
