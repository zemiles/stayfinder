import { getAccessToken } from "../auth/tokenStorage";
import type { StayfinderResponse } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

function isJsonResponse(response: Response) {
  return response.headers.get("content-type")?.includes("application/json");
}

function buildHeaders(headers: HeadersInit | undefined, body: BodyInit | null | undefined) {
  const result = new Headers(headers);
  const token = getAccessToken();

  if (token && !result.has("Authorization")) {
    result.set("Authorization", token);
  }

  if (!(body instanceof FormData) && body !== undefined && body !== null && !result.has("Content-Type")) {
    result.set("Content-Type", "application/json");
  }

  return result;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: buildHeaders(init.headers, init.body)
  });

  const payload = isJsonResponse(response) ? await response.json() : null;

  if (!response.ok) {
    throw new Error(payload?.message ?? `HTTP ${response.status}`);
  }

  if (payload && typeof payload === "object" && "code" in payload) {
    const stayfinderPayload = payload as StayfinderResponse<T>;
    if (stayfinderPayload.code !== "0000") {
      throw new Error(stayfinderPayload.message ?? "요청을 처리하지 못했습니다.");
    }
    return stayfinderPayload.data;
  }

  return payload as T;
}
