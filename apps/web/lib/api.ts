function getApiBase() {
  if (typeof window === "undefined") {
    return process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
}

export function apiUrl(path: string) {
  return `${getApiBase()}${path}`;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}) {
  const headers = { ...(options.headers || {}) };
  const isFormData = options.body instanceof FormData;
  if (!isFormData && !("Content-Type" in headers)) {
    Object.assign(headers, { "Content-Type": "application/json" });
  }

  const response = await fetch(apiUrl(path), {
    ...options,
    headers,
    cache: "no-store"
  });

  if (response.status === 204) return null as T;

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Request failed: ${response.status}`);
  }

  return data as T;
}
