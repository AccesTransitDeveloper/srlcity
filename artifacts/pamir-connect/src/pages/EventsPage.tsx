import { useState, useEffect, useRef } from "react";
import { Plus, CalendarDays, MapPin, Users, Loader2, X, Camera, Clock, Search, Trash2, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

function getAvatar(p: any) {
  return p?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p?.name || "user"}`;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatDay(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const diff = d.getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days === 0) return "Сегодня";
  if (days === 1) return "Завтра";
  if (days === -1) return "Вчера";
  if (days > 0 && days < 7) return `Через ${days} дн.`;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

type FilterType = "upcoming" | "past" | "all";

interface CreateEventForm {
  title: string;
  description: string;
  date: string;
  location: string;
  coverUrl: string;
}

const CreateEventModal = ({ onClose, onCreated }: { onClose: () => void; onCreated: (e: any) => void }) => {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<CreateEventForm>({
    title: "", description: "", date: "", location: "", coverUrl: "",
  });

  const set = (k: keyof CreateEventForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleCover = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await api.upload(file);
      set("coverUrl", url);
    } catch {
      setError("Ошибка загрузки обложки");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date) { setError("Заполните название и дату"); return; }
    setLoading(true);
    setError("");
    try {
      const created = await api.events.create({
        title: form.title.trim(),
        description: form.description.trim(),
        date: new Date(form.date).toISOString(),
        location: form.location.trim(),
        coverUrl: form.coverUrl || undefined,
        createdBy: user!.id,
      });
      onCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || "Ошибка создания события");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-t-2xl bg-card shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-card px-5 pt-4 pb-3 border-b border-border flex items-center justify-between">
          <h2 className="font-display font-bold text-base text-foreground">Создать событие</h2>
          <button onClick={onClose} className="text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Обложка события</label>
            {form.coverUrl ? (
              <div className="relative">
                <img src={form.coverUrl} alt="cover" className="w-full h-32 object-cover rounded-xl" />
                <button type="button" onClick={() => set("coverUrl", "")} className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} className="w-full h-28 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                <span className="text-xs">{uploading ? "Загрузка..." : "Добавить фото"}</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleCover(f); }} />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Название *</label>
            <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Название события" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Описание</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Расскажите о событии..." rows={3} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Дата и время *</label>
              <input type="datetime-local" value={form.date} onChange={e => set("date", e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Место</label>
              <input value={form.location} onChange={e => set("location", e.target.value)} placeholder="Город, адрес" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          {error && <p className="text-xs text-destructive font-medium">{error}</p>}

          <button type="submit" disabled={loading || uploading} className="w-full rounded-xl bg-primary py-3 font-display font-semibold text-primary-foreground disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Создаю...</> : "Создать событие"}
          </button>
        </form>
      </div>
    </div>
  );
};

const EventCard = ({
  event,
  onToggle,
  onDelete,
  userId,
}: {
  event: any;
  onToggle: (id: string, participating: boolean) => void;
  onDelete: (id: string) => void;
  userId?: string;
}) => {
  const isOwn = event.createdBy === userId;
  const isPast = new Date(event.date) < new Date();

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      {event.coverUrl && (
        <div className="relative">
          <img src={event.coverUrl} alt={event.title} className="h-44 w-full object-cover bg-muted" loading="lazy" />
          {!isPast && (
            <div className="absolute top-2 right-2 rounded-full bg-primary/90 px-2.5 py-1 text-xs font-semibold text-primary-foreground">
              {formatDay(event.date)}
            </div>
          )}
          {isPast && (
            <div className="absolute inset-0 bg-black/20 flex items-end">
              <span className="px-3 py-2 text-xs font-medium text-white/80">Завершено</span>
            </div>
          )}
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-semibold text-base text-card-foreground leading-tight">{event.title}</h3>
          {isOwn && (
            <button onClick={() => onDelete(event.id)} className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {event.description && <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{event.description}</p>}

        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
            <span>{formatDate(event.date)}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
              <span>{event.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
            <span>{event.participantCount} участников</span>
          </div>
        </div>

        {event.creator && (
          <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
            <img src={getAvatar(event.creator)} alt={event.creator.name} className="h-6 w-6 rounded-full bg-muted object-cover" />
            <span className="text-xs text-muted-foreground">Организатор: <span className="font-medium text-foreground">{event.creator.name}</span></span>
          </div>
        )}

        <button
          onClick={() => onToggle(event.id, event.participating)}
          disabled={isOwn}
          className={`mt-3 w-full rounded-xl py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            event.participating
              ? "bg-primary/10 text-primary border border-primary/30"
              : isPast
              ? "bg-secondary text-muted-foreground cursor-default"
              : "bg-primary text-primary-foreground hover:opacity-90"
          } ${isOwn ? "opacity-60 cursor-default" : ""}`}
        >
          {event.participating ? (
            <><CheckCircle className="h-4 w-4" /> Участвую</>
          ) : isPast ? (
            "Завершено"
          ) : (
            "Участвовать"
          )}
        </button>
      </div>
    </div>
  );
};

const EventsPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("upcoming");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await api.events.list(user?.id, filter, search);
      setEvents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(loadEvents, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [user?.id, filter, search]);

  const handleToggle = async (id: string, participating: boolean) => {
    if (!user) return;
    try {
      let updated;
      if (participating) {
        updated = await api.events.cancel(id, user.id);
      } else {
        updated = await api.events.participate(id, user.id);
      }
      setEvents(es => es.map(e => e.id === id ? updated : e));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await api.events.delete(id, user.id);
      setEvents(es => es.filter(e => e.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreated = (event: any) => {
    setFilter("upcoming");
    setEvents(es => [event, ...es]);
  };

  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">События</h1>
            <p className="text-xs text-muted-foreground">Мероприятия и встречи</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> Создать
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск событий..."
            className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex rounded-xl bg-secondary p-1">
          {([
            { key: "upcoming", label: "Предстоящие" },
            { key: "past", label: "Прошедшие" },
            { key: "all", label: "Все" },
          ] as { key: FilterType; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${filter === key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <CalendarDays className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-foreground">
            {search ? "Ничего не найдено" : filter === "upcoming" ? "Предстоящих событий нет" : "Событий пока нет"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Создайте первое событие для сообщества</p>
          <button onClick={() => setShowCreate(true)} className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
            Создать событие
          </button>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {events.map(event => (
            <EventCard
              key={event.id}
              event={event}
              userId={user?.id}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showCreate && <CreateEventModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
    </div>
  );
};

export default EventsPage;
