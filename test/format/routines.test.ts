import { describe, expect, it } from "vitest";
import { formatRoutineList, formatRoutine } from "../../src/format/routines.js";

const routine = {
  id: "r1",
  title: "Leg Day",
  folder_id: null,
  updated_at: "2026-04-01T10:00:00Z",
  exercises: [
    {
      title: "Squat",
      exercise_template_id: "ex1",
      sets: [
        { type: "normal", weight_kg: 100, reps: 5 },
        { type: "normal", weight_kg: 100, reps: 5 },
      ],
    },
  ],
};

describe("formatRoutineList", () => {
  it("renders a compact table", () => {
    const out = formatRoutineList([routine]);
    expect(out).toContain("r1");
    expect(out).toContain("Leg Day");
  });

  it("handles empty list", () => {
    expect(formatRoutineList([])).toMatch(/no routines/i);
  });
});

describe("formatRoutine", () => {
  it("renders title, id, and exercises with set counts", () => {
    const out = formatRoutine(routine);
    expect(out).toContain("Leg Day");
    expect(out).toContain("Squat");
    expect(out).toContain("2 sets");
  });
});
