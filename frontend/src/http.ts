import { AUTH_EXPIRED_EVENT, ApiError, friendlyMessage } from "./errors";
import { clearToken, getToken } from "./session";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "/api";

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(0, "NETWORK", "Couldn't reach the server. Check your connection.");
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;

    const unreachable = [502, 503, 504].includes(res.status);
    const fallback = unreachable ? "The server is unavailable right now. Please try again in a moment." : "Something went wrong";
    const code = body?.error ?? (unreachable ? "UNAVAILABLE" : "UNKNOWN");

    // A stored token that the server no longer accepts: forget it and tell the UI
    if (res.status === 401 && code === "UNAUTHORIZED" && token) {
      clearToken();
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }

    throw new ApiError(res.status, code, friendlyMessage(code, body?.message ?? fallback));
  }
  return (await res.json()) as T;
}
