import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "../../src/api/client.js";
import { HevyError } from "../../src/api/errors.js";

describe("api client", () => {
  const fetchMock = vi.fn();
  const client = createClient({
    apiKey: "test-key",
    userAgent: "hevy-cli/test",
    fetchImpl: fetchMock as unknown as typeof fetch,
  });

  beforeEach(() => fetchMock.mockReset());
  afterEach(() => vi.restoreAllMocks());

  it("GETs with api-key + user-agent headers and returns parsed JSON", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const out = await client.request<{ ok: boolean }>("GET", "/v1/user/info");
    expect(out).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe("https://api.hevyapp.com/v1/user/info");
    expect((init as RequestInit).method).toBe("GET");
    expect((init as RequestInit).headers).toMatchObject({
      "api-key": "test-key",
      "user-agent": "hevy-cli/test",
    });
  });

  it("appends query params, skipping undefined", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200, headers: { "content-type": "application/json" } }));
    await client.request("GET", "/v1/routines", { query: { page: 1, pageSize: undefined, q: "leg day" } });
    expect(String(fetchMock.mock.calls[0]![0])).toBe(
      "https://api.hevyapp.com/v1/routines?page=1&q=leg+day",
    );
  });

  it("POSTs JSON body and sets content-type", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200, headers: { "content-type": "application/json" } }));
    await client.request("POST", "/v1/routines", { body: { name: "x" } });
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ name: "x" }));
    expect(init.headers).toMatchObject({ "content-type": "application/json" });
  });

  it("throws HevyError with parsed JSON body on non-2xx", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: "nope" }), {
        status: 401,
        statusText: "Unauthorized",
        headers: { "content-type": "application/json" },
      }),
    );
    await expect(client.request("GET", "/v1/user/info")).rejects.toMatchObject({
      name: "HevyError",
      status: 401,
      body: { error: "nope" },
    });
  });

  it("throws HevyError with text body when response is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("boom", { status: 500, statusText: "Server Error" }));
    await expect(client.request("GET", "/v1/user/info")).rejects.toBeInstanceOf(HevyError);
  });

  it("request() throws on 204 No Content", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(client.request("PUT", "/v1/routines/abc", { body: {} })).rejects.toThrow(
      /unexpected empty response/i,
    );
  });

  it("requestMaybe() returns null on 204 No Content", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const out = await client.requestMaybe("PUT", "/v1/routines/abc", { body: {} });
    expect(out).toBeNull();
  });
});
