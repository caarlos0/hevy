import { Readable } from "node:stream";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setApiKey } from "../../src/api/client.js";
import {
  countWorkouts,
  createWorkout,
  editWorkout,
  getWorkout,
  listWorkoutEvents,
  listWorkouts,
} from "../../src/commands/workouts.js";

const WORKOUT = {
  id: "w1",
  title: "Morning Lift",
  start_time: "2026-04-01T07:00:00Z",
  end_time: "2026-04-01T08:00:00Z",
  exercises: [
    {
      title: "Bench",
      exercise_template_id: "ex1",
      sets: [{ type: "normal", weight_kg: 100, reps: 5 }],
    },
  ],
};

const fetchMock = vi.fn();
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  setApiKey("k");
  fetchMock.mockReset();
});
afterEach(() => vi.restoreAllMocks());

describe("listWorkouts", () => {
  it("calls /v1/workouts with paging", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ page: 1, page_count: 1, workouts: [WORKOUT] }),
    );
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await listWorkouts({ page: 2, pageSize: 5, json: false });
    expect(String(fetchMock.mock.calls[0]![0])).toBe(
      "https://api.hevyapp.com/v1/workouts?page=2&pageSize=5",
    );
    expect(spy.mock.calls.join("")).toContain("Morning Lift");
  });
});

describe("getWorkout", () => {
  it("fetches and prints a single workout", async () => {
    fetchMock.mockResolvedValue(jsonResponse(WORKOUT));
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await getWorkout("w1", { json: false });
    expect(String(fetchMock.mock.calls[0]![0])).toBe(
      "https://api.hevyapp.com/v1/workouts/w1",
    );
    expect(spy.mock.calls.join("")).toContain("Morning Lift");
  });
});

describe("createWorkout", () => {
  it("POSTs JSON read from stdin wrapped in workout envelope", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ...WORKOUT, id: "w2" }, 201));
    const stdin = Readable.from([JSON.stringify(WORKOUT)]);
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await createWorkout({ json: true, stdin });
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toMatchObject({
      workout: { title: "Morning Lift" },
    });
  });
});

describe("editWorkout", () => {
  it("with --file -, reads stdin and PUTs", async () => {
    const updated = { ...WORKOUT, title: "Morning Lift v2" };
    fetchMock
      .mockResolvedValueOnce(jsonResponse(WORKOUT))
      .mockResolvedValueOnce(jsonResponse(updated));
    const stdin = Readable.from([JSON.stringify(updated)]);
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await editWorkout("w1", { file: "-", json: true, stdin });
    const putCall = fetchMock.mock.calls[1]!;
    expect((putCall[1] as RequestInit).method).toBe("PUT");
    expect(JSON.parse((putCall[1] as RequestInit).body as string)).toMatchObject({
      workout: { title: "Morning Lift v2" },
    });
  });
});

describe("countWorkouts", () => {
  it("prints '<n> workouts'", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ workout_count: 99 }));
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await countWorkouts({ json: false });
    expect(String(fetchMock.mock.calls[0]![0])).toBe(
      "https://api.hevyapp.com/v1/workouts/count",
    );
    expect(spy.mock.calls.join("")).toContain("99 workouts");
  });
});

describe("listWorkoutEvents", () => {
  it("passes since/page query params and renders both event types", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        page: 1,
        page_count: 1,
        events: [
          { type: "updated", workout: WORKOUT },
          { type: "deleted", id: "wd1", deleted_at: "2026-04-02T10:00:00Z" },
        ],
      }),
    );
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await listWorkoutEvents({ page: 1, pageSize: 5, since: "2026-04-01T00:00:00Z", json: false });
    expect(String(fetchMock.mock.calls[0]![0])).toBe(
      "https://api.hevyapp.com/v1/workouts/events?page=1&pageSize=5&since=2026-04-01T00%3A00%3A00Z",
    );
    const out = spy.mock.calls.join("");
    expect(out).toContain("updated");
    expect(out).toContain("deleted");
    expect(out).toContain("wd1");
  });
});
