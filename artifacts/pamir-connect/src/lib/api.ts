const BASE = "/api";
const TOKEN_KEY = "pamir_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string) {
  localStorage.setItem(TOKEN_KEY, t);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options?.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

async function upload(file: File): Promise<{ url: string; mediaType: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const token = getToken();
  const res = await fetch(`${BASE}/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

export const api = {
  auth: {
    register: (data: { email: string; password: string; name: string; institution?: string; city?: string; bio?: string }) =>
      req<{ token: string; user: any }>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
    login: (data: { email: string; password: string }) =>
      req<{ token: string; user: any }>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
    me: () => req<any>("/auth/me"),
  },
  profiles: {
    list: () => req<any[]>("/profiles"),
    get: (id: string) => req<any>(`/profiles/${id}`),
    update: (id: string, data: any) => req<any>(`/profiles/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  },
  posts: {
    list: (userId?: string) => req<any[]>(`/posts${userId ? `?userId=${userId}` : ""}`),
    create: (data: any) => req<any>("/posts", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) => req<void>(`/posts/${id}`, { method: "DELETE" }),
    like: (id: string, userId: string) => req<any>(`/posts/${id}/likes`, { method: "POST", body: JSON.stringify({ userId }) }),
    unlike: (id: string, userId: string) => req<any>(`/posts/${id}/likes`, { method: "DELETE", body: JSON.stringify({ userId }) }),
    comments: (id: string) => req<any[]>(`/posts/${id}/comments`),
    addComment: (id: string, data: any) => req<any>(`/posts/${id}/comments`, { method: "POST", body: JSON.stringify(data) }),
  },
  groups: {
    list: (params?: { userId?: string; search?: string }) => {
      const qs = new URLSearchParams();
      if (params?.userId) qs.set("userId", params.userId);
      if (params?.search) qs.set("search", params.search);
      const q = qs.toString();
      return req<any[]>(`/groups${q ? `?${q}` : ""}`);
    },
    get: (id: string, userId?: string) => req<any>(`/groups/${id}${userId ? `?userId=${userId}` : ""}`),
    create: (data: any) => req<any>("/groups", { method: "POST", body: JSON.stringify(data) }),
    requestJoin: (id: string, userId: string) => req<any>(`/groups/${id}/request`, { method: "POST", body: JSON.stringify({ userId }) }),
    leave: (id: string, userId: string) => req<any>(`/groups/${id}/leave`, { method: "DELETE", body: JSON.stringify({ userId }) }),
    getRequests: (id: string) => req<any[]>(`/groups/${id}/requests`),
    respondRequest: (groupId: string, requestId: string, action: "approve" | "reject") =>
      req<any>(`/groups/${groupId}/requests/${requestId}`, { method: "PATCH", body: JSON.stringify({ action }) }),
  },
  events: {
    list: (userId?: string) => req<any[]>(`/events${userId ? `?userId=${userId}` : ""}`),
    create: (data: any) => req<any>("/events", { method: "POST", body: JSON.stringify(data) }),
    participate: (id: string, userId: string) => req<any>(`/events/${id}/participate`, { method: "POST", body: JSON.stringify({ userId }) }),
    cancel: (id: string, userId: string) => req<any>(`/events/${id}/participate`, { method: "DELETE", body: JSON.stringify({ userId }) }),
  },
  threads: {
    list: (userId: string) => req<any[]>(`/threads?userId=${userId}`),
    create: (data: any) => req<any>("/threads", { method: "POST", body: JSON.stringify(data) }),
    messages: (threadId: string) => req<any[]>(`/threads/${threadId}/messages`),
    send: (threadId: string, data: any) => req<any>(`/threads/${threadId}/messages`, { method: "POST", body: JSON.stringify(data) }),
  },
  notifications: {
    list: (userId: string) => req<any[]>(`/notifications?userId=${userId}`),
    markRead: (id: string) => req<any>(`/notifications/${id}/read`, { method: "PATCH" }),
  },
  rides: {
    list: (params?: { driverId?: string; status?: string }) => {
      const qs = new URLSearchParams();
      if (params?.driverId) qs.set("driverId", params.driverId);
      if (params?.status) qs.set("status", params.status);
      const q = qs.toString();
      return req<any[]>(`/rides${q ? `?${q}` : ""}`);
    },
    get: (id: string) => req<any>(`/rides/${id}`),
    create: (data: any) => req<any>("/rides", { method: "POST", body: JSON.stringify(data) }),
    cancel: (id: string, driverId: string) => req<any>(`/rides/${id}/cancel`, { method: "PATCH", body: JSON.stringify({ driverId }) }),
    delete: (id: string, driverId: string) => req<void>(`/rides/${id}`, { method: "DELETE", body: JSON.stringify({ driverId }) }),
  },
  upload,
};
