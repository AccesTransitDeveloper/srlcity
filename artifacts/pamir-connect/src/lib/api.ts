const BASE = "/api";

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

export const api = {
  profiles: {
    list: () => req<any[]>("/profiles"),
    get: (id: string) => req<any>(`/profiles/${id}`),
    create: (data: any) => req<any>("/profiles", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => req<any>(`/profiles/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  },
  posts: {
    list: (userId?: string) => req<any[]>(`/posts${userId ? `?userId=${userId}` : ""}`),
    get: (id: string, userId?: string) => req<any>(`/posts/${id}${userId ? `?userId=${userId}` : ""}`),
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
    join: (id: string, userId: string) => req<any>(`/groups/${id}/join`, { method: "POST", body: JSON.stringify({ userId }) }),
    leave: (id: string, userId: string) => req<any>(`/groups/${id}/join`, { method: "DELETE", body: JSON.stringify({ userId }) }),
  },
  events: {
    list: (userId?: string) => req<any[]>(`/events${userId ? `?userId=${userId}` : ""}`),
    get: (id: string, userId?: string) => req<any>(`/events/${id}${userId ? `?userId=${userId}` : ""}`),
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
};
