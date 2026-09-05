// Helpers for turning API responses into API requests.
//
// The two directions are not symmetric, so a value read with GET cannot be
// written back untouched. Both helpers exist to close that gap.

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * The request keys accepted by an endpoint, at each level of the payload.
 */
export interface RequestKeys {
  top: readonly string[];
  exercise: readonly string[];
  set: readonly string[];
}

/**
 * Rebuild a routine or workout as a request body, keeping only `keys`.
 *
 * Request bodies must be built from an explicit allowlist. The API rejects
 * unknown keys outright:
 *
 *     400 Unrecognized key(s) in object: 'index', 'title'
 *
 * and GET responses carry read-only keys that POST/PUT do not accept —
 * `index` on exercises and sets, `title` on exercises, and `routine_id` on
 * workouts. A denylist would only postpone the problem to the next
 * response-only field the API adds.
 *
 * Values that are not objects are passed through untouched so that
 * hand-edited JSON fails with the API's error rather than a TypeError.
 */
export function toRequest(source: object, keys: RequestKeys): Record<string, unknown> {
  const body = pick(source as Record<string, unknown>, keys.top);
  const { exercises } = source as { exercises?: unknown };
  if (Array.isArray(exercises)) {
    body.exercises = exercises.map((ex: unknown) => {
      if (!isObject(ex)) return ex;
      const out = pick(ex, keys.exercise);
      if (Array.isArray(ex.sets)) {
        out.sets = ex.sets.map((set: unknown) => (isObject(set) ? pick(set, keys.set) : set));
      }
      return out;
    });
  }
  return body;
}

function pick(
  source: Record<string, unknown>,
  keys: readonly string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) if (key in source) out[key] = source[key];
  return out;
}

/**
 * Unwrap a single-key envelope, if present.
 *
 * Several endpoints wrap their payload in an envelope that the published
 * OpenAPI spec does not document, so the declared response type is a bare
 * object while the server sends `{ "routine": { ... } }`. Returns `res`
 * untouched when the envelope is absent, so it is correct either way.
 */
export function unwrap<T>(res: unknown, key: string): T {
  if (isObject(res) && isObject(res[key])) return res[key] as T;
  return res as T;
}
