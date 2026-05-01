import { HevyError } from "./errors.js";

const BASE_URL = "https://api.hevyapp.com";
let apiKey: string | null = null;

export function setApiKey(key: string): void {
  apiKey = key;
}

export interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

export async function request<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  if (!apiKey) {
    throw new Error("api key not set; call setApiKey() before request()");
  }

  const url = new URL(path, BASE_URL);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {
    "api-key": apiKey,
    accept: "application/json",
  };
  let body: string | undefined;
  if (opts.body !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  const res = await fetch(url, { method, headers, body });

  if (res.status === 204) return null as T;

  const ct = res.headers.get("content-type") ?? "";
  const isJson = ct.includes("application/json");
  const raw = await res.text();
  const parsed: unknown = isJson && raw ? safeParse(raw) : raw;

  if (!res.ok) {
    const message = extractMessage(parsed) ?? res.statusText ?? `HTTP ${res.status}`;
    throw new HevyError(res.status, message, parsed);
  }

  return parsed as T;
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

function extractMessage(body: unknown): string | undefined {
  if (typeof body === "string" && body.length > 0) return body;
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    if (typeof b.error === "string") return b.error;
    if (typeof b.message === "string") return b.message;
  }
  return undefined;
}
