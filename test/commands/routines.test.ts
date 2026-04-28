import { Readable } from "node:stream";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setApiKey } from "../../src/api/client.js";
import { listRoutines, getRoutine, createRoutine, editRoutine } from "../../src/commands/routines.js";

const ROUTINE = {
  id: "r1",
  title: "Leg Day",
  folder_id: null,
  updated_at: "2026-04-01T10:00:00Z",
  exercises: [{ title: "Squat", exercise_template_id: "ex1", sets: [{ type: "normal", weight_kg: 100, reps: 5 }] }],
};

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

beforeEach(() => {
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  setApiKey("k");
  fetchMock.mockReset();
});
afterEach(() => vi.restoreAllMocks());

describe("listRoutines", () => {
  it("calls /v1/routines with paging and prints table", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ page: 1, page_count: 1, routines: [ROUTINE] }));
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await listRoutines({ page: 1, pageSize: 5, json: false });
    expect(String(fetchMock.mock.calls[0]![0])).toBe(
      "https://api.hevyapp.com/v1/routines?page=1&pageSize=5",
    );
    expect(spy.mock.calls.join("")).toContain("Leg Day");
  });

  it("emits json envelope with --json", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ page: 1, page_count: 1, routines: [ROUTINE] }));
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await listRoutines({ json: true });
    expect(JSON.parse(spy.mock.calls.map((c) => c[0]).join(""))).toMatchObject({
      routines: [{ id: "r1" }],
    });
  });
});

describe("getRoutine", () => {
  it("fetches a single routine and prints it", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ routine: ROUTINE }));
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await getRoutine("r1", { json: false });
    expect(String(fetchMock.mock.calls[0]![0])).toBe("https://api.hevyapp.com/v1/routines/r1");
    expect(spy.mock.calls.join("")).toContain("Leg Day");
  });

  it("emits raw routine JSON with --json", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ routine: ROUTINE }));
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await getRoutine("r1", { json: true });
    expect(JSON.parse(spy.mock.calls.map((c) => c[0]).join(""))).toMatchObject({ id: "r1" });
  });
});

describe("createRoutine", () => {
  it("POSTs body read from stdin and prints created routine", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ...ROUTINE, id: "r2" }, 201));
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const stdin = Readable.from([JSON.stringify(ROUTINE)]);
    await createRoutine({ json: true, stdin });
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toMatchObject({ routine: { title: "Leg Day" } });
    expect(JSON.parse(spy.mock.calls.map((c) => c[0]).join(""))).toMatchObject({ id: "r2" });
  });
});

describe("editRoutine", () => {
  it("with --file -, reads stdin and PUTs", async () => {
    const updated = { ...ROUTINE, title: "Leg Day v2" };
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ routine: ROUTINE }))
      .mockResolvedValueOnce(jsonResponse(updated));
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const stdin = Readable.from([JSON.stringify(updated)]);
    await editRoutine("r1", { file: "-", json: true, stdin });
    const putCall = fetchMock.mock.calls[1]!;
    expect((putCall[1] as RequestInit).method).toBe("PUT");
    expect(JSON.parse((putCall[1] as RequestInit).body as string)).toMatchObject({
      routine: { title: "Leg Day v2" },
    });
    expect(spy.mock.calls.join("")).toContain("Leg Day v2");
  });

  it("throws a clear error when stdin is invalid JSON", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ routine: ROUTINE }));
    const stdin = Readable.from(["not json"]);
    await expect(editRoutine("r1", { file: "-", json: true, stdin })).rejects.toThrow(
      /invalid JSON from stdin/i,
    );
  });
});
