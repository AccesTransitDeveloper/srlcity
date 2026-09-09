import { useState } from "react";
import { Heart, MessageCircle, Send } from "lucide-react";
import type { Post } from "@/types";
import UserBadge from "./UserBadge";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface PostCardProps {
  post: Post;
}

function getAvatar(p: { avatarUrl?: string | null; avatar?: string }) {
  return p.avatarUrl || p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.avatarUrl}`;
}

function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov)(\?|#|$)/i.test(url);
}

const PostCard = ({ post }: PostCardProps) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.liked);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLike = async () => {
    if (!user) return;
    try {
      if (liked) {
        const res = await api.posts.unlike(post.id, user.id);
        setLikesCount(res.likes);
        setLiked(false);
      } else {
        const res = await api.posts.like(post.id, user.id);
        setLikesCount(res.likes);
        setLiked(true);
      }
    } catch {
      setLiked(!liked);
      setLikesCount((c) => (liked ? c - 1 : c + 1));
    }
  };

  const handleComment = async () => {
    if (!user || !newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const comment = await api.posts.addComment(post.id, { authorId: user.id, text: newComment.trim() });
      setComments([...comments, comment]);
      setNewComment("");
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const image = (post as any).imageUrl || (post as any).image;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <img
          src={getAvatar(post.author)}
          alt={post.author.name}
          className="h-10 w-10 rounded-full bg-muted object-cover"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold text-sm text-card-foreground truncate">
              {post.author.name}
            </span>
            {post.author.badge && <UserBadge type={post.author.badge} />}
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(post.createdAt).toLocaleDateString("ru-RU", {
              day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
            })}
          </span>
        </div>
      </div>

      <p className="text-sm text-card-foreground mb-3 leading-relaxed">{post.content}</p>

      {image && (
        <div className="mb-3 overflow-hidden rounded-lg">
          {isVideoUrl(image) ? (
            <video src={image} controls playsInline className="w-full h-56 object-cover bg-black" />
          ) : (
            <img src={image} alt="" className="w-full h-48 object-cover bg-muted" loading="lazy" />
          )}
        </div>
      )}

      <div className="flex items-center gap-4 pt-2 border-t border-border">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? "text-red-500" : "text-muted-foreground hover:text-red-400"}`}
        >
          <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} />
          <span>{likesCount}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          <span>{comments.length}</span>
        </button>

        <button className="flex items-center gap-1.5 text-sm text-muted-foreground ml-auto hover:text-primary transition-colors">
          <Send className="h-4 w-4" />
        </button>
      </div>

      {showComments && (
        <div className="mt-3 space-y-2 pt-2 border-t border-border">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-2">
              <img
                src={getAvatar(comment.author)}
                alt=""
                className="h-6 w-6 rounded-full bg-muted mt-0.5 object-cover"
              />
              <div>
                <span className="text-xs font-semibold text-card-foreground">{comment.author.name}</span>
                <p className="text-xs text-muted-foreground">{comment.text}</p>
              </div>
            </div>
          ))}
          {user && (
            <div className="flex gap-2 mt-2">
              <img src={getAvatar(user)} alt="" className="h-6 w-6 rounded-full bg-muted object-cover" />
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleComment()}
                placeholder="Написать комментарий..."
                className="flex-1 text-xs bg-secondary rounded-lg px-3 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={handleComment}
                disabled={!newComment.trim() || submitting}
                className="text-xs text-primary font-semibold disabled:opacity-40"
              >
                ОК
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostCard;
