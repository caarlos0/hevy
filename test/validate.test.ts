import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  validateMeasurement,
  validateRoutine,
  validateWorkout,
} from "../src/validate.js";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

async function fixture(name: string): Promise<unknown> {
  const raw = await readFile(`${repoRoot}examples/${name}`, "utf8");
  return JSON.parse(raw);
}

describe("validateWorkout", () => {
  it("accepts the example workout fixture", async () => {
    const result = validateWorkout(await fixture("workout.json"));
    expect(result).toEqual({ ok: true });
  });

  it("ignores server-managed fields (id/created_at/updated_at)", async () => {
    const base = (await fixture("workout.json")) as Record<string, unknown>;
    const result = validateWorkout({
      ...base,
      id: "abc",
      created_at: "2026-05-02T12:00:00Z",
      updated_at: "2026-05-02T12:00:00Z",
    });
    expect(result).toEqual({ ok: true });
  });

  it.each([
    ["string", "not an object"],
    ["array", []],
    ["null", null],
  ])("rejects non-object input (%s)", (_label, input) => {
    const result = validateWorkout(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0]!.path).toBe("$");
  });

  it("fails when title is missing or empty", () => {
    const r1 = validateWorkout({ start_time: "2026-05-02T12:00:00Z", end_time: "2026-05-02T13:00:00Z", exercises: [] });
    const r2 = validateWorkout({ title: "   ", start_time: "2026-05-02T12:00:00Z", end_time: "2026-05-02T13:00:00Z", exercises: [] });
    expect(r1.ok).toBe(false);
    expect(r2.ok).toBe(false);
    if (!r1.ok) expect(r1.issues.some((i) => i.path === "title")).toBe(true);
  });

  it("fails when start_time is a pure date (no time component)", () => {
    const r = validateWorkout({
      title: "x",
      start_time: "2026-05-02",
      end_time: "2026-05-02T13:00:00Z",
      exercises: [{ exercise_template_id: "t", sets: [{}] }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.some((i) => i.path === "start_time")).toBe(true);
  });

  it("accepts ISO datetimes without a timezone", () => {
    const r = validateWorkout({
      title: "x",
      start_time: "2026-05-02T12:00:00",
      end_time: "2026-05-02T13:00:00",
      exercises: [{ exercise_template_id: "t", sets: [{}] }],
    });
    expect(r).toEqual({ ok: true });
  });

  it("fails when end_time is before start_time", () => {
    const r = validateWorkout({
      title: "x",
      start_time: "2026-05-02T13:00:00Z",
      end_time: "2026-05-02T12:00:00Z",
      exercises: [{ exercise_template_id: "t", sets: [{}] }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.some((i) => i.path === "end_time")).toBe(true);
  });

  it("fails when is_private is not boolean", () => {
    const r = validateWorkout({
      title: "x",
      start_time: "2026-05-02T12:00:00Z",
      end_time: "2026-05-02T13:00:00Z",
      is_private: "no",
      exercises: [{ exercise_template_id: "t", sets: [{}] }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.some((i) => i.path === "is_private")).toBe(true);
  });

  it("fails when exercises is empty or missing", () => {
    const r1 = validateWorkout({ title: "x", start_time: "2026-05-02T12:00:00Z", end_time: "2026-05-02T13:00:00Z" });
    const r2 = validateWorkout({ title: "x", start_time: "2026-05-02T12:00:00Z", end_time: "2026-05-02T13:00:00Z", exercises: [] });
    expect(r1.ok).toBe(false);
    expect(r2.ok).toBe(false);
  });

  it("fails when exercise_template_id is missing", () => {
    const r = validateWorkout({
      title: "x",
      start_time: "2026-05-02T12:00:00Z",
      end_time: "2026-05-02T13:00:00Z",
      exercises: [{ sets: [{}] }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok)
      expect(r.issues.some((i) => i.path === "exercises[0].exercise_template_id")).toBe(true);
  });

  it("fails when sets is empty", () => {
    const r = validateWorkout({
      title: "x",
      start_time: "2026-05-02T12:00:00Z",
      end_time: "2026-05-02T13:00:00Z",
      exercises: [{ exercise_template_id: "t", sets: [] }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.some((i) => i.path === "exercises[0].sets")).toBe(true);
  });

  it("fails when set.weight_kg is a string", () => {
    const r = validateWorkout({
      title: "x",
      start_time: "2026-05-02T12:00:00Z",
      end_time: "2026-05-02T13:00:00Z",
      exercises: [{ exercise_template_id: "t", sets: [{ weight_kg: "100" }] }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok)
      expect(r.issues.some((i) => i.path === "exercises[0].sets[0].weight_kg")).toBe(true);
  });

  it("rejects empty-string set.type but accepts any non-empty string", () => {
    const empty = validateWorkout({
      title: "x",
      start_time: "2026-05-02T12:00:00Z",
      end_time: "2026-05-02T13:00:00Z",
      exercises: [{ exercise_template_id: "t", sets: [{ type: "" }] }],
    });
    const custom = validateWorkout({
      title: "x",
      start_time: "2026-05-02T12:00:00Z",
      end_time: "2026-05-02T13:00:00Z",
      exercises: [{ exercise_template_id: "t", sets: [{ type: "drop_set" }] }],
    });
    expect(empty.ok).toBe(false);
    expect(custom).toEqual({ ok: true });
  });

  it("accepts rpe > 10 (no range check) and rejects rpe as string", () => {
    const high = validateWorkout({
      title: "x",
      start_time: "2026-05-02T12:00:00Z",
      end_time: "2026-05-02T13:00:00Z",
      exercises: [{ exercise_template_id: "t", sets: [{ rpe: 11 }] }],
    });
    const str = validateWorkout({
      title: "x",
      start_time: "2026-05-02T12:00:00Z",
      end_time: "2026-05-02T13:00:00Z",
      exercises: [{ exercise_template_id: "t", sets: [{ rpe: "9" }] }],
    });
    expect(high).toEqual({ ok: true });
    expect(str.ok).toBe(false);
  });

  it("aggregates multiple issues", () => {
    const r = validateWorkout({ title: "", exercises: [] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.length).toBeGreaterThanOrEqual(2);
  });
});

describe("validateRoutine", () => {
  it("accepts the example routine fixture", async () => {
    expect(validateRoutine(await fixture("routine.json"))).toEqual({ ok: true });
  });

  it("fails when title is missing", () => {
    const r = validateRoutine({ folder_id: null, exercises: [{ title: "t", exercise_template_id: "x", sets: [{}] }] });
    expect(r.ok).toBe(false);
  });

  it("fails when folder_id key is entirely absent", () => {
    const r = validateRoutine({ title: "x", exercises: [{ title: "t", exercise_template_id: "x", sets: [{}] }] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.some((i) => i.path === "folder_id")).toBe(true);
  });

  it("accepts folder_id: null", () => {
    const r = validateRoutine({
      title: "x",
      folder_id: null,
      exercises: [{ title: "t", exercise_template_id: "x", sets: [{}] }],
    });
    expect(r).toEqual({ ok: true });
  });

  it('rejects folder_id: "abc"', () => {
    const r = validateRoutine({
      title: "x",
      folder_id: "abc",
      exercises: [{ title: "t", exercise_template_id: "x", sets: [{}] }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.some((i) => i.path === "folder_id")).toBe(true);
  });

  it("accepts notes: null (server round-trip)", () => {
    const r = validateRoutine({
      title: "x",
      folder_id: null,
      notes: null,
      exercises: [{ title: "t", exercise_template_id: "x", sets: [{}] }],
    });
    expect(r).toEqual({ ok: true });
  });

  it("rejects notes: 123", () => {
    const r = validateRoutine({
      title: "x",
      folder_id: null,
      notes: 123,
      exercises: [{ title: "t", exercise_template_id: "x", sets: [{}] }],
    });
    expect(r.ok).toBe(false);
  });

  it("requires exercise.title in routines", () => {
    const r = validateRoutine({
      title: "x",
      folder_id: null,
      exercises: [{ exercise_template_id: "x", sets: [{}] }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.some((i) => i.path === "exercises[0].title")).toBe(true);
  });

  it("rejects exercise.rest_seconds as string", () => {
    const r = validateRoutine({
      title: "x",
      folder_id: null,
      exercises: [{ title: "t", exercise_template_id: "x", rest_seconds: "180", sets: [{}] }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.some((i) => i.path === "exercises[0].rest_seconds")).toBe(true);
  });

  it("rejects empty sets[]", () => {
    const r = validateRoutine({
      title: "x",
      folder_id: null,
      exercises: [{ title: "t", exercise_template_id: "x", sets: [] }],
    });
    expect(r.ok).toBe(false);
  });
});

describe("validateMeasurement", () => {
  it("accepts the example measurement fixture", async () => {
    expect(validateMeasurement(await fixture("measurement.json"))).toEqual({ ok: true });
  });

  it("fails when date is missing", () => {
    const r = validateMeasurement({ weight_kg: 80 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.some((i) => i.path === "date")).toBe(true);
  });

  it('fails when date uses "2026/05/02"', () => {
    const r = validateMeasurement({ date: "2026/05/02", weight_kg: 80 });
    expect(r.ok).toBe(false);
  });

  it.each(["2024-13-45", "2026-00-10", "2026-01-32", "0000-00-00"])(
    "rejects impossible date %s",
    (date) => {
      expect(validateMeasurement({ date, weight_kg: 80 }).ok).toBe(false);
    },
  );

  it("rejects negative weight_kg", () => {
    const r = validateMeasurement({ date: "2026-05-02", weight_kg: -3 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.some((i) => i.path === "weight_kg")).toBe(true);
  });

  it("rejects weight_kg as string", () => {
    const r = validateMeasurement({ date: "2026-05-02", weight_kg: "80" });
    expect(r.ok).toBe(false);
  });

  it("requires at least one numeric field", () => {
    const r = validateMeasurement({ date: "2026-05-02" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.some((i) => i.message.includes("at least one"))).toBe(true);
  });
});
