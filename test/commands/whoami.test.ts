import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { whoami } from "../../src/commands/whoami.js";
import { setApiKey } from "../../src/api/client.js";

describe("whoami", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    setApiKey("k");
    fetchMock.mockReset();
  });
  afterEach(() => vi.restoreAllMocks());

  it("prints human summary by default", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: { id: "u1", name: "carlos" } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await whoami({ json: false });
    expect(spy.mock.calls.map((c) => c[0]).join("")).toContain("carlos (u1)");
    spy.mockRestore();
  });

  it("emits raw JSON with --json (unwraps `data` envelope)", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: { id: "u1", name: "carlos" } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await whoami({ json: true });
    const out = spy.mock.calls.map((c) => c[0]).join("");
    expect(JSON.parse(out)).toEqual({ id: "u1", name: "carlos" });
    spy.mockRestore();
  });
});
