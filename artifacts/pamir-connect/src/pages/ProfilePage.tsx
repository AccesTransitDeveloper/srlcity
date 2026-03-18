import { useState, useEffect } from "react";
import { Settings, Trophy, Star, Loader2, LogOut } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { UserProfile } from "@/types";
import UserBadge from "@/components/UserBadge";

function getAvatar(p: UserProfile) {
  return p.avatarUrl || p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`;
}

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const [topUsers, setTopUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const profiles = await api.profiles.list();
        setTopUsers([...profiles].sort((a, b) => b.rating - a.rating));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-foreground">Профиль</h1>
          <div className="flex items-center gap-2">
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Settings className="h-5 w-5" />
            </button>
            <button onClick={signOut} className="text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
          <img
            src={getAvatar(user)}
            alt={user.name}
            className="mx-auto h-20 w-20 rounded-full bg-muted object-cover shadow-md"
          />
          <div className="mt-3 flex items-center justify-center gap-2">
            <h2 className="font-display text-lg font-bold text-card-foreground">{user.name}</h2>
            {user.badge && <UserBadge type={user.badge} />}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {user.institution} • {user.city}
          </p>
          {user.bio && (
            <p className="text-sm text-muted-foreground mt-2">{user.bio}</p>
          )}
          <div className="mt-4 flex items-center justify-center gap-2 text-amber-600">
            <Trophy className="h-4 w-4" />
            <span className="font-display font-bold text-sm">{user.rating} очков</span>
          </div>
          <button className="mt-4 w-full rounded-lg bg-secondary py-2 text-sm font-semibold text-secondary-foreground hover:bg-muted transition-colors">
            Редактировать профиль
          </button>
        </div>

        <section>
          <h2 className="font-display font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />
            Лидерборд
          </h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-2">
              {topUsers.map((u, i) => (
                <div
                  key={u.id}
                  className={`flex items-center gap-3 rounded-xl p-3 ${u.id === user.id ? "bg-primary/10 border border-primary/20" : "bg-card border border-border"}`}
                >
                  <span className={`w-6 text-center text-sm font-bold font-display ${i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-700" : "text-muted-foreground"}`}>
                    {i + 1}
                  </span>
                  <img src={getAvatar(u)} alt={u.name} className="h-8 w-8 rounded-full bg-muted object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-sm text-foreground truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.institution}</p>
                  </div>
                  <div className="flex items-center gap-1 text-amber-600">
                    <Trophy className="h-3.5 w-3.5" />
                    <span className="text-xs font-bold">{u.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ProfilePage;
