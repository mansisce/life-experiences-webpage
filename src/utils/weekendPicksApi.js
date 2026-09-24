export const API_BASE = "/api";

export async function apiCall(path, method = "GET", body) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(res.status);
    return res.json();
  } catch {
    return null; // API not available — fall back to static data
  }
}
