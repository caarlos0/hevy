interface ExerciseLike {
  id: string;
  title: string;
  primary_muscle_group?: string;
  equipment?: string;
}

export function formatExerciseList(items: ExerciseLike[]): string {
  if (items.length === 0) return "no exercises";
  const rows = items.map((e) => [e.id, e.title, e.primary_muscle_group ?? "", e.equipment ?? ""]);
  return renderTable(["ID", "TITLE", "MUSCLE", "EQUIPMENT"], rows);
}

function renderTable(headers: string[], rows: string[][]): string {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] ?? "").length)),
  );
  const fmt = (cells: string[]) =>
    cells.map((c, i) => c.padEnd(widths[i]!)).join("  ").trimEnd();
  return [fmt(headers), ...rows.map(fmt)].join("\n");
}
