import { useState, useEffect, useRef } from "react";
import { Settings, Trophy, Star, Loader2, LogOut, Camera, X, Check, FileText, CalendarDays, Users, Car, Phone, Mail, MapPin, Building } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { UserProfile } from "@/types";

function getAvatar(p: any) {
  return p?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p?.name || "user"}`;
}

const EditProfileModal = ({ onClose }: { onClose: () => void }) => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: user?.name || "",
    institution: (user as any)?.institution || "",
    city: (user as any)?.city || "",
    bio: (user as any)?.bio || "",
    avatarUrl: user?.avatarUrl || "",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleAvatarUpload = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await api.upload(file);
      set("avatarUrl", url);
    } catch {
      setError("Ошибка загрузки фото");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Введите имя"); return; }
    setSaving(true);
    try {
      await updateUser({
        name: form.name.trim(),
        institution: form.institution.trim() || undefined,
        city: form.city.trim() || undefined,
        bio: form.bio.trim() || undefined,
        avatarUrl: form.avatarUrl.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-base text-foreground">Редактировать профиль</h2>
          <button onClick={onClose} className="text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex justify-center mb-5">
          <div className="relative">
            <img src={form.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${form.name}`} alt="" className="h-24 w-24 rounded-full bg-muted object-cover ring-2 ring-primary/20" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); }} />
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Имя *</label>
            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Ваше имя" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Место работы / ВУЗ</label>
              <input value={form.institution} onChange={e => set("institution", e.target.value)} placeholder="Организация" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Город</label>
              <input value={form.city} onChange={e => set("city", e.target.value)} placeholder="Ваш город" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">О себе</label>
            <textarea value={form.bio} onChange={e => set("bio", e.target.value)} rows={3} placeholder="Расскажите о себе..." className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>
          {error && <p className="text-xs text-destructive font-medium">{error}</p>}
          <button type="submit" disabled={saving || uploading} className="w-full rounded-xl bg-primary py-2.5 font-semibold text-sm text-primary-foreground disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Сохранение...</> : <><Check className="h-4 w-4" /> Сохранить</>}
          </button>
        </form>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, value, label, color }: { icon: any; value: number; label: string; color: string }) => (
  <div className="flex flex-col items-center gap-1 rounded-xl bg-card border border-border p-3 flex-1">
    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${color}`}>
      <Icon className="h-4 w-4" />
    </div>
    <span className="font-display font-bold text-lg text-foreground">{value}</span>
    <span className="text-[10px] text-muted-foreground font-medium text-center leading-tight">{label}</span>
  </div>
);

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<{ posts: number; events: number; groups: number; rides: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [lb, st] = await Promise.all([
          api.profiles.leaderboard(15),
          api.profiles.stats(user.id),
        ]);
        setTopUsers(lb);
        setStats(st);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  if (!user) return null;

  const u = user as any;

  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-foreground">Профиль</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowEdit(true)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              <Settings className="h-5 w-5" />
            </button>
            <button onClick={signOut} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="h-20 bg-gradient-to-br from-primary/30 via-primary/10 to-accent/20" />
          <div className="px-5 pb-5">
            <div className="flex items-end justify-between -mt-10 mb-3">
              <div className="relative">
                <img src={getAvatar(user)} alt={user.name} className="h-20 w-20 rounded-2xl bg-muted object-cover ring-4 ring-card shadow-md" />
                <button onClick={() => setShowEdit(true)} className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>
              <button onClick={() => setShowEdit(true)} className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors">
                Редактировать
              </button>
            </div>

            <h2 className="font-display text-xl font-bold text-card-foreground">{user.name}</h2>

            <div className="mt-1.5 space-y-1">
              {u.institution && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{u.institution}</span>
                </div>
              )}
              {u.city && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{u.city}</span>
                </div>
              )}
              {u.phone && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{u.phone}</span>
                </div>
              )}
              {u.email && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{u.email}</span>
                </div>
              )}
            </div>

            {u.bio && <p className="text-sm text-muted-foreground mt-2.5 leading-relaxed">{u.bio}</p>}

            <div className="mt-3 flex items-center gap-1.5 text-amber-600 bg-amber-50 rounded-xl px-3 py-2 w-fit">
              <Trophy className="h-4 w-4" />
              <span className="font-display font-bold text-sm">{u.rating || 0} очков</span>
            </div>
          </div>
        </div>

        {stats && (
          <div className="flex gap-2">
            <StatCard icon={FileText} value={stats.posts} label="Постов" color="bg-blue-100 text-blue-600" />
            <StatCard icon={CalendarDays} value={stats.events} label="Событий" color="bg-primary/10 text-primary" />
            <StatCard icon={Users} value={stats.groups} label="Групп" color="bg-violet-100 text-violet-600" />
            <StatCard icon={Car} value={stats.rides} label="Маршрутов" color="bg-amber-100 text-amber-600" />
          </div>
        )}

        <section>
          <h2 className="font-display font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />
            Рейтинг сообщества
          </h2>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : topUsers.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">Зарегистрируйтесь первыми</p>
          ) : (
            <div className="space-y-2">
              {topUsers.map((u, i) => (
                <div key={u.id} className={`flex items-center gap-3 rounded-xl p-3 ${u.id === user.id ? "bg-primary/10 border border-primary/20" : "bg-card border border-border"}`}>
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold font-display flex-shrink-0 ${
                    i === 0 ? "bg-amber-100 text-amber-600" : i === 1 ? "bg-slate-100 text-slate-500" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-secondary text-muted-foreground"
                  }`}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </div>
                  <img src={getAvatar(u)} alt={u.name} className="h-9 w-9 rounded-full bg-muted object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-sm text-foreground truncate">
                      {u.name}{u.id === user.id ? <span className="text-primary ml-1">(Вы)</span> : ""}
                    </p>
                    {(u.institution || u.city) && (
                      <p className="text-xs text-muted-foreground truncate">{[u.institution, u.city].filter(Boolean).join(" · ")}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-amber-600 flex-shrink-0">
                    <Trophy className="h-3.5 w-3.5" />
                    <span className="text-xs font-bold">{u.rating || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {showEdit && <EditProfileModal onClose={() => setShowEdit(false)} />}
    </div>
  );
};

export default ProfilePage;
