import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "../../src/api/client.js";
import { whoami } from "../../src/commands/whoami.js";

const fetchMock = vi.fn();
const client = createClient({
  apiKey: "k",
  userAgent: "hevy-cli/test",
  fetchImpl: fetchMock as unknown as typeof fetch,
});

beforeEach(() => fetchMock.mockReset());
afterEach(() => vi.restoreAllMocks());

describe("whoami", () => {
  it("prints human summary by default", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: { id: "u1", name: "carlos" } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await whoami(client, { json: false });
    expect(spy.mock.calls.map((c) => c[0]).join("")).toContain("carlos (u1)");
  });

  it("emits raw JSON with --json (unwraps `data` envelope)", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: { id: "u1", name: "carlos" } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await whoami(client, { json: true });
    const out = spy.mock.calls.map((c) => c[0]).join("");
    expect(JSON.parse(out)).toEqual({ id: "u1", name: "carlos" });
  });
});
