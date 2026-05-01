import { Readable } from "node:stream";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "../../src/api/client.js";
import { createRoutine, editRoutine, getRoutine, listRoutines } from "../../src/commands/routines.js";

const ROUTINE = {
  id: "r1",
  title: "Leg Day",
  folder_id: null,
  updated_at: "2026-04-01T10:00:00Z",
  created_at: "2026-03-01T10:00:00Z",
  exercises: [
    {
      title: "Squat",
      exercise_template_id: "ex1",
      sets: [{ type: "normal", weight_kg: 100, reps: 5 }],
    },
  ],
};

const fetchMock = vi.fn();
const client = createClient({
  apiKey: "k",
  userAgent: "hevy-cli/test",
  fetchImpl: fetchMock as unknown as typeof fetch,
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => fetchMock.mockReset());
afterEach(() => vi.restoreAllMocks());

describe("listRoutines", () => {
  it("calls /v1/routines with paging and prints table", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ page: 1, page_count: 1, routines: [ROUTINE] }));
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await listRoutines(client, { page: 1, pageSize: 5, json: false });
    expect(String(fetchMock.mock.calls[0]![0])).toBe(
      "https://api.hevyapp.com/v1/routines?page=1&pageSize=5",
    );
    expect(spy.mock.calls.join("")).toContain("Leg Day");
  });

  it("emits json envelope with --json", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ page: 1, page_count: 1, routines: [ROUTINE] }));
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await listRoutines(client, { json: true });
    expect(JSON.parse(spy.mock.calls.map((c) => c[0]).join(""))).toMatchObject({
      routines: [{ id: "r1" }],
    });
  });
});

describe("getRoutine", () => {
  it("fetches a single routine and prints it", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ routine: ROUTINE }));
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await getRoutine(client, "r1", { json: false });
    expect(String(fetchMock.mock.calls[0]![0])).toBe("https://api.hevyapp.com/v1/routines/r1");
    expect(spy.mock.calls.join("")).toContain("Leg Day");
  });

  it("emits raw routine JSON with --json", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ routine: ROUTINE }));
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await getRoutine(client, "r1", { json: true });
    expect(JSON.parse(spy.mock.calls.map((c) => c[0]).join(""))).toMatchObject({ id: "r1" });
  });
});

describe("createRoutine", () => {
  it("POSTs body read from stdin and strips server-managed fields", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ...ROUTINE, id: "r2" }, 201));
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const stdin = Readable.from([JSON.stringify(ROUTINE)]);
    await createRoutine(client, { json: true, stdin });
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(init.method).toBe("POST");
    const sent = JSON.parse(init.body as string) as { routine: Record<string, unknown> };
    expect(sent).toMatchObject({ routine: { title: "Leg Day" } });
    expect(sent.routine).not.toHaveProperty("id");
    expect(sent.routine).not.toHaveProperty("updated_at");
    expect(sent.routine).not.toHaveProperty("created_at");
    expect(JSON.parse(spy.mock.calls.map((c) => c[0]).join(""))).toMatchObject({ id: "r2" });
  });
});

describe("editRoutine", () => {
  it("with --file -, reads stdin and PUTs without server-managed fields", async () => {
    const updated = { ...ROUTINE, title: "Leg Day v2" };
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ routine: ROUTINE }))
      .mockResolvedValueOnce(jsonResponse(updated));
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const stdin = Readable.from([JSON.stringify(updated)]);
    await editRoutine(client, "r1", { file: "-", json: true, stdin });
    const putCall = fetchMock.mock.calls[1]!;
    expect((putCall[1] as RequestInit).method).toBe("PUT");
    const sent = JSON.parse((putCall[1] as RequestInit).body as string) as {
      routine: Record<string, unknown>;
    };
    expect(sent).toMatchObject({ routine: { title: "Leg Day v2" } });
    expect(sent.routine).not.toHaveProperty("id");
    expect(sent.routine).not.toHaveProperty("updated_at");
    expect(sent.routine).not.toHaveProperty("created_at");
    expect(spy.mock.calls.join("")).toContain("Leg Day v2");
  });

  it("throws a clear error when stdin is invalid JSON", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ routine: ROUTINE }));
    const stdin = Readable.from(["not json"]);
    await expect(editRoutine(client, "r1", { file: "-", json: true, stdin })).rejects.toThrow(
      /invalid JSON from stdin/i,
    );
  });
});
