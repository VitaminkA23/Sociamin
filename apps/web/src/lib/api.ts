export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

// In development the Vite proxy rewrites /api and /uploads → http://localhost:4000 so we
// use a relative URL. In production VITE_API_URL points to the Render backend.
export const API_BASE = (import.meta.env["VITE_API_URL"] as string | undefined) ?? "";

// Converts a relative /uploads/... path stored in the DB to an absolute URL so that
// Vercel (or any other frontend host) can load images from the Render backend.
export function toImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE}${path}`;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {};
  if (!(init.body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api${path}`, { ...init, headers });

  if (!res.ok) {
    let message = "Request failed";
    try {
      const body = (await res.json()) as { message?: string };
      if (typeof body.message === "string") message = body.message;
    } catch {
      // ignore JSON parse error
    }
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string): Promise<T> => request<T>(path),

  post: <T>(path: string, body?: unknown): Promise<T> => {
    const init: RequestInit = { method: "POST" };
    if (body !== undefined) {
      init.body = body instanceof FormData ? body : JSON.stringify(body);
    }
    return request<T>(path, init);
  },

  put: <T>(path: string, body?: unknown): Promise<T> => {
    const init: RequestInit = { method: "PUT" };
    if (body !== undefined) {
      init.body = body instanceof FormData ? body : JSON.stringify(body);
    }
    return request<T>(path, init);
  },

  patch: <T>(path: string, body?: unknown): Promise<T> => {
    const init: RequestInit = { method: "PATCH" };
    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }
    return request<T>(path, init);
  },

  delete: <T>(path: string): Promise<T> => request<T>(path, { method: "DELETE" }),
};
