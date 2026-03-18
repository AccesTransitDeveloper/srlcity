import { useState, useEffect } from "react";
import { Plus, CalendarDays, MapPin, Users, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Event } from "@/types";

const EventsPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.events.list(user?.id);
        setEvents(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const toggleParticipation = async (id: string, participating: boolean) => {
    if (!user) return;
    try {
      let updated;
      if (participating) {
        updated = await api.events.cancel(id, user.id);
      } else {
        updated = await api.events.participate(id, user.id);
      }
      setEvents(events.map((e) => (e.id === id ? updated : e)));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-foreground">События</h1>
          <button className="rounded-full bg-primary p-2 text-primary-foreground shadow-sm hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {events.map((event) => {
            const cover = (event as any).coverUrl || (event as any).cover;
            return (
              <div key={event.id} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                {cover && (
                  <img src={cover} alt={event.title} className="h-40 w-full object-cover bg-muted" loading="lazy" />
                )}
                <div className="p-4">
                  <h3 className="font-display font-semibold text-base text-card-foreground">{event.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" /> {event.date}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" /> {event.location}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5 flex-shrink-0" /> {event.participantCount} участников
                    </div>
                  </div>
                  <button
                    onClick={() => toggleParticipation(event.id, event.participating)}
                    className={`mt-4 w-full rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                      event.participating
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                    }`}
                  >
                    {event.participating ? "✓ Участвую" : "Участвовать"}
                  </button>
                </div>
              </div>
            );
          })}
          {events.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-10">Событий пока нет</p>
          )}
        </div>
      )}
    </div>
  );
};

export default EventsPage;
