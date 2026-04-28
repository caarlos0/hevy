import { describe, expect, it } from "vitest";
import { formatExerciseList } from "../../src/format/exercises.js";

describe("formatExerciseList", () => {
  it("renders id, title, and primary muscle", () => {
    const out = formatExerciseList([
      { id: "e1", title: "Squat", primary_muscle_group: "legs", type: "weight_reps" },
    ]);
    expect(out).toContain("e1");
    expect(out).toContain("Squat");
    expect(out).toContain("legs");
  });

  it("handles empty list", () => {
    expect(formatExerciseList([])).toMatch(/no exercises/i);
  });
});
