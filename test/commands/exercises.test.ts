import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setApiKey } from "../../src/api/client.js";
import { listExercises } from "../../src/commands/exercises.js";

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
