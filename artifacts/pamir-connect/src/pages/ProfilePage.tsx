import { useState, useEffect, useRef } from "react";
import { Settings, Trophy, Star, Loader2, LogOut, Camera, X, Check } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { UserProfile } from "@/types";

function getAvatar(p: UserProfile) {
  return p.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`;
}

const EditProfileModal = ({ onClose }: { onClose: () => void }) => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: user?.name || "",
    institution: user?.institution || "",
    city: user?.city || "",
    bio: user?.bio || "",
    avatarUrl: user?.avatarUrl || "",
  });

  const handleAvatarUpload = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await api.upload(file);
      setForm((f) => ({ ...f, avatarUrl: url }));
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-base text-foreground">Редактировать профиль</h2>
          <button onClick={onClose} className="text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex justify-center mb-5">
          <div className="relative">
            <img
              src={form.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${form.name}`}
              alt=""
              className="h-20 w-20 rounded-full bg-muted object-cover"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); }} />
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Имя *</label>
            <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">ВУЗ</label>
              <input value={form.institution} onChange={(e) => setForm(f => ({ ...f, institution: e.target.value }))} placeholder="ХГУТ" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Город</label>
              <input value={form.city} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Хорог" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">О себе</label>
            <textarea value={form.bio} onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} placeholder="Расскажите о себе..." className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <button type="submit" disabled={saving || uploading} className="w-full rounded-xl bg-primary py-2.5 font-semibold text-sm text-primary-foreground disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Сохранение...</> : <><Check className="h-4 w-4" /> Сохранить</>}
          </button>
        </form>
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const [topUsers, setTopUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const profiles = await api.profiles.list();
        setTopUsers([...profiles].sort((a: UserProfile, b: UserProfile) => b.rating - a.rating));
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
            <button onClick={() => setShowEdit(true)} className="text-muted-foreground hover:text-foreground transition-colors">
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
          <div className="relative inline-block">
            <img src={getAvatar(user)} alt={user.name} className="mx-auto h-20 w-20 rounded-full bg-muted object-cover shadow-md" />
            <button onClick={() => setShowEdit(true)} className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          <h2 className="font-display text-lg font-bold text-card-foreground mt-3">{user.name}</h2>
          {(user.institution || user.city) && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {[user.institution, user.city].filter(Boolean).join(" • ")}
            </p>
          )}
          {user.bio && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{user.bio}</p>}
          <div className="mt-4 flex items-center justify-center gap-2 text-amber-600">
            <Trophy className="h-4 w-4" />
            <span className="font-display font-bold text-sm">{user.rating} очков</span>
          </div>
          <button onClick={() => setShowEdit(true)} className="mt-4 w-full rounded-lg bg-secondary py-2 text-sm font-semibold text-secondary-foreground hover:bg-muted transition-colors">
            Редактировать профиль
          </button>
        </div>

        <section>
          <h2 className="font-display font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />
            Лидерборд сообщества
          </h2>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : topUsers.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">Пока никто не зарегистрирован</p>
          ) : (
            <div className="space-y-2">
              {topUsers.slice(0, 10).map((u, i) => (
                <div key={u.id} className={`flex items-center gap-3 rounded-xl p-3 ${u.id === user.id ? "bg-primary/10 border border-primary/20" : "bg-card border border-border"}`}>
                  <span className={`w-6 text-center text-sm font-bold font-display ${i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-700" : "text-muted-foreground"}`}>
                    {i + 1}
                  </span>
                  <img src={getAvatar(u)} alt={u.name} className="h-8 w-8 rounded-full bg-muted object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-sm text-foreground truncate">{u.name}{u.id === user.id ? " (Вы)" : ""}</p>
                    {u.institution && <p className="text-xs text-muted-foreground truncate">{u.institution}</p>}
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

      {showEdit && <EditProfileModal onClose={() => setShowEdit(false)} />}
    </div>
  );
};

export default ProfilePage;
