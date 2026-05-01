import { describe, expect, it } from "vitest";
import { formatFolder, formatFolderList } from "../../src/format/folders.js";

const folder = {
  id: 42,
  index: 1,
  title: "Push Pull 🏋️‍♂️",
  updated_at: "2026-04-01T10:00:00Z",
  created_at: "2026-03-01T10:00:00Z",
};

describe("formatFolderList", () => {
  it("renders a compact table", () => {
    const out = formatFolderList([folder]);
    expect(out).toContain("42");
    expect(out).toContain("Push Pull");
  });

  it("handles empty list", () => {
    expect(formatFolderList([])).toMatch(/no folders/i);
  });
});

describe("formatFolder", () => {
  it("renders title, id, index, and timestamps", () => {
    const out = formatFolder(folder);
    expect(out).toContain("Push Pull");
    expect(out).toContain("42");
    expect(out).toContain("index: 1");
    expect(out).toContain("created:");
    expect(out).toContain("updated:");
  });

  it("tolerates missing fields", () => {
    const out = formatFolder({ title: "Bare" });
    expect(out).toContain("Bare");
    expect(out).toContain("(?)");
  });
});
