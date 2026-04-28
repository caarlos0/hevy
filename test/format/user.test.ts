import { describe, expect, it } from "vitest";
import { formatUser } from "../../src/format/user.js";

describe("formatUser", () => {
  it("renders username and id", () => {
    expect(formatUser({ id: "u1", username: "carlos" })).toBe("carlos (u1)");
  });
});
