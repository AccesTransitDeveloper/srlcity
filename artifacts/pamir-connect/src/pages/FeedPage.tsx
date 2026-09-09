import { useState, useEffect } from "react";
import { Bell, Loader2 } from "lucide-react";
import PostCard from "@/components/PostCard";
import CreatePost from "@/components/CreatePost";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Post } from "@/types";

function getAvatar(p: any) {
  return p?.avatarUrl || p?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p?.name}`;
}

const FeedPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const postsData = await api.posts.list(user?.id);
        setPosts(postsData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const handleNewPost = async (content: string, imageUrl?: string | null) => {
    if (!user) return;
    try {
      const post = await api.posts.create({ authorId: user.id, content, imageUrl: imageUrl || undefined });
      setPosts((current) => [post, ...current]);
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
