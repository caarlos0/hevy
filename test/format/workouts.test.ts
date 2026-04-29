import { describe, expect, it } from "vitest";
import {
  formatEventList,
  formatWorkout,
  formatWorkoutList,
} from "../../src/format/workouts.js";

const W = {
  id: "w1",
  title: "Morning Lift",
  start_time: "2026-04-01T07:00:00Z",
  end_time: "2026-04-01T08:00:00Z",
  exercises: [
    {
      title: "Bench",
      sets: [
        { type: "normal", weight_kg: 100, reps: 5 },
        { type: "warmup", weight_kg: 60, reps: 8 },
      ],
    },
  ],
};

describe("formatWorkoutList", () => {
  it("renders compact table", () => {
    const out = formatWorkoutList([W]);
    expect(out).toContain("w1");
    expect(out).toContain("Morning Lift");
  });
  it("handles empty", () => {
    expect(formatWorkoutList([])).toMatch(/no workouts/i);
  });
});

describe("formatWorkout", () => {
  it("renders title, dates, and exercises", () => {
    const out = formatWorkout(W);
    expect(out).toContain("Morning Lift");
    expect(out).toContain("Bench");
    expect(out).toContain("2 sets");
    expect(out).toContain("(warmup)");
  });
});

describe("formatEventList", () => {
  it("renders both updated and deleted rows", () => {
    const out = formatEventList([
      { type: "updated", workout: W },
      { type: "deleted", id: "wd1", deleted_at: "2026-04-02T10:00:00Z" },
    ]);
    expect(out).toContain("updated");
    expect(out).toContain("deleted");
    expect(out).toContain("wd1");
    expect(out).toContain("Morning Lift");
  });
  it("handles empty", () => {
    expect(formatEventList([])).toMatch(/no events/i);
  });
});
