import { describe, expect, it } from "vitest";
import { formatUser } from "../../src/format/user.js";

describe("formatUser", () => {
  it("renders name and id", () => {
    expect(formatUser({ id: "u1", name: "carlos" })).toBe("carlos (u1)");
  });

  it("includes the profile url when present", () => {
    expect(formatUser({ id: "u1", name: "carlos", url: "https://hevy.com/user/carlos" })).toBe(
      "carlos (u1) — https://hevy.com/user/carlos",
    );
  });

  it("handles missing fields gracefully", () => {
    expect(formatUser({})).toBe("(unknown) ((no id))");
  });
});
