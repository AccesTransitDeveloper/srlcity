import { useState, useEffect } from "react";
import { Bell, Loader2 } from "lucide-react";
import PostCard from "@/components/PostCard";
import CreatePost from "@/components/CreatePost";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Post, Event } from "@/types";

function getAvatar(p: any) {
  return p?.avatarUrl || p?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p?.name}`;
}

const EventCardMini = ({ event, userId }: { event: Event; userId?: string }) => {
  const [participating, setParticipating] = useState(event.participating);
  const [count, setCount] = useState(event.participantCount);

  const toggle = async () => {
    if (!userId) return;
    try {
      if (participating) {
        const res = await api.events.cancel(event.id, userId);
        setParticipating(false);
        setCount(res.participantCount);
      } else {
        const res = await api.events.participate(event.id, userId);
        setParticipating(true);
        setCount(res.participantCount);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const cover = (event as any).coverUrl || (event as any).cover;

  return (
    <div className="min-w-[260px] snap-start rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      {cover && <img src={cover} alt={event.title} className="h-28 w-full object-cover bg-muted" loading="lazy" />}
      <div className="p-3">
        <h3 className="font-display font-semibold text-sm text-card-foreground line-clamp-1">{event.title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{event.date} • {event.location}</p>
        <p className="text-xs text-muted-foreground">{count} участников</p>
        <button
          onClick={toggle}
          className={`mt-2 w-full rounded-lg py-1.5 text-xs font-semibold transition-colors ${
            participating
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {participating ? "✓ Участвую" : "Участвовать"}
        </button>
      </div>
    </div>
  );
};

const FeedPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [postsData, eventsData] = await Promise.all([
          api.posts.list(user?.id),
          api.events.list(user?.id),
        ]);
        setPosts(postsData);
        setEvents(eventsData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const handleNewPost = async (content: string) => {
    if (!user) return;
    try {
      const post = await api.posts.create({ authorId: user.id, content });
      setPosts([post, ...posts]);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-foreground">SaryKol City</h1>
          <button className="relative text-muted-foreground">
            <Bell className="h-5 w-5" />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {events.length > 0 && (
            <section>
              <h2 className="font-display font-semibold text-sm text-foreground mb-3">Ближайшие события</h2>
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
                {events.map((event) => (
                  <EventCardMini key={event.id} event={event} userId={user?.id} />
                ))}
              </div>
            </section>
          )}

          {user && (
            <CreatePost
              avatar={getAvatar(user)}
              onPost={handleNewPost}
            />
          )}

          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedPage;
