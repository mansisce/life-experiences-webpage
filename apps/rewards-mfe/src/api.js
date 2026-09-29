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
    const isForm = body instanceof FormData; // file uploads: the browser sets the multipart header
    try {
      response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body !== undefined && !isForm && { "Content-Type": "application/json" }),
        },
        body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
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

  // Notes, contacts and files belong to a tile ("category") or an area.
  const owner = (type, id) => `/${type === "area" ? "areas" : "categories"}/${id}`;

  return {
    details: (type, id) => request("GET", `${owner(type, id)}/details`),
    addNote: (type, id, note) => request("POST", `${owner(type, id)}/notes`, note),
    updateNote: (id, changes) => request("PATCH", `/notes/${id}`, changes),
    deleteNote: (id) => request("DELETE", `/notes/${id}`),
    addContact: (type, id, contact) => request("POST", `${owner(type, id)}/contacts`, contact),
    updateContact: (id, changes) => request("PATCH", `/contacts/${id}`, changes),
    deleteContact: (id) => request("DELETE", `/contacts/${id}`),
    uploadFile: (type, id, formData) => request("POST", `${owner(type, id)}/files`, formData),
    updateFile: (id, changes) => request("PATCH", `/files/${id}`, changes),
    deleteFile: (id) => request("DELETE", `/files/${id}`),
    search: (q) => request("GET", `/search${query({ q })}`),
    // File links from the BFF are signed and relative; make them absolute for <img>/<a>.
    fileUrl: (relative) => `${baseUrl}${relative}`,

    categories: () => request("GET", "/categories"),
    createTile: (tile) => request("POST", "/categories", tile),
    updateTile: (id, changes) => request("PATCH", `/categories/${id}`, changes),
    tileDeletePreview: (id) => request("GET", `/categories/${id}/delete-preview`),
    deleteTile: (id, confirmName) => request("DELETE", `/categories/${id}${query({ confirmName })}`),
    reorderTiles: (ids) => request("PUT", "/categories/order", { ids }),
    reorderAreas: (tileId, ids) => request("PUT", `/categories/${tileId}/areas/order`, { ids }),
    addStarterSet: () => request("POST", "/categories/starter"),
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
    areaRewards: (areaId) => request("GET", `/areas/${areaId}/rewards`),
    createReward: (reward) => request("POST", "/rewards", reward),
    updateReward: (id, changes) => request("PATCH", `/rewards/${id}`, changes),
    setRewardTasks: (id, taskIds) => request("PUT", `/rewards/${id}/tasks`, { taskIds }),
  };
}
