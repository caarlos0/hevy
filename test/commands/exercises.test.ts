import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setApiKey } from "../../src/api/client.js";
import {
  createCustomExercise,
  getExercise,
  getExerciseHistory,
  listExercises,
} from "../../src/commands/exercises.js";

const fetchMock = vi.fn();
beforeEach(() => {
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  setApiKey("k");
  fetchMock.mockReset();
});
afterEach(() => vi.restoreAllMocks());

describe("listExercises", () => {
  it("fetches templates and prints table", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          page: 1,
          page_count: 1,
          exercise_templates: [
            { id: "e1", title: "Squat", primary_muscle_group: "legs", equipment: "barbell" },
            { id: "e2", title: "Bench", primary_muscle_group: "chest", equipment: "barbell" },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await listExercises({ json: false });
    const out = spy.mock.calls.map((c) => c[0]).join("");
    expect(out).toContain("Squat");
    expect(out).toContain("Bench");
  });

  it("filters client-side when --search is given", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          page: 1,
          page_count: 1,
          exercise_templates: [
            { id: "e1", title: "Squat", primary_muscle_group: "legs" },
            { id: "e2", title: "Bench Press", primary_muscle_group: "chest" },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await listExercises({ search: "bench", json: false });
    const out = spy.mock.calls.map((c) => c[0]).join("");
    expect(out).toContain("Bench Press");
    expect(out).not.toContain("Squat");
  });
});

describe("getExercise", () => {
  it("fetches by id and prints detail", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "e1",
          title: "Squat",
          type: "weight_reps",
          primary_muscle_group: "quadriceps",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await getExercise("e1", { json: false });
    expect(String(fetchMock.mock.calls[0]![0])).toBe(
      "https://api.hevyapp.com/v1/exercise_templates/e1",
    );
    expect(spy.mock.calls.join("")).toContain("Squat");
  });
});

describe("createCustomExercise", () => {
  it("POSTs custom exercise body and prints created id", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 123 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await createCustomExercise({
      title: "Bulgarian Split Squat",
      type: "weight_reps",
      equipment: "dumbbell",
      muscle: "quadriceps",
      otherMuscles: ["glutes", "hamstrings"],
      json: false,
    });
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      exercise: {
        title: "Bulgarian Split Squat",
        exercise_type: "weight_reps",
        equipment_category: "dumbbell",
        muscle_group: "quadriceps",
        other_muscles: ["glutes", "hamstrings"],
      },
    });
    expect(spy.mock.calls.join("")).toContain("id=123");
  });

  it("rejects empty title", async () => {
    await expect(
      createCustomExercise({
        title: "  ",
        type: "weight_reps",
        equipment: "dumbbell",
        muscle: "quadriceps",
      }),
    ).rejects.toThrow(/title cannot be empty/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("getExerciseHistory", () => {
  it("calls /v1/exercise_history/<id> with date range", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          exercise_history: [
            {
              workout_id: "w1",
              workout_title: "Push Day",
              workout_start_time: "2026-04-01T07:00:00Z",
              weight_kg: 100,
              reps: 5,
              set_type: "normal",
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await getExerciseHistory("e1", {
      startDate: "2026-01-01T00:00:00Z",
      endDate: "2026-12-31T23:59:59Z",
      json: false,
    });
    expect(String(fetchMock.mock.calls[0]![0])).toBe(
      "https://api.hevyapp.com/v1/exercise_history/e1?start_date=2026-01-01T00%3A00%3A00Z&end_date=2026-12-31T23%3A59%3A59Z",
    );
    const out = spy.mock.calls.join("");
    expect(out).toContain("Push Day");
    expect(out).toContain("100kg");
  });
});
