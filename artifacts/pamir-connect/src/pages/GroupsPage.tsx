import { useState, useEffect } from "react";
import { Search, Plus, Users, Loader2, CheckCircle, Clock, X } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Group, GroupJoinRequest } from "@/types";

const CreateGroupModal = ({ onClose, onCreated }: { onClose: () => void; onCreated: (g: Group) => void }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: "", description: "", coverUrl: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Введите название группы"); return; }
    setLoading(true);
    try {
      const group = await api.groups.create({ name: form.name.trim(), description: form.description.trim(), coverUrl: form.coverUrl.trim() || undefined, createdBy: user!.id });
      onCreated(group);
      onClose();
    } catch (err: any) {
      setError(err.message || "Ошибка создания группы");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-base text-foreground">Создать группу</h2>
          <button onClick={onClose} className="text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Название *</label>
            <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Название группы" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Описание</label>
            <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="О чём эта группа?" rows={2} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-primary py-2.5 font-semibold text-sm text-primary-foreground disabled:opacity-60">
            {loading ? "Создание..." : "Создать"}
          </button>
        </form>
      </div>
    </div>
  );
};

const RequestsModal = ({ group, onClose }: { group: Group; onClose: () => void }) => {
  const [requests, setRequests] = useState<GroupJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.groups.getRequests(group.id).then(setRequests).catch(console.error).finally(() => setLoading(false));
  }, [group.id]);

  const respond = async (requestId: string, action: "approve" | "reject") => {
    await api.groups.respondRequest(group.id, requestId, action);
    setRequests((r) => r.filter((req) => req.id !== requestId));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-card shadow-xl max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display font-bold text-base text-foreground">Заявки в «{group.name}»</h2>
          <button onClick={onClose} className="text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : requests.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Нет заявок</p>
          ) : (
            requests.map((req) => (
              <div key={req.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <img src={req.user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.user?.name}`} alt="" className="h-10 w-10 rounded-full bg-muted object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{req.user?.name}</p>
                  <p className="text-xs text-muted-foreground">{req.user?.institution} • {req.user?.city}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => respond(req.id, "approve")} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Принять</button>
                  <button onClick={() => respond(req.id, "reject")} className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground">Отклонить</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const GroupsPage = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [requestsGroup, setRequestsGroup] = useState<Group | null>(null);

  useEffect(() => {
    setLoading(true);
    const load = async () => {
      try {
        const data = await api.groups.list({ userId: user?.id, search: search || undefined });
        setGroups(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [user?.id, search]);

  const handleAction = async (group: Group) => {
    if (!user) return;
    try {
      let updated;
      if (group.joined) {
        if (group.isCreator) return;
        updated = await api.groups.leave(group.id, user.id);
      } else if (group.pendingRequest) {
        return;
      } else {
        updated = await api.groups.requestJoin(group.id, user.id);
      }
      if (updated) setGroups(groups.map((g) => (g.id === group.id ? { ...g, ...updated } : g)));
    } catch (e: any) {
      console.error(e);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-display text-xl font-bold text-foreground">Группы</h1>
          <button onClick={() => setShowCreate(true)} className="rounded-full bg-primary p-2 text-primary-foreground shadow-sm hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск групп..." className="w-full rounded-lg bg-secondary py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="p-4 space-y-3">
          {groups.map((group) => (
            <div key={group.id} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              {group.coverUrl && <img src={group.coverUrl} alt={group.name} className="h-28 w-full object-cover bg-muted" loading="lazy" />}
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-sm text-card-foreground">{group.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{group.description}</p>
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      {group.memberCount} участников
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {group.isCreator ? (
                      <>
                        <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">Вы создатель</span>
                        <button onClick={() => setRequestsGroup(group)} className="rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-200 transition-colors flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Заявки
                        </button>
                      </>
                    ) : group.joined ? (
                      <button onClick={() => handleAction(group)} className="rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-semibold text-secondary-foreground hover:bg-muted transition-colors">
                        Выйти
                      </button>
                    ) : group.pendingRequest ? (
                      <span className="flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-600">
                        <Clock className="h-3 w-3" /> Ожидание
                      </span>
                    ) : (
                      <button onClick={() => handleAction(group)} className="rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
                        Вступить
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {groups.length === 0 && !loading && (
            <p className="text-center text-sm text-muted-foreground py-10">Группы не найдены</p>
          )}
        </div>
      )}

      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} onCreated={(g) => setGroups([g, ...groups])} />}
      {requestsGroup && <RequestsModal group={requestsGroup} onClose={() => setRequestsGroup(null)} />}
    </div>
  );
};

export default GroupsPage;
