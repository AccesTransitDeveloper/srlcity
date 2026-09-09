import { useRef, useState } from "react";
import { ImagePlus, Send, X, Loader2, Video } from "lucide-react";
import { api } from "@/lib/api";

interface CreatePostProps {
  avatar: string;
  onPost: (content: string, imageUrl?: string | null) => void;
}

const CreatePost = ({ avatar, onPost }: CreatePostProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video" | "">("");
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    setError("");
    setUploading(true);
    try {
      const uploaded = await api.upload(file);
      setMediaUrl(uploaded.url);
      setMediaType(uploaded.mediaType === "video" ? "video" : "image");
    } catch {
      setError("Не удалось загрузить файл");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    const content = text.trim();
    if (!content && !mediaUrl) return;
    onPost(content, mediaUrl || undefined);
    setText("");
    setMediaUrl("");
    setMediaType("");
    setError("");
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <img src={avatar} alt="" className="h-9 w-9 rounded-full bg-muted object-cover" />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Что нового?"
          rows={2}
          className="flex-1 resize-none bg-transparent text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>

      {mediaUrl && (
        <div className="mt-3 relative overflow-hidden rounded-xl border border-border bg-secondary/30">
          {mediaType === "video" ? (
            <video src={mediaUrl} controls className="h-56 w-full bg-black object-cover" />
          ) : (
            <img src={mediaUrl} alt="preview" className="h-56 w-full object-cover" />
          )}
          <button
            type="button"
            onClick={() => {
              setMediaUrl("");
              setMediaType("");
            }}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-xs font-medium text-destructive">{error}</p>}

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
          <span className="text-xs font-medium">Фото / видео</span>
        </button>
        <button
          onClick={handleSubmit}
          disabled={uploading || (!text.trim() && !mediaUrl)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          <Send className="h-3.5 w-3.5" />
          Опубликовать
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) await handleFile(file);
          e.currentTarget.value = "";
        }}
      />
    </div>
  );
};

export default CreatePost;
