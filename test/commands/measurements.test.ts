import { Readable } from "node:stream";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setApiKey } from "../../src/api/client.js";
import {
  createMeasurement,
  editMeasurement,
  getMeasurement,
  listMeasurements,
} from "../../src/commands/measurements.js";

const M = {
  date: "2026-04-01",
  weight_kg: 80.5,
  fat_percent: 18.2,
  lean_mass_kg: 65,
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

describe("listMeasurements", () => {
  it("calls /v1/body_measurements and prints table", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ page: 1, page_count: 1, body_measurements: [M] }),
    );
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await listMeasurements({ page: 1, json: false });
    expect(String(fetchMock.mock.calls[0]![0])).toBe(
      "https://api.hevyapp.com/v1/body_measurements?page=1",
    );
    const out = spy.mock.calls.join("");
    expect(out).toContain("2026-04-01");
    expect(out).toContain("80.5");
  });
});

describe("getMeasurement", () => {
  it("fetches by date", async () => {
    fetchMock.mockResolvedValue(jsonResponse(M));
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await getMeasurement("2026-04-01", { json: false });
    expect(String(fetchMock.mock.calls[0]![0])).toBe(
      "https://api.hevyapp.com/v1/body_measurements/2026-04-01",
    );
    expect(spy.mock.calls.join("")).toContain("80.5");
  });
});

describe("createMeasurement", () => {
  it("POSTs body without envelope", async () => {
    fetchMock.mockResolvedValue(jsonResponse(null));
    const stdin = Readable.from([JSON.stringify(M)]);
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await createMeasurement({ json: true, stdin });
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual(M);
  });
});

describe("editMeasurement", () => {
  it("PUTs to /body_measurements/<date> with date stripped from body", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(M))
      .mockResolvedValueOnce(jsonResponse(null));
    const next = { ...M, weight_kg: 81 };
    const stdin = Readable.from([JSON.stringify(next)]);
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await editMeasurement("2026-04-01", { file: "-", json: true, stdin });
    const putCall = fetchMock.mock.calls[1]!;
    expect(String(putCall[0])).toBe(
      "https://api.hevyapp.com/v1/body_measurements/2026-04-01",
    );
    const body = JSON.parse((putCall[1] as RequestInit).body as string);
    expect(body).not.toHaveProperty("date");
    expect(body).toMatchObject({ weight_kg: 81 });
  });
});
