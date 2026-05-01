import { HevyError } from "./errors.js";

const BASE_URL = "https://api.hevyapp.com";

export type Method = "GET" | "POST" | "PUT" | "DELETE";

export interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

export interface Client {
  /** Performs a request and parses the JSON body. Throws if the server returns 204 No Content. */
  request<T>(method: Method, path: string, opts?: RequestOptions): Promise<T>;
  /** Like request, but returns null when the server returns 204 No Content. */
  requestMaybe<T>(method: Method, path: string, opts?: RequestOptions): Promise<T | null>;
}

export interface ClientOptions {
  apiKey: string;
  userAgent: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export function createClient(opts: ClientOptions): Client {
  const baseUrl = opts.baseUrl ?? BASE_URL;
  const f = opts.fetchImpl ?? fetch;

  async function doRequest<T>(
    method: Method,
    path: string,
    reqOpts: RequestOptions = {},
  ): Promise<T | null> {
    const url = new URL(path, baseUrl);
    if (reqOpts.query) {
      for (const [k, v] of Object.entries(reqOpts.query)) {
        if (v !== undefined) url.searchParams.set(k, String(v));
      }
    }

    const headers: Record<string, string> = {
      "api-key": opts.apiKey,
      "user-agent": opts.userAgent,
      accept: "application/json",
    };
    let body: string | undefined;
    if (reqOpts.body !== undefined) {
      headers["content-type"] = "application/json";
      body = JSON.stringify(reqOpts.body);
    }

    const res = await f(url, { method, headers, body });

    if (res.status === 204) return null;

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

  return {
    async request<T>(method: Method, path: string, reqOpts?: RequestOptions): Promise<T> {
      const result = await doRequest<T>(method, path, reqOpts);
      if (result === null) {
        throw new Error(`unexpected empty response from ${method} ${path}`);
      }
      return result;
    },
    requestMaybe: doRequest,
  };
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
