import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "../../src/api/client.js";
import { createFolder, getFolder, listFolders } from "../../src/commands/folders.js";

const FOLDER = {
  id: 42,
  index: 1,
  title: "Push Pull 🏋️‍♂️",
  updated_at: "2026-04-01T10:00:00Z",
  created_at: "2026-03-01T10:00:00Z",
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

describe("listFolders", () => {
  it("calls /v1/routine_folders with paging and prints table", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ page: 1, page_count: 1, routine_folders: [FOLDER] }),
    );
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await listFolders(client, { page: 1, pageSize: 5, json: false });
    expect(String(fetchMock.mock.calls[0]![0])).toBe(
      "https://api.hevyapp.com/v1/routine_folders?page=1&pageSize=5",
    );
    expect(spy.mock.calls.join("")).toContain("Push Pull");
  });

  it("emits json envelope with --json", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ page: 1, page_count: 1, routine_folders: [FOLDER] }),
    );
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await listFolders(client, { json: true });
    expect(JSON.parse(spy.mock.calls.map((c) => c[0]).join(""))).toMatchObject({
      routine_folders: [{ id: 42 }],
    });
  });
});

describe("getFolder", () => {
  it("fetches a single folder and prints it", async () => {
    fetchMock.mockResolvedValue(jsonResponse(FOLDER));
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await getFolder(client, "42", { json: false });
    expect(String(fetchMock.mock.calls[0]![0])).toBe(
      "https://api.hevyapp.com/v1/routine_folders/42",
    );
    expect(spy.mock.calls.join("")).toContain("Push Pull");
  });

  it("emits raw folder JSON with --json", async () => {
    fetchMock.mockResolvedValue(jsonResponse(FOLDER));
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await getFolder(client, "42", { json: true });
    expect(JSON.parse(spy.mock.calls.map((c) => c[0]).join(""))).toMatchObject({
      id: 42,
    });
  });
});

describe("createFolder", () => {
  it("POSTs the title wrapped in routine_folder envelope", async () => {
    fetchMock.mockResolvedValue(jsonResponse(FOLDER, 201));
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await createFolder(client, { title: "Push Pull 🏋️‍♂️", json: true });
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      routine_folder: { title: "Push Pull 🏋️‍♂️" },
    });
    expect(JSON.parse(spy.mock.calls.map((c) => c[0]).join(""))).toMatchObject({
      id: 42,
    });
  });

  it("rejects empty/whitespace titles without calling the API", async () => {
    await expect(createFolder(client, { title: "   " })).rejects.toThrow(
      /title cannot be empty/i,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
