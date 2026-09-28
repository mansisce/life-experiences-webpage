// The MFE's only way out: a thin client for the Rewards BFF. No other backend is called.

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status; // 0 = network failure / BFF unreachable
  }
}

function detailMessage(body, status) {
  const detail = body?.detail;
  if (typeof detail === "string") return detail;
  // FastAPI validation errors: [{loc, msg}, ...]
  if (Array.isArray(detail) && detail.length) return detail.map((d) => d.msg).join("; ");
  return `Request failed (${status})`;
}

export function createApi({ baseUrl, token }) {
  async function request(method, path, body) {
    let response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body !== undefined && { "Content-Type": "application/json" }),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new ApiError("Can't reach the rewards service. Is the BFF running?", 0);
    }
    if (response.status === 204) return null;
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new ApiError(detailMessage(data, response.status), response.status);
    return data;
  }

  const query = (params) => {
    const entries = Object.entries(params).filter(([, v]) => v);
    return entries.length ? `?${new URLSearchParams(entries)}` : "";
  };

  return {
    categories: () => request("GET", "/categories"),
    area: (id) => request("GET", `/areas/${id}`),
    createArea: (categoryId, name) => request("POST", "/areas", { categoryId, name }),
    renameArea: (id, name) => request("PATCH", `/areas/${id}`, { name }),
    deleteArea: (id) => request("DELETE", `/areas/${id}`),

    areaTasks: (areaId, filters = {}) => request("GET", `/areas/${areaId}/tasks${query(filters)}`),
    allTasks: (filters = {}) => request("GET", `/tasks${query(filters)}`),
    createTask: (areaId, task) => request("POST", `/areas/${areaId}/tasks`, task),
    task: (id) => request("GET", `/tasks/${id}`),
    updateTask: (id, changes) => request("PATCH", `/tasks/${id}`, changes),
    completeTask: (id, { note, completedAt }) => request("POST", `/tasks/${id}/complete`, { note, completedAt }),
    activity: (id) => request("GET", `/tasks/${id}/activity`),

    rewards: (filters = {}) => request("GET", `/rewards${query(filters)}`),
    createReward: (reward) => request("POST", "/rewards", reward),
    updateReward: (id, changes) => request("PATCH", `/rewards/${id}`, changes),
    setRewardTasks: (id, taskIds) => request("PUT", `/rewards/${id}/tasks`, { taskIds }),
  };
}
