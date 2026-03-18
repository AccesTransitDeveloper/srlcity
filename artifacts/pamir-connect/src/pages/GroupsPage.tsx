import { useState, useEffect } from "react";
import { Search, Plus, Users, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Group } from "@/types";

const GroupsPage = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
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

  const toggleJoin = async (id: string, joined: boolean) => {
    if (!user) return;
    try {
      let updated;
      if (joined) {
        updated = await api.groups.leave(id, user.id);
      } else {
        updated = await api.groups.join(id, user.id);
      }
      setGroups(groups.map((g) => (g.id === id ? updated : g)));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-display text-xl font-bold text-foreground">Группы</h1>
          <button className="rounded-full bg-primary p-2 text-primary-foreground shadow-sm hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск групп..."
            className="w-full rounded-lg bg-secondary py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {groups.map((group) => {
            const cover = (group as any).coverUrl || (group as any).cover;
            return (
              <div key={group.id} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                {cover && <img src={cover} alt={group.name} className="h-28 w-full object-cover bg-muted" loading="lazy" />}
                <div className="p-3">
                  <h3 className="font-display font-semibold text-sm text-card-foreground">{group.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{group.description}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      {group.memberCount} участников
                    </div>
                    <button
                      onClick={() => toggleJoin(group.id, group.joined)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        group.joined
                          ? "bg-secondary text-secondary-foreground hover:bg-muted"
                          : "bg-primary text-primary-foreground hover:opacity-90"
                      }`}
                    >
                      {group.joined ? "Выйти" : "Вступить"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {groups.length === 0 && !loading && (
            <p className="text-center text-sm text-muted-foreground py-10">Группы не найдены</p>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupsPage;
