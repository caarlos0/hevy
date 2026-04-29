import { describe, expect, it } from "vitest";
import {
  formatMeasurement,
  formatMeasurementList,
} from "../../src/format/measurements.js";

const M = {
  date: "2026-04-01",
  weight_kg: 80.5,
  fat_percent: 18.2,
  lean_mass_kg: 65,
  chest_cm: 100,
};

describe("formatMeasurementList", () => {
  it("renders date/weight/fat/lean columns", () => {
    const out = formatMeasurementList([M]);
    expect(out).toContain("2026-04-01");
    expect(out).toContain("80.5");
    expect(out).toContain("18.2");
    expect(out).toContain("65");
  });
  it("handles empty", () => {
    expect(formatMeasurementList([])).toMatch(/no measurements/i);
  });
});

describe("formatMeasurement", () => {
  it("renders date and present fields only", () => {
    const out = formatMeasurement(M);
    expect(out).toContain("2026-04-01");
    expect(out).toContain("weight (kg): 80.5");
    expect(out).toContain("chest (cm): 100");
    expect(out).not.toContain("waist");
  });
});
