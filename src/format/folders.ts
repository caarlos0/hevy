interface FolderLike {
  id?: number;
  index?: number;
  title?: string;
  updated_at?: string;
  created_at?: string;
}

export function formatFolderList(folders: FolderLike[]): string {
  if (folders.length === 0) return "no folders";
  const rows = folders.map((f) => [
    f.id != null ? String(f.id) : "",
    f.index != null ? String(f.index) : "",
    f.title ?? "",
    f.updated_at ?? "",
  ]);
  return renderTable(["ID", "INDEX", "TITLE", "UPDATED"], rows);
}

export function formatFolder(f: FolderLike): string {
  const lines = [`${f.title ?? "(untitled)"}  (${f.id ?? "?"})`];
  if (f.index != null) lines.push(`index: ${f.index}`);
  if (f.created_at) lines.push(`created: ${f.created_at}`);
  if (f.updated_at) lines.push(`updated: ${f.updated_at}`);
  return lines.join("\n");
}

function renderTable(headers: string[], rows: string[][]): string {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] ?? "").length)),
  );
  const fmt = (cells: string[]) =>
    cells.map((c, i) => c.padEnd(widths[i]!)).join("  ").trimEnd();
  return [fmt(headers), ...rows.map(fmt)].join("\n");
}
