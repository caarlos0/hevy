import { renderTable } from "./table.js";

interface MeasurementLike {
  date?: string;
  weight_kg?: number | null;
  lean_mass_kg?: number | null;
  fat_percent?: number | null;
  neck_cm?: number | null;
  shoulder_cm?: number | null;
  chest_cm?: number | null;
  left_bicep_cm?: number | null;
  right_bicep_cm?: number | null;
  left_forearm_cm?: number | null;
  right_forearm_cm?: number | null;
  abdomen?: number | null;
  waist?: number | null;
  hips?: number | null;
  left_thigh?: number | null;
  right_thigh?: number | null;
  left_calf?: number | null;
  right_calf?: number | null;
}

const FIELDS: Array<[keyof MeasurementLike, string]> = [
  ["weight_kg", "weight (kg)"],
  ["lean_mass_kg", "lean mass (kg)"],
  ["fat_percent", "fat %"],
  ["neck_cm", "neck (cm)"],
  ["shoulder_cm", "shoulder (cm)"],
  ["chest_cm", "chest (cm)"],
  ["left_bicep_cm", "L bicep (cm)"],
  ["right_bicep_cm", "R bicep (cm)"],
  ["left_forearm_cm", "L forearm (cm)"],
  ["right_forearm_cm", "R forearm (cm)"],
  ["abdomen", "abdomen"],
  ["waist", "waist"],
  ["hips", "hips"],
  ["left_thigh", "L thigh"],
  ["right_thigh", "R thigh"],
  ["left_calf", "L calf"],
  ["right_calf", "R calf"],
];

export function formatMeasurementList(entries: MeasurementLike[]): string {
  if (entries.length === 0) return "no measurements";
  const rows = entries.map((m) => [
    m.date ?? "",
    m.weight_kg != null ? String(m.weight_kg) : "",
    m.fat_percent != null ? String(m.fat_percent) : "",
    m.lean_mass_kg != null ? String(m.lean_mass_kg) : "",
  ]);
  return renderTable(["DATE", "WEIGHT", "FAT%", "LEAN"], rows);
}

export function formatMeasurement(m: MeasurementLike): string {
  const lines = [m.date ?? "(no date)"];
  for (const [key, label] of FIELDS) {
    const v = m[key];
    if (v != null) lines.push(`  ${label}: ${v}`);
  }
  return lines.join("\n");
}


