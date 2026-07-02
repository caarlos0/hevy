import { Readable } from "node:stream";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "../../src/api/client.js";
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

describe("listMeasurements", () => {
  it("calls /v1/body_measurements and prints table", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ page: 1, page_count: 1, body_measurements: [M] }),
    );
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await listMeasurements(client, { page: 1, json: false });
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
    await getMeasurement(client, "2026-04-01", { json: false });
    expect(String(fetchMock.mock.calls[0]![0])).toBe(
      "https://api.hevyapp.com/v1/body_measurements/2026-04-01",
    );
    expect(spy.mock.calls.join("")).toContain("80.5");
  });
});

describe("createMeasurement", () => {
  it("POSTs body without envelope and tolerates 204", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const stdin = Readable.from([JSON.stringify(M)]);
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await createMeasurement(client, { json: true, stdin });
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual(M);
  });
});

describe("editMeasurement", () => {
  it("PUTs to /body_measurements/<date> with date stripped from body", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(M))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const next = { ...M, weight_kg: 81 };
    const stdin = Readable.from([JSON.stringify(next)]);
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await editMeasurement(client, "2026-04-01", { file: "-", json: true, stdin });
    const putCall = fetchMock.mock.calls[1]!;
    expect(String(putCall[0])).toBe(
      "https://api.hevyapp.com/v1/body_measurements/2026-04-01",
    );
    const body = JSON.parse((putCall[1] as RequestInit).body as string);
    expect(body).not.toHaveProperty("date");
    expect(body).toMatchObject({ weight_kg: 81 });
  });

  it("dry-run with --file: no API call and date preserved through validation", async () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const stdin = Readable.from([JSON.stringify(M)]);
    await editMeasurement(client, "2026-04-01", { file: "-", json: false, stdin, dryRun: true });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(spy.mock.calls.join("")).toContain("body measurement payload is valid");
  });

  it("dry-run with --file accepts a payload without a date (URL date is authoritative)", async () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const stdin = Readable.from([JSON.stringify({ weight_kg: 81 })]);
    await editMeasurement(client, "2026-04-01", { file: "-", json: false, stdin, dryRun: true });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(spy.mock.calls.join("")).toContain("body measurement payload is valid");
  });

  it("dry-run without --file performs GET but skips PUT", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(M));
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const stdin = Readable.from([JSON.stringify({ ...M, weight_kg: 81 })]);
    Object.assign(stdin, { isTTY: false });
    await editMeasurement(client, "2026-04-01", { json: false, stdin, dryRun: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls.join("")).toContain("body measurement payload is valid");
  });

  it("dry-run propagates GET errors (no 'valid' on 404)", async () => {
    fetchMock.mockResolvedValueOnce(new Response("not found", { status: 404 }));
    const stdin = Readable.from([JSON.stringify(M)]);
    Object.assign(stdin, { isTTY: false });
    await expect(
      editMeasurement(client, "2026-04-01", { json: false, stdin, dryRun: true }),
    ).rejects.toThrow();
  });
});

describe("createMeasurement dry-run", () => {
  it("valid: no API call", async () => {
    const out = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const stdin = Readable.from([JSON.stringify(M)]);
    await createMeasurement(client, { json: false, stdin, dryRun: true });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(out.mock.calls.join("")).toContain("✓ body measurement payload is valid");
  });

  it("invalid: stderr + exitCode=1", async () => {
    const err = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const stdin = Readable.from([JSON.stringify({ date: "2026/04/01" })]);
    await createMeasurement(client, { json: false, stdin, dryRun: true });
    expect(err.mock.calls.join("")).toContain("✗ body measurement payload failed validation");
    expect(process.exitCode).toBe(1);
    process.exitCode = 0;
  });
});
