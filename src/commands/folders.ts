import type { Client } from "../api/client.js";
import { formatFolder, formatFolderList } from "../format/folders.js";
import { writeJson } from "../io.js";

export interface RoutineFolder {
  id: number;
  index: number;
  title: string;
  updated_at?: string;
  created_at?: string;
}

interface ListResponse {
  page: number;
  page_count: number;
  routine_folders: RoutineFolder[];
}

export async function listFolders(
  client: Client,
  opts: { page?: number; pageSize?: number; json?: boolean },
): Promise<void> {
  const data = await client.request<ListResponse>("GET", "/v1/routine_folders", {
    query: { page: opts.page, pageSize: opts.pageSize },
  });
  if (opts.json) {
    writeJson(data);
    return;
  }
  process.stdout.write(formatFolderList(data.routine_folders) + "\n");
}

export async function getFolder(
  client: Client,
  id: string,
  opts: { json?: boolean },
): Promise<void> {
  const folder = await client.request<RoutineFolder>(
    "GET",
    `/v1/routine_folders/${encodeURIComponent(id)}`,
  );
  if (opts.json) {
    writeJson(folder);
    return;
  }
  process.stdout.write(formatFolder(folder) + "\n");
}

export async function createFolder(
  client: Client,
  opts: { title: string; json?: boolean },
): Promise<void> {
  const title = opts.title.trim();
  if (!title) throw new Error("folder title cannot be empty");
  const created = await client.request<RoutineFolder>("POST", "/v1/routine_folders", {
    body: { routine_folder: { title } },
  });
  if (opts.json) writeJson(created);
  else process.stdout.write(formatFolder(created) + "\n");
}
